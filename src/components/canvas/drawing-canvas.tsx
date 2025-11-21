"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDrawingStore } from "@/lib/store/drawing-store";

export function DrawingCanvas({ projectId }: { projectId: string }) {
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
    setCurrentTool,
    brushSettings,
    layers,
    activeLayerId,
    saveToHistory,
    viewTransform,
    setViewTransform,
    loadFromStorage,
    saveToStorage,
    shapeStart,
    shapeEnd,
    setShapeStart,
    setShapeEnd,
    clearShapePreview,
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

  // Handle keyboard shortcuts
  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Keyboard shortcut handling requires multiple conditionals
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or modals
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveToStorage().then((didSave) => {
          if (didSave) {
            toast.success("Project saved");
          } else {
            toast.error("Unable to save project");
          }
        });
        return;
      }

      // Tool shortcuts (only when not holding modifier keys)
      if (!(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            setCurrentTool("brush");
            break;
          case "e":
            e.preventDefault();
            setCurrentTool("eraser");
            break;
          case "r":
            e.preventDefault();
            setCurrentTool("rectangle");
            break;
          case "c":
            e.preventDefault();
            setCurrentTool("circle");
            break;
          case "l":
            e.preventDefault();
            setCurrentTool("line");
            break;
          case "f":
            e.preventDefault();
            setCurrentTool("fill");
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveToStorage, setCurrentTool]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: canvas and context are refs accessed inside closures, adding them would cause infinite loops
  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Canvas resize logic requires complex layer management
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const canvasElement = canvasRef.current;
        canvasElement.width = rect.width;
        canvasElement.height = rect.height;

        // Resize all layer canvases while preserving their content
        const { layers: currentLayers } = useDrawingStore.getState();
        for (const layer of currentLayers) {
          if (layer.canvas && layer.context) {
            // Save the current image data before resizing
            const imageData = layer.canvas.toDataURL();
            const oldWidth = layer.canvas.width;
            const oldHeight = layer.canvas.height;

            // Resize the canvas (this clears it)
            layer.canvas.width = rect.width;
            layer.canvas.height = rect.height;

            // Redraw the image content if it exists
            if (imageData && oldWidth > 0 && oldHeight > 0) {
              const img = new Image();
              // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Image loading and canvas redraw requires complex state management
              img.onload = () => {
                if (layer.context && layer.canvas) {
                  layer.context.clearRect(
                    0,
                    0,
                    layer.canvas.width,
                    layer.canvas.height
                  );
                  // Draw the image scaled to fit the new canvas size
                  layer.context.drawImage(
                    img,
                    0,
                    0,
                    layer.canvas.width,
                    layer.canvas.height
                  );
                  // Trigger re-render of main canvas
                  if (canvas && context) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    const { layers: updatedLayers } =
                      useDrawingStore.getState();
                    for (const l of updatedLayers) {
                      if (l.visible && l.canvas) {
                        context.drawImage(l.canvas, 0, 0);
                      }
                    }
                  }
                }
              };
              img.src = imageData;
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

        // Load persisted state from storage
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Loading and initializing canvas state requires complex layer management
        loadFromStorage(projectId).then(() => {
          // After loading, resize layer canvases to match main canvas
          // and preserve their image content
          const { layers: currentLayers } = useDrawingStore.getState();
          for (const layer of currentLayers) {
            if (layer.canvas && layer.context && canvasElement) {
              // Save the current image data before resizing
              const imageData = layer.canvas.toDataURL();
              const oldWidth = layer.canvas.width;
              const oldHeight = layer.canvas.height;

              // Resize the canvas
              layer.canvas.width = canvasElement.width;
              layer.canvas.height = canvasElement.height;

              // Redraw the image content if it exists
              if (imageData && oldWidth > 0 && oldHeight > 0) {
                const img = new Image();
                img.onload = () => {
                  if (layer.context && layer.canvas) {
                    layer.context.clearRect(
                      0,
                      0,
                      layer.canvas.width,
                      layer.canvas.height
                    );
                    // Draw the image scaled to fit the new canvas size
                    layer.context.drawImage(
                      img,
                      0,
                      0,
                      layer.canvas.width,
                      layer.canvas.height
                    );
                  }
                };
                img.src = imageData;
              }
            }
          }

          // Initialize with first layer if none exist after loading
          const { layers: updatedLayers } = useDrawingStore.getState();
          if (updatedLayers.length === 0) {
            useDrawingStore.getState().addLayer();
            // Resize layer canvas to match main canvas after adding
            const finalLayers = useDrawingStore.getState().layers;
            const newLayer = finalLayers.at(-1);
            if (newLayer?.canvas && canvasElement) {
              newLayer.canvas.width = canvasElement.width;
              newLayer.canvas.height = canvasElement.height;
            }
          }
        });
      }
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      setCanvas(null);
      setContext(null);
    };
  }, [setCanvas, setContext, loadFromStorage, projectId]);

  // Render layers to main canvas
  // biome-ignore lint/correctness/useExhaustiveDependencies: drawShapePreview is a stable function defined in component
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

    // Draw shape preview if drawing a shape
    if (
      isDrawing &&
      shapeStart &&
      shapeEnd &&
      (currentTool === "rectangle" ||
        currentTool === "circle" ||
        currentTool === "line")
    ) {
      // Save context state
      context.save();
      drawShapePreview(context, shapeStart, shapeEnd, currentTool);
      context.restore();
    }
  }, [canvas, context, layers, isDrawing, shapeStart, shapeEnd, currentTool]);

  const getActiveLayer = () => {
    if (!activeLayerId) {
      return null;
    }
    return layers.find((layer) => layer.id === activeLayerId);
  };

  // Flood fill algorithm
  const floodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColor: string
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Flood fill algorithm requires complex pixel manipulation logic
  ) => {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const data = imageData.data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Get the color at the start position
    const startIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];
    const startA = data[startIdx + 3];

    // Parse fill color
    const fillR = Number.parseInt(fillColor.slice(1, 3), 16);
    const fillG = Number.parseInt(fillColor.slice(3, 5), 16);
    const fillB = Number.parseInt(fillColor.slice(5, 7), 16);

    // If the fill color matches the start color, no need to fill
    if (
      startR === fillR &&
      startG === fillG &&
      startB === fillB &&
      startA === 255
    ) {
      return;
    }

    // Use a stack-based flood fill
    const stack: [number, number][] = [
      [Math.floor(startX), Math.floor(startY)],
    ];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const item = stack.pop();
      if (!item) {
        continue;
      }
      const [x, y] = item;
      const key = `${x},${y}`;

      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
        continue;
      }

      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Check if pixel matches start color (with tolerance for anti-aliasing)
      if (
        Math.abs(r - startR) < 10 &&
        Math.abs(g - startG) < 10 &&
        Math.abs(b - startB) < 10 &&
        Math.abs(a - startA) < 10
      ) {
        visited.add(key);

        // Set the pixel color
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = 255;

        // Add neighbors to stack
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Draw shape preview on a temporary canvas
  const drawShapePreview = (
    ctx: CanvasRenderingContext2D,
    start: { x: number; y: number },
    end: { x: number; y: number },
    tool: string
  ) => {
    const { size, opacity, color } = brushSettings;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = size;

    if (tool === "rectangle") {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      ctx.strokeRect(x, y, width, height);
    } else if (tool === "circle") {
      const radius = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  };

  // Draw shape on the active layer
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    start: { x: number; y: number },
    end: { x: number; y: number },
    tool: string
  ) => {
    const { size, opacity, color } = brushSettings;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = size;

    if (tool === "rectangle") {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      ctx.strokeRect(x, y, width, height);
    } else if (tool === "circle") {
      const radius = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Drawing logic requires multiple tool-specific branches
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
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Drawing start logic requires handling multiple tools and states
  ) => {
    if (!canvas) {
      return;
    }

    const { x, y } = getPointerPos(e);
    const activeLayer = getActiveLayer();

    if (currentTool === "fill") {
      // Handle fill tool immediately
      if (activeLayer?.context) {
        // NOTE: saveToHistory() removed - history only captures main canvas, not per-layer state.
        // Undo would revert main canvas but leave layer canvases unchanged, causing ghosting.
        // TODO: Implement per-layer history (capture/restore each layer.canvas ImageData)
        floodFill(activeLayer.context, x, y, brushSettings.color);
        // Update main canvas
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          for (const layer of layers) {
            if (layer.visible && layer.canvas) {
              context.drawImage(layer.canvas, 0, 0);
            }
          }
        }
        saveToStorage();
      }
      return;
    }

    if (
      currentTool === "rectangle" ||
      currentTool === "circle" ||
      currentTool === "line"
    ) {
      // Shape tools: store start position
      setIsDrawing(true);
      setShapeStart({ x, y });
      setShapeEnd({ x, y });
      // NOTE: saveToHistory() removed - history only captures main canvas, not per-layer state.
      // Undo would revert main canvas but leave layer canvases unchanged, causing ghosting.
      // TODO: Implement per-layer history (capture/restore each layer.canvas ImageData)
      return;
    }

    // Brush and eraser tools
    setIsDrawing(true);
    setLastPosition(x, y);
    // NOTE: saveToHistory() removed - history only captures main canvas, not per-layer state.
    // Undo would revert main canvas but leave layer canvases unchanged, causing ghosting.
    // TODO: Implement per-layer history (capture/restore each layer.canvas ImageData)
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

    if (
      currentTool === "rectangle" ||
      currentTool === "circle" ||
      currentTool === "line"
    ) {
      // Update shape end position for preview
      setShapeEnd({ x, y });
      return;
    }

    // Brush and eraser tools
    draw(x, y);
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Drawing stop logic requires complex shape commit and canvas update
  const stopDrawing = () => {
    if (!isDrawing) {
      return;
    }

    const activeLayer = getActiveLayer();

    if (
      (currentTool === "rectangle" ||
        currentTool === "circle" ||
        currentTool === "line") &&
      activeLayer?.context &&
      shapeStart &&
      shapeEnd
    ) {
      // Commit shape to canvas
      drawShape(activeLayer.context, shapeStart, shapeEnd, currentTool);
      // Update main canvas
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (const layer of layers) {
          if (layer.visible && layer.canvas) {
            context.drawImage(layer.canvas, 0, 0);
          }
        }
      }
      clearShapePreview();
      saveToStorage();
    } else if (currentTool === "brush" || currentTool === "eraser") {
      saveToStorage();
    }

    setIsDrawing(false);
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
        <div className="-z-10 absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
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
