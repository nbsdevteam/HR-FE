import { useCallback } from "react";
import PoliciesFilters from "../components/PoliciesFilters";
import PoliciesHeader from "../components/PoliciesHeader";
import PoliciesList from "../components/PoliciesList";
import PoliciesLoadingState from "../components/PoliciesLoadingState";
import PoliciesStats from "../components/PoliciesStats";
import PolicyModals from "../components/PolicyModals";
import PolicyToast from "../components/PolicyToast";
import { usePoliciesPage } from "../hooks/usePoliciesPage";
import type { CreatePolicyForm, EditPolicyForm, PolicySortKey } from "../types";

export const Policies = () => {
  const page = usePoliciesPage();
  const {
    setCreateForm,
    setEditingPolicy,
    setPage,
    setShowCreateModal,
    setShowEditModal,
    setShowViewModal,
    setSortBy,
  } = page;

  const handleCreateClick = useCallback(() => {
    setShowCreateModal(true);
  }, [setShowCreateModal]);

  const handleCreateFormChange = useCallback((form: CreatePolicyForm) => {
    setCreateForm(form);
  }, [setCreateForm]);

  const handleEditFormChange = useCallback((form: EditPolicyForm) => {
    setEditingPolicy(form);
  }, [setEditingPolicy]);

  const handleSortChange = useCallback((sortBy: PolicySortKey) => {
    setSortBy(sortBy);
  }, [setSortBy]);

  if (page.loading) {
    return <PoliciesLoadingState />;
  }

  return (
    <div className="space-y-6">
      <PoliciesHeader onCreateClick={handleCreateClick} />

      <PoliciesStats stats={page.stats} />

      <PoliciesFilters
        search={page.search}
        selectedCategory={page.selectedCategory}
        sortBy={page.sortBy}
        statusFilter={page.statusFilter}
        onCategoryChange={page.handleCategoryChange}
        onSearchChange={page.handleSearchChange}
        onSortChange={handleSortChange}
        onStatusFilterChange={page.handleStatusFilterChange}
      />

      <PoliciesList
        currentPage={page.currentPage}
        expandedPolicy={page.expandedPolicy}
        filteredCount={page.filtered.length}
        isSubmitting={page.isSubmitting}
        localizePolicyText={page.localizePolicyText}
        paged={page.paged}
        totalPages={page.totalPages}
        onDeletePolicy={page.handleDeletePolicy}
        onEditPolicy={page.openEditModal}
        onExpandPolicy={page.setExpandedPolicy}
        onPageChange={setPage}
        onToggleStatus={page.handleToggleStatus}
        onViewPolicy={page.openViewModal}
      />

      <PolicyModals
        createForm={page.createForm}
        editingPolicy={page.editingPolicy}
        isSubmitting={page.isSubmitting}
        localizePolicyText={page.localizePolicyText}
        showCreateModal={page.showCreateModal}
        showEditModal={page.showEditModal}
        showViewModal={page.showViewModal}
        viewingPolicy={page.viewingPolicy}
        onCreateFormChange={handleCreateFormChange}
        onCreateSubmit={page.handleCreatePolicy}
        onEditFormChange={handleEditFormChange}
        onEditSubmit={page.handleUpdatePolicy}
        onShowCreateModalChange={setShowCreateModal}
        onShowEditModalChange={setShowEditModal}
        onShowViewModalChange={setShowViewModal}
      />

      <PolicyToast message={page.toastMessage} />
    </div>
  );
};
