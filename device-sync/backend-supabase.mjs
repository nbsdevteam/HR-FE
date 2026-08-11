/**
 * Supabase backend adapter (BACKEND=supabase, the default / current production path).
 *
 * This is the pre-existing device-sync business logic (employee lookup +
 * auto-provisioning, attendance state machine, employee reconciliation,
 * device health, late/absence detection) extracted verbatim out of
 * sync-service.mjs into the adapter interface shared with backend-odoo.mjs.
 * Behavior is intentionally UNCHANGED from before this refactor.
 */

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function uuid() {
  return crypto.randomUUID();
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 60 + m + s / 60;
}

/**
 * @param {object} config - { url, serviceKey, deviceIp }
 * @param {object} ctx - shared helpers: { log, todayIraq, getDayOfWeek, IRAQ_TZ }
 */
export function createBackend(config, ctx) {
  const { log, todayIraq, getDayOfWeek } = ctx;
  const db = createClient(config.url, config.serviceKey);
  const deviceIp = config.deviceIp;

  let consecutiveHealthFailures = 0;
  const MAX_HEALTH_FAILURES = 3;

  async function init() {
    const { count } = await db.from("employees").select("*", { count: "exact", head: true });
    log("🔗", `Connected to Supabase — ${count} employees in system`);
  }

  // ══════════════════════════════════════════
  // Employee lookup (device_employee_no → person_id → national_id)
  // ══════════════════════════════════════════
  async function findEmployee(employeeNo) {
    let data = null;
    ({ data } = await db
      .from("employees")
      .select("*")
      .eq("device_employee_no", employeeNo)
      .limit(1)
      .maybeSingle());

    if (!data) {
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
      ({ data } = await db
        .from("employees")
        .select("*")
        .eq("national_id", employeeNo)
        .limit(1)
        .maybeSingle());
    }

    return data;
  }

  // ══════════════════════════════════════════
  // Auto-Create Unknown Employees
  // ══════════════════════════════════════════
  async function createEmployee({ employeeNo, name }) {
    log("🆕", `Unknown employee #${employeeNo} "${name}" — auto-creating...`);

    const deviceName = name || `موظف #${employeeNo}`;

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

    const { data, error } = await db.from("employees").insert(newEmployee).select("*").single();

    if (error) {
      log("❌", `Auto-create failed for #${employeeNo}: ${error.message}`);
      return null;
    }

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
  // Attendance Record Logic (device-driven)
  // ══════════════════════════════════════════
  async function upsertAttendance(employee, dateStr, timeStr, verifyMode, employeeNo, attendanceStatus) {
    const isCheckIn = attendanceStatus === "checkIn";
    const isCheckOut = attendanceStatus === "checkOut";

    if (attendanceStatus === "breakOut" || attendanceStatus === "breakIn") {
      await processBreakEvent(employee, dateStr, timeStr, attendanceStatus);
      return;
    }

    if (!isCheckIn && !isCheckOut) {
      log("⚠️", `No attendanceStatus for ${employee.arabic_name || employee.name} at ${timeStr} — skipping`);
      return;
    }

    const { data: existing } = await db
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("date", dateStr)
      .maybeSingle();

    if (isCheckIn) {
      if (existing) {
        if (timeStr < existing.check_in_time) {
          const updates = { check_in_time: timeStr };
          if (existing.check_out_time) {
            const worked = Math.max(0, timeToMinutes(existing.check_out_time) - timeToMinutes(timeStr));
            updates.working_hours = Math.round((worked / 60) * 100) / 100;
          }
          const { error } = await db.from("attendance_records").update(updates).eq("id", existing.id);
          if (error) log("❌", `Update check-in failed: ${error.message}`);
        }
        return;
      }

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
          const checkIn = yesterdayRecord.check_in_time;
          const checkInMinutes = checkIn ? timeToMinutes(checkIn) : 0;
          const checkOutMinutes = timeToMinutes(timeStr) + 1440;
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

      const checkIn = existing.check_in_time;
      const checkInMinutes = checkIn ? timeToMinutes(checkIn) : 0;
      const checkOutMinutes = timeToMinutes(timeStr);
      const workedMinutes = checkIn ? Math.max(0, checkOutMinutes - checkInMinutes) : 0;
      const workedHours = Math.round((workedMinutes / 60) * 100) / 100;

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

  // ══════════════════════════════════════════
  // Break Tracking (breakOut / breakIn)
  // ══════════════════════════════════════════
  async function processBreakEvent(employee, dateStr, timeStr, attendanceStatus) {
    const isBreakOut = attendanceStatus === "breakOut";
    const isBreakIn = attendanceStatus === "breakIn";
    if (!isBreakOut && !isBreakIn) return;

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

    let breaks = [];
    try {
      breaks = record.breaks ? (typeof record.breaks === "string" ? JSON.parse(record.breaks) : record.breaks) : [];
    } catch { breaks = []; }

    if (isBreakOut) {
      breaks.push({ break_out: timeStr, break_in: null });
      log("☕", `${employee.arabic_name || employee.name} started break at ${timeStr}`);
    } else if (isBreakIn) {
      const openBreak = breaks.findLast((b) => b.break_out && !b.break_in);
      if (openBreak) {
        openBreak.break_in = timeStr;
        const breakMinutes = Math.max(0, timeToMinutes(timeStr) - timeToMinutes(openBreak.break_out));
        openBreak.duration_minutes = Math.round(breakMinutes * 100) / 100;
        log("☕", `${employee.arabic_name || employee.name} ended break at ${timeStr} (${openBreak.duration_minutes} min)`);
      } else {
        breaks.push({ break_out: null, break_in: timeStr });
        log("⚠️", `${employee.arabic_name || employee.name} break-in at ${timeStr} but no matching break-out`);
      }
    }

    const totalBreakMinutes = breaks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);

    await db.from("attendance_records").update({
      breaks: JSON.stringify(breaks),
      total_break_minutes: Math.round(totalBreakMinutes * 100) / 100,
    }).eq("id", record.id);
  }

  // ══════════════════════════════════════════
  // Employee Reconciliation (device → HR system)
  // ══════════════════════════════════════════
  async function reconcileEmployees(deviceUsers) {
    const { data: hrEmployees } = await db.from("employees").select("*");

    const hrMap = new Map();
    (hrEmployees || []).forEach((e) => {
      if (e.person_id) hrMap.set(String(e.person_id), e);
      if (e.national_id) hrMap.set(e.national_id, e);
      if (e.device_employee_no) hrMap.set(e.device_employee_no, e);
    });

    let newCount = 0;
    let updatedCount = 0;
    for (const user of deviceUsers) {
      const existing = hrMap.get(user.employeeNo);
      if (!existing) {
        await createEmployee({ employeeNo: user.employeeNo, name: user.name || `موظف #${user.employeeNo}` });
        newCount++;
      } else {
        const deviceName = user.name || "";
        const hrName = existing.name || "";
        if (deviceName && deviceName !== hrName && !deviceName.startsWith("موظف #")) {
          const updates = { name: deviceName, device_employee_no: user.employeeNo };
          if (!existing.arabic_name || existing.arabic_name === hrName) {
            updates.arabic_name = deviceName;
          }
          await db.from("employees").update(updates).eq("id", existing.id);
          log("✏️", `Updated name for #${user.employeeNo}: "${hrName}" → "${deviceName}"`);
          updatedCount++;
        }
        if (!existing.device_employee_no) {
          await db.from("employees").update({ device_employee_no: user.employeeNo }).eq("id", existing.id);
        }
      }
    }

    return { newCount, updatedCount };
  }

  // ══════════════════════════════════════════
  // Device Heartbeat
  // ══════════════════════════════════════════
  async function heartbeat({ status = "online", markSynced = false } = {}) {
    const vals = { last_heartbeat_at: new Date().toISOString(), status };
    if (markSynced) vals.last_sync_at = new Date().toISOString();
    await db.from("biometric_devices").update(vals).eq("ip_address", deviceIp);
  }

  async function notifyDeviceOffline() {
    try {
      await db.from("notifications").insert({
        id: uuid(),
        title: "⚠️ جهاز البصمة غير متصل",
        body: `فشل الاتصال بجهاز البصمة (${deviceIp}) لمدة ${MAX_HEALTH_FAILURES} محاولات متتالية. يرجى التحقق من الجهاز والشبكة.`,
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

  async function notifyDeviceBackOnline(info) {
    try {
      await db.from("notifications")
        .update({ type: "info", title: "جهاز البصمة متصل مرة أخرى", body: `عاد جهاز البصمة ${info?.model || ""} للعمل.` })
        .eq("category", "device_health")
        .eq("type", "error");
    } catch { /* non-critical */ }
  }

  // ══════════════════════════════════════════
  // Device Health (orchestration kept here so both backends own their
  // own failure counter / notification semantics)
  // ══════════════════════════════════════════
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
        log("⚠️", `Could not update device timestamp: ${e.message}`);
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
  // Late Detection
  // ══════════════════════════════════════════
  async function detectLateArrivals() {
    const today = todayIraq();

    const { data: records } = await db
      .from("attendance_records")
      .select("id, employee_id, check_in_time, is_late")
      .eq("date", today)
      .not("check_in_time", "is", null);

    if (!records || records.length === 0) return;

    for (const record of records) {
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
  // Auto-Checkout at Shift End
  // ══════════════════════════════════════════
  const AUTO_CHECKOUT_GRACE_MINUTES = 30;

  async function autoCheckout() {
    const today = todayIraq();
    const nowMinutes = timeToMinutes(
      new Date().toLocaleTimeString("en-GB", { timeZone: ctx.IRAQ_TZ, hour12: false })
    );

    log("🕐", `Auto-checkout check for ${today} (now = ${Math.floor(nowMinutes / 60)}:${String(Math.floor(nowMinutes % 60)).padStart(2, "0")})...`);

    try {
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

      const empIds = openRecords.map((r) => r.employee_id);
      const { data: employees } = await db
        .from("employees")
        .select("id, name, arabic_name, shift_id")
        .in("id", empIds);

      if (!employees) return;

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

        if (nowMinutes < deadlineMinutes) continue;

        const checkOutTime = shift.end_time;
        const checkInMinutes = record.check_in_time ? timeToMinutes(record.check_in_time) : 0;
        const workedMinutes = record.check_in_time
          ? Math.max(0, timeToMinutes(checkOutTime) - checkInMinutes)
          : 0;
        const workedHours = Math.round((workedMinutes / 60) * 100) / 100;

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
  // Absent Detection
  // ══════════════════════════════════════════
  async function detectAbsences() {
    const today = todayIraq();
    const dayOfWeek = getDayOfWeek(today);

    log("🔍", `Checking absences for ${today} (${dayOfWeek})...`);

    try {
      const { data: employees } = await db
        .from("employees")
        .select("id, name, arabic_name, shift_id, status")
        .in("status", ["نشط", "active"])
        .not("shift_id", "is", null);

      if (!employees || employees.length === 0) return;

      const { data: todayRecords } = await db
        .from("attendance_records")
        .select("employee_id")
        .eq("date", today);

      const presentIds = new Set((todayRecords || []).map((r) => r.employee_id));

      const { data: leaves } = await db
        .from("leave_requests")
        .select("employee_id")
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today);

      const onLeaveIds = new Set((leaves || []).map((l) => l.employee_id));

      const shiftIds = [...new Set(employees.map((e) => e.shift_id))];
      const { data: shifts } = await db
        .from("shifts")
        .select("id, working_days")
        .in("id", shiftIds);

      const shiftMap = new Map((shifts || []).map((s) => [s.id, s]));

      let absentCount = 0;
      for (const emp of employees) {
        if (presentIds.has(emp.id) || onLeaveIds.has(emp.id)) continue;

        const shift = shiftMap.get(emp.shift_id);
        if (shift?.working_days) {
          const workDays = Array.isArray(shift.working_days) ? shift.working_days : [];
          if (workDays.length > 0 && !workDays.includes(dayOfWeek)) continue;
        }

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
