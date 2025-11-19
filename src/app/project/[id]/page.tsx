"use client";

import { use } from "react";
import { FloatingBrushControls } from "@/components/brush/floating-brush-controls";
import { DrawingCanvas } from "@/components/canvas/drawing-canvas";
import { FloatingLayers } from "@/components/layers/floating-layers";
import { FloatingDock } from "@/components/toolbar/floating-dock";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <DrawingCanvas projectId={id} />
      </div>

      {/* Floating UI Layer */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Enable pointer events for the actual UI elements */}
        <div className="pointer-events-auto">
          <FloatingDock />
          <FloatingLayers />
          <FloatingBrushControls />
        </div>
      </div>
    </div>
  );
}
