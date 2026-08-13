import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { localizedConfirm } from "../i18n/native";
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
import { EmployeeSelect } from "../components/EmployeeSelect";
import * as odooData from "../lib/api/odooData";
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
import { arabicSource } from "../i18n/source";

// Odoo's lugal.hr.training.* models use fixed English selections; the FE
// displays Arabic labels driven by configurations. Map between them explicitly.
const TRAINING_STATUS_TO_ODOO: Record<string, string> = {
  "قادم": "planned", "جاري": "in_progress", "مكتمل": "completed", "ملغي": "cancelled",
};
const ODOO_TO_TRAINING_STATUS: Record<string, string> = {
  planned: "قادم", in_progress: "جاري", completed: "مكتمل", cancelled: "ملغي",
};
const PARTICIPANT_STATUS_TO_ODOO: Record<string, string> = {
  "مسجل": "enrolled", "جاري": "in_progress", "مكتمل": "completed", "منسحب": "withdrawn",
};
const ODOO_TO_PARTICIPANT_STATUS: Record<string, string> = {
  enrolled: "مسجل", in_progress: "جاري", completed: "مكتمل", failed: "مكتمل", withdrawn: "منسحب",
};

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
  const trainingCategories = (getValue('training.categories', arabicSource("training.business_objectives_business_development_technical_skills_leader"))).split(',').map(s => s.trim());
  const trainingStatuses = (getValue('training.statuses', arabicSource("training.upcoming_ongoing_completed_cancelled"))).split(',').map(s => s.trim());
  const participantStatuses = (getValue('training.participant_statuses', arabicSource("training.registered_ongoing_completed_withdrawn"))).split(',').map(s => s.trim());
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

  const [filter, setFilter] = useState(arabicSource("common.all"));
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<DbTrainingProgram | null>(null);
  const [selectedProgramForParticipants, setSelectedProgramForParticipants] = useState<string | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProgramForm>({
    title: "",
    category: trainingCategories[0] || arabicSource("common.business_objectives"),
    weight: `${defaultWeight}%`,
    instructor: "",
    duration: "",
    status: trainingStatuses[0] || arabicSource("common.is_coming"),
    max_participants: "",
    start_date: "",
    end_date: "",
    objectives: "",
  });
  const [enrollForm, setEnrollForm] = useState<EnrollParticipantForm>({
    employee_id: "",
    completion_status: participantStatuses[0] || arabicSource("common.registered"),
    score: "",
  });

  const showToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const filters = [arabicSource("common.all"), ...trainingCategories];

  // Translate Odoo enum keys → Arabic display labels
  const displayPrograms = useMemo(() => {
    return programs.map((p) => ({ ...p, status: ODOO_TO_TRAINING_STATUS[p.status] || p.status }));
  }, [programs]);
  const displayParticipants = useMemo(() => {
    return allParticipants.map((p) => ({
      ...p,
      completion_status: ODOO_TO_PARTICIPANT_STATUS[p.completion_status] || p.completion_status,
    }));
  }, [allParticipants]);

  const filtered = useMemo(() => {
    let result = displayPrograms;
    if (filter !== arabicSource("common.all")) {
      result = result.filter((p) => p.category === filter);
    }
    if (searchTerm) {
      result = result.filter((p) => p.title.includes(searchTerm));
    }
    return result;
  }, [displayPrograms, filter, searchTerm]);

  const programParticipants = (programId: string) => {
    return displayParticipants.filter((p) => p.training_program_id === programId);
  };

  const stats = useMemo(() => {
    return {
      totalPrograms: displayPrograms.length,
      ongoingPrograms: displayPrograms.filter((p) => p.status === arabicSource("common.my_neighbor")).length,
      completedPrograms: displayPrograms.filter((p) => p.status === arabicSource("common.complete")).length,
      totalParticipants: displayParticipants.length,
      completionRate: displayParticipants.length > 0
        ? Math.round((displayParticipants.filter((p) => p.completion_status === arabicSource("common.complete")).length / displayParticipants.length) * 100)
        : 0,
    };
  }, [displayPrograms, displayParticipants]);

  const handleCreateProgram = async () => {
    if (!createForm.title || !createForm.category) {
      showToast("error", arabicSource("training.please_fill_in_the_required_data"));
      return;
    }

    try {
      const objectives = createForm.objectives
        ? createForm.objectives.split("\n").filter((o) => o.trim())
        : [];

      const payload = {
        title: createForm.title,
        category: createForm.category,
        weight: createForm.weight,
        instructor: createForm.instructor || null,
        duration: createForm.duration || null,
        status: TRAINING_STATUS_TO_ODOO[createForm.status] || "planned",
        completion_rate: 0,
        max_participants: createForm.max_participants ? parseInt(createForm.max_participants) : null,
        start_date: createForm.start_date || null,
        end_date: createForm.end_date || null,
        objectives: objectives.length > 0 ? objectives : null,
      };

      await odooData.createTrainingProgram(payload);

      showToast("success", arabicSource("training.the_training_program_has_been_created_successfully"));
      setCreateForm({
        title: "",
        category: trainingCategories[0] || arabicSource("common.business_objectives"),
        weight: `${defaultWeight}%`,
        instructor: "",
        duration: "",
        status: trainingStatuses[0] || arabicSource("common.is_coming"),
        max_participants: "",
        start_date: "",
        end_date: "",
        objectives: "",
      });
      setShowCreateModal(false);
      refetchPrograms();
    } catch (err) {
      showToast("error", arabicSource("training.error_creating_the_program"));
    }
  };

  const handleUpdateProgram = async () => {
    if (!editingProgram) return;

    try {
      const status = TRAINING_STATUS_TO_ODOO[editingProgram.status] || editingProgram.status;
      await odooData.updateTrainingProgram(editingProgram.id, {
        status,
        completion_rate: editingProgram.completion_rate,
        instructor: editingProgram.instructor,
        duration: editingProgram.duration,
      });

      showToast("success", arabicSource("training.the_software_has_been_updated_successfully"));
      setEditingProgram(null);
      refetchPrograms();
    } catch (err) {
      showToast("error", arabicSource("training.software_update_error"));
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!localizedConfirm(arabicSource("training.do_you_want_to_delete_this_training_program"))) return;

    try {
      await odooData.deleteTrainingProgram(id);

      showToast("success", arabicSource("training.the_program_was_deleted_successfully"));
      refetchPrograms();
      refetchParticipants();
    } catch (err) {
      showToast("error", arabicSource("training.error_deleting_the_program"));
    }
  };

  const handleEnrollParticipant = async () => {
    if (!enrollForm.employee_id || !selectedProgramForParticipants) {
      showToast("error", arabicSource("training.please_select_an_employee"));
      return;
    }

    try {
      await odooData.createTrainingParticipant({
        training_program_id: selectedProgramForParticipants,
        employee_id: enrollForm.employee_id,
        completion_status: PARTICIPANT_STATUS_TO_ODOO[enrollForm.completion_status] || "enrolled",
        score: enrollForm.score ? parseInt(enrollForm.score) : null,
      });

      showToast("success", arabicSource("training.the_employee_has_been_successfully_registered_in_the_program"));
      setEnrollForm({
        employee_id: "",
        completion_status: participantStatuses[0] || arabicSource("common.registered"),
        score: "",
      });
      setShowEnrollModal(false);
      refetchParticipants();
    } catch (err) {
      showToast("error", arabicSource("training.error_in_employee_registration"));
    }
  };

  const handleMarkCompleted = async (participantId: string, score: number) => {
    try {
      await odooData.updateTrainingParticipant(participantId, {
        completion_status: "completed",
        score,
      });

      showToast("success", arabicSource("training.participant_status_has_been_updated"));
      refetchParticipants();
    } catch (err) {
      showToast("error", arabicSource("training.update_error"));
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!localizedConfirm(arabicSource("training.do_you_want_to_delete_this_participant_from_the_program"))) return;

    try {
      await odooData.deleteTrainingParticipant(participantId);

      showToast("success", arabicSource("training.participant_has_been_successfully_deleted"));
      refetchParticipants();
    } catch (err) {
      showToast("error", arabicSource("training.error_deleting_participant"));
    }
  };

  // Calculate monthly hours from programs
  const monthlyHours = useMemo(() => {
    const months = [arabicSource("common.january"), arabicSource("common.february"), arabicSource("common.march"), arabicSource("common.april"), arabicSource("common.may"), arabicSource("common.jun")];
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
          <h1 className="text-gradient-gold">{arabicSource("common.training_and_development")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("training.managing_training_programs_and_participants")}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {arabicSource("training.new_program")}
        </button>
      </div>

      {/* Weight Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-foreground mb-4">{arabicSource("training.distribution_of_training_weights")}</h3>
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
                    {arabicSource("training.programs")} {cat}
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
          { label: arabicSource("common.total_programs"), value: stats.totalPrograms, icon: BookOpen },
          { label: arabicSource("training.ongoing_programs"), value: stats.ongoingPrograms, icon: Play },
          { label: arabicSource("training.completed_programs"), value: stats.completedPrograms, icon: Award },
          { label: arabicSource("training.total_participants"), value: stats.totalParticipants, icon: Users },
          { label: arabicSource("common.completion_rate"), value: `${stats.completionRate}%`, icon: CheckCircle },
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
        <h3 className="text-foreground mb-4">{arabicSource("training.monthly_training_hours")}</h3>
        <CustomBarChart
          data={monthlyHours.map((d) => ({ label: d.month, value: d.hours }))}
          barLabel={arabicSource("common.hours_2")}
          height={250}
        />
      </motion.div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={arabicSource("training.searching_for_a_program")}
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
                        {program.instructor || arabicSource("training.without_a_coach")}
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
                    <Users className="w-3 h-3" /> {participants.length} {arabicSource("training.participant")}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                      {arabicSource("common.completion_rate")}
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
                    <h4 className="text-sm text-foreground">{arabicSource("training.participants")}</h4>
                    <button
                      onClick={() => {
                        setSelectedProgramForParticipants(program.id);
                        setShowEnrollModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {arabicSource("common.addition")}
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
                          {p.completion_status !== arabicSource("common.complete") && (
                            <button
                              onClick={() => handleMarkCompleted(p.id, 85)}
                              className="ml-2 p-1 hover:bg-emerald-500/20 rounded transition-colors"
                              title={arabicSource("training.status_update")}
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
                    <p className="text-xs text-muted-foreground">{arabicSource("training.there_are_no_participants")}</p>
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
                <h2 className="text-xl text-foreground">{arabicSource("training.new_training_program")}</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground mb-2">{arabicSource("training.address")}</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    placeholder={arabicSource("training.program_title")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-foreground mb-2">{arabicSource("training.category")}</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    >
                      {trainingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">{arabicSource("training.weight")}</label>
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
                    <label className="block text-sm text-foreground mb-2">{arabicSource("common.coach")}</label>
                    <input
                      type="text"
                      value={createForm.instructor}
                      onChange={(e) => setCreateForm({ ...createForm, instructor: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                      placeholder={arabicSource("training.name_of_coach")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">{arabicSource("common.duration_hours")}</label>
                    <input
                      type="text"
                      value={createForm.duration}
                      onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                      placeholder={arabicSource("training.20_hours")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-foreground mb-2">{arabicSource("common.start_date")}</label>
                    <input
                      type="date"
                      value={createForm.start_date}
                      onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">{arabicSource("training.end_date")}</label>
                    <input
                      type="date"
                      value={createForm.end_date}
                      onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-2">{arabicSource("common.status")}</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                  >
                    {trainingStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-2">{arabicSource("training.maximum_participants")}</label>
                  <input
                    type="number"
                    value={createForm.max_participants}
                    onChange={(e) => setCreateForm({ ...createForm, max_participants: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-2">{arabicSource("training.targets_each_target_in_a_line")}</label>
                  <textarea
                    value={createForm.objectives}
                    onChange={(e) => setCreateForm({ ...createForm, objectives: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60 resize-none"
                    placeholder={arabicSource("training.the_first_goal_the_second_goal_the_third_goal")}
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border/20">
                  <button
                    onClick={handleCreateProgram}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {arabicSource("training.save_the_program")}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {arabicSource("common.cancel")}
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
                <h2 className="text-xl text-foreground">{arabicSource("training.modify_the_program")}</h2>
                <button
                  onClick={() => setEditingProgram(null)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground mb-2">{arabicSource("common.coach")}</label>
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
                  <label className="block text-sm text-foreground mb-2">{arabicSource("common.duration_hours")}</label>
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
                    <label className="block text-sm text-foreground mb-2">{arabicSource("common.status")}</label>
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
                    <label className="block text-sm text-foreground mb-2">{arabicSource("training.completion_rate")}</label>
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
                    {arabicSource("common.save_changes")}
                  </button>
                  <button
                    onClick={() => setEditingProgram(null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {arabicSource("common.cancel")}
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
                <h2 className="text-xl text-foreground">{arabicSource("training.register_a_new_employee")}</h2>
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground mb-2">{arabicSource("common.employee_3")}</label>
                  <EmployeeSelect
                    employees={employees}
                    labels={Object.fromEntries(employees.map((e) => [String(e.id), empDisplayName(e)]))}
                    value={enrollForm.employee_id}
                    onChange={(id) => setEnrollForm({ ...enrollForm, employee_id: String(id) })}
                    placeholder={arabicSource("training.select_employee")}
                    excludeIds={programParticipants(selectedProgramForParticipants || "").map((p) => p.employee_id)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-foreground mb-2">{arabicSource("training.join_status")}</label>
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

                {enrollForm.completion_status === arabicSource("common.complete") && (
                  <div>
                    <label className="block text-sm text-foreground mb-2">{arabicSource("training.grade")}</label>
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
                    {arabicSource("training.register")}
                  </button>
                  <button
                    onClick={() => setShowEnrollModal(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {arabicSource("common.cancel")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {programsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{arabicSource("common.loading")}</div>
        </div>
      )}
    </div>
  );
}
