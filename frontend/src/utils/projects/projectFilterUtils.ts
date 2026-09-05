import type { Project } from "@/src/models";

export function filterProjects(
  projects: Project[],
  searchTerm: string,
  statusFilter: string,
  priorityFilter: string,
): Project[] {
  return projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });
}

export function hasActiveFilters(
  searchTerm: string,
  statusFilter: string,
  priorityFilter: string,
): boolean {
  return (
    Boolean(searchTerm) || statusFilter !== "all" || priorityFilter !== "all"
  );
}
