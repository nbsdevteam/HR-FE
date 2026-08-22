import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Search, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { DbEmployee, empDisplayName, empNumber } from "@/shared/hooks";

type Props = {
  employees: DbEmployee[];
  value: string;
  onChange: (employeeId: string) => void;
  className?: string;
  placeholder?: string;
  filter?: (employee: DbEmployee) => boolean;
  disabled?: boolean;
  showDepartment?: boolean;
  excludeIds?: string[];
  /**
   * Optional id→label map from the parent (e.g. empMap). Used when the parent
   * already resolves names successfully (contracts table) so the closed field
   * stays in sync even if local state is reset.
   */
  labels?: Record<string, string>;
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

/** Resolve employee row for a controlled value (id is canonical). */
function findEmployee(
  employees: DbEmployee[],
  valueKey: string,
): DbEmployee | null {
  if (!valueKey) return null;
  return employees.find((e) => String(e.id) === valueKey) || null;
}

/**
 * Searchable employee dropdown. Display name is derived from value + employees
 * (and optional parent labels map) — not from ephemeral local-only state.
 */
const EmployeeSelect = ({
  employees,
  value,
  onChange,
  className = "",
  placeholder,
  filter,
  disabled = false,
  showDepartment = true,
  excludeIds,
  labels,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const exclude = useMemo(
    () => new Set((excludeIds || []).map((id) => String(id))),
    [excludeIds],
  );

  const valueKey = value == null || value === "" ? "" : String(value);
  const selected = useMemo(
    () => findEmployee(employees, valueKey),
    [employees, valueKey],
  );

  // Canonical display: employees row → parent labels map → empty (placeholder).
  const selectedName = useMemo(() => {
    if (!valueKey) return "";
    if (selected) return empDisplayName(selected);
    const fromLabels = labels?.[valueKey];
    if (fromLabels) return fromLabels;
    return "";
  }, [valueKey, selected, labels]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => !exclude.has(String(e.id)))
      .filter((e) => (filter ? filter(e) : true))
      .filter((e) => matchesQuery(e, q))
      .slice()
      .sort((a, b) => empDisplayName(a).localeCompare(empDisplayName(b), "ar"));
  }, [employees, exclude, filter, query]);

  const label =
    placeholder ||
    arabicSource("training.select_employee") ||
    arabicSource("common.search_for_an_employee");

  const pick = (emp: DbEmployee) => {
    // Always persist the Odoo hr.employee id (same key empMap / contracts use).
    onChange(String(emp.id));
    setOpen(false);
    setQuery("");
  };

  const clear = () => {
    onChange("");
  };

  function handleToggle() {
    if (disabled) return;
    setOpen((v) => !v);
    setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (ev: MouseEvent) => {
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
    // pointerdown bubble (not capture-click) avoids racing option selection.
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className={`w-full h-10 px-3 rounded-lg border border-border bg-input-background flex items-center gap-2 ${
          disabled ? "opacity-50" : "cursor-pointer"
        } focus-within:ring-2 focus-within:ring-ring`}
        onClick={handleToggle}
      >
        {/*
          Readonly input guarantees the browser paints the value. A flex+truncate
          <span> inside a <button> was collapsing / not updating after pick.
        */}
        <input
          type="text"
          readOnly
          disabled={disabled}
          value={selectedName}
          placeholder={label}
          data-employee-id={valueKey || undefined}
          className="min-w-0 flex-1 h-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground cursor-pointer"
          style={{ fontSize: 13 }}
          dir="auto"
          aria-haspopup="listbox"
          aria-expanded={open}
          // onFocus={() => {
          //   if (!disabled) setOpen(true);
          // }}
        />
        <span className="flex items-center gap-1 shrink-0">
          {!!valueKey && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  clear();
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
      </div>

      {open ? (
        <div
          className="absolute z-[800] mt-1 w-full rounded-lg border border-border bg-card shadow-xl overflow-hidden"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-border/40 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={arabicSource("common.search_for_an_employee")}
              className="w-full h-8 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              style={{ fontSize: 13 }}
            />
          </div>
          <div className="max-h-96 overflow-y-auto" role="listbox">
            {options.length === 0 ? (
              <p
                className="px-3 py-3 text-muted-foreground"
                style={{ fontSize: 12 }}
              >
                {arabicSource("common.no_results_found")}
              </p>
            ) : (
              options?.map((emp) => {
                const active = String(emp.id) === valueKey;
                const name = empDisplayName(emp);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => {
                      // mousedown + preventDefault: commit before blur/outside handlers.
                      e.preventDefault();
                      e.stopPropagation();
                      pick(emp);
                    }}
                    className={`w-full px-3 py-2 text-start hover:bg-primary/10 cursor-pointer border-b border-border/10 last:border-b-0 ${
                      active ? "bg-primary/10 text-primary" : "text-foreground"
                    }`}
                    style={{ fontSize: 13 }}
                  >
                    <div className="truncate font-medium" dir="auto">
                      {name}
                    </div>
                    {showDepartment &&
                      (emp.department || emp.device_employee_no) && (
                        <div
                          className="text-muted-foreground truncate"
                          style={{ fontSize: 11 }}
                        >
                          {[
                            emp.department,
                            emp.device_employee_no
                              ? `#${emp.device_employee_no}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                  </button>
                );
              })
            )}
          </div>
          <div
            className="px-3 py-1.5 border-t border-border/40 text-muted-foreground"
            style={{ fontSize: 10 }}
          >
            {options.length} /{" "}
            {
              employees.filter(
                (e) => !exclude.has(String(e.id)) && (!filter || filter(e)),
              ).length
            }
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EmployeeSelect;
