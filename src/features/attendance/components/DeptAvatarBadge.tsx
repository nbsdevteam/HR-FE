type DeptAvatarBadgeProps = {
  initial: string;
  deptColor?: string | null;
  fontSize: number;
};

const DeptAvatarBadge = ({ initial, deptColor, fontSize }: DeptAvatarBadgeProps) => (
  <div
    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${!deptColor ? "bg-primary/15 border-primary/25" : ""}`}
    style={deptColor ? { backgroundColor: `${deptColor}20`, borderColor: `${deptColor}40` } : undefined}
  >
    <span style={{ fontSize, color: deptColor || undefined }} className={!deptColor ? "text-primary" : ""}>
      {initial}
    </span>
  </div>
);

export default DeptAvatarBadge;
