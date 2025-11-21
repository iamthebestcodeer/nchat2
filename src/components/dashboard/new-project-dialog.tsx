"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LayoutTemplate, Monitor, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/storage";
import { cn } from "@/lib/utils";

const PRESETS = [
  {
    id: "screen",
    name: "Screen Size",
    width: 1920,
    height: 1080,
    icon: Monitor,
  },
  {
    id: "a4",
    name: "A4 Print",
    width: 2480,
    height: 3508,
    icon: FileText,
  },
  {
    id: "square",
    name: "Square",
    width: 1080,
    height: 1080,
    icon: Square,
  },
  {
    id: "mobile",
    name: "Mobile",
    width: 390,
    height: 844,
    icon: LayoutTemplate,
  },
];

export function NewProjectDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [selectedPreset, setSelectedPreset] = useState("screen");

  const handleCreate = async () => {
    const projectName = name.trim() || "Untitled Project";
    const project = await createProject(projectName);
    // TODO: Save dimensions to project settings
    setOpen(false);
    router.push(`/project/${project.id}`);
  };

  const selectPreset = (preset: (typeof PRESETS)[0]) => {
    setSelectedPreset(preset.id);
    setWidth(preset.width);
    setHeight(preset.height);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Choose a preset or define custom dimensions for your canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled Project"
              value={name}
            />
          </div>

          <div className="grid gap-2">
            <Label>Presets</Label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {PRESETS.map((preset) => (
                <div
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-all hover:bg-muted",
                    selectedPreset === preset.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "bg-background"
                  )}
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      selectPreset(preset);
                    }
                  }}
                >
                  <preset.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{preset.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                onChange={(e) => setWidth(Number(e.target.value))}
                type="number"
                value={width}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                onChange={(e) => setHeight(Number(e.target.value))}
                type="number"
                value={height}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

