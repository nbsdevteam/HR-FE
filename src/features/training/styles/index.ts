export const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg";

/** Shared field style for single-line text/number inputs inside training modals, matching `employees/styles`' `inputCls`. */
export const fieldCls = "w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

/** Shared field style for multi-line textareas inside training modals (no fixed height, sized via `rows`). */
export const textareaCls = "w-full px-4 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none resize-none";

/** Training modals' footer layout (save action leading, no horizontal padding). */
export const TRAINING_FOOTER_WRAPPER_CLASS = "flex items-center gap-3 pt-4 border-t border-border/20";

/** Training modals' cancel/close button style. */
export const TRAINING_FOOTER_CANCEL_CLASS = "flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors";
