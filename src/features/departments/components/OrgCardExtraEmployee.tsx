import { memo } from "react";
import { NodeAvatar } from "@/shared/components";

type OrgCardExtraEmployeeProps = {
  name: string;
  photo: string | null;
  color: string;
};

/** Secondary holder of a position whose headcount is greater than one. */
const OrgCardExtraEmployee = ({
  name,
  photo,
  color,
}: OrgCardExtraEmployeeProps) => (
  <div className="flex items-center gap-1.5">
    <NodeAvatar
      photo={photo}
      name={name}
      color={color}
      initials={name.charAt(0)}
      sizeClassName="w-5 h-5"
      extraClassName="shrink-0"
      fontSize={8}
    />
    <span className="text-muted-foreground truncate" style={{ fontSize: 10 }} data-i18n-ignore>
      {name}
    </span>
  </div>
);

export default memo(OrgCardExtraEmployee);
