import { motion } from "motion/react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import PublicLeaveEmployeeSearchResultRow from "./PublicLeaveEmployeeSearchResultRow";
import PublicLeaveNotice from "./PublicLeaveNotice";
import type { usePublicLeaveRequestPage } from "../hooks/usePublicLeaveRequestPage";

type PublicLeaveEmployeeSearchProps = {
  page: ReturnType<typeof usePublicLeaveRequestPage>;
};

const PublicLeaveEmployeeSearch = ({ page }: PublicLeaveEmployeeSearchProps) => {
  const { handleGoToTrack, handleSelectEmployee, minSearchChars, search } = page;

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    search.updateQuery(event.target.value);
  };

  const unavailable = Boolean(search.selected && !search.selected.verification_available);

  const handleClearSelection = (): void => {
    search.clearSelection();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h1 className="text-foreground" style={{ fontSize: 22 }}>{arabicSource("public_leave.search_title")}</h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
          {arabicSource("public_leave.search_subtitle")}
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
        <input
          type="text"
          dir="auto"
          value={search.query}
          onChange={handleQueryChange}
          placeholder={arabicSource("public_leave.search_placeholder")}
          className="w-full ps-10 pe-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
          style={{ fontSize: 14 }}
        />
      </div>

      {search.tooShort && (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("public_leave.search_min_chars")} {minSearchChars}
        </p>
      )}

      {search.searching && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      )}

      {search.searchError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontSize: 12.5 }}>{search.searchError}</span>
        </div>
      )}

      {!search.searching && !search.tooShort && !search.searchError && search.results.length === 0 && (
        <p className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>
          {arabicSource("public_leave.search_no_match")}
        </p>
      )}

      {search.results.length > 0 && (
        <div className="space-y-2">
          {search.results.map((employee) => (
            <PublicLeaveEmployeeSearchResultRow
              key={employee.id}
              employee={employee}
              selected={search.selected?.id === employee.id}
              onSelect={handleSelectEmployee}
            />
          ))}
        </div>
      )}

      {search.truncated && (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("public_leave.search_truncated")}
        </p>
      )}

      {unavailable && (
        <div className="space-y-3">
          <PublicLeaveNotice
            tone="error"
            title={arabicSource("public_leave.verification_unavailable_title")}
            body={arabicSource("public_leave.verification_unavailable_body")}
          />
          <button
            type="button"
            onClick={handleClearSelection}
            className="w-full px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
            style={{ fontSize: 13 }}
          >
            {arabicSource("public_leave.choose_someone_else")}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoToTrack}
        className="w-full text-center text-primary hover:underline cursor-pointer"
        style={{ fontSize: 12.5 }}
      >
        {arabicSource("public_leave.track_link")}
      </button>
    </motion.div>
  );
};

export default PublicLeaveEmployeeSearch;
