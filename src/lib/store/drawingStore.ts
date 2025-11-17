import { create } from "zustand";

export type Tool = "brush" | "eraser";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
}

export interface BrushSettings {
  size: number;
  opacity: number;
  color: string;
}

interface DrawingState {
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
}

const defaultBrushSettings: BrushSettings = {
  size: 10,
  opacity: 1,
  color: "#000000",
};

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

    setCurrentTool: (tool) => set({ currentTool: tool }),

    setBrushSize: (size) =>
      set((state) => ({
        brushSettings: { ...state.brushSettings, size },
      })),

    setBrushOpacity: (opacity) =>
      set((state) => ({
        brushSettings: { ...state.brushSettings, opacity },
      })),

    setBrushColor: (color) =>
      set((state) => ({
        brushSettings: { ...state.brushSettings, color },
      })),

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
  },

    deleteLayer: (layerId) => {
      set((state) => {
        const newLayers = state.layers.filter((layer) => layer.id !== layerId);
        const newActiveLayerId =
          state.activeLayerId === layerId
            ? newLayers.length > 0
              ? newLayers[newLayers.length - 1].id
              : null
            : state.activeLayerId;
        return {
          layers: newLayers,
          activeLayerId: newActiveLayerId,
        };
      });
    },

    setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

    toggleLayerVisibility: (layerId) => {
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === layerId
            ? { ...layer, visible: !layer.visible }
            : layer
        ),
      }));
    },

    moveLayer: (layerId, direction) => {
      set((state) => {
        const layers = [...state.layers];
        const index = layers.findIndex((layer) => layer.id === layerId);
        if (index === -1) return state;

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
    },

    saveToHistory: () => {
      const { canvas, context } = get();
      if (!canvas || !context) return;

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
      if (!canvas || !context || historyIndex <= 0) return;

      const newIndex = historyIndex - 1;
      const imageData = history[newIndex];
      context.putImageData(imageData, 0, 0);
      set({ historyIndex: newIndex });
    },

    redo: () => {
      const { canvas, context, history, historyIndex } = get();
      if (!canvas || !context || historyIndex >= history.length - 1) return;

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
  };
});

