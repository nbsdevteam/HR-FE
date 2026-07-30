import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Fingerprint, ScanFace, CreditCard, Server, Users, Activity,
  Search, RefreshCw, DoorOpen, DoorClosed,
  HardDrive, Loader2,
  Shield, Camera, Eye, Upload, X, Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { EmptyState } from "../components/EmptyState";

import { SYNC_API } from "../lib/constants";
const API = SYNC_API;

// ── Types ──

interface DeviceInfo {
  deviceName: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  macAddress: string;
}

interface Capacity {
  person: { used: number; total: number };
  face: { used: number; total: number };
  fingerprint: { used: number; total: number };
  card: { used: number; total: number };
  event: { used: number; total: number };
}

interface DevicePerson {
  employeeNo: string;
  name: string;
  userType: string;
  gender: string | null;
  numOfCard: number;
  numOfFP: number;
  numOfFace: number;
}

interface DeviceEvent {
  employeeNo: string;
  name: string;
  time: string;
  verifyMode: string;
  cardNo: string;
  doorNo: number;
}

interface BiometricDevice {
  id: string;
  name: string;
  model: string;
  ip_address: string;
  is_active: boolean;
}

type Tab = "overview" | "persons" | "events" | "face";

// ── Helper Components ──

function CapacityBar({ label, icon: Icon, used, total, color }: {
  label: string; icon: React.ElementType; used: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <div className="bg-card/30 backdrop-blur-md p-4 rounded-xl border border-border/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <span className="text-sm font-mono text-foreground">{used} / {total}</span>
      </div>
      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
      active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
             : "bg-red-500/10 text-red-400 border border-red-500/20"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-red-400"}`} />
      {active ? "متصل" : "غير متصل"}
    </span>
  );
}

