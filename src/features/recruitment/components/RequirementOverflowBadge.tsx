type RequirementOverflowBadgeProps = {
  hiddenCount: number;
};

export const RequirementOverflowBadge = ({ hiddenCount }: RequirementOverflowBadgeProps) => {
  if (hiddenCount <= 0) return null;

  return (
    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary" style={{ fontSize: 11 }}>
      +{hiddenCount}
    </span>
  );
};
