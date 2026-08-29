import SettingsToggle from "./SettingsToggle";

type TNotificationToggleRowProps = {
  label: string;
  on: boolean;
  onToggle: () => void;
};

const NotificationToggleRow = ({
  label,
  on,
  onToggle,
}: TNotificationToggleRowProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
    <span className="text-foreground" style={{ fontSize: 13 }}>
      {label}
    </span>
    <SettingsToggle on={on} onClick={onToggle} />
  </div>
);

export default NotificationToggleRow;
