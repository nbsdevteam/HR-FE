import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Building2, Download, Printer, UserPlus } from "lucide-react";
import type { Ref } from "react";
import type { OrgNode } from "../types";
import SearchResults from "./SearchResults";
import { SearchInput } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type HierarchyHeaderProps = {
  unlinkedCount: number;
  searchInputRef: Ref<HTMLInputElement>;
  searchQuery: string;
  showSearchResults: boolean;
  searchResults: OrgNode[];
  onShowUnlinked: () => void;
  onAddEmployee: () => void;
  onAddDepartment: () => void;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchSelect: (node: OrgNode) => void;
  onCloseSearchResults: () => void;
  onClearSearch: () => void;
  onPrint: () => void;
  onExportPNG: () => void;
};

const HierarchyHeader = ({
  unlinkedCount,
  searchInputRef,
  searchQuery,
  showSearchResults,
  searchResults,
  onShowUnlinked,
  onAddEmployee,
  onAddDepartment,
  onSearchChange,
  onSearchFocus,
  onSearchSelect,
  onCloseSearchResults,
  onClearSearch,
  onPrint,
  onExportPNG,
}: HierarchyHeaderProps) => (
  <div className="flex items-start justify-between flex-wrap gap-4">
    <div>
      <h1 className="text-gradient-gold">
        {arabicSource("common.organizational_structure")}
      </h1>
      <p className="text-muted-foreground mt-1">
        {arabicSource(
          "hierarchy.organization_structure_and_department_map_data_directly_from_the",
        )}
      </p>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      {unlinkedCount > 0 && (
        <button
          onClick={onShowUnlinked}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-all shadow-sm"
          style={{ fontSize: 13 }}
        >
          <AlertTriangle className="w-4 h-4" />
          {unlinkedCount} {arabicSource("hierarchy.without_binding")}
        </button>
      )}

      <button
        onClick={onAddEmployee}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
        style={{ fontSize: 13 }}
      >
        <UserPlus className="w-4 h-4" />{" "}
        {arabicSource("common.add_an_employee")}
      </button>

      <button
        onClick={onAddDepartment}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border/60 hover:border-primary/30 text-foreground transition-all shadow-sm"
        style={{ fontSize: 13 }}
      >
        <Building2 className="w-4 h-4" />{" "}
        {arabicSource("hierarchy.add_a_new_section")}
      </button>

      <SearchInput
        inputRef={searchInputRef}
        iconClassName="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
        inputClassName="bg-card border border-border/60 rounded-lg ps-9 pe-8 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        placeholder={arabicSource("common.search_for_an_employee")}
        value={searchQuery}
        onChange={onSearchChange}
        onFocus={onSearchFocus}
        onClear={onClearSearch}
        style={{ fontSize: 13, width: 220 }}
      >
        <AnimatePresence>
          {showSearchResults && searchQuery.trim() && (
            <SearchResults
              results={searchResults}
              onSelect={onSearchSelect}
              onClose={onCloseSearchResults}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showSearchResults &&
            searchQuery.trim() &&
            searchResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full mt-1 start-0 end-0 bg-card border border-border/60 rounded-lg shadow-xl z-50 px-3 py-3 text-center"
              >
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                  {arabicSource("hierarchy.there_are_no_results_for")}
                  {searchQuery}"
                </p>
              </motion.div>
            )}
        </AnimatePresence>
      </SearchInput>

      <button
        onClick={onPrint}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
        style={{ fontSize: 13 }}
        title={arabicSource("common.print")}
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">{arabicSource("common.print")}</span>
      </button>
      <button
        onClick={onExportPNG}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
        style={{ fontSize: 13 }}
        title={arabicSource("hierarchy.export_png")}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">
          {arabicSource("common.export")}
        </span>
      </button>
    </div>
  </div>
);

export default HierarchyHeader;
