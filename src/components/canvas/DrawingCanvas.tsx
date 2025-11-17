"use client";

import { useEffect, useRef } from "react";
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
  } = useDrawingStore();

  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const canvasElement = canvasRef.current;
        const oldWidth = canvasElement.width;
        const oldHeight = canvasElement.height;
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
              layer.context.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
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
          const newLayer = updatedLayers[updatedLayers.length - 1];
          if (newLayer && newLayer.canvas && canvasElement) {
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
    if (!canvas || !context || layers.length === 0) return;

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
    if (!activeLayerId) return null;
    return layers.find((layer) => layer.id === activeLayerId);
  };

  const draw = (x: number, y: number) => {
    const activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.context) return;

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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x: number;
    let y: number;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    setIsDrawing(true);
    setLastPosition(x, y);
    saveToHistory();
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvas) return;

    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    let x: number;
    let y: number;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    draw(x, y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-muted/30"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={handleDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={handleDrawing}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}

