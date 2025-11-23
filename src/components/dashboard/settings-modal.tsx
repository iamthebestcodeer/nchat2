"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your drawing experience.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Appearance</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className={cn(
                  "flex h-auto flex-col gap-2 py-4",
                  theme === "light" && "border-primary bg-primary/5"
                )}
                onClick={() => setTheme("light")}
              >
                <Sun className="h-6 w-6" />
                <span>Light</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex h-auto flex-col gap-2 py-4",
                  theme === "dark" && "border-primary bg-primary/5"
                )}
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-6 w-6" />
                <span>Dark</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex h-auto flex-col gap-2 py-4",
                  theme === "system" && "border-primary bg-primary/5"
                )}
                onClick={() => setTheme("system")}
              >
                <Laptop className="h-6 w-6" />
                <span>System</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


