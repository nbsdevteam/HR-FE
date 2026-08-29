import { motion } from "motion/react";
import type { OrgNode } from "../types";
import SearchButton from "./SearchButton";

const SearchResults = ({
  results,
  onSelect,
  onClose,
}: {
  results: OrgNode[];
  onSelect: (node: OrgNode) => void;
  onClose: () => void;
}) => {
  if (results.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="absolute top-full mt-1 start-0 end-0 bg-card border border-border/60 rounded-lg shadow-xl z-50 overflow-hidden max-h-[260px] overflow-y-auto"
    >
      {results.map((node) => (
        <SearchButton
          key={node.dbId}
          node={node}
          onSelect={onSelect}
          onClose={onClose}
        />
      ))}
    </motion.div>
  );
};

export default SearchResults;
