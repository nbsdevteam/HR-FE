import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Plus, X, Eye, ChevronDown, ChevronUp, Search, Calendar, Shield, Clock, Users, Wallet,
  Edit2, Trash2, Save, AlertTriangle, CheckCircle, Archive, RotateCcw
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { EmptyState } from "../components/EmptyState";
import { usePolicies, type DbPolicy } from "../lib/hooks";
import { localizedConfirm } from "../i18n/native";
import { arabicSource } from "../i18n/source";

const CATEGORY_ICONS: Record<string, any> = {
  [arabicSource("common.vacations_2")]: Calendar,
  [arabicSource("common.attendance_2")]: Clock,
  [arabicSource("common.salaries_2")]: Wallet,
  [arabicSource("common.behavior")]: Shield,
  [arabicSource("common.training")]: Users,
  [arabicSource("common.general")]: FileText,
};

const categories = [arabicSource("common.all"), arabicSource("common.vacations_2"), arabicSource("common.attendance_2"), arabicSource("common.salaries_2"), arabicSource("common.behavior"), arabicSource("common.training"), arabicSource("common.general")];

const statusColors: Record<string, string> = {
  [arabicSource("common.is_active")]: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  [arabicSource("common.is_under_review")]: "bg-primary/10 border-primary/20 text-primary",
  [arabicSource("common.archived")]: "bg-muted/30 border-border text-muted-foreground",
};

const STATUS_OPTIONS = [arabicSource("common.is_active"), arabicSource("common.is_under_review"), arabicSource("common.archived")];

interface CreatePolicyForm {
  title: string;
  category: string;
  description: string;
  content: string;
}

interface EditPolicyForm extends CreatePolicyForm {
  id: string;
  status: string;
  version: number;
}

