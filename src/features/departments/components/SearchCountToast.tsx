import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type SearchCountToastProps = {
  searchQuery: string;
  matchCount: number;
  onClearSearch: () => void;
};

export const SearchCountToast = ({ searchQuery, matchCount, onClearSearch }: SearchCountToastProps) => (
  <AnimatePresence>
    {searchQuery.trim() && matchCount > 0 && (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
        <div className="bg-card border border-primary/40 rounded-full px-4 py-2 shadow-xl flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground" style={{ fontSize: 12 }}>{matchCount} {arabicSource("hierarchy.result_for")}{searchQuery}"</span>
          </div>
          <button onClick={onClearSearch} className="w-6 h-6 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
