type PublicLeaveStepIndicatorItemProps = {
  label: string;
  index: number;
  active: boolean;
  done: boolean;
};

const PublicLeaveStepIndicatorItem = ({ label, index, active, done }: PublicLeaveStepIndicatorItemProps) => {
  const circleClass = active
    ? "bg-primary text-primary-foreground border-primary"
    : done
      ? "bg-primary/15 text-primary border-primary/40"
      : "bg-muted/10 text-muted-foreground border-border";

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div
        className={`w-6 h-6 rounded-full border flex items-center justify-center ${circleClass}`}
        style={{ fontSize: 11 }}
      >
        {index}
      </div>
      <span
        className={active ? "text-foreground" : "text-muted-foreground"}
        style={{ fontSize: 10 }}
      >
        {label}
      </span>
    </div>
  );
};

export default PublicLeaveStepIndicatorItem;
