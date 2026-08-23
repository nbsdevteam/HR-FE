import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Eye,
  FileText,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { POLICY_CATEGORY_ICONS, policyStatusColors } from "../constants/policies";
import type { DisplayPolicy } from "../types";

type PolicyListItemProps = {
  policy: DisplayPolicy;
  index: number;
  isExpanded: boolean;
  isSubmitting: boolean;
  localizePolicyText: (value: string | null | undefined) => string;
  onDeletePolicy: (id: string) => void;
  onEditPolicy: (policy: DisplayPolicy) => void;
  onExpandPolicy: (id: string | null) => void;
  onToggleStatus: (policy: DisplayPolicy) => void;
  onViewPolicy: (policy: DisplayPolicy) => void;
};

const PolicyListItem = ({
  policy,
  index,
  isExpanded,
  isSubmitting,
  localizePolicyText,
  onDeletePolicy,
  onEditPolicy,
  onExpandPolicy,
  onToggleStatus,
  onViewPolicy,
}: PolicyListItemProps) => {
  const Icon = POLICY_CATEGORY_ICONS[policy.category] || FileText;
  const localizedContent = localizePolicyText(policy.content);

  const handleToggleExpand = (): void => {
    onExpandPolicy(isExpanded ? null : policy.id);
  };

  const handleViewClick = (): void => {
    onViewPolicy(policy);
  };

  const handleEditClick = (): void => {
    onEditPolicy(policy);
  };

  const handleToggleStatusClick = (): void => {
    onToggleStatus(policy);
  };

  const handleDeleteClick = (): void => {
    onDeletePolicy(policy.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
    >
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/10 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-start">
            <h3 className="text-foreground font-medium">
              {localizePolicyText(policy.title)}
            </h3>
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>
              {localizePolicyText(policy.description) ||
                arabicSource("policies.no_description")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <span
              className={`px-2 py-0.5 rounded-md border ${policyStatusColors[policy.status]}`}
              style={{ fontSize: 11 }}
            >
              {policy.status}
            </span>
            <span
              className="text-muted-foreground"
              style={{ fontSize: 10 }}
            >
              v{policy.version}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 border-t border-border/20 space-y-4">
              <div className="p-4 rounded-lg bg-muted/20">
                <p
                  className="text-foreground whitespace-pre-line"
                  style={{ fontSize: 13, lineHeight: 1.8 }}
                >
                  {localizedContent.substring(0, 200) ||
                    arabicSource("policies.no_content")}
                  {localizedContent.length > 200 && "..."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">
                    {arabicSource("common.category")}
                  </p>
                  <p className="text-foreground font-medium">
                    {localizePolicyText(policy.category)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {arabicSource("policies.latest_update")}
                  </p>
                  <p className="text-foreground font-medium" dir="ltr">
                    {policy.last_updated}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {arabicSource("common.version")}
                  </p>
                  <p className="text-foreground font-medium">
                    v{policy.version}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <button
                  onClick={handleViewClick}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  {arabicSource("policies.full_view")}
                </button>
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  <Edit2 className="w-4 h-4" />
                  {arabicSource("common.edit")}
                </button>
                <button
                  onClick={handleToggleStatusClick}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded text-xs hover:bg-amber-500/30 transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  <RotateCcw className="w-4 h-4" />
                  {arabicSource("policies.change_status")}
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4" />
                  {arabicSource("common.delete")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PolicyListItem;
