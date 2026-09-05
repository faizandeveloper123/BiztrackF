"use client";

import { DashboardLayout } from "@/src/components/layout";
import {
  ProjectsPageHeader,
  ProjectsToolbar,
  ProjectsLoadingState,
  ProjectsErrorState,
  ProjectsEmptyState,
  ProjectsGrid,
  ProjectFormDialog,
  ProjectDeleteDialog,
} from "@/src/components/projects";
import { useProjectsPage } from "@/src/hooks/useProjectsPage";

export default function ProjectsPage() {
  const {
    mounted,
    loading,
    error,
    searchTerm,
    statusFilter,
    priorityFilter,
    filteredProjects,
    filtersActive,
    starredProjects,
    dialogOpen,
    dialogMode,
    formData,
    formError,
    formLoading,
    users,
    deleteDialogOpen,
    projectToDelete,
    selectedProjectManager,
    selectedTeamMembers,
    canCreateProject,
    canEditProject,
    getDeleteMode,
    handleRequestDeletion,
    setDialogOpen,
    setFormData,
    setDeleteDialogOpen,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    fetchProjects,
    handleCreateProject,
    handleEditProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleFormSubmit,
    toggleStarred,
    handleViewProject,
    handleViewTasks,
    clearFilters,
  } = useProjectsPage();

  if (!mounted) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <ProjectsPageHeader />

        <ProjectsToolbar
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          canCreate={canCreateProject()}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onPriorityFilterChange={setPriorityFilter}
          onClearFilters={clearFilters}
          onCreateProject={handleCreateProject}
        />

        {loading ? (
          <ProjectsLoadingState />
        ) : error ? (
          <ProjectsErrorState
            error={error}
            onRetry={() => void fetchProjects()}
          />
        ) : (
          <ProjectsGrid
            projects={filteredProjects}
            starredProjects={starredProjects}
            canEditProject={canEditProject}
            getDeleteMode={getDeleteMode}
            onToggleStarred={toggleStarred}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onRequestDeletion={handleRequestDeletion}
            onViewProject={handleViewProject}
            onViewTasks={handleViewTasks}
          />
        )}

        {!loading && !error && filteredProjects.length === 0 && (
          <ProjectsEmptyState
            hasFilters={filtersActive}
            canCreate={canCreateProject()}
            onCreateProject={handleCreateProject}
          />
        )}

        <ProjectFormDialog
          open={dialogOpen}
          mode={dialogMode}
          formData={formData}
          formError={formError}
          formLoading={formLoading}
          users={users}
          selectedProjectManager={selectedProjectManager}
          selectedTeamMembers={selectedTeamMembers}
          onOpenChange={setDialogOpen}
          onFormDataChange={setFormData}
          onSubmit={handleFormSubmit}
        />

        <ProjectDeleteDialog
          open={deleteDialogOpen}
          project={projectToDelete}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDeleteProject}
        />
      </div>
    </DashboardLayout>
  );
}
