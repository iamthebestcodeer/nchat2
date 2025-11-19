"use client";

import { useEffect, useRef, useState } from "react";
import { useDrawingStore } from "@/lib/store/drawingStore";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    canvas,
    setCanvas,
    context,
    setContext,
    isDrawing,
    setIsDrawing,
    lastX,
    lastY,
    setLastPosition,
    currentTool,
    brushSettings,
    layers,
    activeLayerId,
    saveToHistory,
    viewTransform,
    setViewTransform,
  } = useDrawingStore();

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null
  );

  // Handle wheel events for zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(
          Math.max(viewTransform.scale + delta, 0.1),
          5
        );

        setViewTransform({
          ...viewTransform,
          scale: newScale,
        });
      } else {
        // Pan
        e.preventDefault();
        setViewTransform({
          ...viewTransform,
          x: viewTransform.x - e.deltaX,
          y: viewTransform.y - e.deltaY,
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [viewTransform, setViewTransform]);

  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const canvasElement = canvasRef.current;
        canvasElement.width = rect.width;
        canvasElement.height = rect.height;

        // Resize all layer canvases
        const { layers: currentLayers } = useDrawingStore.getState();
        for (const layer of currentLayers) {
          if (layer.canvas) {
            layer.canvas.width = rect.width;
            layer.canvas.height = rect.height;
            // Re-initialize context after resize
            if (layer.context) {
              layer.context.fillStyle = "transparent";
              layer.context.fillRect(
                0,
                0,
                layer.canvas.width,
                layer.canvas.height
              );
            }
          }
        }
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    if (canvasRef.current) {
      const canvasElement = canvasRef.current;
      const ctx = canvasElement.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        // Set default context properties
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = "source-over";

        setCanvas(canvasElement);
        setContext(ctx);

        // Initialize with first layer if none exist
        const { layers: currentLayers } = useDrawingStore.getState();
        if (currentLayers.length === 0) {
          useDrawingStore.getState().addLayer();
          // Resize layer canvas to match main canvas after adding
          const updatedLayers = useDrawingStore.getState().layers;
          const newLayer = updatedLayers.at(-1);
          if (newLayer?.canvas && canvasElement) {
            newLayer.canvas.width = canvasElement.width;
            newLayer.canvas.height = canvasElement.height;
          }
        }
      }
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      setCanvas(null);
      setContext(null);
    };
  }, [setCanvas, setContext]);

  // Render layers to main canvas
  useEffect(() => {
    if (!(canvas && context) || layers.length === 0) {
      return;
    }

    // Clear main canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all visible layers
    for (const layer of layers) {
      if (layer.visible && layer.canvas && layer.context) {
        context.drawImage(layer.canvas, 0, 0);
      }
    }
  }, [canvas, context, layers]);

  const getActiveLayer = () => {
    if (!activeLayerId) {
      return null;
    }
    return layers.find((layer) => layer.id === activeLayerId);
  };

  const draw = (x: number, y: number) => {
    const activeLayer = getActiveLayer();
    if (!activeLayer?.context) {
      return;
    }

    const ctx = activeLayer.context;
    const { size, opacity, color } = brushSettings;

    ctx.globalAlpha = opacity;
    ctx.lineWidth = size;

    if (currentTool === "brush") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    } else if (currentTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Update main canvas
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (const layer of layers) {
        if (layer.visible && layer.canvas && layer.context) {
          context.drawImage(layer.canvas, 0, 0);
        }
      }
    }

    setLastPosition(x, y);
  };

  const getPointerPos = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent
  ) => {
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Calculate position relative to canvas, accounting for zoom and pan
    // The canvas itself is transformed, so we need to map screen coordinates back to canvas coordinates
    // However, since we are transforming the canvas element via CSS, the getBoundingClientRect()
    // already accounts for the transform. But wait, if we scale the canvas with CSS,
    // the internal coordinate system (width/height) remains the same.
    // So we need to map the click position on the scaled element to the internal resolution.

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!canvas) {
      return;
    }

    // Middle mouse or Space+Drag for panning (handled separately or here?)
    // For now, let's stick to drawing. Panning is via wheel or two-finger touch (native).

    const { x, y } = getPointerPos(e);

    setIsDrawing(true);
    setLastPosition(x, y);
    saveToHistory();
  };

  const handleDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!canvas) {
      return;
    }

    const { x, y } = getPointerPos(e);
    setCursorPos({ x, y });

    if (!isDrawing) {
      return;
    }

    e.preventDefault();
    draw(x, y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const handlePointerLeave = () => {
    setCursorPos(null);
    stopDrawing();
  };

  return (
    <div
      className="relative h-full w-full touch-none overflow-hidden bg-muted/30"
      ref={containerRef}
    >
      <div
        className="absolute inset-0 flex origin-center items-center justify-center will-change-transform"
        style={{
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
        }}
      >
        <canvas
          className="cursor-none bg-white shadow-2xl"
          onMouseDown={startDrawing}
          onMouseLeave={handlePointerLeave}
          onMouseMove={handleDrawing}
          onMouseUp={stopDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={handleDrawing}
          onTouchStart={startDrawing}
          ref={canvasRef}
        />
        {cursorPos && (
          <div
            className="pointer-events-none absolute z-50 rounded-full border border-foreground/50"
            style={{
              left: 0,
              top: 0,
              width: brushSettings.size,
              height: brushSettings.size,
              transform: `translate(${cursorPos.x - brushSettings.size / 2}px, ${cursorPos.y - brushSettings.size / 2}px)`,
              backgroundColor:
                currentTool === "eraser"
                  ? "rgba(255, 255, 255, 0.5)"
                  : brushSettings.color,
              opacity: 0.5,
            }}
          />
        )}
      </div>
    </div>
  );
}
