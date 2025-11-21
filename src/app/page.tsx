"use client";

import { formatDistanceToNow } from "date-fns";
import {
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { SettingsModal } from "@/components/dashboard/settings-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { WelcomeModal } from "@/components/ui/welcome-modal";
import {
  createProject,
  deleteProject,
  getAllProjects,
  type Project,
  renameProject,
} from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectToRename, setProjectToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      const projects = await getAllProjects();
      setProjects(projects);
    };
    loadProjects();
  }, []);

  const handleDeleteProject = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete);
      const projects = await getAllProjects();
      setProjects(projects);
      setProjectToDelete(null);
    }
  };

  const handleRenameProject = async () => {
    if (projectToRename && newName.trim()) {
      await renameProject(projectToRename.id, newName.trim());
      const projects = await getAllProjects();
      setProjects(projects);
      setProjectToRename(null);
      setNewName("");
    }
  };

  const openRenameDialog = (project: Project) => {
    setProjectToRename({ id: project.id, name: project.name });
    setNewName(project.name);
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <WelcomeModal />

      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header / Hero */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-4xl tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-lg">
              Ready to create something amazing?
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="bg-background/50 pl-9 backdrop-blur-sm"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                value={searchQuery}
              />
            </div>
            <SettingsModal>
              <Button size="icon" variant="outline">
                <Settings className="h-5 w-5" />
              </Button>
            </SettingsModal>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* New Project Card */}
          <div>
            <NewProjectDialog>
              <Card className="group relative flex h-full min-h-[280px] cursor-pointer flex-col items-center justify-center gap-4 border-dashed bg-muted/30 transition-all hover:border-primary hover:bg-muted/50 hover:shadow-lg">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm transition-transform group-hover:scale-110">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <span className="font-medium text-lg">New Project</span>
              </Card>
            </NewProjectDialog>
          </div>

          {filteredProjects.map((project) => (
            <div key={project.id}>
              <Card className="group relative flex h-full min-h-[280px] cursor-pointer overflow-hidden border bg-card transition-all hover:-translate-y-1 hover:shadow-xl">
                <Link
                  className="block aspect-video w-full bg-muted/50 transition-colors hover:bg-muted"
                  href={`/project/${project.id}`}
                >
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    {project.thumbnail ? (
                      // biome-ignore lint/a11y/useAltText: Alt text is provided via project.name
                      <img
                        alt={project.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        src={project.thumbnail}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-background/50" />
                      </div>
                    )}
                  </div>
                </Link>

                <CardFooter className="flex items-center justify-between bg-card/50 p-4 backdrop-blur-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{project.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(project.lastModified, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        size="icon"
                        variant="ghost"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openRenameDialog(project)}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setProjectToDelete(project.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && projects.length > 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed text-muted-foreground">
            <p className="text-lg">
              No projects found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      <AlertDialog
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        open={!!projectToDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteProject}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        onOpenChange={(open) => !open && setProjectToRename(null)}
        open={!!projectToRename}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameProject();
                }
              }}
              placeholder="Project Name"
              value={newName}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setProjectToRename(null)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleRenameProject}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
