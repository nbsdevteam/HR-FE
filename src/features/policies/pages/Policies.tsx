import { useCallback } from "react";
import { CheckCircle } from "lucide-react";
import { lazy, Suspense } from "react";
import Toast from "@/shared/components/Toast";
import PoliciesFilters from "../components/PoliciesFilters";
import PoliciesHeader from "../components/PoliciesHeader";
import PoliciesList from "../components/PoliciesList";
import PoliciesLoadingState from "../components/PoliciesLoadingState";
import PoliciesStats from "../components/PoliciesStats";
import { usePoliciesPage } from "../hooks/usePoliciesPage";
import type { PolicyFormPatch, PolicySortKey } from "../types";
const PolicyModals = lazy(() => import("../components/PolicyModals"));

const Policies = () => {
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

  const handleCreateFormChange = useCallback(
    (patch: PolicyFormPatch) => {
      setCreateForm((prev) => ({ ...prev, ...patch }));
    },
    [setCreateForm],
  );

  const handleEditFormChange = useCallback(
    (patch: PolicyFormPatch) => {
      setEditingPolicy((prev) => (prev ? { ...prev, ...patch } : prev));
    },
    [setEditingPolicy],
  );

  const handleSortChange = useCallback(
    (sortBy: PolicySortKey) => {
      setSortBy(sortBy);
    },
    [setSortBy],
  );

  if (page.loading) {
    return <PoliciesLoadingState />;
  }

  return (
    <div className="space-y-6">
      <PoliciesHeader onCreateClick={handleCreateClick} />

      <PoliciesStats stats={page.stats} />

      <PoliciesFilters
        search={page?.search}
        selectedCategory={page?.selectedCategory}
        sortBy={page?.sortBy}
        statusFilter={page?.statusFilter}
        onCategoryChange={page?.handleCategoryChange}
        onSearchChange={page?.handleSearchChange}
        onSortChange={handleSortChange}
        onStatusFilterChange={page?.handleStatusFilterChange}
      />

      <PoliciesList
        currentPage={page?.currentPage}
        expandedPolicy={page?.expandedPolicy}
        filteredCount={page?.filtered.length}
        isSubmitting={page?.isSubmitting}
        localizePolicyText={page?.localizePolicyText}
        paged={page?.paged}
        totalPages={page?.totalPages}
        onDeletePolicy={page?.handleDeletePolicy}
        onEditPolicy={page?.openEditModal}
        onExpandPolicy={page?.setExpandedPolicy}
        onPageChange={setPage}
        onToggleStatus={page?.handleToggleStatus}
        onViewPolicy={page?.openViewModal}
      />

      <Suspense fallback={null}>
        <PolicyModals
          createForm={page?.createForm}
          editingPolicy={page?.editingPolicy}
          isSubmitting={page?.isSubmitting}
          localizePolicyText={page?.localizePolicyText}
          showCreateModal={page?.showCreateModal}
          showEditModal={page?.showEditModal}
          showViewModal={page?.showViewModal}
          viewingPolicy={page?.viewingPolicy}
          onCreateFormChange={handleCreateFormChange}
          onCreateSubmit={page?.handleCreatePolicy}
          onEditFormChange={handleEditFormChange}
          onEditSubmit={page?.handleUpdatePolicy}
          onShowCreateModalChange={setShowCreateModal}
          onShowEditModalChange={setShowEditModal}
          onShowViewModalChange={setShowViewModal}
        />
      </Suspense>

      {page.toastMessage && (
        <Toast
          message={page?.toastMessage}
          icon={CheckCircle}
          position="bottom-start"
          toneClassName="bg-toast-success border-toast-success-border"
          iconBoxClassName="bg-toast-success-border/25"
          iconClassName="w-3 h-3 text-toast-success-fg"
          textClassName="text-toast-success-fg text-sm font-medium"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        />
      )}
    </div>
  );
};

export default Policies;
