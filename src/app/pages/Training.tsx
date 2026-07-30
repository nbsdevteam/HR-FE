import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Target,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  Play,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Filter,
  Save,
  AlertCircle,
} from "lucide-react";
import { CustomBarChart } from "../components/custom-bar-chart";
import { DonutChart } from "../components/donut-chart";
import { supabase } from "../lib/supabase";
import {
  useTrainingPrograms,
  useTrainingParticipants,
  useEmployees,
  useConfigurations,
  empDisplayName,
  DbTrainingProgram,
  DbTrainingParticipant,
  DbEmployee,
} from "../lib/hooks";

// Color palettes for dynamic status/participant status assignment
const statusColorPalette = [
  "bg-blue-500/10 border-blue-500/20 text-blue-400",
  "bg-primary/10 border-primary/20 text-primary",
  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  "bg-muted/30 border-border text-muted-foreground",
];
const statusIconPalette = [Calendar, Play, CheckCircle, AlertCircle];

const participantStatusColorPalette = [
  "bg-blue-500/10 border-blue-500/20 text-blue-400",
  "bg-primary/10 border-primary/20 text-primary",
  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  "bg-red-500/10 border-red-500/20 text-red-400",
];

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface CreateProgramForm {
  title: string;
  category: string;
  weight: string;
  instructor: string;
  duration: string;
  status: string;
  max_participants: string;
  start_date: string;
  end_date: string;
  objectives: string;
}

interface EnrollParticipantForm {
  employee_id: string;
  completion_status: string;
  score: string;
}

