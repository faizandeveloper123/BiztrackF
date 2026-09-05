import type { Project } from "@/src/models";
import type { ProjectDialogMode, ProjectFormData } from "@/src/types/projects";
import { projectDateKey } from "./projectDateUtils";

export const DEFAULT_PROJECT_FORM_DATA: ProjectFormData = {
  name: "",
  description: "",
  status: "planning",
  priority: "medium",
  startDate: "",
  endDate: "",
  budget: 0,
  notes: "",
  clientEmail: "",
  projectManagerId: "",
  teamMemberIds: [],
};

export function projectToFormData(project: Project): ProjectFormData {
  return {
    name: project.name,
    description: project.description || "",
    status: project.status,
    priority: project.priority,
    startDate: project.startDate || "",
    endDate: project.endDate || "",
    budget: project.budget || 0,
    notes: project.notes || "",
    clientEmail: project.clientEmail || "",
    projectManagerId: project.projectManager.id,
    teamMemberIds: project.teamMembers.map((member) => member.id),
  };
}

export function validateProjectForm(
  formData: ProjectFormData,
  dialogMode: ProjectDialogMode,
): string | null {
  if (!formData.startDate?.trim()) {
    return "Start date is required";
  }
  if (!formData.endDate?.trim()) {
    return "End date is required";
  }
  const startKey = projectDateKey(formData.startDate);
  const endKey = projectDateKey(formData.endDate);
  if (startKey.length === 10 && endKey.length === 10 && endKey < startKey) {
    return "End date must be on or after start date";
  }
  if (dialogMode === "create" && !formData.projectManagerId) {
    return "Please select a project manager";
  }
  return null;
}
