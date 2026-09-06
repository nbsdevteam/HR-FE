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
    // `alt` is a person/record name from the backend, and `alt` is one of the
    // attributes the DOM localizer rewrites — opt it out.
    <img src={photo} alt={name} data-i18n-ignore className={`${sizeClassName} rounded-full object-cover flex-shrink-0 aspect-square ${extraClassName}`} style={imgStyle} />
  ) : (
    <div
      className={`${sizeClassName} rounded-full flex items-center justify-center flex-shrink-0 aspect-square ${extraClassName} ${fallbackClassName}`}
      style={{ background: color, ...fallbackStyle }}
    >
      <span className={textClassName} style={{ fontSize }}>{initials}</span>
    </div>
  );

export default NodeAvatar;
