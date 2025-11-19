import { create } from "zustand";
import {
  deserializeLayers,
  loadStateFromStorage,
  type SerializableState,
  saveStateToStorage,
  serializeLayers,
} from "../storage";

export type Tool = "brush" | "eraser";

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
  // Canvas state
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  isDrawing: boolean;
  lastX: number;
  lastY: number;

  // Tool state
  currentTool: Tool;
  brushSettings: BrushSettings;

  // Layers
  layers: Layer[];
  activeLayerId: string | null;

  // History
  history: ImageData[];
  historyIndex: number;

  // View Transform
  viewTransform: { x: number; y: number; scale: number };

  // Actions
  setCanvas: (canvas: HTMLCanvasElement | null) => void;
  setContext: (context: CanvasRenderingContext2D | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setLastPosition: (x: number, y: number) => void;
  setCurrentTool: (tool: Tool) => void;
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
  saveToStorage: () => void;
  loadFromStorage: () => Promise<void>;
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

  const debouncedSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => {
      const state = get();
      const serializedState: SerializableState = {
        brushSettings: state.brushSettings,
        currentTool: state.currentTool,
        viewTransform: state.viewTransform,
        layers: serializeLayers(state.layers),
        activeLayerId: state.activeLayerId,
      };
      saveStateToStorage(serializedState);
    }, SAVE_DELAY);
  };

  return {
    // Initial state
    canvas: null,
    context: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    currentTool: "brush",
    brushSettings: defaultBrushSettings,
    layers: [],
    activeLayerId: null,
    history: [],
    historyIndex: -1,
    viewTransform: { x: 0, y: 0, scale: 1 },

    // Actions
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
    },

    zoomOut: () => {
      set((state) => ({
        viewTransform: {
          ...state.viewTransform,
          scale: Math.max(state.viewTransform.scale * 0.9, 0.1),
        },
      }));
    },

    resetView: () => {
      set({ viewTransform: { x: 0, y: 0, scale: 1 } });
      debouncedSave();
    },

    saveToStorage: () => {
      const state = get();
      const serializedState: SerializableState = {
        brushSettings: state.brushSettings,
        currentTool: state.currentTool,
        viewTransform: state.viewTransform,
        layers: serializeLayers(state.layers),
        activeLayerId: state.activeLayerId,
      };
      saveStateToStorage(serializedState);
    },

    loadFromStorage: async () => {
      const savedState = loadStateFromStorage();
      if (!savedState) {
        return;
      }

      // Restore brush settings, tool, and view transform
      set({
        brushSettings: savedState.brushSettings,
        currentTool: savedState.currentTool,
        viewTransform: savedState.viewTransform,
        activeLayerId: savedState.activeLayerId,
      });

      // Restore layers (async operation)
      // deserializeLayers already creates canvases with images drawn
      const restoredLayers = await deserializeLayers(savedState.layers);
      set({ layers: restoredLayers });
    },
  };
});
