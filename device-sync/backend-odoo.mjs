/**
 * Odoo backend adapter (BACKEND=odoo — staging / post-cutover path).
 *
 * Implements the same adapter interface as backend-supabase.mjs, but writes
 * through the already-built `lugal_hr` REST API (JWT via lugal_auth) instead
 * of talking to Supabase directly. See:
 *   - odoo-client.mjs                     — JWT login/refresh + JSON-RPC call helper
 *   - Lugal-ai/addons/lugal_hr/controllers/*  — the endpoints called below
 *   - Lugal-ai/scripts/hr_migration/setup_device_sync_service_account.py
 *
 * Deliberate simplifications vs. the Supabase backend (documented, not
 * silently dropped — see the "Device-Sync Odoo Bridge" plan, step 6):
 *   - detectLateArrivals() is a no-op: Odoo computes is_late/late_minutes/
 *     lugal_overtime_hours server-side from the employee's resource_calendar_id,
 *     so that server computation is authoritative once BACKEND=odoo.
 *   - Working hours / overtime on checkout are likewise left to Odoo's own
 *     compute fields instead of being calculated here.
 *   - reconcileEmployees() does NOT auto-rename employees on device/HR name
 *     mismatch (unlike the Supabase backend) — that needs hr.employees.edit,
 *     which is intentionally NOT granted to this headless service account.
 *     Mismatches are logged as a summary count for HR to review manually.
 *   - detectAbsences() does not exclude employees on approved leave — doing
 *     so requires hr.leave.hr_approve/manage_types, which is broader than a
 *     device-sync bot should hold. Flagged here rather than silently wrong;
 *     revisit if false-positive "absent" rows during approved leave become
 *     a real problem on staging.
 */

import { OdooClient } from "./odoo-client.mjs";

const EMPLOYEE_CACHE_TTL_MS = 5 * 60 * 1000;

function floatHoursToHHMMSS(h) {
  if (h === null || h === undefined || h === false) return null;
  const totalMinutes = Math.round(Number(h) * 60);
  const hh = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 60 + m + s / 60;
}

