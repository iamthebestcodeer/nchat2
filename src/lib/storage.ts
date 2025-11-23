import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { BrushSettings, Layer, Tool } from "./store/drawing-store";

const DB_NAME = "drawing-app-db";
const DB_VERSION = 1;
const PROJECTS_STORE = "projects";
const STATES_STORE = "states";

// Legacy keys for migration
const LEGACY_STORAGE_KEY = "drawing-app-state";
const LEGACY_PROJECTS_KEY = "drawing-app-projects";

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

interface DrawingAppDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
  };
  states: {
    key: string;
    value: SerializableState;
  };
}

let dbPromise: Promise<IDBPDatabase<DrawingAppDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DrawingAppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STATES_STORE)) {
          db.createObjectStore(STATES_STORE);
        }
      },
    });
  }
  return dbPromise;
}

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
 * Migrate data from localStorage to IndexedDB
 */
async function migrateFromLocalStorage() {
  try {
    const db = await getDB();
    const projectsJson = localStorage.getItem(LEGACY_PROJECTS_KEY);
    const legacyState = localStorage.getItem(LEGACY_STORAGE_KEY);

    // Check if we already have projects in IDB
    const existingProjects = await db.getAll(PROJECTS_STORE);
    if (existingProjects.length > 0) {
      return; // Already migrated or used IDB
    }

    if (projectsJson) {
      const projects: Project[] = JSON.parse(projectsJson);
      const tx = db.transaction([PROJECTS_STORE, STATES_STORE], "readwrite");
      
      for (const project of projects) {
        await tx.objectStore(PROJECTS_STORE).put(project);
        const projectState = localStorage.getItem(`project-${project.id}`);
        if (projectState) {
          await tx.objectStore(STATES_STORE).put(JSON.parse(projectState), project.id);
        }
      }
      
      await tx.done;
    } else if (legacyState) {
      // Handle single legacy project
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: "Untitled Project",
        lastModified: Date.now(),
      };
      
      const tx = db.transaction([PROJECTS_STORE, STATES_STORE], "readwrite");
      await tx.objectStore(PROJECTS_STORE).put(newProject);
      await tx.objectStore(STATES_STORE).put(JSON.parse(legacyState), newProject.id);
      await tx.done;
    }
    
    // Optional: Clear localStorage after successful migration
    // localStorage.removeItem(LEGACY_PROJECTS_KEY);
    // localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

/**
 * Syncs any orphaned states (states without a corresponding project) to the projects store
 */
async function syncOrphanedStates(db: IDBPDatabase<DrawingAppDB>) {
  try {
    const stateKeys = await db.getAllKeys(STATES_STORE);
    const projectKeys = await db.getAllKeys(PROJECTS_STORE);
    const projectKeySet = new Set(projectKeys);

    const missingProjects = stateKeys.filter((key) => !projectKeySet.has(key));

    if (missingProjects.length > 0) {
      const tx = db.transaction(PROJECTS_STORE, "readwrite");
      await Promise.all(
        missingProjects.map((id) =>
          tx.store.put({
            id,
            name: "Recovered Project",
            lastModified: Date.now(),
          })
        )
      );
      await tx.done;
    }
  } catch (error) {
    console.error("Error syncing orphaned states:", error);
  }
}

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<Project[]> {
  try {
    await migrateFromLocalStorage();
    const db = await getDB();
    await syncOrphanedStates(db);
    return await db.getAll(PROJECTS_STORE);
  } catch (error) {
    console.error("Error getting projects:", error);
    return [];
  }
}

/**
 * Create a new project
 */
export async function createProject(name: string): Promise<Project> {
  const newProject: Project = {
    id: crypto.randomUUID(),
    name,
    lastModified: Date.now(),
  };

  const db = await getDB();
  await db.put(PROJECTS_STORE, newProject);
  return newProject;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([PROJECTS_STORE, STATES_STORE], "readwrite");
  await tx.objectStore(PROJECTS_STORE).delete(id);
  await tx.objectStore(STATES_STORE).delete(id);
  await tx.done;
}

/**
 * Rename a project
 */
export async function renameProject(id: string, newName: string): Promise<void> {
  const db = await getDB();
  const project = await db.get(PROJECTS_STORE, id);
  if (project) {
    project.name = newName;
    project.lastModified = Date.now();
    await db.put(PROJECTS_STORE, project);
  }
}

/**
 * Saves state to IndexedDB for a specific project
 */
export async function saveStateToStorage(
  state: SerializableState,
  projectId: string,
  thumbnail?: string
): Promise<boolean> {
  try {
    const db = await getDB();
    const tx = db.transaction([PROJECTS_STORE, STATES_STORE], "readwrite");
    
    await tx.objectStore(STATES_STORE).put(state, projectId);

    const project = await tx.objectStore(PROJECTS_STORE).get(projectId);
    if (project) {
      project.lastModified = Date.now();
      if (thumbnail) {
        project.thumbnail = thumbnail;
      }
      await tx.objectStore(PROJECTS_STORE).put(project);
    } else {
      // If project record is missing but we're saving state, recreate the project record
      await tx.objectStore(PROJECTS_STORE).put({
        id: projectId,
        name: "Untitled Project",
        lastModified: Date.now(),
        thumbnail,
      });
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error("Error saving state to storage:", error);
    return false;
  }
}

/**
 * Loads state from IndexedDB for a specific project
 */
export async function loadStateFromStorage(
  projectId: string
): Promise<SerializableState | null> {
  try {
    const db = await getDB();
    const state = await db.get(STATES_STORE, projectId);
    return state || null;
  } catch (error) {
    console.error("Error loading state from storage:", error);
    return null;
  }
}

/**
 * Clears saved state from storage
 */
export async function clearStateFromStorage(projectId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STATES_STORE, projectId);
  } catch (error) {
    console.error("Error clearing state from storage:", error);
  }
}
