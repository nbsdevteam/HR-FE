/**
 * HR Device Sync Service — Hybrid Push + Poll
 * ─────────────────────────────────────────────
 * 1. Listens for real-time push events from the Hikvision device
 * 2. Polls the device every N minutes for new attendance events
 * 3. Full reconciliation every 30 min to catch any gaps
 * 4. Employee auto-discovery: unknown IDs → auto-create + notify HR
 *
 * Run:  node sync-service.mjs
 */

import "dotenv/config";
import cron from "node-cron";
import express from "express";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { HikvisionClient } from "./hikvision-api.mjs";

function uuid() {
  return crypto.randomUUID();
}

// ── Config ──

const config = {
  device: {
    ip: process.env.DEVICE_IP || "192.168.15.15",
    port: parseInt(process.env.DEVICE_PORT || "443"),
    username: process.env.DEVICE_USERNAME || "admin",
    password: process.env.DEVICE_PASSWORD || "",
    useHttps: process.env.DEVICE_USE_HTTPS !== "false",
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  sync: {
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || "5"),
    reconcileMinutes: parseInt(process.env.FULL_RECONCILE_MINUTES || "30"),
    employeeSyncMinutes: parseInt(process.env.EMPLOYEE_SYNC_MINUTES || "60"),
    timezone: process.env.TIMEZONE || "Asia/Baghdad",
  },
  push: {
    port: parseInt(process.env.PUSH_LISTENER_PORT || "8089"),
    enabled: process.env.PUSH_LISTENER_ENABLED !== "false",
  },
};

// ── Clients ──

const hik = new HikvisionClient(config.device);
const db = createClient(config.supabase.url, config.supabase.serviceKey);

// ── State ──

let lastSyncTime = null; // ISO string of last successful event sync
const processedEventIds = new Set(); // dedup within session
const IRAQ_TZ = config.sync.timezone;

// ── Persist lastSyncTime so PM2 restarts don't lose state ──

async function loadLastSyncTime() {
  try {
    const { data } = await db
      .from("biometric_devices")
      .select("last_sync_at")
      .eq("ip_address", config.device.ip)
      .maybeSingle();
    if (data?.last_sync_at) {
      lastSyncTime = data.last_sync_at;
      log("📌", `Restored lastSyncTime from DB: ${lastSyncTime}`);
    }
  } catch (err) {
    log("⚠️", `Could not restore lastSyncTime: ${err.message}`);
  }
}

// ── Helpers ──

function nowIraq() {
  return new Date().toLocaleString("en-CA", { timeZone: IRAQ_TZ }).replace(", ", "T");
}

function todayIraq() {
  return new Date().toLocaleDateString("en-CA", { timeZone: IRAQ_TZ });
}

function toIsoLocal(date) {
  // Format: 2026-04-22T08:30:00+03:00
  const d = date instanceof Date ? date : new Date(date);
  const offset = "+03:00"; // Iraq is UTC+3
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offset}`;
}

function getDayOfWeek(dateStr) {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date(dateStr + "T00:00:00+03:00").getDay()];
}

function log(emoji, msg) {
  const ts = new Date().toLocaleTimeString("en-GB", { timeZone: IRAQ_TZ });
  console.log(`[${ts}] ${emoji} ${msg}`);
}

// ── Retry with exponential backoff (for Supabase / device calls) ──

async function withRetry(fn, { maxRetries = 3, baseDelayMs = 1000, label = "operation" } = {}) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      log("🔁", `${label} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ══════════════════════════════════════════
// CORE: Process a single attendance event
// ══════════════════════════════════════════

async function processEvent(event) {
  const { employeeNo, time, verifyMode, eventId, attendanceStatus } = event;

  // Dedup
  const dedupKey = `${employeeNo}-${time}-${eventId}`;
  if (processedEventIds.has(dedupKey)) return;
  processedEventIds.add(dedupKey);

  // Keep dedup set bounded
  if (processedEventIds.size > 10000) {
    const arr = [...processedEventIds];
    arr.splice(0, 5000);
    processedEventIds.clear();
    arr.forEach((k) => processedEventIds.add(k));
  }

  if (!employeeNo || !time) return;

  const eventTime = new Date(time);
  const dateStr = time.slice(0, 10); // "2026-04-22"
  const timeStr = time.slice(11, 19); // "08:30:15"

  // 1. Find employee in HR system (check device_employee_no, person_id, and national_id)
  let employee = null;
  try {
    // Try device_employee_no first (most specific)
    let { data } = await db
      .from("employees")
      .select("*")
      .eq("device_employee_no", employeeNo)
      .limit(1)
      .maybeSingle();

    if (!data) {
      // Try person_id
      const numId = parseInt(employeeNo);
      if (!isNaN(numId)) {
        ({ data } = await db
          .from("employees")
          .select("*")
          .eq("person_id", numId)
          .limit(1)
          .maybeSingle());
      }
    }

    if (!data) {
      // Try national_id
      ({ data } = await db
        .from("employees")
        .select("*")
        .eq("national_id", employeeNo)
        .limit(1)
        .maybeSingle());
    }

    employee = data;
  } catch (lookupErr) {
    log("⚠️", `Employee lookup error for #${employeeNo}: ${lookupErr.message}`);
  }

  // 2. Auto-discover: employee not found → create + notify
  if (!employee) {
    employee = await autoCreateEmployee(event);
    if (!employee) return;
  }

  // 3. Upsert attendance record (use device's own check-in/out status)
  try {
    await upsertAttendanceRecord(employee, dateStr, timeStr, verifyMode, employeeNo, attendanceStatus);
    const statusLabel = attendanceStatus === "checkIn" ? "دخول" : attendanceStatus === "checkOut" ? "خروج" : attendanceStatus || "—";
    log("✅", `${employee.arabic_name || employee.name} → ${timeStr} [${statusLabel}] (${verifyMode})`);
  } catch (upsertErr) {
    log("❌", `Upsert failed for ${employee.name}: ${upsertErr.message}`);
  }
}

