import type { BrushSettings, Layer, Tool } from "./store/drawingStore";

const STORAGE_KEY = "drawing-app-state";

export type SerializableLayer = {
  id: string;
  name: string;
  visible: boolean;
  imageData: string; // base64 encoded canvas data
  width: number;
  height: number;
};

export type SerializableState = {
  brushSettings: BrushSettings;
  currentTool: Tool;
  viewTransform: { x: number; y: number; scale: number };
  layers: SerializableLayer[];
  activeLayerId: string | null;
};

/**
 * Converts a canvas element to base64 image data
 */
export function canvasToBase64(
  canvas: HTMLCanvasElement | null
): string | null {
  if (!canvas) {
    return null;
  }
  try {
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error converting canvas to base64:", error);
    return null;
  }
}

/**
 * Converts layers to serializable format
 */
export function serializeLayers(layers: Layer[]): SerializableLayer[] {
  return layers.map((layer) => {
    const imageData = layer.canvas ? (canvasToBase64(layer.canvas) ?? "") : "";
    return {
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      imageData,
      width: layer.canvas?.width ?? 800,
      height: layer.canvas?.height ?? 600,
    };
  });
}

/**
 * Converts serializable layers back to Layer objects with canvas elements
 */
export async function deserializeLayers(
  serializedLayers: SerializableLayer[]
): Promise<Layer[]> {
  const layers: Layer[] = [];

  for (const serialized of serializedLayers) {
    const canvas = await createCanvasFromImageData(
      serialized.imageData,
      serialized.width,
      serialized.height
    );
    const context = canvas?.getContext("2d") ?? null;

    layers.push({
      id: serialized.id,
      name: serialized.name,
      visible: serialized.visible,
      canvas: canvas ?? null,
      context,
    });
  }

  return layers;
}

/**
 * Helper to create canvas from image data (async version)
 */
function createCanvasFromImageData(
  imageData: string,
  width: number,
  height: number
): Promise<HTMLCanvasElement | null> {
  if (!imageData) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "transparent";
      context.fillRect(0, 0, width, height);
    }
    return canvas;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    return new Promise<HTMLCanvasElement | null>((resolve) => {
      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0);
        resolve(canvas);
      };
      image.onerror = () => {
        console.error("Error loading image from base64");
        resolve(null);
      };
      image.src = imageData;
    });
  } catch (error) {
    console.error("Error creating canvas from base64:", error);
    return null;
  }
}

/**
 * Saves state to localStorage
 */
export function saveStateToStorage(state: SerializableState): boolean {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("Storage quota exceeded. Cannot save state.");
    } else {
      console.error("Error saving state to storage:", error);
    }
    return false;
  }
}

/**
 * Loads state from localStorage
 */
export function loadStateFromStorage(): SerializableState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    return JSON.parse(serialized) as SerializableState;
  } catch (error) {
    console.error("Error loading state from storage:", error);
    return null;
  }
}

/**
 * Clears saved state from localStorage
 */
export function clearStateFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing state from storage:", error);
  }
}
