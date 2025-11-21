"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDrawingStore } from "@/lib/store/drawing-store";

export function FloatingLayers() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    moveLayer,
  } = useDrawingStore();

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-4 right-4 z-50"
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
                    <Layers className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Layers</TooltipContent>
              </Tooltip>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <GlassPanel
            className="fixed top-4 right-4 z-50 flex w-72 flex-col"
            drag
            dragConstraints={{
              left: -window.innerWidth + 300,
              right: 0,
              top: 0,
              bottom: window.innerHeight - 400,
            }}
            dragMomentum={false}
          >
            <div className="flex cursor-grab items-center justify-between border-border/50 border-b p-3 active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Layers</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  className="h-6 w-6 rounded-full"
                  onClick={() => setIsOpen(false)}
                  size="icon"
                  variant="ghost"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 p-3">
              <Button
                className="w-full"
                onClick={addLayer}
                size="sm"
                variant="secondary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Layer
              </Button>

              <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-2">
                  {layers.map((layer, index) => (
                    <div
                      className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                        activeLayerId === layer.id
                          ? "border-primary/50 bg-primary/10"
                          : "border-transparent hover:bg-muted/50"
                      }`}
                      key={layer.id}
                    >
                      <button
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        type="button"
                      >
                        {layer.visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        className="flex-1 truncate text-left font-medium text-sm"
                        onClick={() => setActiveLayer(layer.id)}
                        type="button"
                      >
                        {layer.name}
                      </button>

                      <div className="flex gap-0.5">
                        <div className="flex flex-col">
                          <button
                            className="rounded p-0.5 transition-colors hover:bg-background/50 disabled:opacity-30"
                            disabled={index === layers.length - 1}
                            onClick={() => moveLayer(layer.id, "up")}
                            type="button"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            className="rounded p-0.5 transition-colors hover:bg-background/50 disabled:opacity-30"
                            disabled={index === 0}
                            onClick={() => moveLayer(layer.id, "down")}
                            type="button"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          className="ml-1 rounded-md p-1.5 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                          disabled={layers.length === 1}
                          onClick={() => deleteLayer(layer.id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </GlassPanel>
        )}
      </AnimatePresence>
    </>
  );
}
