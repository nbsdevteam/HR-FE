import type { ComponentType, ReactNode } from "react";

type DeleteOptionButtonProps = {
  icon: ComponentType<{ className?: string }>;
  title: ReactNode;
  description: ReactNode;
  onClick: () => void;
  /** Full replacement for the card's border/hover tone classes. */
  toneClassName: string;
  iconClassName: string;
  titleClassName: string;
};

/**
 * One of the "what should happen to the subordinates?" choices in the delete
 * dialog — a full-width card button, not a plain action, so the shared `Button`
 * primitive can't represent it.
 */
const DeleteOptionButton = ({
  icon: Icon,
  title,
  description,
  onClick,
  toneClassName,
  iconClassName,
  titleClassName,
}: DeleteOptionButtonProps) => (
  <button
    onClick={onClick}
    className={`w-full text-start p-3 rounded-xl border transition-all ${toneClassName}`}
  >
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${iconClassName}`} />
      <span className={titleClassName} style={{ fontSize: 13 }}>
        {title}
      </span>
    </div>
    <p className="text-muted-foreground" style={{ fontSize: 11 }}>
      {description}
    </p>
  </button>
);

export default DeleteOptionButton;