export function Training() {
  const { programs, loading: programsLoading, refetch: refetchPrograms } = useTrainingPrograms();
  const { participants: allParticipants, refetch: refetchParticipants } = useTrainingParticipants();
  const { employees } = useEmployees();
  const { getValue, getNumber } = useConfigurations();

  // Training categories, statuses, and participant statuses — all from configurations table
  const trainingCategories = (getValue('training.categories', 'أهداف العمل,تطوير الأعمال,المهارات التقنية,القيادة والإدارة,السلامة المهنية')).split(',').map(s => s.trim());
  const trainingStatuses = (getValue('training.statuses', 'قادم,جاري,مكتمل,ملغي')).split(',').map(s => s.trim());
  const participantStatuses = (getValue('training.participant_statuses', 'مسجل,جاري,مكتمل,منسحب')).split(',').map(s => s.trim());
  const defaultWeight = getNumber('training.default_weight', 70);

  // Build dynamic color/icon maps from config-driven lists
  const statusColors: Record<string, string> = {};
  const statusIcons: Record<string, any> = {};
  trainingStatuses.forEach((s, i) => {
    statusColors[s] = statusColorPalette[Math.min(i, statusColorPalette.length - 1)];
    statusIcons[s] = statusIconPalette[Math.min(i, statusIconPalette.length - 1)];
  });
  const participantStatusColors: Record<string, string> = {};
  participantStatuses.forEach((s, i) => {
    participantStatusColors[s] = participantStatusColorPalette[Math.min(i, participantStatusColorPalette.length - 1)];
  });

  const [filter, setFilter] = useState("الكل");
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<DbTrainingProgram | null>(null);
  const [selectedProgramForParticipants, setSelectedProgramForParticipants] = useState<string | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProgramForm>({
    title: "",
    category: trainingCategories[0] || "أهداف العمل",
    weight: `${defaultWeight}%`,
    instructor: "",
    duration: "",
    status: trainingStatuses[0] || "قادم",
    max_participants: "",
    start_date: "",
    end_date: "",
    objectives: "",
  });
  const [enrollForm, setEnrollForm] = useState<EnrollParticipantForm>({
    employee_id: "",
    completion_status: participantStatuses[0] || "مسجل",
    score: "",
  });

  const showToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const filters = ["الكل", ...trainingCategories];

  const filtered = useMemo(() => {
    let result = programs;
    if (filter !== "الكل") {
      result = result.filter((p) => p.category === filter);
    }
    if (searchTerm) {
      result = result.filter((p) => p.title.includes(searchTerm));
    }
    return result;
  }, [programs, filter, searchTerm]);

  const programParticipants = (programId: string) => {
    return allParticipants.filter((p) => p.training_program_id === programId);
  };

  const stats = useMemo(() => {
    return {
      totalPrograms: programs.length,
      ongoingPrograms: programs.filter((p) => p.status === "جاري").length,
      completedPrograms: programs.filter((p) => p.status === "مكتمل").length,
      totalParticipants: allParticipants.length,
      completionRate: allParticipants.length > 0
        ? Math.round((allParticipants.filter((p) => p.completion_status === "مكتمل").length / allParticipants.length) * 100)
        : 0,
    };
  }, [programs, allParticipants]);

  const handleCreateProgram = async () => {
    if (!createForm.title || !createForm.category) {
      showToast("error", "يرجى ملء البيانات المطلوبة");
      return;
    }

    try {
      const objectives = createForm.objectives
        ? createForm.objectives.split("\n").filter((o) => o.trim())
        : [];

      const { error } = await supabase.from("training_programs").insert({
        title: createForm.title,
        category: createForm.category,
        weight: createForm.weight,
        instructor: createForm.instructor || null,
        duration: createForm.duration || null,
        status: createForm.status,
        completion_rate: 0,
        max_participants: createForm.max_participants ? parseInt(createForm.max_participants) : null,
        start_date: createForm.start_date || null,
        end_date: createForm.end_date || null,
        objectives: objectives.length > 0 ? objectives : null,
      });

      if (error) throw error;

      showToast("success", "تم إنشاء البرنامج التدريبي بنجاح");
      setCreateForm({
        title: "",
        category: trainingCategories[0] || "أهداف العمل",
        weight: `${defaultWeight}%`,
        instructor: "",
        duration: "",
        status: trainingStatuses[0] || "قادم",
        max_participants: "",
        start_date: "",
        end_date: "",
        objectives: "",
      });
      setShowCreateModal(false);
      refetchPrograms();
    } catch (err) {
      showToast("error", "خطأ في إنشاء البرنامج");
    }
  };

  const handleUpdateProgram = async () => {
    if (!editingProgram) return;

    try {
      const { error } = await supabase
        .from("training_programs")
        .update({
          status: editingProgram.status,
          completion_rate: editingProgram.completion_rate,
          instructor: editingProgram.instructor,
          duration: editingProgram.duration,
        })
        .eq("id", editingProgram.id);

      if (error) throw error;

      showToast("success", "تم تحديث البرنامج بنجاح");
      setEditingProgram(null);
      refetchPrograms();
    } catch (err) {
      showToast("error", "خطأ في تحديث البرنامج");
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm("هل تريد حذف هذا البرنامج التدريبي؟")) return;

    try {
      // Delete participants first
      await supabase.from("training_participants").delete().eq("training_program_id", id);

      // Delete program
      const { error } = await supabase.from("training_programs").delete().eq("id", id);

      if (error) throw error;

      showToast("success", "تم حذف البرنامج بنجاح");
      refetchPrograms();
      refetchParticipants();
    } catch (err) {
      showToast("error", "خطأ في حذف البرنامج");
    }
  };

  const handleEnrollParticipant = async () => {
    if (!enrollForm.employee_id || !selectedProgramForParticipants) {
      showToast("error", "يرجى اختيار الموظف");
      return;
    }

    try {
      const { error } = await supabase.from("training_participants").insert({
        training_program_id: selectedProgramForParticipants,
        employee_id: enrollForm.employee_id,
        completion_status: enrollForm.completion_status,
        score: enrollForm.score ? parseInt(enrollForm.score) : null,
        enrolled_at: new Date().toISOString(),
        completed_at: enrollForm.completion_status === "مكتمل" ? new Date().toISOString() : null,
      });

      if (error) throw error;

      showToast("success", "تم تسجيل الموظف في البرنامج بنجاح");
      setEnrollForm({
        employee_id: "",
        completion_status: participantStatuses[0] || "مسجل",
        score: "",
      });
      setShowEnrollModal(false);
      refetchParticipants();
    } catch (err) {
      showToast("error", "خطأ في تسجيل الموظف");
    }
  };

  const handleMarkCompleted = async (participantId: string, score: number) => {
    try {
      const { error } = await supabase
        .from("training_participants")
        .update({
          completion_status: "مكتمل",
          score: score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", participantId);

      if (error) throw error;

      showToast("success", "تم تحديث حالة المشارك");
      refetchParticipants();
    } catch (err) {
      showToast("error", "خطأ في التحديث");
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm("هل تريد حذف هذا المشارك من البرنامج؟")) return;

    try {
      const { error } = await supabase
        .from("training_participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;

      showToast("success", "تم حذف المشارك بنجاح");
      refetchParticipants();
    } catch (err) {
      showToast("error", "خطأ في حذف المشارك");
    }
  };

  // Calculate monthly hours from programs
  const monthlyHours = useMemo(() => {
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];
    return months.map((month, idx) => {
      const count = programs.filter((p) => {
        if (!p.start_date) return false;
        const startMonth = new Date(p.start_date).getMonth();
        return startMonth === idx;
      }).length;
      const totalHours = programs
        .filter((p) => {
          if (!p.start_date) return false;
          const startMonth = new Date(p.start_date).getMonth();
          return startMonth === idx;
        })
        .reduce((sum, p) => sum + (p.duration ? parseInt(p.duration) : 0), 0);
      return { month, hours: totalHours || count * 20 };
    });
  }, [programs]);

  const categoryColorPalette = ["#D4AF37", "#F7E7CE", "#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
  const categoryDistribution = useMemo(() => {
    const counts = trainingCategories.map(cat => ({
      cat,
      count: programs.filter(p => p.category === cat).length,
    }));
    const total = counts.reduce((s, c) => s + c.count, 0) || 1;
    return counts.map((c, i) => ({
      name: `${c.cat} (${Math.round((c.count / total) * 100)}%)`,
      value: (c.count / total) * 100,
      color: categoryColorPalette[i % categoryColorPalette.length],
    }));
  }, [programs, trainingCategories]);

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? empDisplayName(emp) : employeeId;
  };

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`fixed bottom-6 start-6 z-50 border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2.5 pointer-events-auto ${
              toast.type === "success"
                ? "bg-card border-green-500/40"
                : toast.type === "error"
                  ? "bg-card border-red-500/40"
                  : "bg-card border-blue-500/40"
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              toast.type === "success" ? "bg-green-500/20" : toast.type === "error" ? "bg-red-500/20" : "bg-blue-500/20"
            }`}>
              <CheckCircle className={`w-3 h-3 ${
                toast.type === "success" ? "text-green-400" : toast.type === "error" ? "text-red-400" : "text-blue-400"
              }`} />
            </div>
            <span className="text-foreground text-sm">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gradient-gold">التدريب والتطوير</h1>
          <p className="text-muted-foreground mt-1">إدارة برامج التدريب والمشاركين</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          برنامج جديد
        </button>
      </div>

      {/* Weight Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-foreground mb-4">توزيع الأوزان التدريبية</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-1 flex items-center justify-center">
            <DonutChart data={categoryDistribution} size={180} innerRadius={50} outerRadius={80} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {trainingCategories.slice(0, 4).map((cat, idx) => {
              const icons = [Target, TrendingUp, BookOpen, Award];
              const bgColors = ["bg-primary/5 border-primary/20", "bg-accent/5 border-accent/20", "bg-blue-500/5 border-blue-500/20", "bg-emerald-500/5 border-emerald-500/20"];
              const iconColors = ["text-primary", "text-accent", "text-blue-400", "text-emerald-400"];
              const CatIcon = icons[idx % icons.length];
              return (
                <div key={cat} className={`p-4 rounded-xl ${bgColors[idx % bgColors.length]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CatIcon className={`w-5 h-5 ${iconColors[idx % iconColors.length]}`} />
                    <h4 className="text-foreground">{cat}</h4>
                  </div>
                  <span className="text-gradient-gold" style={{ fontSize: 36 }}>
                    {programs.filter(p => p.category === cat).length}
                  </span>
                  <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
                    برامج {cat}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: "إجمالي البرامج", value: stats.totalPrograms, icon: BookOpen },
          { label: "برامج جارية", value: stats.ongoingPrograms, icon: Play },
          { label: "برامج مكتملة", value: stats.completedPrograms, icon: Award },
          { label: "إجمالي المشاركين", value: stats.totalParticipants, icon: Users },
          { label: "نسبة الإنجاز", value: `${stats.completionRate}%`, icon: CheckCircle },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: 13 }}>
                    {stat.label}
                  </p>
                  <span className="text-gradient-gold block mt-2" style={{ fontSize: 28 }}>
                    {stat.value}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Monthly Hours Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-foreground mb-4">الساعات التدريبية الشهرية</h3>
        <CustomBarChart
          data={monthlyHours.map((d) => ({ label: d.month, value: d.hours }))}
          barLabel="الساعات"
          height={250}
        />
      </motion.div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="البحث عن برنامج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-4 pe-10 py-2 rounded-lg bg-card border border-border/40 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Training Programs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filtered.map((program, i) => {
            const StatusIcon = statusIcons[program.status];
            const participants = programParticipants(program.id);

            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -3 }}
                className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-lg hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-foreground">{program.title}</h3>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                        {program.instructor || "بدون مدرب"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingProgram(program)}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-primary" />
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(program.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${statusColors[program.status]}`}
                  style={{ fontSize: 12 }}
                >
                  <StatusIcon className="w-3 h-3" />
                  {program.status}
                </span>

                <div className="flex flex-wrap gap-3 my-3">
                  <span
                    className={`px-2 py-0.5 rounded-md border ${
                      statusColorPalette[trainingCategories.indexOf(program.category) % statusColorPalette.length] || "bg-primary/10 border-primary/20 text-primary"
                    }`}
                    style={{ fontSize: 11 }}
                  >
                    {program.category} ({program.weight})
                  </span>
                  {program.duration && (
                    <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 12 }}>
                      <Clock className="w-3 h-3" /> {program.duration}
                    </span>
                  )}
                  <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 12 }}>
                    <Users className="w-3 h-3" /> {participants.length} مشارك
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                      نسبة الإنجاز
                    </span>
                    <span className="text-foreground" style={{ fontSize: 11 }}>
                      {program.completion_rate}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${program.completion_rate}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>

                {/* Objectives */}
                {program.objectives && program.objectives.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {program.objectives.slice(0, 2).map((obj, oi) => (
                      <p key={oi} className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 11 }}>
                        <Target className="w-3 h-3 text-primary flex-shrink-0" />
                        {obj}
                      </p>
                    ))}
                  </div>
                )}

                {/* Participants section */}
                <div className="mt-4 pt-4 border-t border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm text-foreground">المشاركون</h4>
                    <button
                      onClick={() => {
                        setSelectedProgramForParticipants(program.id);
                        setShowEnrollModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      إضافة
                    </button>
                  </div>

                  {participants.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded bg-card/50 border border-border/20"
                        >
                          <div className="flex-1">
                            <p className="text-xs text-foreground">{getEmployeeName(p.employee_id)}</p>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs mt-1 border ${participantStatusColors[p.completion_status]}`}
                            >
                              {p.completion_status}
                            </span>
                          </div>
                          {p.score && (
                            <span className="text-xs text-primary font-semibold ms-2">{p.score}%</span>
                          )}
                          {p.completion_status !== "مكتمل" && (
                            <button
                              onClick={() => handleMarkCompleted(p.id, 85)}
                              className="ml-2 p-1 hover:bg-emerald-500/20 rounded transition-colors"
                              title="تحديث الحالة"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteParticipant(p.id)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">لا يوجد مشاركون</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/40 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-foreground">برنامج تدريبي جديد</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground mb-2">العنوان *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    placeholder="عنوان البرنامج"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-foreground mb-2">الفئة *</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    >
                      {trainingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">الوزن</label>
                    <input
                      type="text"
                      value={createForm.weight}
                      onChange={(e) => setCreateForm({ ...createForm, weight: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                      placeholder={`${defaultWeight}%`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-foreground mb-2">المدرب</label>
                    <input
                      type="text"
                      value={createForm.instructor}
                      onChange={(e) => setCreateForm({ ...createForm, instructor: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                      placeholder="اسم المدرب"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">المدة (ساعات)</label>
                    <input
                      type="text"
                      value={createForm.duration}
                      onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                      placeholder="20 ساعة"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-foreground mb-2">تاريخ البداية</label>
                    <input
                      type="date"
                      value={createForm.start_date}
                      onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">تاريخ النهاية</label>
                    <input
                      type="date"
                      value={createForm.end_date}
                      onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-2">الحالة</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                  >
                    {trainingStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-2">الحد الأقصى للمشاركين</label>
                  <input
                    type="number"
                    value={createForm.max_participants}
                    onChange={(e) => setCreateForm({ ...createForm, max_participants: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-2">الأهداف (كل هدف في سطر)</label>
                  <textarea
                    value={createForm.objectives}
                    onChange={(e) => setCreateForm({ ...createForm, objectives: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60 resize-none"
                    placeholder="الهدف الأول&#10;الهدف الثاني&#10;الهدف الثالث"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border/20">
                  <button
                    onClick={handleCreateProgram}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    حفظ البرنامج
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/40 rounded-xl p-6 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-foreground">تعديل البرنامج</h2>
                <button
                  onClick={() => setEditingProgram(null)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground mb-2">المدرب</label>
                  <input
                    type="text"
                    value={editingProgram.instructor || ""}
                    onChange={(e) =>
                      setEditingProgram({
                        ...editingProgram,
                        instructor: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-2">المدة (ساعات)</label>
                  <input
                    type="text"
                    value={editingProgram.duration || ""}
                    onChange={(e) =>
                      setEditingProgram({
                        ...editingProgram,
                        duration: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-foreground mb-2">الحالة</label>
                    <select
                      value={editingProgram.status}
                      onChange={(e) =>
                        setEditingProgram({
                          ...editingProgram,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    >
                      {trainingStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">نسبة الإنجاز (%)</label>
                    <input
                      type="number"
                      value={editingProgram.completion_rate}
                      onChange={(e) =>
                        setEditingProgram({
                          ...editingProgram,
                          completion_rate: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border/20">
                  <button
                    onClick={handleUpdateProgram}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    حفظ التغييرات
                  </button>
                  <button
                    onClick={() => setEditingProgram(null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enroll Modal */}
      <AnimatePresence>
        {showEnrollModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/40 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-foreground">تسجيل موظف جديد</h2>
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground mb-2">الموظف *</label>
                  <select
                    value={enrollForm.employee_id}
                    onChange={(e) =>
                      setEnrollForm({ ...enrollForm, employee_id: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                  >
                    <option value="">اختر موظف</option>
                    {employees
                      .filter(
                        (e) =>
                          !programParticipants(selectedProgramForParticipants || "").some(
                            (p) => p.employee_id === e.id
                          )
                      )
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {empDisplayName(emp)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-2">حالة الانضمام</label>
                  <select
                    value={enrollForm.completion_status}
                    onChange={(e) =>
                      setEnrollForm({
                        ...enrollForm,
                        completion_status: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                  >
                    {participantStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {enrollForm.completion_status === "مكتمل" && (
                  <div>
                    <label className="block text-sm text-foreground mb-2">الدرجة (%)</label>
                    <input
                      type="number"
                      value={enrollForm.score}
                      onChange={(e) =>
                        setEnrollForm({ ...enrollForm, score: e.target.value })
                      }
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                      placeholder="85"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-border/20">
                  <button
                    onClick={handleEnrollParticipant}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    تسجيل
                  </button>
                  <button
                    onClick={() => setShowEnrollModal(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {programsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">جاري التحميل...</div>
        </div>
      )}
    </div>
  );
}
