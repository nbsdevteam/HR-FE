import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Search, X } from "lucide-react";
import { arabicSource } from "../i18n/source";
import { DbEmployee, empDisplayName, empNumber } from "../lib/hooks";

type Props = {
  employees: DbEmployee[];
  value: string;
  onChange: (employeeId: string) => void;
  className?: string;
  placeholder?: string;
  /** Extra filter (e.g. exclude already enrolled, active-only). */
  filter?: (employee: DbEmployee) => boolean;
  disabled?: boolean;
  showDepartment?: boolean;
  /** Exclude these employee ids from the list. */
  excludeIds?: string[];
};

function matchesQuery(emp: DbEmployee, q: string): boolean {
  if (!q) return true;
  const hay = [
    empDisplayName(emp),
    emp.name,
    emp.arabic_name,
    emp.department,
    emp.position,
    emp.email,
    emp.device_employee_no,
    emp.person_id != null ? String(emp.person_id) : "",
    emp.person_id != null ? empNumber(emp.person_id) : "",
    emp.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

/**
 * Searchable employee dropdown backed by /api/hr/employees/list data.
 * Opens the full list on click (not only after typing).
 */
export function EmployeeSelect({
  employees,
  value,
  onChange,
  className = "",
  placeholder,
  filter,
  disabled = false,
  showDepartment = true,
  excludeIds,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const exclude = useMemo(() => new Set(excludeIds || []), [excludeIds]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => !exclude.has(e.id))
      .filter((e) => (filter ? filter(e) : true))
      .filter((e) => matchesQuery(e, q))
      .slice()
      .sort((a, b) => empDisplayName(a).localeCompare(empDisplayName(b), "ar"));
  }, [employees, exclude, filter, query]);

  const selected = employees.find((e) => e.id === value) || null;

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: MouseEvent) => {
      if (!rootRef.current?.contains(ev.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    // Focus search when opened
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label =
    placeholder ||
    arabicSource("training.select_employee") ||
    arabicSource("common.search_for_an_employee");

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setQuery("");
        }}
        className="w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50"
      >
        <span className={`truncate text-start ${selected ? "text-foreground" : "text-muted-foreground"}`} style={{ fontSize: 13 }}>
          {selected
            ? `${empDisplayName(selected)}${showDepartment && selected.department ? ` — ${selected.department}` : ""}`
            : label}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="p-0.5 rounded hover:bg-muted/40 text-muted-foreground"
              aria-label="clear"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border/40 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={arabicSource("common.search_for_an_employee")}
              className="w-full h-8 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              style={{ fontSize: 13 }}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-3 text-muted-foreground" style={{ fontSize: 12 }}>
                {arabicSource("common.no_results_found")}
              </p>
            ) : (
              options.map((emp) => {
                const active = emp.id === value;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onChange(emp.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full px-3 py-2 text-start hover:bg-primary/10 cursor-pointer border-b border-border/10 last:border-b-0 ${
                      active ? "bg-primary/10 text-primary" : "text-foreground"
                    }`}
                    style={{ fontSize: 13 }}
                  >
                    <div className="truncate">{empDisplayName(emp)}</div>
                    {(showDepartment || emp.device_employee_no) && (
                      <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                        {[emp.department, emp.device_employee_no ? `#${emp.device_employee_no}` : ""]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="px-3 py-1.5 border-t border-border/40 text-muted-foreground" style={{ fontSize: 10 }}>
            {options.length} / {employees.filter((e) => !exclude.has(e.id) && (!filter || filter(e))).length}
          </div>
        </div>
      )}
    </div>
  );
}