export function Policies() {
  const { policies, loading, refetch } = usePolicies();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(arabicSource("common.all"));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPolicy, setViewingPolicy] = useState<DbPolicy | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<EditPolicyForm | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState<CreatePolicyForm>({
    title: "",
    category: arabicSource("common.general"),
    description: "",
    content: "",
  });

  // Show toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter policies
  const filtered = policies.filter(p => {
    const matchSearch = (p.title?.includes(search) || p.description?.includes(search)) ?? false;
    const matchCat = selectedCategory === arabicSource("common.all") || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Calculate stats
  const stats = {
    total: policies.length,
    active: policies.filter(p => p.status === arabicSource("common.is_active")).length,
    underReview: policies.filter(p => p.status === arabicSource("common.is_under_review")).length,
    archived: policies.filter(p => p.status === arabicSource("common.archived")).length,
  };

  // Create policy
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.content.trim()) {
      showToast(arabicSource("common.please_fill_out_all_required_fields"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("policies").insert([
        {
          title: createForm.title,
          category: createForm.category,
          description: createForm.description,
          content: createForm.content,
          status: arabicSource("common.is_active"),
          version: 1,
          last_updated: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        }
      ]);

      if (error) throw error;

      showToast(arabicSource("policies.the_policy_was_created_successfully"));
      setCreateForm({ title: "", category: arabicSource("common.general"), description: "", content: "" });
      setShowCreateModal(false);
      await refetch();
    } catch (err: any) {
      showToast(arabicSource("common.error_2") + " " + (err.message || arabicSource("policies.policy_creation_failed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update policy
  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("policies")
        .update({
          title: editingPolicy.title,
          category: editingPolicy.category,
          description: editingPolicy.description,
          content: editingPolicy.content,
          status: editingPolicy.status,
          version: editingPolicy.version + 1,
          last_updated: new Date().toISOString().split('T')[0],
        })
        .eq("id", editingPolicy.id);

      if (error) throw error;

      showToast(arabicSource("policies.the_policy_was_updated_successfully"));
      setEditingPolicy(null);
      setShowEditModal(false);
      await refetch();
    } catch (err: any) {
      showToast(arabicSource("common.error_2") + " " + (err.message || arabicSource("policies.policy_update_failed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete policy
  const handleDeletePolicy = async (id: string) => {
    if (!localizedConfirm(arabicSource("policies.are_you_sure_you_want_to_delete_this_policy"))) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("policies")
        .delete()
        .eq("id", id);

      if (error) throw error;

      showToast(arabicSource("policies.the_policy_was_deleted_successfully"));
      await refetch();
    } catch (err: any) {
      showToast(arabicSource("common.error_2") + " " + (err.message || arabicSource("policies.policy_deletion_failed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (policy: DbPolicy) => {
    const statusMap: Record<string, string> = {
      [arabicSource("common.is_active")]: arabicSource("common.is_under_review"),
      [arabicSource("common.is_under_review")]: arabicSource("common.archived"),
      [arabicSource("common.archived")]: arabicSource("common.is_active"),
    };
    const newStatus = statusMap[policy.status] || arabicSource("common.is_active");

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("policies")
        .update({
          status: newStatus,
          last_updated: new Date().toISOString().split('T')[0],
        })
        .eq("id", policy.id);

      if (error) throw error;

      showToast(`${arabicSource("policies.status_changed_to")} ${newStatus}`);
      await refetch();
    } catch (err: any) {
      showToast(arabicSource("common.error_2") + " " + (err.message || arabicSource("policies.status_change_failed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (policy: DbPolicy) => {
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
  };

  // Open view modal
  const openViewModal = (policy: DbPolicy) => {
    setViewingPolicy(policy);
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gradient-gold">{arabicSource("common.policies_and_procedures")}</h1>
            <p className="text-muted-foreground mt-1">{arabicSource("common.internal_policies_and_systems_manual")}</p>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">{arabicSource("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gradient-gold">{arabicSource("common.policies_and_procedures")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("common.internal_policies_and_systems_manual")}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          {arabicSource("policies.add_policy")}
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: arabicSource("policies.total_policies"), value: stats.total, icon: FileText, iconBg: "bg-primary/10 border-primary/20", iconColor: "text-primary" },
          { label: arabicSource("policies.is_active"), value: stats.active, icon: CheckCircle, iconBg: "bg-emerald-500/10 border-emerald-500/20", iconColor: "text-emerald-400" },
          { label: arabicSource("common.is_under_review"), value: stats.underReview, icon: AlertTriangle, iconBg: "bg-primary/10 border-primary/20", iconColor: "text-primary" },
          { label: arabicSource("policies.archived"), value: stats.archived, icon: Archive, iconBg: "bg-muted/10 border-border", iconColor: "text-muted-foreground" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-lg relative overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent w-28 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="text-gradient-gold text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg border ${stat.iconBg}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input
            type="text"
            placeholder={arabicSource("policies.policy_research")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              style={{ fontSize: 13 }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} message={arabicSource("policies.there_are_no_matching_policies_for_your_search")} />
        ) : (
          filtered.map((policy, i) => {
            const Icon = CATEGORY_ICONS[policy.category] || FileText;
            const isExpanded = expandedPolicy === policy.id;

            return (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
              >
                <button
                  onClick={() => setExpandedPolicy(isExpanded ? null : policy.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-start">
                      <h3 className="text-foreground font-medium">{policy.title}</h3>
                      <p className="text-muted-foreground" style={{ fontSize: 13 }}>
                        {policy.description || arabicSource("policies.no_description")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-md border ${statusColors[policy.status]}`} style={{ fontSize: 11 }}>
                        {policy.status}
                      </span>
                      <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                        v{policy.version}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 border-t border-border/20 space-y-4">
                        {/* Content Preview */}
                        <div className="p-4 rounded-lg bg-muted/20">
                          <p className="text-foreground whitespace-pre-line" style={{ fontSize: 13, lineHeight: 1.8 }}>
                            {policy.content?.substring(0, 200) || arabicSource("policies.no_content")}
                            {policy.content && policy.content.length > 200 && "..."}
                          </p>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">{arabicSource("common.category")}</p>
                            <p className="text-foreground font-medium">{policy.category}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{arabicSource("policies.latest_update")}</p>
                            <p className="text-foreground font-medium" dir="ltr">
                              {policy.last_updated}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{arabicSource("common.version")}</p>
                            <p className="text-foreground font-medium">v{policy.version}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => openViewModal(policy)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            {arabicSource("policies.full_view")}
                          </button>
                          <button
                            onClick={() => openEditModal(policy)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors cursor-pointer"
                            disabled={isSubmitting}
                          >
                            <Edit2 className="w-4 h-4" />
                            {arabicSource("common.edit")}
                          </button>
                          <button
                            onClick={() => handleToggleStatus(policy)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded text-xs hover:bg-amber-500/30 transition-colors cursor-pointer"
                            disabled={isSubmitting}
                          >
                            <RotateCcw className="w-4 h-4" />
                            {arabicSource("policies.change_status")}
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(policy.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors cursor-pointer"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                            {arabicSource("common.delete")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border/40 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{arabicSource("policies.add_a_new_policy")}</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePolicy} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.address")}</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder={arabicSource("policies.enter_the_policy_title")}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.category")}</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                  >
                    {[arabicSource("common.vacations_2"), arabicSource("common.attendance_2"), arabicSource("common.salaries_2"), arabicSource("common.behavior"), arabicSource("common.training"), arabicSource("common.general")].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.description")}</label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder={arabicSource("policies.brief_description_of_the_policy")}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.content")}</label>
                  <textarea
                    value={createForm.content}
                    onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                    placeholder={arabicSource("policies.enter_the_full_policy_content")}
                    rows={8}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {arabicSource("policies.create_the_policy")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    {arabicSource("common.cancel")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingPolicy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border/40 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{arabicSource("policies.modify_the_policy")}</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePolicy} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.address")}</label>
                  <input
                    type="text"
                    value={editingPolicy.title}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.category")}</label>
                  <select
                    value={editingPolicy.category}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                  >
                    {[arabicSource("common.vacations_2"), arabicSource("common.attendance_2"), arabicSource("common.salaries_2"), arabicSource("common.behavior"), arabicSource("common.training"), arabicSource("common.general")].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.description")}</label>
                  <input
                    type="text"
                    value={editingPolicy.description}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.status")}</label>
                  <select
                    value={editingPolicy.status}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{arabicSource("common.content")}</label>
                  <textarea
                    value={editingPolicy.content}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, content: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
                  />
                </div>

                {/* Version Info */}
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {arabicSource("policies.current_version")} <span className="text-foreground font-medium">v{editingPolicy.version}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {arabicSource("policies.the_version_will_be_automatically_upgraded_upon_saving")}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {arabicSource("policies.save_the_modifications")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    {arabicSource("common.cancel")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && viewingPolicy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border/40 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{viewingPolicy.title}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{viewingPolicy.description}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border/20">
                  <div>
                    <p className="text-muted-foreground text-sm">{arabicSource("common.category")}</p>
                    <p className="text-foreground font-medium">{viewingPolicy.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{arabicSource("common.status")}</p>
                    <p className={`text-sm font-medium px-2 py-1 rounded-md border w-fit ${statusColors[viewingPolicy.status]}`}>
                      {viewingPolicy.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{arabicSource("common.version")}</p>
                    <p className="text-foreground font-medium">v{viewingPolicy.version}</p>
                  </div>
                </div>

                {/* Full Content */}
                <div className="p-4 bg-muted/10 rounded-lg border border-border/20">
                  <p className="text-foreground whitespace-pre-wrap" style={{ lineHeight: 2 }}>
                    {viewingPolicy.content}
                  </p>
                </div>

                {/* Footer Info */}
                <div className="pt-4 border-t border-border/20 text-xs text-muted-foreground">
                  <p>{arabicSource("policies.latest_update_2")} {viewingPolicy.last_updated}</p>
                  <p>{arabicSource("policies.created")} {viewingPolicy.created_at}</p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  {arabicSource("common.close")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-6 start-6 z-50 border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2.5 pointer-events-auto bg-card border-green-500/40"
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500/20">
            <CheckCircle className="w-3 h-3 text-green-400" />
          </div>
          <span className="text-foreground text-sm">{toastMessage}</span>
        </motion.div>
      )}
    </div>
  );
}
