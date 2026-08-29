import { useState, useRef, useCallback } from "react";

export const useHierarchyPanZoom = () => {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [panEnabled, setPanEnabled] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panEnabled || !containerRef.current) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, scrollLeft: containerRef.current.scrollLeft, scrollTop: containerRef.current.scrollTop };
  }, [panEnabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - (e.clientX - dragStartRef.current.x);
    containerRef.current.scrollTop = dragStartRef.current.scrollTop - (e.clientY - dragStartRef.current.y);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => { setIsDragging(false); }, []);

  const handleTogglePan = useCallback(() => setPanEnabled(current => !current), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1))), []);
  const handleZoomIn = useCallback(() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1))), []);
  const handleResetZoom = useCallback(() => setZoom(1), []);

  return {
    containerRef,
    zoom,
    isDragging,
    panEnabled,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTogglePan,
    handleZoomOut,
    handleZoomIn,
    handleResetZoom,
  };
};
