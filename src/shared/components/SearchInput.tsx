import { useCallback, type CSSProperties, type ChangeEvent, type ReactNode, type Ref } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Full replacement for the outer wrapper's className (not merged). Defaults to "relative". */
  wrapperClassName?: string;
  /** Full replacement for the icon's className (not merged). */
  iconClassName?: string;
  /** Full replacement for the input's className (not merged). */
  inputClassName: string;
  style?: CSSProperties;
  inputRef?: Ref<HTMLInputElement>;
  onFocus?: () => void;
  /** When set, renders an end-aligned clear button while `value` is non-empty. */
  onClear?: () => void;
  /** Extra content (e.g. a results dropdown) rendered after the input, inside the wrapper. */
  children?: ReactNode;
}

const DEFAULT_WRAPPER_CLASS = "relative";
const DEFAULT_ICON_CLASS =
  "absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground";

/**
 * Shared search-input-with-icon field, factored out of the near-identical
 * versions independently built across attendance and department components.
 */
const SearchInput = ({
  value,
  onChange,
  placeholder,
  wrapperClassName,
  iconClassName,
  inputClassName,
  style,
  inputRef,
  onFocus,
  onClear,
  children,
}: SearchInputProps) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className={wrapperClassName ?? DEFAULT_WRAPPER_CLASS}>
      <Search className={iconClassName ?? DEFAULT_ICON_CLASS} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        placeholder={placeholder}
        className={inputClassName}
        style={style}
      />
      {onClear && value && (
        <button
          onClick={onClear}
          className="absolute end-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {children}
    </div>
  );
};

export default SearchInput;
