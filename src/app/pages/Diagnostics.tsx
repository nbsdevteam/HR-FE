import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { arabicSource } from "../i18n/source";

interface CheckResult {
  name: string;
  type: "table" | "view" | "function" | "bucket" | "column";
  status: "checking" | "ok" | "error" | "warning";
  detail?: string;
  rowCount?: number;
}

export function Diagnostics() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const updateResult = (name: string, update: Partial<CheckResult>) => {
    setResults((prev) =>
      prev.map((r) => (r.name === name ? { ...r, ...update } : r))
    );
  };

  const runChecks = async () => {
    setRunning(true);
    setDone(false);

    // Define all checks
    const tables = [
      "employees",
      "departments",
      "employee_custodies",
      "employee_attachments",
      "leave_requests",
      "leave_balances",
      "evaluations",
      "evaluation_criteria",
      "warnings",
      "job_openings",
      "applicants",
      "training_programs",
      "training_participants",
      "policies",
      "org_chart",
      "notifications",
      "attendance_records",
      "monthly_records",
      "monthly_ledgers",
      "shifts",
      "user_profiles",
    ];

    const views = [
      "dashboard_stats",
      "employee_summary",
      "job_openings_with_counts",
      "training_with_counts",
    ];

    const newColumns = [
      "position",
      "email",
      "personal_phone",
      "company_phone",
      "join_date",
      "end_date",
      "status",
      "address",
      "national_id",
      "emergency_contact",
      "emergency_phone",
      "blood_type",
      "manager_id",
    ];

    const buckets = ["employee-photos", "attachments", "resumes"];

    const rpcFunctions = [
      "get_employee_leave_balance",
      "get_department_stats",
    ];

    // Initialize all
    const initial: CheckResult[] = [
      ...tables.map((t) => ({
        name: t,
        type: "table" as const,
        status: "checking" as const,
      })),
      ...views.map((v) => ({
        name: v,
        type: "view" as const,
        status: "checking" as const,
      })),
      ...newColumns.map((c) => ({
        name: `employees.${c}`,
        type: "column" as const,
        status: "checking" as const,
      })),
      ...buckets.map((b) => ({
        name: b,
        type: "bucket" as const,
        status: "checking" as const,
      })),
      ...rpcFunctions.map((f) => ({
        name: f,
        type: "function" as const,
        status: "checking" as const,
      })),
    ];
    setResults(initial);

    // Check tables
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: false })
          .limit(1);
        if (error) {
          updateResult(table, {
            status: "error",
            detail: error.message,
          });
        } else {
          updateResult(table, {
            status: "ok",
            detail: `${count ?? data?.length ?? 0} rows`,
            rowCount: count ?? data?.length ?? 0,
          });
        }
      } catch (e: any) {
        updateResult(table, { status: "error", detail: e.message });
      }
    }

    // Check views
    for (const view of views) {
      try {
        const { data, error } = await supabase.from(view).select("*").limit(1);
        if (error) {
          updateResult(view, { status: "error", detail: error.message });
        } else {
          updateResult(view, {
            status: "ok",
            detail: `View works, returned ${data?.length ?? 0} rows`,
          });
        }
      } catch (e: any) {
        updateResult(view, { status: "error", detail: e.message });
      }
    }

    // Check new columns on employees
    try {
      const { data, error } = await supabase
        .from("employees")
        .select(newColumns.join(","))
        .limit(1);
      if (error) {
        // Parse which columns failed
        for (const col of newColumns) {
          const { error: colErr } = await supabase
            .from("employees")
            .select(col)
            .limit(1);
          updateResult(`employees.${col}`, {
            status: colErr ? "error" : "ok",
            detail: colErr ? colErr.message : "Column exists",
          });
        }
      } else {
        for (const col of newColumns) {
          updateResult(`employees.${col}`, {
            status: "ok",
            detail: "Column exists",
          });
        }
      }
    } catch (e: any) {
      for (const col of newColumns) {
        updateResult(`employees.${col}`, {
          status: "error",
          detail: e.message,
        });
      }
    }

    // Check buckets
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage.from(bucket).list("", {
          limit: 1,
        });
        if (error) {
          updateResult(bucket, { status: "error", detail: error.message });
        } else {
          updateResult(bucket, {
            status: "ok",
            detail: `Bucket accessible, ${data?.length ?? 0} files found`,
          });
        }
      } catch (e: any) {
        updateResult(bucket, { status: "error", detail: e.message });
      }
    }

    // Check RPC functions
    for (const fn of rpcFunctions) {
      try {
        if (fn === "get_employee_leave_balance") {
          const { error } = await supabase.rpc(fn, {
            p_employee_id: "___test___",
            p_year: 2026,
          });
          if (error && error.message.includes("does not exist")) {
            updateResult(fn, { status: "error", detail: "Function not found" });
          } else {
            updateResult(fn, {
              status: "ok",
              detail: error ? `Function exists (${error.message})` : "Function works",
            });
          }
        } else if (fn === "get_department_stats") {
          const { data, error } = await supabase.rpc(fn);
          if (error && error.message.includes("does not exist")) {
            updateResult(fn, { status: "error", detail: "Function not found" });
          } else {
            updateResult(fn, {
              status: "ok",
              detail: error
                ? `Function exists (${error.message})`
                : `Function works, ${data?.length ?? 0} departments`,
            });
          }
        }
      } catch (e: any) {
        updateResult(fn, { status: "error", detail: e.message });
      }
    }

    setRunning(false);
    setDone(true);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const okCount = results.filter((r) => r.status === "ok").length;
  const errCount = results.filter((r) => r.status === "error").length;
  const checkingCount = results.filter((r) => r.status === "checking").length;
  const totalCount = results.length;

  const statusIcon = (s: string) => {
    switch (s) {
      case "ok":
        return "✅";
      case "error":
        return "❌";
      case "checking":
        return "⏳";
      case "warning":
        return "⚠️";
      default:
        return "❓";
    }
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case "table":
        return arabicSource("diagnostics.table");
      case "view":
        return "View";
      case "function":
        return arabicSource("diagnostics.rpc_function");
      case "bucket":
        return "Storage";
      case "column":
        return arabicSource("common.column");
      default:
        return t;
    }
  };

  const groupByType = (type: string) => results.filter((r) => r.type === type);

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "Tajawal, sans-serif",
        padding: 32,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>
        {arabicSource("diagnostics.database_check_migration_diagnostics")}
      </h1>
      <p style={{ color: "#888", marginBottom: 24 }}>
        {arabicSource("diagnostics.scans_all_tables_views_new_columns_storage_buckets_and_rpc_funct")}
      </p>

      {/* Summary */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "#065f46",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
          }}
        >
          {arabicSource("diagnostics.successful")} {okCount}
        </div>
        <div
          style={{
            background: errCount > 0 ? "#991b1b" : "#374151",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
          }}
        >
          {arabicSource("diagnostics.failed")} {errCount}
        </div>
        <div
          style={{
            background: "#374151",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
          }}
        >
          {arabicSource("diagnostics.under_examination")} {checkingCount}
        </div>
        <div
          style={{
            background: "#1e3a5f",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
          }}
        >
          {arabicSource("diagnostics.total")} {totalCount}
        </div>
        {done && errCount === 0 && (
          <div
            style={{
              background: "#14532d",
              color: "#4ade80",
              padding: "12px 24px",
              borderRadius: 8,
              fontWeight: "bold",
            }}
          >
            {arabicSource("diagnostics.everything_works_perfectly")}
          </div>
        )}
      </div>

      <button
        onClick={runChecks}
        disabled={running}
        style={{
          background: running ? "#555" : "#2563eb",
          color: "#fff",
          border: "none",
          padding: "10px 24px",
          borderRadius: 8,
          cursor: running ? "not-allowed" : "pointer",
          marginBottom: 24,
        }}
      >
        {running ? arabicSource("diagnostics.checking") : arabicSource("diagnostics.re_examination")}
      </button>

      {/* Tables */}
      {(
        [
          ["table", arabicSource("diagnostics.tables")],
          ["view", arabicSource("diagnostics.the_views")],
          ["column", arabicSource("diagnostics.new_employees_columns")],
          ["bucket", "📁 Storage Buckets"],
          ["function", "⚙️ RPC Functions"],
        ] as [string, string][]
      ).map(([type, label]) => {
        const items = groupByType(type);
        if (items.length === 0) return null;
        return (
          <div key={type} style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 8 }}>{label}</h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#1f2937",
                    color: "#d1d5db",
                    textAlign: "right",
                  }}
                >
                  <th style={{ padding: 8 }}>{arabicSource("common.status")}</th>
                  <th style={{ padding: 8 }}>{arabicSource("common.name")}</th>
                  <th style={{ padding: 8 }}>{arabicSource("diagnostics.type")}</th>
                  <th style={{ padding: 8 }}>{arabicSource("common.details")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr
                    key={r.name}
                    style={{
                      borderBottom: "1px solid #374151",
                      background:
                        r.status === "error"
                          ? "rgba(220,38,38,0.1)"
                          : "transparent",
                    }}
                  >
                    <td style={{ padding: 8 }}>{statusIcon(r.status)}</td>
                    <td
                      style={{
                        padding: 8,
                        fontFamily: "monospace",
                        direction: "ltr",
                        textAlign: "right",
                      }}
                    >
                      {r.name}
                    </td>
                    <td style={{ padding: 8 }}>{typeLabel(r.type)}</td>
                    <td
                      style={{
                        padding: 8,
                        color: r.status === "error" ? "#f87171" : "#9ca3af",
                        fontSize: 13,
                      }}
                    >
                      {r.detail || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
