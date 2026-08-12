/**
 * HR Device Sync Service — Hybrid Push + Poll
 * ─────────────────────────────────────────────
 * 1. Listens for real-time push events from the Hikvision device
 * 2. Polls the device every N minutes for new attendance events
 * 3. Full reconciliation every 30 min to catch any gaps
 * 4. Employee auto-discovery: unknown IDs → auto-create + notify HR
 *
 * Backend: writes derived attendance/employee/notification/device data
 * through a pluggable backend adapter (see backend-supabase.mjs /
 * backend-odoo.mjs), selected via the BACKEND env var. The Hikvision
 * integration below (device polling/push/reconciliation) is unchanged
 * regardless of which backend is active — see the "Device-Sync Odoo
 * Bridge" plan for the full rationale.
 *
 * Run:  node sync-service.mjs
 */

import "dotenv/config";
import cron from "node-cron";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { HikvisionClient } from "./hikvision-api.mjs";
import { createBackend as createSupabaseBackend } from "./backend-supabase.mjs";
import { createBackend as createOdooBackend } from "./backend-odoo.mjs";

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
  odoo: {
    apiBase: process.env.ODOO_API_BASE || "",
    db: process.env.ODOO_DB || "",
    username: process.env.ODOO_SYNC_USERNAME || "",
    password: process.env.ODOO_SYNC_PASSWORD || "",
  },
  sync: {
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || "5"),
    reconcileMinutes: parseInt(process.env.FULL_RECONCILE_MINUTES || "30"),
    employeeSyncMinutes: parseInt(process.env.EMPLOYEE_SYNC_MINUTES || "60"),
    timezone: process.env.TIMEZONE || "Asia/Baghdad",
    tzOffsetHours: parseInt(process.env.TZ_OFFSET_HOURS || "3"), // Asia/Baghdad = UTC+3
  },
  push: {
    port: parseInt(process.env.PUSH_LISTENER_PORT || "8089"),
    enabled: process.env.PUSH_LISTENER_ENABLED !== "false",
  },
  // BACKEND=supabase (default, current production) | BACKEND=odoo (staging / post-cutover)
  backendType: (process.env.BACKEND || "supabase").trim().toLowerCase(),
};

// ── Clients ──

const hik = new HikvisionClient(config.device);

// Supabase client backs the polling-cursor bootstrap (loadLastSyncTime) and
// the pre-existing /api/device/* management routes. When BACKEND=odoo for
// staging and SUPABASE_* is unset, skip creating the client so the sync
// listener can still start; those Supabase-only routes will return 503.
const db =
  config.supabase.url && config.supabase.serviceKey
    ? createClient(config.supabase.url, config.supabase.serviceKey)
    : null;

const IRAQ_TZ = config.sync.timezone;

function log(emoji, msg) {
  const ts = new Date().toLocaleTimeString("en-GB", { timeZone: IRAQ_TZ });
  console.log(`[${ts}] ${emoji} ${msg}`);
}

if (!db) {
  log(
    "⚠️",
    "SUPABASE_URL/SERVICE_KEY not set — /api/device/* Supabase routes disabled; " +
      `attendance writes use BACKEND=${config.backendType}`,
  );
}

function todayIraq() {
  return new Date().toLocaleDateString("en-CA", { timeZone: IRAQ_TZ });
}

function getDayOfWeek(dateStr) {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date(dateStr + "T00:00:00+03:00").getDay()];
}

const backendCtx = { log, todayIraq, getDayOfWeek, IRAQ_TZ };

const backend =
  config.backendType === "odoo"
    ? createOdooBackend(
        {
          apiBase: config.odoo.apiBase,
          db: config.odoo.db,
          username: config.odoo.username,
          password: config.odoo.password,
          tzOffsetHours: config.sync.tzOffsetHours,
          device: { ip: config.device.ip, port: config.device.port, useHttps: config.device.useHttps, username: config.device.username },
        },
        backendCtx,
      )
    : createSupabaseBackend({ url: config.supabase.url, serviceKey: config.supabase.serviceKey, deviceIp: config.device.ip }, backendCtx);

