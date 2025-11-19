"use client";

import { MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { WelcomeModal } from "@/components/ui/WelcomeModal";
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
    setProjects(getAllProjects());
  }, []);

  const handleCreateProject = () => {
    const project = createProject("Untitled Project");
    router.push(`/project/${project.id}`);
  };

  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setProjects(getAllProjects());
      setProjectToDelete(null);
    }
  };

  const handleRenameProject = () => {
    if (projectToRename && newName.trim()) {
      renameProject(projectToRename.id, newName.trim());
      setProjects(getAllProjects());
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

      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-4xl tracking-tight">My Projects</h1>
          <Button onClick={handleCreateProject} size="lg">
            <Plus className="mr-2 h-5 w-5" /> New Project
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute top-3 left-3 h-5 w-5 text-muted-foreground" />
          <Input
            className="pl-10 text-lg"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            value={searchQuery}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <Card
              className="group relative overflow-hidden transition-all hover:shadow-lg"
              key={project.id}
            >
              <div
                className="aspect-video w-full cursor-pointer bg-muted/50 transition-colors hover:bg-muted"
                onClick={() => router.push(`/project/${project.id}`)}
              >
                {/* Thumbnail placeholder or actual thumbnail */}
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  {project.thumbnail ? (
                    <img
                      alt={project.name}
                      className="h-full w-full object-cover"
                      src={project.thumbnail}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-background/50" />
                    </div>
                  )}
                </div>
              </div>

              <CardFooter className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{project.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(project.lastModified).toLocaleDateString()}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      size="icon"
                      variant="ghost"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openRenameDialog(project)}>
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
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed text-muted-foreground">
            <p className="text-lg">No projects found</p>
            <Button onClick={handleCreateProject} variant="outline">
              Create your first project
            </Button>
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
