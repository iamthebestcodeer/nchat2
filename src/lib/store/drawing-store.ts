import { create } from "zustand";
import {
  deserializeLayers,
  getAllProjects,
  loadStateFromStorage,
  type SerializableState,
  saveStateToStorage,
  serializeLayers,
} from "../storage";

export type Tool =
  | "brush"
  | "eraser"
  | "rectangle"
  | "circle"
  | "line"
  | "fill";

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
};

export type BrushSettings = {
  size: number;
  opacity: number;
  color: string;
};

type DrawingState = {
  // Project state
  projectId: string | null;
  isSaving: boolean;
  lastSavedAt: number | null;
  saveError: string | null;

  // Canvas state
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  isDrawing: boolean;
  lastX: number;
  lastY: number;

  // Tool state
  currentTool: Tool;
  brushSettings: BrushSettings;

  // Shape drawing state
  shapeStart: { x: number; y: number } | null;
  shapeEnd: { x: number; y: number } | null;

  // Layers
  layers: Layer[];
  activeLayerId: string | null;

  // History
  history: ImageData[];
  historyIndex: number;

  // View Transform
  viewTransform: { x: number; y: number; scale: number };

  // Actions
  setProjectId: (projectId: string | null) => void;
  setCanvas: (canvas: HTMLCanvasElement | null) => void;
  setContext: (context: CanvasRenderingContext2D | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setLastPosition: (x: number, y: number) => void;
  setCurrentTool: (tool: Tool) => void;
  setShapeStart: (pos: { x: number; y: number } | null) => void;
  setShapeEnd: (pos: { x: number; y: number } | null) => void;
  clearShapePreview: () => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushColor: (color: string) => void;
  addLayer: () => void;
  deleteLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  moveLayer: (layerId: string, direction: "up" | "down") => void;
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  setViewTransform: (transform: {
    x: number;
    y: number;
    scale: number;
  }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  saveToStorage: () => Promise<boolean>;
  loadFromStorage: (projectId: string) => Promise<void>;
};

const defaultBrushSettings: BrushSettings = {
  size: 10,
  opacity: 1,
  color: "#000000",
};

// Debounce timer for auto-save
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DELAY = 500; // ms

export const useDrawingStore = create<DrawingState>((set, get) => {
  const createNewLayer = (): Layer => {
    const canvas = document.createElement("canvas");
    // Default size, will be resized to match main canvas
    canvas.width = 800;
    canvas.height = 600;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "transparent";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    return {
      id: `layer-${Date.now()}-${Math.random()}`,
      name: `Layer ${get().layers.length + 1}`,
      visible: true,
      canvas,
      context,
    };
  };

  const generateThumbnail = (): string | undefined => {
    const { layers, canvas } = get();
    
    // Determine dimensions from canvas or fallback to first layer
    let width = canvas?.width;
    let height = canvas?.height;

    if (!width || !height) {
      const firstLayer = layers.find((l) => l.canvas);
      if (firstLayer?.canvas) {
        width = firstLayer.canvas.width;
        height = firstLayer.canvas.height;
      }
    }

    if (!width || !height) return undefined;

    try {
      // Create a small canvas for thumbnail
      const thumbCanvas = document.createElement("canvas");
      const aspect = width / height;
      const thumbWidth = 300;
      const thumbHeight = 300 / aspect;

      thumbCanvas.width = thumbWidth;
      thumbCanvas.height = thumbHeight;

      const ctx = thumbCanvas.getContext("2d");
      if (!ctx) return undefined;

      // Fill white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, thumbWidth, thumbHeight);

      // Draw all visible layers directly to ensure we capture the latest state
      // independent of the main canvas state
      for (const layer of layers) {
        if (layer.visible && layer.canvas) {
          ctx.drawImage(
            layer.canvas,
            0,
            0,
            width,
            height,
            0,
            0,
            thumbWidth,
            thumbHeight
          );
        }
      }

      return thumbCanvas.toDataURL("image/jpeg", 0.7);
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return undefined;
    }
  };

  const persistState = async (): Promise<boolean> => {
    const state = get();
    if (!state.projectId) {
      set({ isSaving: false });
      return false;
    }

    const serializedState: SerializableState = {
      brushSettings: state.brushSettings,
      currentTool: state.currentTool,
      viewTransform: state.viewTransform,
      layers: serializeLayers(state.layers),
      activeLayerId: state.activeLayerId,
    };

    const thumbnail = generateThumbnail();
    const didSave = await saveStateToStorage(
      serializedState,
      state.projectId,
      thumbnail
    );

    set({
      isSaving: false,
      lastSavedAt: didSave ? Date.now() : state.lastSavedAt,
      saveError: didSave ? null : "Unable to save project. Please try again.",
    });

    saveTimer = null;

    return didSave;
  };

  const debouncedSave = () => {
    if (!get().projectId) {
      return;
    }
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    set({ isSaving: true, saveError: null });
    saveTimer = setTimeout(() => {
      persistState();
    }, SAVE_DELAY);
  };

  return {
    // Initial state
    projectId: null,
    isSaving: false,
    lastSavedAt: null,
    saveError: null,
    canvas: null,
    context: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    currentTool: "brush",
    brushSettings: defaultBrushSettings,
    shapeStart: null,
    shapeEnd: null,
    layers: [],
    activeLayerId: null,
    history: [],
    historyIndex: -1,
    viewTransform: { x: 0, y: 0, scale: 1 },

    // Actions
    setProjectId: (projectId) => set({ projectId }),

    setCanvas: (canvas) => {
      if (canvas) {
        const context = canvas.getContext("2d");
        set({ canvas, context });
      } else {
        set({ canvas: null, context: null });
      }
    },

    setContext: (context) => set({ context }),

    setIsDrawing: (isDrawing) => set({ isDrawing }),

    setLastPosition: (x, y) => set({ lastX: x, lastY: y }),

    setCurrentTool: (tool) => {
      set({ currentTool: tool });
      debouncedSave();
    },

    setShapeStart: (pos) => set({ shapeStart: pos }),

    setShapeEnd: (pos) => set({ shapeEnd: pos }),

    clearShapePreview: () => set({ shapeStart: null, shapeEnd: null }),

    setBrushSize: (size) => {
      set((state) => ({
        brushSettings: { ...state.brushSettings, size },
      }));
      debouncedSave();
    },

    setBrushOpacity: (opacity) => {
      set((state) => ({
        brushSettings: { ...state.brushSettings, opacity },
      }));
      debouncedSave();
    },

    setBrushColor: (color) => {
      set((state) => ({
        brushSettings: { ...state.brushSettings, color },
      }));
      debouncedSave();
    },

    addLayer: () => {
      const newLayer = createNewLayer();
      // Resize layer canvas to match main canvas if it exists
      const { canvas } = get();
      if (canvas && newLayer.canvas) {
        newLayer.canvas.width = canvas.width;
        newLayer.canvas.height = canvas.height;
      }
      set((state) => ({
        layers: [...state.layers, newLayer],
        activeLayerId: newLayer.id,
      }));
      debouncedSave();
    },

    deleteLayer: (layerId) => {
      set((state) => {
        const newLayers = state.layers.filter((layer) => layer.id !== layerId);
        let newActiveLayerId = state.activeLayerId;
        if (state.activeLayerId === layerId) {
          newActiveLayerId =
            newLayers.length > 0 ? (newLayers.at(-1)?.id ?? null) : null;
        }
        return {
          layers: newLayers,
          activeLayerId: newActiveLayerId,
        };
      });
      debouncedSave();
    },

    setActiveLayer: (layerId) => {
      set({ activeLayerId: layerId });
      debouncedSave();
    },

    toggleLayerVisibility: (layerId) => {
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        ),
      }));
      debouncedSave();
    },

    moveLayer: (layerId, direction) => {
      set((state) => {
        const layers = [...state.layers];
        const index = layers.findIndex((layer) => layer.id === layerId);
        if (index === -1) {
          return state;
        }

        if (direction === "up" && index < layers.length - 1) {
          [layers[index], layers[index + 1]] = [
            layers[index + 1],
            layers[index],
          ];
        } else if (direction === "down" && index > 0) {
          [layers[index], layers[index - 1]] = [
            layers[index - 1],
            layers[index],
          ];
        }

        return { layers };
      });
      debouncedSave();
    },

    saveToHistory: () => {
      const { canvas, context } = get();
      if (!(canvas && context)) {
        return;
      }

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(imageData);
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
    },

    undo: () => {
      const { canvas, context, history, historyIndex } = get();
      if (!(canvas && context) || historyIndex <= 0) {
        return;
      }

      const newIndex = historyIndex - 1;
      const imageData = history[newIndex];
      context.putImageData(imageData, 0, 0);
      set({ historyIndex: newIndex });
    },

    redo: () => {
      const { canvas, context, history, historyIndex } = get();
      if (!(canvas && context) || historyIndex >= history.length - 1) {
        return;
      }

      const newIndex = historyIndex + 1;
      const imageData = history[newIndex];
      context.putImageData(imageData, 0, 0);
      set({ historyIndex: newIndex });
    },

    clearCanvas: () => {
      const { context, canvas } = get();
      if (context && canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        get().saveToHistory();
      }
    },

    setViewTransform: (viewTransform) => {
      set({ viewTransform });
      debouncedSave();
    },

    zoomIn: () => {
      set((state) => ({
        viewTransform: {
          ...state.viewTransform,
          scale: Math.min(state.viewTransform.scale * 1.1, 5),
        },
      }));
      debouncedSave();
    },

    zoomOut: () => {
      set((state) => ({
        viewTransform: {
          ...state.viewTransform,
          scale: Math.max(state.viewTransform.scale * 0.9, 0.1),
        },
      }));
      debouncedSave();
    },

    resetView: () => {
      set({ viewTransform: { x: 0, y: 0, scale: 1 } });
      debouncedSave();
    },

    saveToStorage: async () => {
      if (!get().projectId) {
        return false;
      }
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      set({ isSaving: true, saveError: null });
      return await persistState();
    },

    loadFromStorage: async (projectId: string) => {
      const projects = await getAllProjects();
      const projectMeta = projects.find(
        (project) => project.id === projectId
      );
      set({ projectId, saveError: null, isSaving: false });
      const savedState = await loadStateFromStorage(projectId);
      if (!savedState) {
        // If no saved state, reset to defaults but keep projectId
        // Check if projectId still matches before setting state
        if (get().projectId !== projectId) {
          return;
        }
        set({
          brushSettings: defaultBrushSettings,
          currentTool: "brush",
          viewTransform: { x: 0, y: 0, scale: 1 },
          layers: [],
          activeLayerId: null,
          lastSavedAt: null,
        });
        return;
      }

      // Restore brush settings, tool, and view transform
      // Check if projectId still matches before setting state
      if (get().projectId !== projectId) {
        return;
      }
      set({
        brushSettings: savedState.brushSettings,
        currentTool: savedState.currentTool,
        viewTransform: savedState.viewTransform,
        activeLayerId: savedState.activeLayerId,
        lastSavedAt: projectMeta?.lastModified ?? null,
      });

      // Restore layers (async operation)
      // deserializeLayers already creates canvases with images drawn
      const restoredLayers = await deserializeLayers(savedState.layers);
      // Critical check: ensure projectId still matches before setting layers
      // This prevents loading wrong project's layers if user navigated away
      if (get().projectId !== projectId) {
        return;
      }
      set({ layers: restoredLayers });
    },
  };
});
