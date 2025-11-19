"use client";

import { FloatingBrushControls } from "@/components/brush/FloatingBrushControls";
import { DrawingCanvas } from "@/components/canvas/DrawingCanvas";
import { FloatingLayers } from "@/components/layers/FloatingLayers";
import { FloatingDock } from "@/components/toolbar/FloatingDock";
import { WelcomeModal } from "@/components/ui/WelcomeModal";

export default function Home() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <WelcomeModal />

      {/* Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <DrawingCanvas />
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
