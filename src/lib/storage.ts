import type { BrushSettings, Layer, Tool } from "./store/drawing-store";

const STORAGE_KEY = "drawing-app-state"; // Legacy key
const PROJECTS_KEY = "drawing-app-projects";

export type Project = {
  id: string;
  name: string;
  lastModified: number;
  thumbnail?: string;
};

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
    return Promise.resolve(canvas);
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return Promise.resolve(null);
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
    return Promise.resolve(null);
  }
}

/**
 * Get all projects
 */
export function getAllProjects(): Project[] {
  try {
    // Check for legacy state and migrate if needed
    const legacyState = localStorage.getItem(STORAGE_KEY);
    if (legacyState) {
      const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
      // Only migrate if we haven't already (simple check: if projects is empty but legacy exists)
      // Or we could just migrate it to a "Untitled Project" and delete legacy
      if (projects.length === 0) {
        const newProject: Project = {
          id: crypto.randomUUID(),
          name: "Untitled Project",
          lastModified: Date.now(),
        };
        localStorage.setItem(PROJECTS_KEY, JSON.stringify([newProject]));
        localStorage.setItem(`project-${newProject.id}`, legacyState);
        localStorage.removeItem(STORAGE_KEY);
        return [newProject];
      }
    }

    const projects = localStorage.getItem(PROJECTS_KEY);
    return projects ? JSON.parse(projects) : [];
  } catch (error) {
    console.error("Error getting projects:", error);
    return [];
  }
}

/**
 * Create a new project
 */
export function createProject(name: string): Project {
  const newProject: Project = {
    id: crypto.randomUUID(),
    name,
    lastModified: Date.now(),
  };

  const projects = getAllProjects();
  projects.push(newProject);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

  return newProject;
}

/**
 * Delete a project
 */
export function deleteProject(id: string): void {
  const projects = getAllProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  localStorage.removeItem(`project-${id}`);
}

/**
 * Rename a project
 */
export function renameProject(id: string, newName: string): void {
  const projects = getAllProjects().map((p) =>
    p.id === id ? { ...p, name: newName, lastModified: Date.now() } : p
  );
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

/**
 * Saves state to localStorage for a specific project
 */
export function saveStateToStorage(
  state: SerializableState,
  projectId?: string
): boolean {
  try {
    const serialized = JSON.stringify(state);

    if (projectId) {
      localStorage.setItem(`project-${projectId}`, serialized);

      // Update last modified and thumbnail
      const projects = getAllProjects();
      const projectIndex = projects.findIndex((p) => p.id === projectId);
      if (projectIndex !== -1) {
        // Generate thumbnail from first visible layer or composite
        // For now, we'll just update the timestamp
        projects[projectIndex].lastModified = Date.now();

        // Try to generate a thumbnail from the first visible layer
        const visibleLayer = state.layers.find((l) => l.visible && l.imageData);
        if (visibleLayer) {
          // We could store a small thumbnail here, but for now let's just store the timestamp
          // Storing full base64 in the project list might be too heavy
        }

        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      }
    } else {
      // Fallback to legacy key if no projectId provided (shouldn't happen with new flow)
      localStorage.setItem(STORAGE_KEY, serialized);
    }

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
 * Loads state from localStorage for a specific project
 */
export function loadStateFromStorage(
  projectId?: string
): SerializableState | null {
  try {
    let serialized: string | null = null;

    if (projectId) {
      serialized = localStorage.getItem(`project-${projectId}`);
    } else {
      serialized = localStorage.getItem(STORAGE_KEY);
    }

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
export function clearStateFromStorage(projectId?: string): void {
  try {
    if (projectId) {
      localStorage.removeItem(`project-${projectId}`);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error("Error clearing state from storage:", error);
  }
}