// ══════════════════════════════════════════
// Attendance Record Logic (device-driven)
// ══════════════════════════════════════════

async function upsertAttendanceRecord(employee, dateStr, timeStr, verifyMode, employeeNo, attendanceStatus) {
  const isCheckIn = attendanceStatus === "checkIn";
  const isCheckOut = attendanceStatus === "checkOut";

  // Handle break events → route to break tracker
  if (attendanceStatus === "breakOut" || attendanceStatus === "breakIn") {
    await processBreakEvent(employee, dateStr, timeStr, attendanceStatus);
    return;
  }

  // If device didn't provide status (shouldn't happen, but safety net) — skip
  if (!isCheckIn && !isCheckOut) {
    log("⚠️", `No attendanceStatus for ${employee.arabic_name || employee.name} at ${timeStr} — skipping`);
    return;
  }

  // Check if record exists for this employee + date
  const { data: existing } = await db
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employee.id)
    .eq("date", dateStr)
    .maybeSingle();

  if (isCheckIn) {
    if (existing) {
      // Already have a record — update check-in only if this is earlier
      if (timeStr < existing.check_in_time) {
        const updates = { check_in_time: timeStr };
        // Recalculate working hours if checkout exists
        if (existing.check_out_time) {
          const worked = Math.max(0, timeToMinutes(existing.check_out_time) - timeToMinutes(timeStr));
          updates.working_hours = Math.round((worked / 60) * 100) / 100;
        }
        const { error } = await db.from("attendance_records").update(updates).eq("id", existing.id);
        if (error) log("❌", `Update check-in failed: ${error.message}`);
      }
      // Otherwise ignore — we already have the first check-in
      return;
    }

    // No record yet — create new CHECK IN
    const { error } = await db.from("attendance_records").insert({
      id: uuid(),
      employee_id: employee.id,
      date: dateStr,
      day_of_week: getDayOfWeek(dateStr),
      check_in_time: timeStr,
      check_out_time: null,
      working_hours: 0,
      overtime_hours: 0,
      is_late: false,
      late_minutes: 0,
      is_early: false,
      status: "checked_in",
      auto_checkout_applied: false,
      source: "device",
      verify_mode: verifyMode,
      device_employee_no: String(employeeNo || ""),
    });

    if (error) log("❌", `Insert check-in failed for ${employee.name}: ${error.message}`);
    return;
  }

  if (isCheckOut) {
    if (!existing) {
      // No record for today — check if this is an overnight shift checkout
      // (employee checked in YESTERDAY and is checking out early today)
      const yesterday = new Date(new Date(dateStr + "T00:00:00+03:00").getTime() - 86400000)
        .toISOString().slice(0, 10);
      const { data: yesterdayRecord } = await db
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("date", yesterday)
        .is("check_out_time", null)
        .eq("status", "checked_in")
        .maybeSingle();

      if (yesterdayRecord) {
        // Overnight shift — close yesterday's record with today's checkout
        const checkIn = yesterdayRecord.check_in_time;
        const checkInMinutes = checkIn ? timeToMinutes(checkIn) : 0;
        const checkOutMinutes = timeToMinutes(timeStr) + 1440; // add 24h in minutes for overnight
        const workedMinutes = checkIn ? Math.max(0, checkOutMinutes - checkInMinutes) : 0;
        const workedHours = Math.round((workedMinutes / 60) * 100) / 100;

        const { error } = await db.from("attendance_records").update({
          check_out_time: timeStr,
          working_hours: workedHours,
          overtime_hours: 0,
          status: "complete",
          auto_checkout_applied: false,
        }).eq("id", yesterdayRecord.id);

        if (error) log("❌", `Overnight checkout update failed: ${error.message}`);
        else log("🌙", `${employee.arabic_name || employee.name} overnight checkout: yesterday ${checkIn} → today ${timeStr} (${workedHours}h)`);
        return;
      }

      // Truly no check-in anywhere — create record with check-out only
      const { error } = await db.from("attendance_records").insert({
        id: uuid(),
        employee_id: employee.id,
        date: dateStr,
        day_of_week: getDayOfWeek(dateStr),
        check_in_time: null,
        check_out_time: timeStr,
        working_hours: 0,
        overtime_hours: 0,
        is_late: false,
        late_minutes: 0,
        is_early: false,
        status: "missing_checkin",
        auto_checkout_applied: false,
        source: "device",
        verify_mode: verifyMode,
        device_employee_no: String(employeeNo || ""),
      });

      if (error) log("❌", `Insert check-out (no check-in) failed: ${error.message}`);
      log("⚠️", `${employee.arabic_name || employee.name} checked out at ${timeStr} with no check-in`);
      return;
    }

    // Update to latest check-out time
    const checkIn = existing.check_in_time;
    const checkInMinutes = checkIn ? timeToMinutes(checkIn) : 0;
    const checkOutMinutes = timeToMinutes(timeStr);
    const workedMinutes = checkIn ? Math.max(0, checkOutMinutes - checkInMinutes) : 0;
    const workedHours = Math.round((workedMinutes / 60) * 100) / 100;

    // Calculate overtime if employee has a shift
    let overtimeHours = 0;
    if (employee.shift_id && workedHours > 0) {
      const { data: shift } = await db
        .from("shifts")
        .select("target_hours_per_day")
        .eq("id", employee.shift_id)
        .maybeSingle();
      if (shift && workedHours > shift.target_hours_per_day) {
        overtimeHours = Math.round((workedHours - shift.target_hours_per_day) * 100) / 100;
      }
    }

    const { error } = await db
      .from("attendance_records")
      .update({
        check_out_time: timeStr,
        working_hours: workedHours,
        overtime_hours: overtimeHours,
        status: checkIn ? "complete" : "missing_checkin",
        auto_checkout_applied: false,
      })
      .eq("id", existing.id);

    if (error) log("❌", `Update check-out failed for ${employee.name}: ${error.message}`);
  }
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 60 + m + s / 60;
}

