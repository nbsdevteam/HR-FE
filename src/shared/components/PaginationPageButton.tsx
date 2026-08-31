import { useCallback } from "react";
import { arabicSource } from "@/i18n/source";

type PaginationPageButtonProps = {
  page: number;
  isCurrent: boolean;
  disabled: boolean;
  onSelect: (page: number) => void;
};

const PaginationPageButton = ({ page, isCurrent, disabled, onSelect }: PaginationPageButtonProps) => {
  const handleClick = useCallback((): void => {
    onSelect(page);
  }, [onSelect, page]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-current={isCurrent ? "page" : undefined}
      aria-label={`${arabicSource("common.go_to_page")} ${page}`}
      className={`min-w-9 h-9 px-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        isCurrent
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-transparent text-foreground border-border/60 hover:bg-muted/30"
      }`}
      style={{ fontSize: 13 }}
    >
      {page}
    </button>
  );
};

export default PaginationPageButton;
