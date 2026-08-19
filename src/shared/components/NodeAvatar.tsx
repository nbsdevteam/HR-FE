import type { CSSProperties, ReactNode } from "react";

type NodeAvatarProps = {
  photo?: string | null;
  name: string;
  color?: string;
  initials: ReactNode;
  sizeClassName: string;
  fontSize: number;
  extraClassName?: string;
  imgStyle?: CSSProperties;
  fallbackClassName?: string;
  fallbackStyle?: CSSProperties;
  textClassName?: string;
};

const NodeAvatar = ({
  photo,
  name,
  color,
  initials,
  sizeClassName,
  fontSize,
  extraClassName = "",
  imgStyle,
  fallbackClassName = "",
  fallbackStyle,
  textClassName = "text-white",
}: NodeAvatarProps) =>
  photo ? (
    <img src={photo} alt={name} className={`${sizeClassName} rounded-full object-cover ${extraClassName}`} style={imgStyle} />
  ) : (
    <div
      className={`${sizeClassName} rounded-full flex items-center justify-center ${extraClassName} ${fallbackClassName}`}
      style={{ background: color, ...fallbackStyle }}
    >
      <span className={textClassName} style={{ fontSize }}>{initials}</span>
    </div>
  );

export default NodeAvatar;
