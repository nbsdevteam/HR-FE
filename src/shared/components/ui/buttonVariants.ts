import { cva } from "class-variance-authority";

// Shadcn-style button classes, kept as a standalone `cva` (no `<Button>`
// component) because the date picker only ever needs the class strings —
// `PickerCalendar` applies `buttonVariants({ variant: 'ghost' })` to its own
// nav/day `<button>`s instead of rendering a wrapping component.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2",
        lg: "h-12 px-8 py-4",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
