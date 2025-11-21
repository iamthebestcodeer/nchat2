# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Tooling & Commands

This is a Next.js App Router project (Next 16) under `src/app` with TypeScript and React 19. Dependencies are managed with Bun (preferred) and also compatible with Node package managers.

### Installation

- Install dependencies (preferred):
  - `bun install`

### Development server

- Start dev server on `http://localhost:3000`:
  - `bun dev`

The main dashboard route is implemented in `src/app/page.tsx`. Edits to this file and other components hot-reload in dev.

### Build & production

- Build the app:
  - `bun run build`
- Start the production server (after building):
  - `bun start`

### Linting & formatting

Biome is configured via `biome.jsonc` with the `ultracite/core` and `ultracite/next` presets and is installed as a dev dependency.

Common commands:
- Run Biome checks over the project:
  - `bunx biome check src`
- Optionally check the whole repo:
  - `bunx biome check .`

(There is no dedicated `lint` script in `package.json`; prefer invoking Biome directly as above.)

### Tests

- There is currently **no test script** in `package.json` and no `*.test.*` or `__tests__` files.
- Before running tests, add a test runner (e.g. Vitest/Jest) and a corresponding script, then invoke via Bun, for example:
  - `bun run test`

## High-Level Architecture

### App structure

- Uses the Next.js App Router under `src/app`.
- `src/app/layout.tsx` (if present) defines the root layout, global styles (`src/app/globals.css`), and any shared providers.
- `src/app/page.tsx` implements the **dashboard/home page**:
-  - Fetches the list of drawing projects from `@/lib/storage` (`getAllProjects`).
-  - Renders a static, responsive grid of project cards (no framer-motion), showing each project's last-saved canvas as a thumbnail preview when available.
-  - Uses `NewProjectDialog` and `SettingsModal` from `@/components/dashboard` for project creation and app-level settings.
-  - Navigates to `/project/{id}` via `next/link` for editing a specific project.
- `src/app/project/[id]/page.tsx` implements the **project canvas view**:
  - Extracts the `id` route param and passes it to `DrawingCanvas`.
  - Composes the drawing experience from floating UI layers:
    - `@/components/canvas/DrawingCanvas` for the main canvas.
    - `@/components/toolbar/FloatingDock` for tool selection and global actions.
    - `@/components/layers/FloatingLayers` for layer management.
    - `@/components/brush/FloatingBrushControls` for brush configuration.
  - Uses `framer-motion` for page-level transitions.

### State management & persistence

Global drawing state and persistence are centralized in `src/lib`:

- `src/lib/store/drawing-store.ts`:
  - Defines the **Zustand store** (`useDrawingStore`) that holds all drawing-related state:
    - Current project metadata (`projectId`, `isSaving`, `lastSavedAt`, `saveError`).
    - Canvas references (`canvas`, `context`) and drawing flags (`isDrawing`, last cursor position).
    - Tooling state (`currentTool`, `brushSettings`).
    - Layer stack (`layers`, `activeLayerId`) where each `Layer` tracks its own off-screen canvas and context.
    - View transform for pan/zoom (`viewTransform: { x, y, scale }`).
    - History stack (`history`, `historyIndex`) for undo/redo.
  - Exposes a rich set of actions for:
    - Tool/brush updates (`setCurrentTool`, `setBrushSize`, `setBrushOpacity`, `setBrushColor`).
    - Layer management (`addLayer`, `deleteLayer`, `setActiveLayer`, `toggleLayerVisibility`, `moveLayer`).
    - Canvas lifecycle (`setCanvas`, `setContext`, `clearCanvas`, `saveToHistory`, `undo`, `redo`).
    - View control (`setViewTransform`, `zoomIn`, `zoomOut`, `resetView`).
    - Persistence hooks (`saveToStorage`, `loadFromStorage`).
  - Implements an internal debounced auto-save mechanism:
    - Serializes drawing state to a `SerializableState` (brush/tool settings, view transform, serialized layers).
    - Calls out to `saveStateToStorage` in `@/lib/storage` after a short delay when relevant state changes.

- `src/lib/storage.ts`:
  - Owns **project metadata and persisted drawing state** using IndexedDB via the `idb` library.
  - Defines the `DrawingAppDB` schema with two object stores:
    - `projects` – stores `{ id, name, lastModified, thumbnail? }` for each project.
    - `states` – stores serialized drawing state keyed by project ID.
  - Handles migration from earlier **localStorage-based** storage:
    - Reads legacy keys (`drawing-app-state`, `drawing-app-projects`, and per-project `project-{id}` entries).
    - Populates IndexedDB on first run and can synthesize a single "Untitled Project" when only a legacy state exists.
  - Provides a small, well-defined API used by the UI:
    - `getAllProjects()` – returns the list of projects (after ensuring migration and syncing orphaned states).
    - `createProject(name)` – creates a new project record.
    - `deleteProject(id)` – deletes both project metadata and its corresponding saved state.
    - `renameProject(id, newName)` – updates a project's name and `lastModified` timestamp.
    - `saveStateToStorage(state, projectId, thumbnail?)` – persists serialized state and updates project metadata (including optional thumbnail).
    - `loadStateFromStorage(projectId)` / `clearStateFromStorage(projectId)` for restoring or clearing persisted state.
  - Manages serialization of canvas layers:
    - `serializeLayers(layers)` turns `Layer` objects (with canvases) into a `SerializableLayer[]` with base64 image data.
    - `deserializeLayers(serializedLayers)` reconstructs `Layer[]` with new canvas elements populated from stored base64 data.

Together, `drawing-store.ts` and `storage.ts` form the core of the application's model layer: UI components interact with the Zustand store, which in turn uses the storage module to read/write durable state.

### Components & UI

- `src/components/ui` contains reusable UI primitives (buttons, inputs, dialogs, dropdowns, alert dialogs, etc.), largely following the shadcn/Radix-style composition. These components are consumed throughout the app (`@/components/ui/*`).
- `src/components/dashboard` implements dashboard-specific UI:
  - `new-project-dialog.tsx` – modal for creating a new project, wired to `createProject` and navigation to the new project's page.
  - `settings-modal.tsx` – global settings surface used from the home page header.
- `src/components/canvas`, `src/components/brush`, `src/components/layers`, and `src/components/toolbar` encapsulate the drawing experience for a single project:
  - Canvas rendering, pointer event handling, and delegation to `useDrawingStore` actions.
  - Layer list UI and interactions, including visibility toggles and reordering.
  - Brush/tool controls that update the store's tool and brush settings.
- `src/components/command-palette.tsx` provides a command palette built on `cmdk`, likely wired to navigation or common actions across the app.

### TypeScript & Path Aliases

- TypeScript is configured via `tsconfig.json` with `strict` and `strictNullChecks` enabled and no emit.
- The `@/*` path alias maps to `./src/*` and is used extensively (e.g. `@/components/ui/button`, `@/lib/storage`). When adding new modules, prefer importing via this alias for consistency.

This overview should be sufficient for future Warp agents to locate key entry points (`src/app/page.tsx`, `src/app/project/[id]/page.tsx`), understand where global state and persistence live (`src/lib`), and how the UI layers are organized (`src/components`).

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config Biome preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `npx ultracite fix`
- **Check for issues**: `npx ultracite check`
- **Diagnose setup**: `npx ultracite doctor`

Biome (the underlying engine) provides extremely fast Rust-based linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `npx ultracite fix` before committing to ensure compliance.
