"use client";

import { Brush, Layers, MousePointer2, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("has-seen-welcome");
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("has-seen-welcome", "true");
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="border-border/50 bg-background/80 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="mb-2 text-center font-bold text-2xl">
            Welcome to nChat Draw
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            A professional-grade digital drawing experience in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-6">
          <div className="flex flex-col items-center rounded-xl bg-secondary/50 p-4 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Brush className="h-5 w-5" />
            </div>
            <h3 className="mb-1 font-semibold">Pro Brushes</h3>
            <p className="text-muted-foreground text-sm">
              Customizable size, opacity, and colors.
            </p>
          </div>

          <div className="flex flex-col items-center rounded-xl bg-secondary/50 p-4 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="mb-1 font-semibold">Layer System</h3>
            <p className="text-muted-foreground text-sm">
              Organize your artwork with unlimited layers.
            </p>
          </div>

          <div className="flex flex-col items-center rounded-xl bg-secondary/50 p-4 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MousePointer2 className="h-5 w-5" />
            </div>
            <h3 className="mb-1 font-semibold">Infinite Canvas</h3>
            <p className="text-muted-foreground text-sm">
              Zoom and pan freely to focus on details.
            </p>
          </div>

          <div className="flex flex-col items-center rounded-xl bg-secondary/50 p-4 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <h3 className="mb-1 font-semibold">Modern UI</h3>
            <p className="text-muted-foreground text-sm">
              Glassmorphic interface that stays out of your way.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="h-12 w-full rounded-xl text-lg"
            onClick={handleClose}
          >
            Start Creating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
