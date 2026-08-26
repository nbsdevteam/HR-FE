import { memo } from "react";
import type { Ref } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Download,
  Printer,
  Settings,
} from "lucide-react";
import { SearchInput } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import HeaderActionButton from "./HeaderActionButton";
import SearchResults from "./SearchResults";

const UNLINKED_TONE =
  "bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 shadow-sm";

type HierarchyHeaderProps = {
  unlinkedCount: number;
  searchInputRef: Ref<HTMLInputElement>;
  searchQuery: string;
  showSearchResults: boolean;
  searchResults: OrgNode[];
  canManage?: boolean;
  onOpenManagement?: () => void;
  onShowUnlinked: () => void;
  onAddDepartment: () => void;
  onAddPosition: () => void;
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
  canManage = false,
  onOpenManagement,
  onShowUnlinked,
  onAddDepartment,
  onAddPosition,
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
      {canManage && onOpenManagement && (
        <HeaderActionButton icon={Settings} onClick={onOpenManagement}>
          {arabicSource("org_structure.manage_structure")}
        </HeaderActionButton>
      )}

      {unlinkedCount > 0 && (
        <HeaderActionButton
          icon={AlertTriangle}
          onClick={onShowUnlinked}
          toneClassName={UNLINKED_TONE}
        >
          {unlinkedCount} {arabicSource("hierarchy.without_binding")}
        </HeaderActionButton>
      )}

      <HeaderActionButton icon={Building2} onClick={onAddDepartment}>
        {arabicSource("hierarchy.add_a_new_section")}
      </HeaderActionButton>

      <HeaderActionButton icon={Briefcase} onClick={onAddPosition}>
        {arabicSource("hierarchy.new_position")}
      </HeaderActionButton>

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

      <HeaderActionButton
        icon={Printer}
        onClick={onPrint}
        title={arabicSource("common.print")}
        toneClassName="bg-card border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-foreground"
        paddingClassName="px-3 py-2"
        hideLabelOnMobile
      >
        {arabicSource("common.print")}
      </HeaderActionButton>
      <HeaderActionButton
        icon={Download}
        onClick={onExportPNG}
        title={arabicSource("hierarchy.export_png")}
        toneClassName="bg-card border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-foreground"
        paddingClassName="px-3 py-2"
        hideLabelOnMobile
      >
        {arabicSource("common.export")}
      </HeaderActionButton>
    </div>
  </div>
);

export default memo(HierarchyHeader);
