import { useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { PAGE_GAP, pageRange, pageWindow, type PageWindowItem } from "@/shared/utils/pagination";
import Button from "./Button";
import Select from "./Select";
import PaginationPageButton from "./PaginationPageButton";

export const PAGE_SIZE_OPTIONS = ["10", "25", "50", "100"] as const;

type PaginationProps = {
  /** 1-based, as returned by the backend's `page` field. */
  page: number;
  totalPages: number;
  /** Total matching rows across all pages, for the range summary. */
  total: number;
  perPage: number;
  /** Dims the control while a page request is in flight, without unmounting it. */
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
};

const gapKey = (index: number): string => `gap-${index}`;

const Pagination = ({
  page,
  totalPages,
  total,
  perPage,
  loading = false,
  onPageChange,
  onPerPageChange,
}: PaginationProps) => {
  const pages = useMemo<PageWindowItem[]>(() => pageWindow(page, totalPages), [page, totalPages]);
  const range = useMemo(() => pageRange(page, perPage, total), [page, perPage, total]);

  const handlePrevious = useCallback((): void => {
    if (page > 1) onPageChange(page - 1);
  }, [onPageChange, page]);

  const handleNext = useCallback((): void => {
    if (page < totalPages) onPageChange(page + 1);
  }, [onPageChange, page, totalPages]);

  const handlePerPageChange = useCallback((value: string): void => {
    onPerPageChange?.(Number(value));
  }, [onPerPageChange]);

  // A single page of results needs no navigation, but the row count is still
  // worth showing — so the control collapses to the summary rather than vanishing.
  const showNav = totalPages > 1;

  return (
    <nav
      aria-label={arabicSource("common.pagination")}
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/40"
    >
      <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 12 }}>
        <span data-i18n-ignore dir="ltr">
          {range.from}&ndash;{range.to}
        </span>
        <span>/</span>
        <span data-i18n-ignore dir="ltr">{total}</span>
      </div>

      {showNav && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronRight}
            disabled={loading || page <= 1}
            onClick={handlePrevious}
            aria-label={arabicSource("common.go_to_previous_page")}
          >
            {arabicSource("common.previous")}
          </Button>

          {pages.map((item, index) =>
            item === PAGE_GAP ? (
              <span
                key={gapKey(index)}
                aria-hidden="true"
                className="px-1 text-muted-foreground select-none"
                style={{ fontSize: 13 }}
              >
                &hellip;
              </span>
            ) : (
              <PaginationPageButton
                key={item}
                page={item}
                isCurrent={item === page}
                disabled={loading}
                onSelect={onPageChange}
              />
            ),
          )}

          <Button
            variant="ghost"
            size="sm"
            icon={ChevronLeft}
            iconPosition="trailing"
            disabled={loading || page >= totalPages}
            onClick={handleNext}
            aria-label={arabicSource("common.go_to_next_page")}
          >
            {arabicSource("common.next")}
          </Button>
        </div>
      )}

      {onPerPageChange && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("common.rows_per_page")}
          </span>
          <Select
            value={String(perPage)}
            onChange={handlePerPageChange}
            options={PAGE_SIZE_OPTIONS}
            optionsAreData
            disabled={loading}
            aria-label={arabicSource("common.rows_per_page")}
            className="w-20"
            style={{ height: 34, fontSize: 13 }}
            openUpward
          />
        </div>
      )}
    </nav>
  );
};

export default Pagination;
