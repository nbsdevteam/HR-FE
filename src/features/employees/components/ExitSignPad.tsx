import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type ExitSignPadProps = {
  disabled?: boolean;
  /** The drawn signature as a PNG data URL, or null once it is cleared. */
  onChange: (dataUrl: string | null) => void;
};

const PAD_WIDTH = 600;
const PAD_HEIGHT = 200;

/** A finger or mouse signature. The backend wants a PNG or JPEG of at most 300 KB. */
const ExitSignPad = ({ disabled = false, onChange }: ExitSignPadProps) => {
  const [hasInk, setHasInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  /** Pointer position in canvas pixels, whatever size the canvas is shown at. */
  const pointOf = useCallback((e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointOf(e);
  }, [disabled, pointOf]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>): void => {
    const context = e.currentTarget.getContext("2d");
    const last = lastPointRef.current;
    if (!drawingRef.current || !context || !last) return;
    const next = pointOf(e);
    context.beginPath();
    context.moveTo(last.x, last.y);
    context.lineTo(next.x, next.y);
    context.stroke();
    lastPointRef.current = next;
  }, [pointOf]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    setHasInk(true);
    onChange(e.currentTarget.toDataURL("image/png"));
  }, [onChange]);

  const handleClear = useCallback((): void => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, PAD_WIDTH, PAD_HEIGHT);
    setHasInk(false);
    onChange(null);
  }, [onChange]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
  }, []);

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={PAD_WIDTH}
        height={PAD_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full rounded-lg border border-dashed border-border bg-white touch-none"
        style={{ aspectRatio: `${PAD_WIDTH} / ${PAD_HEIGHT}` }}
        aria-label={arabicSource("public_exit_sign.signature_label")}
        data-exit-sign-pad
      />
      <Button variant="outline" size="sm" icon={Eraser} disabled={disabled || !hasInk} onClick={handleClear}>
        {arabicSource("public_exit_sign.clear_signature")}
      </Button>
    </div>
  );
};

export default ExitSignPad;