// ══════════════════════════════════════════
// Auto-Create Unknown Employees
// ══════════════════════════════════════════

async function autoCreateEmployee(event) {
  const { employeeNo, name } = event;

  log("🆕", `Unknown employee #${employeeNo} "${name}" — auto-creating...`);

  // Try to get more info from device
  let deviceName = name || `موظف #${employeeNo}`;

  // Create employee with pending status
  const newEmployee = {
    id: uuid(),
    person_id: parseInt(employeeNo) || 0,
    name: deviceName,
    arabic_name: deviceName,
    department: "غير محدد",
    monthly_salary: 0,
    currency: "IQD",
    overtime_rate: 1.5,
    overtime_enabled: false,
    allowed_late_minutes: 15,
    status: "معلق", // Pending — needs HR review
    national_id: null, // will be filled by HR — device employeeNo is NOT the national ID
    device_employee_no: String(employeeNo),
  };

  const { data, error } = await db
    .from("employees")
    .insert(newEmployee)
    .select("*")
    .single();

  if (error) {
    log("❌", `Auto-create failed for #${employeeNo}: ${error.message}`);
    return null;
  }

  // Create notification for HR
  try {
    await db.from("notifications").insert({
      id: uuid(),
      title: `موظف جديد من البصمة: "${deviceName}" (#${employeeNo})`,
      body: `تم إضافة موظف جديد تلقائياً من جهاز البصمة. يرجى مراجعة وإكمال بياناته.`,
      type: "warning",
      category: "attendance",
      entity_type: "employee",
      entity_id: data.id,
      target_employee_id: null,
      action_url: `/employees/${data.id}`,
    });
  } catch (notifErr) {
    log("⚠️", `Notification insert failed (non-critical): ${notifErr.message}`);
  }

  log("🔔", `Notification created for HR — review employee "${deviceName}"`);
  return data;
}

// ══════════════════════════════════════════
// Employee Sync (device → HR system)
// ══════════════════════════════════════════

async function syncEmployees() {
  log("👥", "Syncing enrolled users from device...");

  try {
    const users = await hik.fetchAllUsers();
    log("👥", `Found ${users.length} users on device`);

    // Get all HR employees
    const { data: hrEmployees } = await db
      .from("employees")
      .select("*");

    const hrMap = new Map();
    (hrEmployees || []).forEach((e) => {
      if (e.person_id) hrMap.set(String(e.person_id), e);
      if (e.national_id) hrMap.set(e.national_id, e);
      if (e.device_employee_no) hrMap.set(e.device_employee_no, e);
    });

    let newCount = 0;
    let updatedCount = 0;
    for (const user of users) {
      const existing = hrMap.get(user.employeeNo);
      if (!existing) {
        // Not in HR system — auto-create
        await autoCreateEmployee({
          employeeNo: user.employeeNo,
          name: user.name || `موظف #${user.employeeNo}`,
        });
        newCount++;
      } else {
        // Existing employee — sync name updates from device
        // If device name changed (and isn't a generic placeholder), update HR system name field
        const deviceName = user.name || "";
        const hrName = existing.name || "";
        if (deviceName && deviceName !== hrName && !deviceName.startsWith("موظف #")) {
          const updates = { name: deviceName, device_employee_no: user.employeeNo };
          // Only update arabic_name if not already set to something different by HR
          if (!existing.arabic_name || existing.arabic_name === hrName) {
            updates.arabic_name = deviceName;
          }
          await db.from("employees").update(updates).eq("id", existing.id);
          log("✏️", `Updated name for #${user.employeeNo}: "${hrName}" → "${deviceName}"`);
          updatedCount++;
        }
        // Always ensure device_employee_no is linked
        if (!existing.device_employee_no) {
          await db.from("employees").update({ device_employee_no: user.employeeNo }).eq("id", existing.id);
        }
      }
    }

    if (newCount > 0) log("🆕", `Auto-created ${newCount} new employees from device`);
    if (updatedCount > 0) log("✏️", `Updated ${updatedCount} employee names from device`);
    if (newCount === 0 && updatedCount === 0) log("✓", "All device users are already in sync");
  } catch (err) {
    log("❌", `Employee sync failed: ${err.message}`);
  }
}

// ══════════════════════════════════════════
// Poll: Fetch recent events from device
// ══════════════════════════════════════════

async function pollEvents() {
  const now = new Date();
  const startTime = lastSyncTime || toIsoLocal(new Date(now.getTime() - config.sync.intervalMinutes * 60 * 1000));
  const endTime = toIsoLocal(now);

  log("🔄", `Polling events: ${startTime.slice(11, 19)} → ${endTime.slice(11, 19)}`);

  try {
    // Use fetchAttendanceEvents — only successful auth events (major=5 + valid employee)
    const events = await withRetry(
      () => hik.fetchAttendanceEvents(startTime, endTime),
      { label: "fetchAttendanceEvents" }
    );
    log("📥", `Fetched ${events.length} attendance events (filtered)`);

    let processed = 0;
    for (const event of events) {
      await processEvent(event);
      processed++;
    }

    lastSyncTime = endTime;
    await updateDeviceSyncTimestamp();
    if (processed > 0) log("📊", `Processed ${processed} events → Supabase`);
  } catch (err) {
    log("❌", `Poll failed: ${err.message}`);
    if (err.stack) log("📋", err.stack.split("\n")[1]?.trim() || "");
  }
}

// ══════════════════════════════════════════
// Full Reconciliation (catch-up for today)
// ══════════════════════════════════════════

// Update biometric_devices.last_sync_at in Supabase (so frontend knows sync is fresh)
async function updateDeviceSyncTimestamp() {
  try {
    await db.from("biometric_devices")
      .update({ last_sync_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString() })
      .eq("ip_address", config.device.ip);
  } catch (err) {
    log("⚠️", `Could not update device timestamp: ${err.message}`);
  }
}

