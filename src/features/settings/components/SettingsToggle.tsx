type SettingsToggleProps = {
  on: boolean;
  onClick: () => void;
};

export const SettingsToggle = ({ on, onClick }: SettingsToggleProps) => (
  <div
    onClick={onClick}
    className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${
      on ? "bg-primary" : "bg-switch-background"
    }`}
  >
    <div
      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
        on ? "end-0.5" : "start-0.5"
      }`}
    />
  </div>
);