function CredentialIcons({ fp, face, card }: { fp: number; face: number; card: number }) {
  return (
    <div className="flex items-center gap-2">
      {fp > 0 && (
        <div className="flex items-center gap-0.5 text-emerald-400" title={`${fp} بصمة`}>
          <Fingerprint className="w-3.5 h-3.5" /><span className="text-xs">{fp}</span>
        </div>
      )}
      {face > 0 && (
        <div className="flex items-center gap-0.5 text-blue-400" title={`${face} وجه`}>
          <ScanFace className="w-3.5 h-3.5" /><span className="text-xs">{face}</span>
        </div>
      )}
      {card > 0 && (
        <div className="flex items-center gap-0.5 text-amber-400" title={`${card} بطاقة`}>
          <CreditCard className="w-3.5 h-3.5" /><span className="text-xs">{card}</span>
        </div>
      )}
      {fp === 0 && face === 0 && card === 0 && (
        <span className="text-xs text-muted-foreground/50">لا بيانات</span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// Main Page Component
// ══════════════════════════════════════════

export function DeviceManagement() {
  const [tab, setTab] = useState<Tab>("overview");
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load registered devices from DB
  useEffect(() => {
    async function loadDevices() {
      const { data } = await supabase.from("biometric_devices").select("*").order("name");
      if (data && data.length > 0) {
        setDevices(data);
        setSelectedDevice(data[0].id);
      } else {
        // Use default device if none registered
        setDevices([{
          id: "default",
          name: "جهاز البصمة الرئيسي",
          model: "DS-K1T342MFWX",
          ip_address: "192.168.15.15",
          is_active: true,
        }]);
        setSelectedDevice("default");
      }
    }
    loadDevices();
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "نظرة عامة", icon: Server },
    { key: "persons", label: "إدارة الأشخاص", icon: Users },
    { key: "events", label: "سجل الأحداث", icon: Activity },
    { key: "face", label: "صور الوجه", icon: Camera },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gradient-gold">أجهزة البصمة</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة أجهزة الحضور والانصراف البيومترية</p>
        </div>
        {devices.length > 1 && (
          <select
            className="bg-card/30 backdrop-blur-md rounded-lg px-3 py-2 text-sm border border-border/20 bg-transparent text-foreground"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name} — {d.model}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card/30 backdrop-blur-md rounded-xl border border-border/20 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "overview" && <OverviewTab />}
          {tab === "persons" && <PersonsTab />}
          {tab === "events" && <EventsTab />}
          {tab === "face" && <FaceTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════
// Tab 1: Device Overview
// ══════════════════════════════════════════

function OverviewTab() {
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [network, setNetwork] = useState<any>(null);
  const [door, setDoor] = useState<any>(null);
  const [deviceIp, setDeviceIp] = useState("");
  const [loading, setLoading] = useState(true);
  const [doorLoading, setDoorLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/device/info`);
      const data = await res.json();
      if (data.success) {
        setInfo(data.info);
        setCapacity(data.capacity);
        setNetwork(data.network);
        setDoor(data.door);
        setDeviceIp(data.deviceIp || data.network?.ipAddress || "");
      }
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDoor = async (action: "open" | "close") => {
    setDoorLoading(true);
    try {
      await fetch(`${API}/device/door/${action}`, { method: "POST" });
    } catch { /* */ }
    setDoorLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-muted-foreground ms-3">جاري تحميل معلومات الجهاز...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Info Card */}
      <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            معلومات الجهاز
          </h3>
          <div className="flex items-center gap-2">
            <StatusBadge active={!!info} />
            <button onClick={load} className="p-2 rounded-lg hover:bg-muted/20 transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        {info && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "اسم الجهاز", value: info.deviceName },
              { label: "الموديل", value: info.model },
              { label: "الرقم التسلسلي", value: info.serialNumber },
              { label: "إصدار البرنامج", value: info.firmwareVersion },
              { label: "عنوان IP", value: deviceIp || network?.ipAddress || "—" },
              { label: "MAC Address", value: info.macAddress || network?.macAddress || "—" },
              { label: "اسم الباب", value: door?.doorName || "—" },
              { label: "مدة فتح الباب", value: door?.openDuration ? `${door.openDuration} ثانية` : "—" },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <p className="text-sm text-foreground font-mono" dir="ltr">{item.value || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Capacity Cards */}
      {capacity && (
        <div>
          <h3 className="text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            سعة الجهاز
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <CapacityBar label="الأشخاص" icon={Users} used={capacity.person.used} total={capacity.person.total} color="text-blue-400" />
            <CapacityBar label="الوجوه" icon={ScanFace} used={capacity.face.used} total={capacity.face.total} color="text-emerald-400" />
            <CapacityBar label="البصمات" icon={Fingerprint} used={capacity.fingerprint.used} total={capacity.fingerprint.total} color="text-purple-400" />
            <CapacityBar label="البطاقات" icon={CreditCard} used={capacity.card.used} total={capacity.card.total} color="text-amber-400" />
            <CapacityBar label="الأحداث" icon={Activity} used={capacity.event.used} total={capacity.event.total} color="text-red-400" />
          </div>
        </div>
      )}

      {/* Door Control */}
      <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-6">
        <h3 className="text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          التحكم بالباب
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleDoor("open")}
            disabled={doorLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            <DoorOpen className="w-4 h-4" />
            فتح الباب
          </button>
          <button
            onClick={() => handleDoor("close")}
            disabled={doorLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            <DoorClosed className="w-4 h-4" />
            إغلاق الباب
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Tab 2: Person Management
// ══════════════════════════════════════════

function PersonsTab() {
  const [persons, setPersons] = useState<DevicePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [facePhotos, setFacePhotos] = useState<Record<string, string>>({});
  const [loadingFaces, setLoadingFaces] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/device/persons`);
      const data = await res.json();
      if (data.success) {
        setPersons(data.persons);
        // Load face photos for persons who have faces
        const withFaces = data.persons.filter((p: DevicePerson) => p.numOfFace > 0);
        if (withFaces.length > 0 && Object.keys(facePhotos).length === 0) {
          setLoadingFaces(true);
          const photos: Record<string, string> = {};
          // Load in batches of 5 to avoid overwhelming the device
          for (let i = 0; i < withFaces.length; i += 5) {
            const batch = withFaces.slice(i, i + 5);
            await Promise.all(batch.map(async (p: DevicePerson) => {
              try {
                const fRes = await fetch(`${API}/device/persons/${p.employeeNo}/face`);
                const fData = await fRes.json();
                if (fData.found && fData.imageBase64) photos[p.employeeNo] = fData.imageBase64;
              } catch { /* skip */ }
            }));
          }
          setFacePhotos(photos);
          setLoadingFaces(false);
        }
      }
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search) return persons;
    const q = search.toLowerCase();
    return persons.filter(p => p.name.toLowerCase().includes(q) || p.employeeNo.includes(q));
  }, [persons, search]);

  const userTypeLabel = (t: string) => {
    if (t === "normal") return "عادي";
    if (t === "visitor") return "زائر";
    if (t === "blackList") return "محظور";
    return t;
  };

  const userTypeColor = (t: string) => {
    if (t === "normal") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (t === "visitor") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو رقم الموظف..."
            className="w-full ps-10 pe-4 py-2 rounded-lg bg-card/30 backdrop-blur-md border border-border/20 bg-transparent text-foreground text-sm placeholder:text-muted-foreground/50"
          />
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-muted/20 transition-colors" title="تحديث">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
        <span className="text-xs text-muted-foreground">{persons.length} شخص مسجل</span>
        {loadingFaces && <span className="text-xs text-blue-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />جاري تحميل الصور...</span>}
        <span className="text-[10px] text-muted-foreground/50 border border-border/20 rounded px-2 py-1">لإضافة موظف جديد، استخدم صفحة الموظفون</span>
      </div>

      {/* Persons Kanban Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground ms-3">جاري تحميل الأشخاص...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.employeeNo}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 overflow-hidden hover:border-primary/30 transition-all group"
            >
              {/* Photo area */}
              <div className="relative h-36 bg-gradient-to-b from-muted/30 to-muted/10 flex items-center justify-center overflow-hidden">
                {facePhotos[p.employeeNo] ? (
                  <img
                    src={`data:image/jpeg;base64,${facePhotos[p.employeeNo]}`}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <Users className="w-12 h-12 text-muted-foreground/20" />
                    {p.numOfFace === 0 && (
                      <span className="text-[10px] text-muted-foreground/40 mt-1">لا توجد صورة</span>
                    )}
                  </div>
                )}
                {/* Employee number badge */}
                <span className="absolute top-2 start-2 text-xs font-mono bg-black/50 text-white px-1.5 py-0.5 rounded" dir="ltr">
                  {p.employeeNo}
                </span>
                {/* User type badge */}
                <span className={`absolute top-2 end-2 text-[10px] px-1.5 py-0.5 rounded border ${userTypeColor(p.userType)}`}>
                  {userTypeLabel(p.userType)}
                </span>
              </div>

              {/* Info area */}
              <div className="p-3 space-y-2">
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                </div>

                {/* Credentials */}
                <div className="flex items-center justify-center gap-3">
                  <div className={`flex items-center gap-0.5 ${p.numOfFP > 0 ? "text-emerald-400" : "text-muted-foreground/25"}`} title="بصمة">
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span className="text-xs">{p.numOfFP}</span>
                  </div>
                  <div className={`flex items-center gap-0.5 ${p.numOfFace > 0 ? "text-blue-400" : "text-muted-foreground/25"}`} title="وجه">
                    <ScanFace className="w-3.5 h-3.5" />
                    <span className="text-xs">{p.numOfFace}</span>
                  </div>
                  <div className={`flex items-center gap-0.5 ${p.numOfCard > 0 ? "text-amber-400" : "text-muted-foreground/25"}`} title="بطاقة">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="text-xs">{p.numOfCard}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={Users} message={search ? "لا توجد نتائج" : "لا يوجد أشخاص مسجلين"} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// Tab 3: Event Search
// ══════════════════════════════════════════

function EventsTab() {
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchEmp, setSearchEmp] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (searchEmp) params.set("employeeNo", searchEmp);
      const res = await fetch(`${API}/device/events?${params}`);
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } catch { /* offline */ }
    setLoading(false);
  }, [startDate, endDate, searchEmp]);

  useEffect(() => { load(); }, []);

  const formatEventTime = (t: string) => {
    if (!t) return "—";
    const date = t.slice(0, 10);
    const time = t.slice(11, 19);
    return `${date} ${time}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-4">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-muted/20 border border-border/20 text-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-muted/20 border border-border/20 text-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">رقم الموظف</label>
            <input
              type="text"
              value={searchEmp}
              onChange={(e) => setSearchEmp(e.target.value)}
              placeholder="الكل"
              className="px-3 py-2 rounded-lg bg-muted/20 border border-border/20 text-foreground text-sm w-32"
              dir="ltr"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            بحث
          </button>
          <span className="text-xs text-muted-foreground">{events.length} حدث</span>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="bg-muted/20 border-b border-border/20">
                {["رقم الموظف", "الاسم", "الوقت", "طريقة التحقق", "رقم البطاقة", "الباب"].map(h => (
                  <th key={h} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : events.length > 0 ? events.map((e, i) => (
                <tr key={`${e.employeeNo}-${e.time}-${i}`} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-2 text-foreground font-mono text-sm" dir="ltr">{e.employeeNo}</td>
                  <td className="px-4 py-2 text-foreground text-sm">{e.name || "—"}</td>
                  <td className="px-4 py-2 text-foreground text-sm font-mono" dir="ltr">{formatEventTime(e.time)}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className="text-muted-foreground">{e.verifyMode || "—"}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground font-mono" dir="ltr">{e.cardNo || "—"}</td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">{e.doorNo || 1}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6}><EmptyState icon={Activity} message="لا توجد أحداث" hint="اضغط &quot;بحث&quot; لعرض الأحداث" /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Tab 4: Face Photo Management
// ══════════════════════════════════════════

function FaceTab() {
  const [persons, setPersons] = useState<DevicePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [viewFace, setViewFace] = useState<{ empNo: string; image: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/device/persons`);
      const data = await res.json();
      if (data.success) setPersons(data.persons);
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search) return persons;
    const q = search.toLowerCase();
    return persons.filter(p => p.name.toLowerCase().includes(q) || p.employeeNo.includes(q));
  }, [persons, search]);

  const handleViewFace = async (empNo: string) => {
    try {
      const res = await fetch(`${API}/device/persons/${empNo}/face`);
      const data = await res.json();
      if (data.found && data.imageBase64) {
        setViewFace({ empNo, image: data.imageBase64 });
      } else {
        setViewFace({ empNo, image: "" });
      }
    } catch { /* */ }
  };

  const handleUploadFace = async (empNo: string, file: File) => {
    setUploading(empNo);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      await fetch(`${API}/device/persons/${empNo}/face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      await load();
    } catch { /* */ }
    setUploading(null);
  };

  const handleDeleteFace = async (empNo: string) => {
    try {
      await fetch(`${API}/device/persons/${empNo}/face`, { method: "DELETE" });
      setViewFace(null);
      await load();
    } catch { /* */ }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-full ps-10 pe-4 py-2 rounded-lg bg-card/30 backdrop-blur-md border border-border/20 bg-transparent text-foreground text-sm placeholder:text-muted-foreground/50"
          />
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-muted/20 transition-colors">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Face Photo Modal */}
      <AnimatePresence>
        {viewFace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setViewFace(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card/30 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 border border-border/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-foreground">صورة الوجه — #{viewFace.empNo}</h4>
                <button onClick={() => setViewFace(null)} className="p-1 rounded hover:bg-muted/20">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {viewFace.image ? (
                <img
                  src={`data:image/jpeg;base64,${viewFace.image}`}
                  alt="Face"
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <ScanFace className="w-16 h-16 mb-2 opacity-30" />
                  <span>لا توجد صورة وجه مسجلة</span>
                </div>
              )}
              {viewFace.image && (
                <button
                  onClick={() => handleDeleteFace(viewFace.empNo)}
                  className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف الصورة
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persons Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((p) => (
            <div
              key={p.employeeNo}
              className="bg-card/30 backdrop-blur-md rounded-xl border border-border/20 p-4 text-center space-y-2 hover:border-primary/30 transition-colors"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/30 flex items-center justify-center overflow-hidden">
                {p.numOfFace > 0 ? (
                  <button onClick={() => handleViewFace(p.employeeNo)} className="w-full h-full flex items-center justify-center hover:bg-muted/50 transition-colors">
                    <ScanFace className="w-8 h-8 text-emerald-400" />
                  </button>
                ) : (
                  <ScanFace className="w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
              <div>
                <p className="text-sm text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono" dir="ltr">#{p.employeeNo}</p>
              </div>
              <div className="flex items-center justify-center gap-1">
                <CredentialIcons fp={p.numOfFP} face={p.numOfFace} card={p.numOfCard} />
              </div>
              <div className="flex gap-1 justify-center">
                {p.numOfFace > 0 ? (
                  <button
                    onClick={() => handleViewFace(p.employeeNo)}
                    className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <Eye className="w-3 h-3 inline me-1" />
                    عرض
                  </button>
                ) : null}
                <label className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer">
                  {uploading === p.employeeNo ? (
                    <Loader2 className="w-3 h-3 inline animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-3 h-3 inline me-1" />
                      رفع
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFace(p.employeeNo, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
