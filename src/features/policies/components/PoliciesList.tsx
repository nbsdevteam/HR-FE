import { FileText } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { arabicSource } from "@/i18n/source";
import { policiesPageSize } from "../constants/policies";
import type { DisplayPolicy } from "../types";
import PolicyListItem from "./PolicyListItem";

type PoliciesListProps = {
  currentPage: number;
  expandedPolicy: string | null;
  filteredCount: number;
  isSubmitting: boolean;
  localizePolicyText: (value: string | null | undefined) => string;
  paged: DisplayPolicy[];
  totalPages: number;
  onDeletePolicy: (id: string) => void;
  onEditPolicy: (policy: DisplayPolicy) => void;
  onExpandPolicy: (id: string | null) => void;
  onPageChange: (updater: (page: number) => number) => void;
  onToggleStatus: (policy: DisplayPolicy) => void;
  onViewPolicy: (policy: DisplayPolicy) => void;
};

const PoliciesList = ({
  currentPage,
  expandedPolicy,
  filteredCount,
  isSubmitting,
  localizePolicyText,
  paged,
  totalPages,
  onDeletePolicy,
  onEditPolicy,
  onExpandPolicy,
  onPageChange,
  onToggleStatus,
  onViewPolicy,
}: PoliciesListProps) => (
  <div className="space-y-4">
    {filteredCount === 0 ? (
      <EmptyState
        icon={FileText}
        message={arabicSource(
          "policies.there_are_no_matching_policies_for_your_search",
        )}
      />
    ) : (
      paged?.map((policy, index) => (
        <PolicyListItem
          key={policy.id}
          policy={policy}
          index={index}
          isExpanded={expandedPolicy === policy.id}
          isSubmitting={isSubmitting}
          localizePolicyText={localizePolicyText}
          onDeletePolicy={onDeletePolicy}
          onEditPolicy={onEditPolicy}
          onExpandPolicy={onExpandPolicy}
          onToggleStatus={onToggleStatus}
          onViewPolicy={onViewPolicy}
        />
      ))
    )}
    {filteredCount > policiesPageSize && (
      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-muted-foreground text-xs">
          {(currentPage - 1) * policiesPageSize + 1}–
          {Math.min(currentPage * policiesPageSize, filteredCount)} /{" "}
          {filteredCount}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange((page) => Math.max(1, page - 1))}
            className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40 cursor-pointer hover:bg-muted/30"
          >
            ‹
          </button>
          <span className="text-sm text-foreground">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() =>
              onPageChange((page) => Math.min(totalPages, page + 1))
            }
            className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40 cursor-pointer hover:bg-muted/30"
          >
            ›
          </button>
        </div>
      </div>
    )}
  </div>
);

export default PoliciesList;
