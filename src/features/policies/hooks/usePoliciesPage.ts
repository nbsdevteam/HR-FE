import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { normalizeLanguage } from "@/i18n";
import { translateArabicSource } from "@/i18n/legacy";
import { useOdooMutation, usePolicies } from "@/shared/hooks";
import { runAsyncAction } from "@/shared/utils/asyncAction";
import { countBy } from "@/shared/utils/collections";
import { stripHtmlTags } from "@/shared/utils/html";
import {
  ODOO_STATUS_TO_POLICY,
  POLICY_STATUS_TO_ODOO,
  policiesPageSize,
} from "../constants/policies";
import type { CreatePolicyForm, DisplayPolicy, EditPolicyForm, PolicySortKey } from "../types";

export const usePoliciesPage = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(arabicSource("common.all"));
  const [statusFilter, setStatusFilter] = useState(arabicSource("common.all"));
  const [sortBy, setSortBy] = useState<PolicySortKey>("updated");
  const [page, setPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPolicy, setViewingPolicy] = useState<DisplayPolicy | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<EditPolicyForm | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeletePolicyId, setPendingDeletePolicyId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreatePolicyForm>({
    title: "",
    category: arabicSource("common.general"),
    description: "",
    content: "",
  });

  const { i18n } = useTranslation();
  const { policies, loading } = usePolicies();
  const createPolicyMutation = useOdooMutation<unknown, Record<string, unknown>>(
    (payload) => odooData.createPolicy(payload),
    "policies",
  );
  const updatePolicyMutation = useOdooMutation<unknown, { id: string; payload: Record<string, unknown> }>(
    ({ id, payload }) => odooData.updatePolicy(id, payload),
    "policies",
  );
  const deletePolicyMutation = useOdooMutation<unknown, string>(
    (id) => odooData.deletePolicy(id),
    "policies",
  );

  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  const localizePolicyText = useCallback((value: string | null | undefined) => (
    value ? translateArabicSource(value, language) : ""
  ), [language]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const displayPolicies = useMemo<DisplayPolicy[]>(() => policies.map((policy) => ({
    ...policy,
    content: stripHtmlTags(policy.content),
    status: ODOO_STATUS_TO_POLICY[policy.status] || policy.status,
  })), [policies]);

  const filtered = useMemo(() => displayPolicies
    .filter((policy) => {
      const query = search.trim().toLowerCase();
      const matchSearch =
        !query ||
        (policy.title || "").toLowerCase().includes(query) ||
        (policy.description || "").toLowerCase().includes(query) ||
        (policy.content || "").toLowerCase().includes(query);
      const matchCategory =
        selectedCategory === arabicSource("common.all") || policy.category === selectedCategory;
      const matchStatus =
        statusFilter === arabicSource("common.all") || policy.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "", "ar");
      if (sortBy === "category") return (a.category || "").localeCompare(b.category || "", "ar");
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "", "ar");
      return String(b.last_updated || b.created_at || "").localeCompare(
        String(a.last_updated || a.created_at || ""),
      );
    }), [displayPolicies, search, selectedCategory, sortBy, statusFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / policiesPageSize)), [filtered.length]);

  const currentPage = useMemo(() => Math.min(page, totalPages), [page, totalPages]);

  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * policiesPageSize, currentPage * policiesPageSize),
    [currentPage, filtered],
  );

  const stats = useMemo(() => {
    const byStatus = countBy(displayPolicies, (policy) => policy.status);
    return {
      total: displayPolicies.length,
      active: byStatus.get(arabicSource("common.is_active")) ?? 0,
      underReview: byStatus.get(arabicSource("common.is_under_review")) ?? 0,
      archived: byStatus.get(arabicSource("common.archived")) ?? 0,
    };
  }, [displayPolicies]);

  const handleCreatePolicy = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.title.trim() || !createForm.content.trim()) {
      showToast(arabicSource("common.please_fill_out_all_required_fields"));
      return;
    }

    await runAsyncAction(async () => {
      await createPolicyMutation.mutateAsync({
        title: createForm.title,
        category: createForm.category,
        description: createForm.description,
        content: createForm.content,
        status: "active",
        version: 1,
      });

      showToast(arabicSource("policies.the_policy_was_created_successfully"));
      setCreateForm({ title: "", category: arabicSource("common.general"), description: "", content: "" });
      setShowCreateModal(false);
    }, {
      setLoading: setIsSubmitting,
      onError: (error: any) => showToast(arabicSource("common.error_2") + " " + (error.message || arabicSource("policies.policy_creation_failed"))),
    });
  }, [createForm, createPolicyMutation, showToast]);

  const handleUpdatePolicy = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPolicy) return;

    await runAsyncAction(async () => {
      await updatePolicyMutation.mutateAsync({
        id: editingPolicy.id,
        payload: {
          title: editingPolicy.title,
          category: editingPolicy.category,
          description: editingPolicy.description,
          content: editingPolicy.content,
          status: POLICY_STATUS_TO_ODOO[editingPolicy.status] || editingPolicy.status,
          version: editingPolicy.version + 1,
        },
      });

      showToast(arabicSource("policies.the_policy_was_updated_successfully"));
      setEditingPolicy(null);
      setShowEditModal(false);
    }, {
      setLoading: setIsSubmitting,
      onError: (error: any) => showToast(arabicSource("common.error_2") + " " + (error.message || arabicSource("policies.policy_update_failed"))),
    });
  }, [editingPolicy, showToast, updatePolicyMutation]);

  const requestDeletePolicy = useCallback((id: string) => {
    setPendingDeletePolicyId(id);
  }, []);

  const cancelDeletePolicy = useCallback(() => {
    setPendingDeletePolicyId(null);
  }, []);

  const confirmDeletePolicy = useCallback(async () => {
    if (!pendingDeletePolicyId) return;

    await runAsyncAction(async () => {
      await deletePolicyMutation.mutateAsync(pendingDeletePolicyId);
      showToast(arabicSource("policies.the_policy_was_deleted_successfully"));
    }, {
      setLoading: setIsSubmitting,
      onError: (error: any) => showToast(arabicSource("common.error_2") + " " + (error.message || arabicSource("policies.policy_deletion_failed"))),
    });
    setPendingDeletePolicyId(null);
  }, [deletePolicyMutation, pendingDeletePolicyId, showToast]);

  const handleToggleStatus = useCallback(async (policy: DisplayPolicy) => {
    const statusMap: Record<string, string> = {
      [arabicSource("common.is_active")]: arabicSource("common.is_under_review"),
      [arabicSource("common.is_under_review")]: arabicSource("common.archived"),
      [arabicSource("common.archived")]: arabicSource("common.is_active"),
    };
    const newStatus = statusMap[policy.status] || arabicSource("common.is_active");

    await runAsyncAction(async () => {
      await updatePolicyMutation.mutateAsync({
        id: policy.id,
        payload: { status: POLICY_STATUS_TO_ODOO[newStatus] || newStatus },
      });

      showToast(`${arabicSource("policies.status_changed_to")} ${newStatus}`);
    }, {
      setLoading: setIsSubmitting,
      onError: (error: any) => showToast(arabicSource("common.error_2") + " " + (error.message || arabicSource("policies.status_change_failed"))),
    });
  }, [showToast, updatePolicyMutation]);

  const openEditModal = useCallback((policy: DisplayPolicy) => {
    setEditingPolicy({
      id: policy.id,
      title: policy.title,
      category: policy.category,
      description: policy.description || "",
      content: policy.content || "",
      status: policy.status,
      version: policy.version,
    });
    setShowEditModal(true);
  }, []);

  const openViewModal = useCallback((policy: DisplayPolicy) => {
    setViewingPolicy(policy);
    setShowViewModal(true);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  return {
    createForm,
    currentPage,
    editingPolicy,
    expandedPolicy,
    filtered,
    handleCategoryChange,
    handleCreatePolicy,
    handleSearchChange,
    handleStatusFilterChange,
    handleToggleStatus,
    handleUpdatePolicy,
    isSubmitting,
    loading,
    localizePolicyText,
    openEditModal,
    openViewModal,
    page,
    paged,
    pendingDeletePolicyId,
    requestDeletePolicy,
    cancelDeletePolicy,
    confirmDeletePolicy,
    search,
    selectedCategory,
    setCreateForm,
    setEditingPolicy,
    setExpandedPolicy,
    setPage,
    setShowCreateModal,
    setShowEditModal,
    setShowViewModal,
    showCreateModal,
    showEditModal,
    showViewModal,
    sortBy,
    setSortBy,
    stats,
    statusFilter,
    toastMessage,
    totalPages,
    viewingPolicy,
  };
};
