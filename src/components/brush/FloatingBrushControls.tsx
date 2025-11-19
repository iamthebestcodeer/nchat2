"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Settings2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDrawingStore } from "@/lib/store/drawingStore";

export function FloatingBrushControls() {
  const [isOpen, setIsOpen] = useState(false);
  const { brushSettings, setBrushSize, setBrushOpacity } = useDrawingStore();

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-4 left-4 z-50"
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
          >
            <GlassPanel className="p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="rounded-xl"
                    onClick={() => setIsOpen(true)}
                    size="icon"
                    variant="ghost"
                  >
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Brush Settings</TooltipContent>
              </Tooltip>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <GlassPanel
            className="fixed top-4 left-4 z-50 flex w-64 flex-col"
            drag
            dragConstraints={{
              left: 0,
              right: window.innerWidth - 300,
              top: 0,
              bottom: window.innerHeight - 400,
            }}
            dragMomentum={false}
          >
            <div className="flex cursor-grab items-center justify-between border-border/50 border-b p-3 active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Brush Settings</span>
              </div>
              <Button
                className="h-6 w-6 rounded-full"
                onClick={() => setIsOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-6 p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label
                    className="font-medium text-muted-foreground text-xs"
                    htmlFor="brush-size"
                  >
                    Size
                  </Label>
                  <span className="font-mono text-xs">
                    {brushSettings.size}px
                  </span>
                </div>
                <Slider
                  className="[&_.bg-primary]:bg-foreground"
                  id="brush-size"
                  max={100}
                  min={1}
                  onValueChange={([value]) => setBrushSize(value)}
                  step={1}
                  value={[brushSettings.size]}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label
                    className="font-medium text-muted-foreground text-xs"
                    htmlFor="brush-opacity"
                  >
                    Opacity
                  </Label>
                  <span className="font-mono text-xs">
                    {Math.round(brushSettings.opacity * 100)}%
                  </span>
                </div>
                <Slider
                  className="[&_.bg-primary]:bg-foreground"
                  id="brush-opacity"
                  max={1}
                  min={0}
                  onValueChange={([value]) => setBrushOpacity(value)}
                  step={0.01}
                  value={[brushSettings.opacity]}
                />
              </div>
            </div>
          </GlassPanel>
        )}
      </AnimatePresence>
    </>
  );
}