function shiftDateStr(dateStr, deltaDays) {
  return new Date(new Date(`${dateStr}T00:00:00+03:00`).getTime() + deltaDays * 86400000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Convert a *local* Asia/Baghdad wall-clock date+time (as reported by the
 * device) into the UTC "YYYY-MM-DD HH:MM:SS" string Odoo's Datetime fields
 * expect. Handles day rollover correctly (e.g. 01:00 local -> previous day UTC).
 */
function toUtcDatetimeString(dateStr, timeStr, offsetHours) {
  const sign = offsetHours >= 0 ? "+" : "-";
  const abs = Math.abs(offsetHours);
  const offsetStr = `${sign}${String(Math.trunc(abs)).padStart(2, "0")}:${String(Math.round((abs % 1) * 60)).padStart(2, "0")}`;
  const d = new Date(`${dateStr}T${timeStr}${offsetStr}`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid local datetime: ${dateStr}T${timeStr}${offsetStr}`);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/** Inverse of toUtcDatetimeString: UTC "YYYY-MM-DD HH:MM:SS" -> local HH:MM:SS time-of-day. */
function utcStringToLocalTimeStr(utcStr, offsetHours) {
  if (!utcStr) return null;
  const d = new Date(utcStr.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return null;
  const local = new Date(d.getTime() + offsetHours * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
}

function normalizeEmployee(item) {
  return {
    id: item.id,
    name: item.name || "",
    arabic_name: item.arabic_name || item.name || "",
    device_employee_no: item.device_employee_no || "",
    employee_code: item.employee_code || "",
    shift_id: item.shift_id || null,
    shift_name: item.shift_name || "",
    allowed_late_minutes: item.allowed_late_minutes || 15,
    hr_status: item.status || "active",
  };
}

/**
 * @param {object} config - { apiBase, db, username, password, device: { ip, port, model, serialNumber, useHttps, username }, tzOffsetHours }
 * @param {object} ctx - shared helpers: { log, todayIraq, getDayOfWeek, IRAQ_TZ }
 */
export function createBackend(config, ctx) {
  const { log, todayIraq, getDayOfWeek } = ctx;
  const tzOffsetHours = config.tzOffsetHours ?? 3;

  const odoo = new OdooClient({
    apiBase: config.apiBase,
    db: config.db,
    username: config.username,
    password: config.password,
    log,
  });

  let deviceId = null;
  let employeeCache = new Map(); // device_employee_no / employee_code -> normalized employee
  let employeeCacheAt = 0;
  let consecutiveHealthFailures = 0;
  let lateArrivalsNoteLogged = false;
  const MAX_HEALTH_FAILURES = 3;

  async function _listAllEmployees() {
    const items = [];
    let offset = 0;
    const limit = 200;
    for (;;) {
      const page = await odoo.call("/api/hr/employees/list", { limit, offset });
      const pageItems = page?.items || [];
      items.push(...pageItems);
      if (pageItems.length < limit || items.length >= (page?.total || items.length)) break;
      offset += limit;
    }
    return items;
  }

  async function _refreshEmployeeCache() {
    const items = await _listAllEmployees();
    const map = new Map();
    for (const item of items) {
      const emp = normalizeEmployee(item);
      if (emp.device_employee_no) map.set(emp.device_employee_no, emp);
      if (emp.employee_code) map.set(emp.employee_code, emp);
    }
    employeeCache = map;
    employeeCacheAt = Date.now();
    return map;
  }

  async function _ensureEmployeeCache() {
    if (Date.now() - employeeCacheAt > EMPLOYEE_CACHE_TTL_MS || employeeCache.size === 0) {
      await _refreshEmployeeCache();
    }
    return employeeCache;
  }

  async function _ensureDevice() {
    if (deviceId) return deviceId;
    const list = await odoo.call("/api/hr/devices/list", { active_only: false });
    const found = (list?.items || []).find((d) => d.ip_address === config.device.ip);
    if (found) {
      deviceId = found.id;
      return deviceId;
    }
    const created = await odoo.call("/api/hr/devices/create", {
      name: config.device.name || `Hikvision ${config.device.ip}`,
      ip_address: config.device.ip,
      port: config.device.port,
      serial_number: config.device.serialNumber || undefined,
      model_name: config.device.model || undefined,
      use_https: config.device.useHttps,
      username: config.device.username,
      status: "unknown",
    });
    deviceId = created.id;
    log("🆕", `Registered device in Odoo: id=${deviceId} ip=${config.device.ip}`);
    return deviceId;
  }

  async function init({ deviceInfo } = {}) {
    await odoo.login();
    if (deviceInfo) {
      config.device.model = config.device.model || deviceInfo.model;
      config.device.serialNumber = config.device.serialNumber || deviceInfo.serialNumber;
    }
    await _ensureDevice();
    await _ensureEmployeeCache();
    log("🔗", `Connected to Odoo (${config.db || "default db"}) — ${employeeCache.size} device-mapped employees cached`);
  }

  // ══════════════════════════════════════════
  // Employee lookup / auto-provisioning
  // ══════════════════════════════════════════
  async function findEmployee(employeeNo) {
    await _ensureEmployeeCache();
    let emp = employeeCache.get(String(employeeNo));
    if (emp) return emp;
    // Cache miss — could be a very recently created employee; refresh once.
    await _refreshEmployeeCache();
    emp = employeeCache.get(String(employeeNo));
    return emp || null;
  }

  async function createEmployee({ employeeNo, name }) {
    log("🆕", `Unknown employee #${employeeNo} "${name}" — auto-creating in Odoo...`);
    const deviceName = name || `موظف #${employeeNo}`;

    let created;
    try {
      created = await odoo.call("/api/hr/employees/create", {
        name: deviceName,
        device_employee_no: String(employeeNo),
        status: "onboarding",
      });
    } catch (err) {
      log("❌", `Auto-create failed for #${employeeNo}: ${err.message}`);
      return null;
    }

    const emp = normalizeEmployee(created);
    employeeCache.set(String(employeeNo), emp);
    if (emp.employee_code) employeeCache.set(emp.employee_code, emp);

    try {
      await odoo.call("/api/hr/notifications/create", {
        title: `موظف جديد من البصمة: "${deviceName}" (#${employeeNo})`,
        body: "تم إضافة موظف جديد تلقائياً من جهاز البصمة. يرجى مراجعة وإكمال بياناته.",
        type: "warning",
        category: "attendance",
        entity_type: "employee",
        entity_id: emp.id,
        action_url: `/employees/${emp.id}`,
      });
    } catch (notifErr) {
      log("⚠️", `Notification create failed (non-critical): ${notifErr.message}`);
    }

    log("🔔", `Notification created for HR — review employee "${deviceName}"`);
    return emp;
  }

  // ══════════════════════════════════════════
  // Attendance
  // ══════════════════════════════════════════
  async function _attendanceForDate(employeeId, dateStr) {
    const page = await odoo.call("/api/hr/attendance/list", {
      employee_id: employeeId,
      date_from: dateStr,
      date_to: dateStr,
      limit: 5,
    });
    return page?.items?.[0] || null;
  }

  async function _openAttendanceForDate(employeeId, dateStr) {
    const row = await _attendanceForDate(employeeId, dateStr);
    return row && !row.check_out ? row : null;
  }

  async function upsertAttendance(employee, dateStr, timeStr, verifyMode, employeeNo, attendanceStatus) {
    if (attendanceStatus === "breakOut" || attendanceStatus === "breakIn") {
      await _processBreakEvent(employee, attendanceStatus);
      return;
    }

    const isCheckIn = attendanceStatus === "checkIn";
    const isCheckOut = attendanceStatus === "checkOut";
    if (!isCheckIn && !isCheckOut) {
      log("⚠️", `No attendanceStatus for ${employee.arabic_name || employee.name} at ${timeStr} — skipping`);
      return;
    }

    const deviceIdVal = await _ensureDevice().catch(() => null);
    const baseVals = {
      employee_id: employee.id,
      source: "device",
      verify_mode: verifyMode,
      device_employee_no: String(employeeNo || ""),
      ...(deviceIdVal ? { device_id: deviceIdVal } : {}),
    };

    if (isCheckIn) {
      const existing = await _attendanceForDate(employee.id, dateStr);
      if (existing && existing.check_in) {
        const existingLocal = utcStringToLocalTimeStr(existing.check_in, tzOffsetHours);
        if (existingLocal && !(timeStr < existingLocal)) return; // keep the earliest check-in, like the Supabase backend
      }
      await odoo.call("/api/hr/attendance/upsert", {
        ...baseVals,
        date: dateStr,
        check_in: toUtcDatetimeString(dateStr, timeStr, tzOffsetHours),
      });
      return;
    }

    // isCheckOut
    const existingToday = await _attendanceForDate(employee.id, dateStr);
    if (!existingToday) {
      const yesterday = shiftDateStr(dateStr, -1);
      const openYesterday = await _openAttendanceForDate(employee.id, yesterday);
      if (openYesterday) {
        await odoo.call("/api/hr/attendance/upsert", {
          ...baseVals,
          date: yesterday,
          check_out: toUtcDatetimeString(dateStr, timeStr, tzOffsetHours),
          status: "complete",
        });
        log("🌙", `${employee.arabic_name || employee.name} overnight checkout: ${yesterday} → ${dateStr} ${timeStr}`);
        return;
      }

      await odoo.call("/api/hr/attendance/upsert", {
        ...baseVals,
        date: dateStr,
        check_out: toUtcDatetimeString(dateStr, timeStr, tzOffsetHours),
        status: "missing_checkin",
      });
      log("⚠️", `${employee.arabic_name || employee.name} checked out at ${timeStr} with no check-in`);
      return;
    }

    await odoo.call("/api/hr/attendance/upsert", {
      ...baseVals,
      date: dateStr,
      check_out: toUtcDatetimeString(dateStr, timeStr, tzOffsetHours),
    });
  }

  /**
   * Uses Odoo's native break_start/break_end (single open break per day),
   * which stamp the SERVER's current time rather than the historical device
   * punch time. Fine for live push/poll (near real-time); a known gap for
   * backfilling old dates via manual-sync.mjs against BACKEND=odoo.
   */
  async function _processBreakEvent(employee, attendanceStatus) {
    try {
      if (attendanceStatus === "breakOut") {
        await odoo.call("/api/hr/attendance/break_start", { employee_id: employee.id });
        log("☕", `${employee.arabic_name || employee.name} started break`);
      } else if (attendanceStatus === "breakIn") {
        await odoo.call("/api/hr/attendance/break_end", { employee_id: employee.id });
        log("☕", `${employee.arabic_name || employee.name} ended break`);
      }
    } catch (err) {
      log("⚠️", `Break event failed for ${employee.arabic_name || employee.name}: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════
  // Employee reconciliation (device → Odoo)
  // ══════════════════════════════════════════
  async function reconcileEmployees(deviceUsers) {
    await _refreshEmployeeCache();

    let newCount = 0;
    let mismatchCount = 0;
    for (const user of deviceUsers) {
      const existing = employeeCache.get(user.employeeNo);
      if (!existing) {
        await createEmployee({ employeeNo: user.employeeNo, name: user.name || `موظف #${user.employeeNo}` });
        newCount++;
        continue;
      }
      const deviceName = user.name || "";
      if (deviceName && deviceName !== existing.name && !deviceName.startsWith("موظف #")) {
        mismatchCount++;
      }
    }

    if (mismatchCount > 0) {
      log("ℹ️", `${mismatchCount} employee(s) have a different name on the device vs. Odoo — review manually (auto-rename needs hr.employees.edit, not granted to this service account)`);
    }
    return { newCount, updatedCount: 0 };
  }

  // ══════════════════════════════════════════
  // Device heartbeat / health
  // ══════════════════════════════════════════
  async function heartbeat({ status = "online", markSynced = false } = {}) {
    const id = await _ensureDevice();
    await odoo.call(`/api/hr/devices/${id}/heartbeat`, { status, mark_synced: markSynced });
  }

  async function notifyDeviceOffline() {
    try {
      await odoo.call("/api/hr/notifications/create", {
        title: "⚠️ جهاز البصمة غير متصل",
        body: `فشل الاتصال بجهاز البصمة (${config.device.ip}) لمدة ${MAX_HEALTH_FAILURES} محاولات متتالية. يرجى التحقق من الجهاز والشبكة.`,
        type: "error",
        category: "device_health",
        entity_type: "device",
      });
    } catch (err) {
      log("⚠️", `Could not create offline notification: ${err.message}`);
    }
  }

  async function notifyDeviceBackOnline(info) {
    try {
      await odoo.call("/api/hr/notifications/create", {
        title: "جهاز البصمة متصل مرة أخرى",
        body: `عاد جهاز البصمة ${info?.model || ""} للعمل.`,
        type: "info",
        category: "device_health",
        entity_type: "device",
      });
    } catch { /* non-critical */ }
  }

  async function checkDeviceHealth(deviceInfo, err) {
    if (!err) {
      if (consecutiveHealthFailures > 0) {
        log("💚", `Device back online after ${consecutiveHealthFailures} failed checks`);
        await notifyDeviceBackOnline(deviceInfo);
      }
      consecutiveHealthFailures = 0;
      try {
        await heartbeat({ status: "online" });
      } catch (e) {
        log("⚠️", `Could not update device heartbeat: ${e.message}`);
      }
      return;
    }

    consecutiveHealthFailures++;
    log("⚠️", `Device health check failed (${consecutiveHealthFailures}/${MAX_HEALTH_FAILURES}): ${err.message}`);
    try {
      await heartbeat({ status: consecutiveHealthFailures >= MAX_HEALTH_FAILURES ? "offline" : "degraded" });
    } catch { /* non-critical */ }

    if (consecutiveHealthFailures === MAX_HEALTH_FAILURES) {
      log("🔴", "Device appears OFFLINE — creating notification for HR");
      await notifyDeviceOffline();
    }
  }

  // ══════════════════════════════════════════
  // Late detection — no-op: Odoo computes is_late/late_minutes server-side
  // ══════════════════════════════════════════
  async function detectLateArrivals() {
    if (!lateArrivalsNoteLogged) {
      log("ℹ️", "detectLateArrivals() is a no-op under BACKEND=odoo — Odoo computes is_late/late_minutes server-side from the employee's shift/calendar");
      lateArrivalsNoteLogged = true;
    }
  }

  // ══════════════════════════════════════════
  // Auto-checkout at shift end
  // ══════════════════════════════════════════
  const AUTO_CHECKOUT_GRACE_MINUTES = 30;

  async function _listAllShifts() {
    const page = await odoo.call("/api/hr/shifts/list", { limit: 500 });
    return page?.items || [];
  }

  async function autoCheckout() {
    const today = todayIraq();
    const dayOfWeek = getDayOfWeek(today);
    const nowMinutes = timeToMinutes(
      new Date().toLocaleTimeString("en-GB", { timeZone: ctx.IRAQ_TZ, hour12: false })
    );

    try {
      const [attToday, employees, shifts] = await Promise.all([
        odoo.call("/api/hr/attendance/list", { date_from: today, date_to: today, limit: 5000 }),
        _listAllEmployees(),
        _listAllShifts(),
      ]);

      const openRows = (attToday?.items || []).filter((a) => a.check_in && !a.check_out);
      if (openRows.length === 0) return;

      const empMap = new Map(employees.map((e) => [e.id, e]));
      const shiftMap = new Map(shifts.map((s) => [s.id, s]));

      let autoCount = 0;
      for (const row of openRows) {
        const emp = empMap.get(row.employee_id);
        if (!emp?.shift_id) continue;
        const shift = shiftMap.get(emp.shift_id);
        if (!shift) continue;
        if (!shift[`${dayOfWeek}_is_working`]) continue;

        const endTimeStr = shift[`${dayOfWeek}_end`] || floatHoursToHHMMSS(shift.end_time);
        if (!endTimeStr) continue;

        const shiftEndMinutes = timeToMinutes(endTimeStr);
        if (nowMinutes < shiftEndMinutes + AUTO_CHECKOUT_GRACE_MINUTES) continue;

        await odoo.call("/api/hr/attendance/upsert", {
          employee_id: row.employee_id,
          date: today,
          check_out: toUtcDatetimeString(today, endTimeStr, tzOffsetHours),
          status: "complete",
          auto_checkout_applied: true,
          source: "device",
        });
        autoCount++;
        log("🕐", `Auto-checkout: ${emp.arabic_name || emp.name} → ${endTimeStr} (shift end)`);
      }

      if (autoCount > 0) log("📋", `Auto-checkout applied to ${autoCount} employees`);
    } catch (err) {
      log("❌", `Auto-checkout failed: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════
  // Absence detection
  // ══════════════════════════════════════════
  async function detectAbsences() {
    const today = todayIraq();
    const dayOfWeek = getDayOfWeek(today);
    log("🔍", `Checking absences for ${today} (${dayOfWeek})...`);

    try {
      const [employees, shifts, attToday] = await Promise.all([
        _listAllEmployees(),
        _listAllShifts(),
        odoo.call("/api/hr/attendance/list", { date_from: today, date_to: today, limit: 5000 }),
      ]);

      const shiftMap = new Map(shifts.map((s) => [s.id, s]));
      const presentIds = new Set((attToday?.items || []).map((a) => a.employee_id));

      let absentCount = 0;
      for (const emp of employees) {
        if (emp.status !== "active" || !emp.shift_id) continue;
        if (presentIds.has(emp.id)) continue;

        const shift = shiftMap.get(emp.shift_id);
        if (shift && shift[`${dayOfWeek}_is_working`] === false) continue;

        try {
          await odoo.call("/api/hr/attendance/upsert", {
            employee_id: emp.id,
            date: today,
            status: "absent",
            source: "system",
          });
          absentCount++;
        } catch (err) {
          log("⚠️", `Could not mark ${emp.arabic_name || emp.name} absent: ${err.message}`);
        }
      }

      if (absentCount > 0) log("📋", `Marked ${absentCount} employees as absent for ${today}`);
      else log("✓", "No absences to record");
    } catch (err) {
      log("❌", `Absence detection failed: ${err.message}`);
    }
  }

  return {
    init,
    findEmployee,
    createEmployee,
    upsertAttendance,
    reconcileEmployees,
    heartbeat,
    notifyDeviceOffline,
    notifyDeviceBackOnline,
    checkDeviceHealth,
    detectLateArrivals,
    autoCheckout,
    detectAbsences,
  };
}