log("⚙️", `Backend: ${config.backendType}${config.backendType === "odoo" ? ` (${config.odoo.apiBase})` : ""}`);

// ── State ──

let lastSyncTime = null; // ISO string of last successful event sync
const processedEventIds = new Set(); // dedup within session

// ── Persist lastSyncTime so PM2 restarts don't lose state (always via Supabase — see note above) ──

async function loadLastSyncTime() {
  if (!db) return;
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

function requireSupabase(res) {
  if (db) return false;
  res.status(503).json({
    success: false,
    error: "Supabase is not configured on this host (Odoo-only mode)",
  });
  return true;
}

// ── Helpers ──

function toIsoLocal(date) {
  // Format: 2026-04-22T08:30:00+03:00
  const d = date instanceof Date ? date : new Date(date);
  const offset = "+03:00"; // Iraq is UTC+3
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offset}`;
}

// ── Retry with exponential backoff (for backend / device calls) ──

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
// (backend-agnostic orchestration — employee lookup/creation and the
// attendance write itself are delegated to the active `backend`)
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

  const dateStr = time.slice(0, 10); // "2026-04-22"
  const timeStr = time.slice(11, 19); // "08:30:15"

  // 1. Find employee in the active backend
  let employee = null;
  try {
    employee = await backend.findEmployee(employeeNo);
  } catch (lookupErr) {
    log("⚠️", `Employee lookup error for #${employeeNo}: ${lookupErr.message}`);
  }

  // 2. Auto-discover: employee not found → create + notify
  if (!employee) {
    employee = await backend.createEmployee({ employeeNo, name: event.name });
    if (!employee) return;
  }

  // 3. Upsert attendance record (use device's own check-in/out status)
  try {
    await backend.upsertAttendance(employee, dateStr, timeStr, verifyMode, employeeNo, attendanceStatus);
    const statusLabel = attendanceStatus === "checkIn" ? "دخول" : attendanceStatus === "checkOut" ? "خروج" : attendanceStatus || "—";
    log("✅", `${employee.arabic_name || employee.name} → ${timeStr} [${statusLabel}] (${verifyMode})`);
  } catch (upsertErr) {
    log("❌", `Upsert failed for ${employee.name}: ${upsertErr.message}`);
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
    try {
      await backend.heartbeat({ status: "online", markSynced: true });
    } catch (err) {
      log("⚠️", `Could not update device heartbeat: ${err.message}`);
    }
    if (processed > 0) log("📊", `Processed ${processed} events → ${config.backendType}`);
  } catch (err) {
    log("❌", `Poll failed: ${err.message}`);
    if (err.stack) log("📋", err.stack.split("\n")[1]?.trim() || "");
  }
}

// ══════════════════════════════════════════
// Full Reconciliation (catch-up for today)
// ══════════════════════════════════════════

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

    try {
      await backend.heartbeat({ status: "online", markSynced: true });
    } catch (err) {
      log("⚠️", `Could not update device heartbeat: ${err.message}`);
    }
    log("📊", `Reconcile done: ${processed} events processed for ${today}`);
  } catch (err) {
    log("❌", `Reconciliation failed: ${err.message}`);
    if (err.stack) log("📋", err.stack.split("\n")[1]?.trim() || "");
  }
}

// ══════════════════════════════════════════
// Employee Sync (device → HR system)
// ══════════════════════════════════════════