async function fullReconcile() {
  const today = todayIraq();
  const startTime = `${today}T00:00:00+03:00`;
  const endTime = toIsoLocal(new Date());

  log("🔁", `Full reconciliation for ${today}...`);

  try {
    // Use fetchAttendanceEvents — only successful auth events
    const events = await hik.fetchAttendanceEvents(startTime, endTime);
    log("📥", `Reconcile: ${events.length} attendance events today (filtered)`);

    let processed = 0;
    for (const event of events) {
      await processEvent(event);
      processed++;
    }

    await updateDeviceSyncTimestamp();
    log("📊", `Reconcile done: ${processed} events processed for ${today}`);

    // Log Supabase record count for today
    const { count } = await db
      .from("attendance_records")
      .select("*", { count: "exact", head: true })
      .eq("date", today);
    log("📊", `Supabase has ${count || 0} attendance records for today`);
  } catch (err) {
    log("❌", `Reconciliation failed: ${err.message}`);
    if (err.stack) log("📋", err.stack.split("\n")[1]?.trim() || "");
  }
}

// ══════════════════════════════════════════
// Push Listener: Device sends events to us
// ══════════════════════════════════════════

function startPushListener() {
  const app = express();

  // CORS headers for frontend requests (must be before routes)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  app.use(express.json());
  app.use(express.text({ type: "application/xml" }));

  // Hikvision ISAPI event notification endpoint
  app.post("/ISAPI/Event/notification/alertStream", async (req, res) => {
    try {
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

      // Parse the event from the push notification
      const event = parsePushEvent(body);
      // Only process if it's a real attendance event (has employee + attendanceStatus + major=5)
      if (event && event.employeeNo && event.employeeNo !== "0" && event.attendanceStatus && isAttendanceEvent(event)) {
        await processEvent(event);
      }

      res.status(200).send("OK");
    } catch (err) {
      log("❌", `Push event error: ${err.message}`);
      res.status(200).send("OK"); // Always 200 so device doesn't retry endlessly
    }
  });

  // Generic fallback for different Hikvision push paths
  app.post("/EventNotification", async (req, res) => {
    try {
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const event = parsePushEvent(body);
      if (event && event.employeeNo && event.employeeNo !== "0" && event.attendanceStatus && isAttendanceEvent(event)) {
        await processEvent(event);
      }
      res.status(200).send("OK");
    } catch (err) {
      log("❌", `Push event error: ${err.message}`);
      res.status(200).send("OK");
    }
  });

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      status: "running",
      lastSync: lastSyncTime,
      processedCount: processedEventIds.size,
      uptime: process.uptime(),
    });
  });

  // Manual sync trigger (called from frontend TopBar)
  app.post("/api/sync", async (req, res) => {
    log("🔄", "Manual sync triggered from UI");
    try {
      await fullReconcile();
      await updateDeviceSyncTimestamp();
      res.json({ success: true, lastSync: lastSyncTime, message: "Sync complete" });
    } catch (err) {
      log("❌", `Manual sync failed: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Manual employee sync trigger
  app.post("/api/sync/employees", async (req, res) => {
    log("👥", "Manual employee sync triggered from UI");
    try {
      await syncEmployees();
      res.json({ success: true, message: "Employee sync complete" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Device status for frontend
  app.get("/api/status", (req, res) => {
    res.json({
      status: "running",
      lastSync: lastSyncTime,
      processedCount: processedEventIds.size,
      uptime: Math.round(process.uptime()),
      deviceIp: config.device.ip,
    });
  });

  // ══════════════════════════════════════════
  // Device Management API
  // ══════════════════════════════════════════

  // GET /api/device/info — device overview + capacity
  app.get("/api/device/info", async (req, res) => {
    try {
      const [info, capacity, network, door] = await Promise.all([
        hik.getDeviceInfo(),
        hik.getCapacity(),
        hik.getNetworkStatus(),
        hik.getDoorStatus(),
      ]);
      // Ensure IP is always available from config
      if (network && !network.ipAddress) network.ipAddress = config.device.ip;
      res.json({ success: true, info, capacity, network, door, deviceIp: config.device.ip });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/device/persons — list all enrolled persons
  app.get("/api/device/persons", async (req, res) => {
    try {
      const users = await hik.fetchAllUsers();
      res.json({ success: true, persons: users, total: users.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/device/persons/:id — get a single person
  app.get("/api/device/persons/:id", async (req, res) => {
    try {
      const person = await hik.getPerson(req.params.id);
      if (!person) return res.status(404).json({ success: false, error: "Person not found" });
      res.json({ success: true, person });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/device/persons — create a new person
  app.post("/api/device/persons", async (req, res) => {
    try {
      const { employeeNo, name, gender, userType, validFrom, validTo } = req.body;
      if (!employeeNo || !name) return res.status(400).json({ success: false, error: "employeeNo and name are required" });
      const result = await hik.createPerson({ employeeNo, name, gender, userType, validFrom, validTo });
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT /api/device/persons/:id — update a person
  app.put("/api/device/persons/:id", async (req, res) => {
    try {
      const { name, gender, userType, validFrom, validTo } = req.body;
      const result = await hik.updatePerson({ employeeNo: req.params.id, name, gender, userType, validFrom, validTo });
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/device/persons/:id — delete a person
  app.delete("/api/device/persons/:id", async (req, res) => {
    try {
      const result = await hik.deletePerson(req.params.id);
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/device/persons/:id/face — get face photo
  app.get("/api/device/persons/:id/face", async (req, res) => {
    try {
      const result = await hik.getFacePhoto(req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/device/persons/:id/face — upload face photo (base64 in body)
  app.post("/api/device/persons/:id/face", express.raw({ type: "*/*", limit: "5mb" }), async (req, res) => {
    try {
      let imageBuffer;
      if (req.is("application/json")) {
        const data = JSON.parse(req.body.toString());
        imageBuffer = Buffer.from(data.image, "base64");
      } else {
        imageBuffer = req.body;
      }
      const result = await hik.uploadFacePhoto(req.params.id, imageBuffer);
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/device/persons/:id/face — delete face photo
  app.delete("/api/device/persons/:id/face", async (req, res) => {
    try {
      const result = await hik.deleteFacePhoto(req.params.id);
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/device/events — search events with filters
  app.get("/api/device/events", async (req, res) => {
    try {
      const { startDate, endDate, employeeNo } = req.query;
      const start = startDate || todayIraq();
      const end = endDate || start;
      const startTime = `${start}T00:00:00+03:00`;
      const endTime = `${end}T23:59:59+03:00`;

      const events = await hik.fetchAttendanceEvents(startTime, endTime);

      // Filter by employee if specified
      const filtered = employeeNo
        ? events.filter(e => e.employeeNo === employeeNo)
        : events;

      res.json({ success: true, events: filtered, total: filtered.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/device/door/open — remote door open
  app.post("/api/device/door/open", async (req, res) => {
    try {
      const result = await hik.remoteDoorOpen();
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/device/door/close — remote door close
  app.post("/api/device/door/close", async (req, res) => {
    try {
      const result = await hik.remoteDoorClose();
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ══════════════════════════════════════════
  // HR → Device Sync API
  // ══════════════════════════════════════════

  // GET /api/device/next-employee-id — get next available employee ID (max of HR + device + 1)
  app.get("/api/device/next-employee-id", async (req, res) => {
    try {
      // Get max from HR system
      const { data: hrMax } = await db
        .from("employees")
        .select("person_id")
        .order("person_id", { ascending: false })
        .limit(1)
        .maybeSingle();
      const hrMaxId = hrMax?.person_id || 0;

      // Get max from device
      let deviceMaxId = 0;
      try {
        const users = await hik.fetchAllUsers();
        for (const u of users) {
          const num = parseInt(u.employeeNo);
          if (!isNaN(num) && num > deviceMaxId) deviceMaxId = num;
        }
      } catch { /* device offline — use HR max only */ }

      const nextId = Math.max(hrMaxId, deviceMaxId) + 1;
      res.json({ success: true, nextId });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/device/remove-credentials/:id — remove person + credentials from device (termination)
  app.post("/api/device/remove-credentials/:id", async (req, res) => {
    try {
      const empNo = req.params.id;
      const { removeFace, removeFingerprint, removePerson } = req.body;
      const results = {};

      if (removeFace) {
        try {
          await hik.deleteFacePhoto(empNo);
          results.face = "removed";
          log("🗑️", `Removed face data for #${empNo}`);
        } catch (e) { results.face = `error: ${e.message}`; }
      }

      // Note: fingerprint removal requires the device API endpoint
      // The device typically uses /ISAPI/AccessControl/FingerPrint/Delete
      if (removeFingerprint) {
        try {
          await hik._putJson("/ISAPI/AccessControl/FingerPrint/Delete", {
            FingerPrintDelete: {
              mode: "byEmployeeNo",
              EmployeeNoDetail: { employeeNo: empNo },
            },
          });
          results.fingerprint = "removed";
          log("🗑️", `Removed fingerprint data for #${empNo}`);
        } catch (e) { results.fingerprint = `error: ${e.message}`; }
      }

      if (removePerson) {
        try {
          await hik.deletePerson(empNo);
          results.person = "removed";
          log("🗑️", `Removed person #${empNo} from device entirely`);
        } catch (e) { results.person = `error: ${e.message}`; }
      }

      // Update HR record to clear device link
      if (removePerson) {
        await db.from("employees")
          .update({ device_employee_no: null })
          .eq("device_employee_no", empNo);
      }

      res.json({ success: true, results });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/device/sync-employee — push an HR employee to the biometric device
  app.post("/api/device/sync-employee", async (req, res) => {
    try {
      const { employeeNo, name, gender, facePhoto } = req.body;
      if (!employeeNo || !name) {
        return res.status(400).json({ success: false, error: "employeeNo and name are required" });
      }

      // Check if person already exists on device
      let exists = false;
      try {
        const person = await hik.getPerson(employeeNo);
        exists = !!person;
      } catch { /* not found */ }

      if (exists) {
        // Update existing person
        await hik.updatePerson({ employeeNo, name, gender: gender || "male", userType: "normal" });
        log("✏️", `HR→Device: Updated person #${employeeNo} "${name}"`);
      } else {
        // Create new person
        await hik.createPerson({ employeeNo, name, gender: gender || "male", userType: "normal" });
        log("🆕", `HR→Device: Created person #${employeeNo} "${name}"`);
      }

      // Upload face photo if provided (base64)
      if (facePhoto) {
        try {
          const imageBuffer = Buffer.from(facePhoto, "base64");
          await hik.uploadFacePhoto(employeeNo, imageBuffer);
          log("📸", `HR→Device: Uploaded face photo for #${employeeNo}`);
        } catch (faceErr) {
          log("⚠️", `Face upload failed for #${employeeNo}: ${faceErr.message}`);
        }
      }

      res.json({ success: true, action: exists ? "updated" : "created" });
    } catch (err) {
      log("❌", `HR→Device sync failed: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/device/sync-employee/:id — remove employee from device when terminated
  app.delete("/api/device/sync-employee/:id", async (req, res) => {
    try {
      await hik.deletePerson(req.params.id);
      log("🗑️", `HR→Device: Removed person #${req.params.id} from device`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/device/sync-status — compare device persons vs HR employees
  app.get("/api/device/sync-status", async (req, res) => {
    try {
      const [users, { data: hrEmployees }] = await Promise.all([
        hik.fetchAllUsers(),
        db.from("employees").select("id, name, arabic_name, person_id, device_employee_no, status"),
      ]);

      const deviceMap = new Map(users.map(u => [u.employeeNo, u]));
      const hrMap = new Map();
      (hrEmployees || []).forEach(e => {
        const key = e.device_employee_no || String(e.person_id || "");
        if (key) hrMap.set(key, e);
      });

      // Employees in HR but not on device
      const notOnDevice = (hrEmployees || []).filter(e => {
        const key = e.device_employee_no || String(e.person_id || "");
        return key && !deviceMap.has(key) && e.status !== "منتهي";
      });

      // Persons on device but not in HR
      const notInHR = users.filter(u => !hrMap.has(u.employeeNo));

      // Synced (both)
      const synced = users.filter(u => hrMap.has(u.employeeNo));

      res.json({
        success: true,
        deviceTotal: users.length,
        hrTotal: (hrEmployees || []).length,
        synced: synced.length,
        notOnDevice: notOnDevice.map(e => ({
          id: e.id,
          name: e.arabic_name || e.name,
          employeeNo: e.device_employee_no || String(e.person_id || ""),
        })),
        notInHR: notInHR.map(u => ({
          employeeNo: u.employeeNo,
          name: u.name,
          numOfFace: u.numOfFace,
          numOfFP: u.numOfFP,
        })),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.listen(config.push.port, "0.0.0.0", () => {
    log("📡", `Push listener running on port ${config.push.port}`);
    log("📡", `Manual sync: POST http://localhost:${config.push.port}/api/sync`);
    log("📡", `Configure device to push events to: http://<this-machine-ip>:${config.push.port}/ISAPI/Event/notification/alertStream`);
  });
}

/**
 * Check if a push event is a valid attendance event (not door lock, alarm, etc.)
 * major=5 = access control (authentication), which is what we want for attendance.
 * If major is unknown (some push formats omit it), accept if employee is present.
 */
function isAttendanceEvent(event) {
  // If we have a major code, only accept major=5 (access control / auth)
  if (event.eventType !== undefined && event.eventType !== null) {
    return event.eventType === 5;
  }
  // If no major code in push event, accept as long as there's an employee
  return true;
}

function parsePushEvent(body) {
  // Try JSON
  try {
    const json = typeof body === "string" ? JSON.parse(body) : body;
    const evt = json.AccessControllerEvent || json.EventNotificationAlert || json;
    return {
      eventId: evt.serialNo || evt.eventId || Date.now(),
      employeeNo: evt.employeeNoString || String(evt.employeeNo || ""),
      name: evt.name || "",
      time: evt.dateTime || evt.time || new Date().toISOString(),
      verifyMode: evt.currentVerifyMode || "unknown",
      attendanceStatus: evt.attendanceStatus || null,
      eventType: evt.major ?? null,
      eventMinor: evt.minor ?? null,
    };
  } catch {
    // Try XML
    const extractXml = (xml, tag) => {
      const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
      return m ? m[1].trim() : "";
    };
    const majorStr = extractXml(body, "major");
    return {
      eventId: extractXml(body, "serialNo") || Date.now(),
      employeeNo: extractXml(body, "employeeNoString") || extractXml(body, "employeeNo"),
      name: extractXml(body, "name"),
      time: extractXml(body, "dateTime") || extractXml(body, "time") || new Date().toISOString(),
      verifyMode: extractXml(body, "currentVerifyMode") || "unknown",
      attendanceStatus: extractXml(body, "attendanceStatus") || null,
      eventType: majorStr ? parseInt(majorStr) : null,
      eventMinor: parseInt(extractXml(body, "minor")) || null,
    };
  }
}

// ══════════════════════════════════════════
// Late Detection (runs after check-in)
// ══════════════════════════════════════════

async function detectLateArrivals() {
  const today = todayIraq();

  // Get today's records that have check_in but no late calculation yet
  const { data: records } = await db
    .from("attendance_records")
    .select("id, employee_id, check_in_time, is_late")
    .eq("date", today)
    .not("check_in_time", "is", null);

  if (!records || records.length === 0) return;

  for (const record of records) {
    // Get employee's shift
    const { data: emp } = await db
      .from("employees")
      .select("*")
      .eq("id", record.employee_id)
      .maybeSingle();

    if (!emp?.shift_id) continue;

    const { data: shift } = await db
      .from("shifts")
      .select("*")
      .eq("id", emp.shift_id)
      .maybeSingle();

    if (!shift?.start_time) continue;

    const shiftStart = timeToMinutes(shift.start_time);
    const checkIn = timeToMinutes(record.check_in_time);
    const gracePeriod = emp.allowed_late_minutes || 15;
    const lateMinutes = Math.max(0, checkIn - shiftStart - gracePeriod);

    if (lateMinutes > 0 && !record.is_late) {
      await db.from("attendance_records").update({
        is_late: true,
        late_minutes: lateMinutes,
      }).eq("id", record.id);
    }
  }
}

// ══════════════════════════════════════════
// ⑬ Auto-Checkout at Shift End (Option A)
// ══════════════════════════════════════════

const AUTO_CHECKOUT_GRACE_MINUTES = 30; // grace period after shift end

async function autoCheckout() {
  const today = todayIraq();
  const nowMinutes = timeToMinutes(
    new Date().toLocaleTimeString("en-GB", { timeZone: IRAQ_TZ, hour12: false })
  );

  log("🕐", `Auto-checkout check for ${today} (now = ${Math.floor(nowMinutes / 60)}:${String(Math.floor(nowMinutes % 60)).padStart(2, "0")})...`);

  try {
    // Get all open records for today (checked_in, no checkout)
    const { data: openRecords } = await db
      .from("attendance_records")
      .select("id, employee_id, check_in_time, status")
      .eq("date", today)
      .is("check_out_time", null)
      .in("status", ["checked_in"]);

    if (!openRecords || openRecords.length === 0) {
      log("✓", "No open records to auto-checkout");
      return;
    }

    // Get all employees with shifts
    const empIds = openRecords.map((r) => r.employee_id);
    const { data: employees } = await db
      .from("employees")
      .select("id, name, arabic_name, shift_id")
      .in("id", empIds);

    if (!employees) return;

    // Build shift cache
    const shiftIds = [...new Set(employees.filter((e) => e.shift_id).map((e) => e.shift_id))];
    const { data: shifts } = await db
      .from("shifts")
      .select("id, end_time, target_hours_per_day")
      .in("id", shiftIds);

    const shiftMap = new Map((shifts || []).map((s) => [s.id, s]));
    const empMap = new Map(employees.map((e) => [e.id, e]));

    let autoCount = 0;

    for (const record of openRecords) {
      const emp = empMap.get(record.employee_id);
      if (!emp?.shift_id) continue;

      const shift = shiftMap.get(emp.shift_id);
      if (!shift?.end_time) continue;

      const shiftEndMinutes = timeToMinutes(shift.end_time);
      const deadlineMinutes = shiftEndMinutes + AUTO_CHECKOUT_GRACE_MINUTES;

      // Only auto-checkout if we're past shift_end + grace
      if (nowMinutes < deadlineMinutes) continue;

      // Use the shift's end_time as the checkout time (Option A: estimated hours)
      const checkOutTime = shift.end_time;
      const checkInMinutes = record.check_in_time ? timeToMinutes(record.check_in_time) : 0;
      const workedMinutes = record.check_in_time
        ? Math.max(0, timeToMinutes(checkOutTime) - checkInMinutes)
        : 0;
      const workedHours = Math.round((workedMinutes / 60) * 100) / 100;

      // Calculate overtime
      let overtimeHours = 0;
      if (shift.target_hours_per_day && workedHours > shift.target_hours_per_day) {
        overtimeHours = Math.round((workedHours - shift.target_hours_per_day) * 100) / 100;
      }

      const { error } = await db.from("attendance_records").update({
        check_out_time: checkOutTime,
        working_hours: workedHours,
        overtime_hours: overtimeHours,
        status: "auto_checkout",
        auto_checkout_applied: true,
      }).eq("id", record.id);

      if (!error) {
        autoCount++;
        log("🕐", `Auto-checkout: ${emp.arabic_name || emp.name} → ${checkOutTime} (${workedHours}h, shift end)`);
      }
    }

    if (autoCount > 0) log("📋", `Auto-checkout applied to ${autoCount} employees`);
  } catch (err) {
    log("❌", `Auto-checkout failed: ${err.message}`);
  }
}

// ══════════════════════════════════════════
// ⑭ Absent Detection
// ══════════════════════════════════════════

async function detectAbsences() {
  const today = todayIraq();
  const dayOfWeek = getDayOfWeek(today);

  log("🔍", `Checking absences for ${today} (${dayOfWeek})...`);

  try {
    // Get all active employees with shifts
    const { data: employees } = await db
      .from("employees")
      .select("id, name, arabic_name, shift_id, status")
      .in("status", ["نشط", "active"])
      .not("shift_id", "is", null);

    if (!employees || employees.length === 0) return;

    // Get today's attendance records
    const { data: todayRecords } = await db
      .from("attendance_records")
      .select("employee_id")
      .eq("date", today);

    const presentIds = new Set((todayRecords || []).map((r) => r.employee_id));

    // Get approved leaves for today
    const { data: leaves } = await db
      .from("leave_requests")
      .select("employee_id")
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today);

    const onLeaveIds = new Set((leaves || []).map((l) => l.employee_id));

    // Get shifts to check if today is a working day
    const shiftIds = [...new Set(employees.map((e) => e.shift_id))];
    const { data: shifts } = await db
      .from("shifts")
      .select("id, working_days")
      .in("id", shiftIds);

    const shiftMap = new Map((shifts || []).map((s) => [s.id, s]));

    let absentCount = 0;
    for (const emp of employees) {
      // Skip if already has a record or is on leave
      if (presentIds.has(emp.id) || onLeaveIds.has(emp.id)) continue;

      // Skip if today isn't a working day for their shift
      const shift = shiftMap.get(emp.shift_id);
      if (shift?.working_days) {
        const workDays = Array.isArray(shift.working_days) ? shift.working_days : [];
        if (workDays.length > 0 && !workDays.includes(dayOfWeek)) continue;
      }

      // Create absent record
      const { error } = await db.from("attendance_records").upsert({
        id: uuid(),
        employee_id: emp.id,
        date: today,
        day_of_week: dayOfWeek,
        check_in_time: null,
        check_out_time: null,
        working_hours: 0,
        overtime_hours: 0,
        is_late: false,
        late_minutes: 0,
        is_early: false,
        status: "absent",
        auto_checkout_applied: false,
        source: "system",
      }, { onConflict: "employee_id,date", ignoreDuplicates: true });

      if (!error) absentCount++;
    }

    if (absentCount > 0) log("📋", `Marked ${absentCount} employees as absent for ${today}`);
    else log("✓", "No absences to record");
  } catch (err) {
    log("❌", `Absence detection failed: ${err.message}`);
  }
}

// ══════════════════════════════════════════
// ⑮ Device Health Monitoring
// ══════════════════════════════════════════

let consecutiveHealthFailures = 0;
const MAX_HEALTH_FAILURES = 3;

async function checkDeviceHealth() {
  try {
    const info = await hik.getDeviceInfo();
    if (consecutiveHealthFailures > 0) {
      log("💚", `Device back online after ${consecutiveHealthFailures} failed checks`);

      // Clear any previous offline notification
      try {
        await db.from("notifications")
          .update({ type: "info", title: "جهاز البصمة متصل مرة أخرى", body: `عاد جهاز البصمة ${info.model} للعمل.` })
          .eq("category", "device_health")
          .eq("type", "error");
      } catch { /* non-critical */ }
    }
    consecutiveHealthFailures = 0;

    // Update heartbeat
    await db.from("biometric_devices")
      .update({ last_heartbeat_at: new Date().toISOString(), status: "online" })
      .eq("ip_address", config.device.ip);

  } catch (err) {
    consecutiveHealthFailures++;
    log("⚠️", `Device health check failed (${consecutiveHealthFailures}/${MAX_HEALTH_FAILURES}): ${err.message}`);

    // Update device status
    try {
      await db.from("biometric_devices")
        .update({ status: consecutiveHealthFailures >= MAX_HEALTH_FAILURES ? "offline" : "degraded" })
        .eq("ip_address", config.device.ip);
    } catch { /* non-critical */ }

    if (consecutiveHealthFailures === MAX_HEALTH_FAILURES) {
      log("🔴", "Device appears OFFLINE — creating notification for HR");
      try {
        await db.from("notifications").insert({
          id: uuid(),
          title: "⚠️ جهاز البصمة غير متصل",
          body: `فشل الاتصال بجهاز البصمة (${config.device.ip}) لمدة ${MAX_HEALTH_FAILURES} محاولات متتالية. يرجى التحقق من الجهاز والشبكة.`,
          type: "error",
          category: "device_health",
          entity_type: "device",
          entity_id: null,
          target_employee_id: null,
        });
      } catch (notifErr) {
        log("⚠️", `Could not create offline notification: ${notifErr.message}`);
      }
    }
  }
}

// ══════════════════════════════════════════
// ⑯ Break Tracking (breakOut / breakIn)
// ══════════════════════════════════════════

// The upsertAttendanceRecord already skips breakOut/breakIn with a log.
// This new function handles them properly.

async function processBreakEvent(employee, dateStr, timeStr, attendanceStatus) {
  const isBreakOut = attendanceStatus === "breakOut";
  const isBreakIn = attendanceStatus === "breakIn";

  if (!isBreakOut && !isBreakIn) return;

  // Get today's attendance record
  const { data: record } = await db
    .from("attendance_records")
    .select("id, breaks")
    .eq("employee_id", employee.id)
    .eq("date", dateStr)
    .maybeSingle();

  if (!record) {
    log("⚠️", `Break event for ${employee.arabic_name || employee.name} but no attendance record for ${dateStr}`);
    return;
  }

  // Parse existing breaks (stored as JSON array)
  let breaks = [];
  try {
    breaks = record.breaks ? (typeof record.breaks === "string" ? JSON.parse(record.breaks) : record.breaks) : [];
  } catch { breaks = []; }

  if (isBreakOut) {
    // Start a new break period
    breaks.push({ break_out: timeStr, break_in: null });
    log("☕", `${employee.arabic_name || employee.name} started break at ${timeStr}`);
  } else if (isBreakIn) {
    // Close the last open break
    const openBreak = breaks.findLast((b) => b.break_out && !b.break_in);
    if (openBreak) {
      openBreak.break_in = timeStr;
      const breakMinutes = Math.max(0, timeToMinutes(timeStr) - timeToMinutes(openBreak.break_out));
      openBreak.duration_minutes = Math.round(breakMinutes * 100) / 100;
      log("☕", `${employee.arabic_name || employee.name} ended break at ${timeStr} (${openBreak.duration_minutes} min)`);
    } else {
      // No open break — just record it
      breaks.push({ break_out: null, break_in: timeStr });
      log("⚠️", `${employee.arabic_name || employee.name} break-in at ${timeStr} but no matching break-out`);
    }
  }

  // Calculate total break minutes
  const totalBreakMinutes = breaks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);

  await db.from("attendance_records").update({
    breaks: JSON.stringify(breaks),
    total_break_minutes: Math.round(totalBreakMinutes * 100) / 100,
  }).eq("id", record.id);
}

// ══════════════════════════════════════════
// STARTUP
// ══════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  HR Device Sync Service");
  console.log("  Hikvision DS-K1T342MFWX ↔ Supabase");
  console.log("═══════════════════════════════════════════");

  // Test device connection
  try {
    const info = await hik.getDeviceInfo();
    log("🔗", `Connected to device: ${info.model} (${info.serialNumber})`);
  } catch (err) {
    log("❌", `Cannot connect to device at ${config.device.ip}: ${err.message}`);
    log("💡", "Check: IP, port, username, password, and network connectivity");
    process.exit(1);
  }

  // Test Supabase connection
  try {
    const { count } = await db.from("employees").select("*", { count: "exact", head: true });
    log("🔗", `Connected to Supabase — ${count} employees in system`);
  } catch (err) {
    log("❌", `Cannot connect to Supabase: ${err.message}`);
    process.exit(1);
  }

  // Restore lastSyncTime from DB (survives PM2 restarts)
  await loadLastSyncTime();

  // Initial full sync
  await fullReconcile();
  await syncEmployees();
  await detectLateArrivals();

  // ── Schedule: Poll every N minutes ──
  cron.schedule(`*/${config.sync.intervalMinutes} * * * *`, async () => {
    await pollEvents();
    await detectLateArrivals();
  });
  log("⏰", `Polling every ${config.sync.intervalMinutes} minutes`);

  // ── Schedule: Full reconciliation every 30 min ──
  cron.schedule(`*/${config.sync.reconcileMinutes} * * * *`, fullReconcile);
  log("⏰", `Full reconciliation every ${config.sync.reconcileMinutes} minutes`);

  // ── Schedule: Employee sync every hour ──
  cron.schedule(`*/${config.sync.employeeSyncMinutes} * * * *`, syncEmployees);
  log("⏰", `Employee sync every ${config.sync.employeeSyncMinutes} minutes`);

  // ── Schedule: Device health check every 5 minutes ──
  cron.schedule("*/5 * * * *", checkDeviceHealth);
  log("⏰", "Device health monitoring every 5 minutes");

  // ── Schedule: Auto-checkout every 15 minutes (catches shift-end + grace) ──
  cron.schedule("*/15 * * * *", autoCheckout);
  log("⏰", "Auto-checkout check every 15 minutes");

  // ── Schedule: Absent detection at 10:00 AM Iraq time daily ──
  cron.schedule("0 10 * * *", detectAbsences, { timezone: IRAQ_TZ });
  log("⏰", "Absence detection scheduled at 10:00 AM daily");

  // ── Start push listener ──
  if (config.push.enabled) {
    startPushListener();
  }

  log("🟢", "Sync service is running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
