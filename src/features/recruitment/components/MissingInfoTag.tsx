import { memo } from "react";

type MissingInfoTagProps = {
  info: string;
  label: string | undefined;
};

const MissingInfoTag = ({ info, label }: MissingInfoTagProps) => (
  <span
    className="px-2 py-0.5 rounded-md bg-muted/20 border border-border/30 text-muted-foreground"
    style={{ fontSize: 11 }}
    dir={label ? undefined : "ltr"}
    {...(label ? {} : { "data-i18n-ignore": true })}
  >
    {label || info}
  </span>
);

export default memo(MissingInfoTag);