async function syncEmployees() {
  log("👥", "Syncing enrolled users from device...");

  try {
    const users = await hik.fetchAllUsers();
    log("👥", `Found ${users.length} users on device`);

    const { newCount, updatedCount } = await backend.reconcileEmployees(users);

    if (newCount > 0) log("🆕", `Auto-created ${newCount} new employees from device`);
    if (updatedCount > 0) log("✏️", `Updated ${updatedCount} employee names from device`);
    if (newCount === 0 && updatedCount === 0) log("✓", "All device users are already in sync");
  } catch (err) {
    log("❌", `Employee sync failed: ${err.message}`);
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
      backend: config.backendType,
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
      backend: config.backendType,
      lastSync: lastSyncTime,
      processedCount: processedEventIds.size,
      uptime: Math.round(process.uptime()),
      deviceIp: config.device.ip,
    });
  });

  // ══════════════════════════════════════════
  // Device Management API
  // (unchanged — always backed by Supabase; not part of this bridge's scope,
  // see HR-FE/device-sync README's "Backend toggle" section)
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
      if (requireSupabase(res)) return;
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

      // Update HR record to clear device link (Supabase-backed management route)
      if (removePerson) {
        if (!db) {
          results.hrUnlink = "skipped: supabase not configured";
        } else {
          await db.from("employees")
            .update({ device_employee_no: null })
            .eq("device_employee_no", empNo);
        }
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
      if (requireSupabase(res)) return;
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
// STARTUP
// ══════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  HR Device Sync Service");
  console.log(`  Hikvision DS-K1T342MFWX ↔ ${config.backendType === "odoo" ? "Odoo" : "Supabase"}`);
  console.log("═══════════════════════════════════════════");

  // Test device connection
  let deviceInfo = null;
  try {
    deviceInfo = await hik.getDeviceInfo();
    log("🔗", `Connected to device: ${deviceInfo.model} (${deviceInfo.serialNumber})`);
  } catch (err) {
    log("❌", `Cannot connect to device at ${config.device.ip}: ${err.message}`);
    log("💡", "Check: IP, port, username, password, and network connectivity");
    process.exit(1);
  }

  // Test backend connection (Supabase or Odoo — see `backend.init()`)
  try {
    await backend.init({ deviceInfo });
  } catch (err) {
    log("❌", `Cannot connect to backend (${config.backendType}): ${err.message}`);
    process.exit(1);
  }

  // Restore lastSyncTime from DB (survives PM2 restarts)
  await loadLastSyncTime();

  // Initial full sync
  await fullReconcile();
  await syncEmployees();
  await backend.detectLateArrivals();

  // ── Schedule: Poll every N minutes ──
  cron.schedule(`*/${config.sync.intervalMinutes} * * * *`, async () => {
    await pollEvents();
    await backend.detectLateArrivals();
  });
  log("⏰", `Polling every ${config.sync.intervalMinutes} minutes`);

  // ── Schedule: Full reconciliation every 30 min ──
  cron.schedule(`*/${config.sync.reconcileMinutes} * * * *`, fullReconcile);
  log("⏰", `Full reconciliation every ${config.sync.reconcileMinutes} minutes`);

  // ── Schedule: Employee sync every hour ──
  cron.schedule(`*/${config.sync.employeeSyncMinutes} * * * *`, syncEmployees);
  log("⏰", `Employee sync every ${config.sync.employeeSyncMinutes} minutes`);

  // ── Schedule: Device health check every 5 minutes ──
  cron.schedule("*/5 * * * *", async () => {
    try {
      const info = await hik.getDeviceInfo();
      await backend.checkDeviceHealth(info, null);
    } catch (err) {
      await backend.checkDeviceHealth(null, err);
    }
  });
  log("⏰", "Device health monitoring every 5 minutes");

  // ── Schedule: Auto-checkout every 15 minutes (catches shift-end + grace) ──
  cron.schedule("*/15 * * * *", () => backend.autoCheckout());
  log("⏰", "Auto-checkout check every 15 minutes");

  // ── Schedule: Absent detection at 10:00 AM Iraq time daily ──
  cron.schedule("0 10 * * *", () => backend.detectAbsences(), { timezone: IRAQ_TZ });
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
