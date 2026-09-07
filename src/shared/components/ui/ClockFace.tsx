import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "./cn";
import ClockFaceSvg, { CC } from "./ClockFaceSvg";

type ClockFaceProps = {
  hours: number; // 0–23
  minutes: number; // 0–59
  onChange: (h: number, m: number) => void;
};

const ClockFace = ({ hours, minutes, onChange }: ClockFaceProps) => {
  const [mode, setMode] = useState<"h" | "m">("h");
  const [lh, setLh] = useState(hours);
  const [lm, setLm] = useState(minutes);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  // Refs for stable access inside event listeners
  const modeRef = useRef<"h" | "m">("h");
  const lhRef = useRef(lh);
  const lmRef = useRef(lm);

  const getAngle = useCallback((cx: number, cy: number): number => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const x = ((cx - rect.left) / rect.width) * 180 - CC;
    const y = ((cy - rect.top) / rect.height) * 180 - CC;
    return ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
  }, []);

  const applyAngle = useCallback(
    (angle: number): void => {
      if (modeRef.current === "h") {
        const h12 = Math.round(angle / 30) % 12; // 0 = 12 o'clock, 1–11 = 1–11
        const isPm = lhRef.current >= 12;
        const newH = isPm ? (h12 === 0 ? 12 : h12 + 12) % 24 : h12;
        setLh(newH);
        lhRef.current = newH;
      } else {
        const newM = Math.round(angle / 6) % 60;
        setLm(newM);
        lmRef.current = newM;
        onChange(lhRef.current, newM);
      }
    },
    [onChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): void => {
      dragging.current = true;
      applyAngle(getAngle(e.clientX, e.clientY));
    },
    [applyAngle, getAngle],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): void => {
      if (!dragging.current) return;
      applyAngle(getAngle(e.clientX, e.clientY));
    },
    [applyAngle, getAngle],
  );

  const handleMouseUp = useCallback((): void => {
    if (!dragging.current) return;
    dragging.current = false;
    if (modeRef.current === "h") {
      setMode("m");
      onChange(lhRef.current, lmRef.current);
    }
  }, [onChange]);

  const handleManualInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const [rawH, rawM] = e.target.value.split(":");
      const h = Number(rawH);
      const m = Number(rawM);
      // Deliberately NOT parseHhMm: this is validation, so unparseable input is
      // ignored rather than silently replaced with a default the user did not type.
      if (rawH !== undefined && rawM !== undefined && !Number.isNaN(h) && !Number.isNaN(m)) {
        setLh(h);
        setLm(m);
        lhRef.current = h;
        lmRef.current = m;
        onChange(h, m);
      }
    },
    [onChange],
  );

  const handleHMode = useCallback((): void => setMode("h"), []);
  const handleMMode = useCallback((): void => setMode("m"), []);

  const handleAmClick = useCallback((): void => {
    if (lhRef.current < 12) return;
    const newH = lhRef.current % 12;
    setLh(newH);
    lhRef.current = newH;
    onChange(newH, lmRef.current);
  }, [onChange]);

  const handlePmClick = useCallback((): void => {
    if (lhRef.current >= 12) return;
    const newH = (lhRef.current % 12) + 12;
    setLh(newH);
    lhRef.current = newH;
    onChange(newH, lmRef.current);
  }, [onChange]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    lhRef.current = lh;
    lmRef.current = lm;
  }, [lh, lm]);

  // Sync when parent changes value (e.g. manual input)
  useEffect(() => {
    setLh(hours);
    setLm(minutes);
  }, [hours, minutes]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const isAm = lh < 12;
  const d12 = lh % 12 === 0 ? 12 : lh % 12;
  const hourDeg = (((lh % 12) + lm / 60) / 12) * 360;
  const minDeg = (lm / 60) * 360;

  return (
    <div className="flex flex-col items-center gap-2 pt-2 pb-3 px-2">
      {/* ── Digital header ── */}
      <div className="flex items-center">
        {/* Hour button */}
        <button
          type="button"
          onClick={handleHMode}
          className={cn(
            "w-12 h-10 rounded-xl text-lg font-mono font-bold transition-all select-none",
            mode === "h"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "bg-muted/20 text-foreground/60 hover:bg-muted/40",
          )}
        >
          {String(d12).padStart(2, "0")}
        </button>

        <span className="text-xl font-mono text-muted-foreground mx-0.5 select-none">:</span>

        {/* Minute button */}
        <button
          type="button"
          onClick={handleMMode}
          className={cn(
            "w-12 h-10 rounded-xl text-lg font-mono font-bold transition-all select-none",
            mode === "m"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "bg-muted/20 text-foreground/60 hover:bg-muted/40",
          )}
        >
          {String(lm).padStart(2, "0")}
        </button>

        {/* AM / PM */}
        <div className="flex flex-col ms-2 gap-0.5">
          <button
            type="button"
            onClick={handleAmClick}
            className={cn(
              "w-9 py-0.5 rounded-md text-[10px] font-bold uppercase leading-tight transition-all",
              isAm
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/20 text-muted-foreground hover:bg-muted/40",
            )}
          >
            AM
          </button>
          <button
            type="button"
            onClick={handlePmClick}
            className={cn(
              "w-9 py-0.5 rounded-md text-[10px] font-bold uppercase leading-tight transition-all",
              !isAm
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/20 text-muted-foreground hover:bg-muted/40",
            )}
          >
            PM
          </button>
        </div>
      </div>

      {/* Mode hint */}
      <p className="text-[10px] text-muted-foreground -mt-1">
        {mode === "h" ? "Select hour — drag or click" : "Select minute — drag or click"}
      </p>

      {/* ── Clock SVG ── */}
      <ClockFaceSvg
        ref={svgRef}
        mode={mode}
        hour12={d12}
        lm={lm}
        hourDeg={hourDeg}
        minDeg={minDeg}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/*
        Manual text input — a plain native <input>, not the app's shared
        InputField component: `type="time"` doesn't take InputField's
        value/onChange(value) contract, and would drag in a dependency this
        standalone clock face doesn't need.
      */}
      <input
        type="time"
        value={`${String(lh).padStart(2, "0")}:${String(lm).padStart(2, "0")}`}
        onChange={handleManualInput}
        className={cn(
          "h-7 w-28 rounded-lg border border-border/50 bg-transparent px-2 py-1",
          "text-xs text-center font-mono [direction:ltr] outline-none",
          "transition-[color,box-shadow]",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
    </div>
  );
};

export default ClockFace;
