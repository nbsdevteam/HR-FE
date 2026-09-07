import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "./cn";

export const Popover = (props: React.ComponentProps<typeof PopoverPrimitive.Root>) => (
  <PopoverPrimitive.Root data-slot="popover" {...props} />
);

export const PopoverTrigger = (props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) => (
  <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
);

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Where the portal renders. Undefined (the default) is Radix's own default, `document.body`. */
  container?: React.ComponentProps<typeof PopoverPrimitive.Portal>["container"];
};

export const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 4,
  container,
  ...props
}: PopoverContentProps) => (
  <PopoverPrimitive.Portal container={container}>
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[2147483650] w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

export const PopoverAnchor = (props: React.ComponentProps<typeof PopoverPrimitive.Anchor>) => (
  <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
);
