import React, { useState, useEffect, useRef, ReactNode, InputHTMLAttributes } from "react";
import { 
  Bus, 
  ChevronLeft, 
  LogOut, 
  Plus, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Users, 
  Settings, 
  Palette, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Edit, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  ShieldCheck,
  X,
  ArrowRight,
  Menu,
  Download,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ── Constants ──────────────────────────────────────────────────────────

const RED = "#B91C1C";
const DARK = "#0F172A";
const SLATE = "#64748B";

const STATUS_MAP = {
  pending_upload: { label: "Enviar Declaração", icon: Upload, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  analyzing: { label: "Em Análise", icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  approved: { label: "Cadastrado", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  rejected: { label: "Recusado", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
};

const REQ_STATUS = {
  pending_upload: { label: "Enviar Declaração", icon: Upload, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  analyzing: { label: "Em Análise", icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  approved: { label: "Cadastrado", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  rejected: { label: "Recusado", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
};

// ── Utilities ──────────────────────────────────────────────────────────

const openDocument = (dataUrl: string) => {
  if (!dataUrl) return;
  if (dataUrl.startsWith('data:')) {
    try {
      const parts = dataUrl.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error("Erro ao processar documento:", e);
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    }
  } else {
    window.open(dataUrl, '_blank');
  }
};

// ── Shared UI Components ──────────────────────────────────────────────

function Logo({ size = "md", settings }: { size?: "sm" | "md" | "lg" | "xl" | "2xl", settings?: any }) {
  const sizes = {
    sm: { box: "w-12 h-12", text: "text-lg", sub: "text-[10px]" },
    md: { box: "w-16 h-16", text: "text-xl", sub: "text-xs" },
    lg: { box: "w-24 h-24", text: "text-2xl", sub: "text-sm" },
    xl: { box: "w-40 h-40", text: "text-3xl", sub: "text-base" },
    "2xl": { box: "w-56 h-56", text: "text-4xl", sub: "text-lg" },
  };
  const name = settings?.companyName || "Trectur";
  const logo = settings?.logo;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div 
        className={`${sizes[size].box} rounded-[2.5rem] flex items-center justify-center font-bold shadow-2xl overflow-hidden shrink-0 transition-all duration-500 hover:scale-105 border-4 border-white`}
        style={{ backgroundColor: "var(--logo-bg-color)", color: "var(--button-font-color)" }}
      >
        {logo ? (
          <img src={logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        ) : (
          <span className={size === "2xl" ? "text-7xl" : size === "xl" ? "text-6xl" : "text-3xl"}>{name.charAt(0)}</span>
        )}
      </div>
      <div>
        <div className={`${sizes[size].text} font-black tracking-tighter leading-none mb-2`} style={{ color: "var(--company-name-font-color)" }}>
          {name}
        </div>
        <div className={`${sizes[size].sub} text-slate-400 font-bold uppercase tracking-widest opacity-70`}>Recadastramento Escolar</div>
      </div>
    </div>
  );
}

const variants = {
  primary: "", // Handled specially above
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary-light",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  ghost: "bg-transparent text-slate-500 hover:bg-slate-100",
};

const Button = ({ children, onClick, variant = "primary", full = false, disabled = false, icon: Icon, loading = false, title }: ButtonProps) => {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`
        px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 
        flex items-center justify-center gap-2 active:scale-[0.98]
        ${isPrimary ? "bg-[var(--button-color)] text-[var(--button-font-color)] hover:bg-[var(--button-hover-bg-color)] hover:text-[var(--button-hover-font-color)] shadow-md" : ""}
        ${isSecondary ? "bg-[var(--secondary-button-color)] text-[var(--secondary-button-font-color)] border-2 border-[var(--secondary-button-font-color)] hover:bg-[var(--secondary-button-hover-bg-color)] hover:text-[var(--secondary-button-hover-font-color)]" : ""}
        ${(!isPrimary && !isSecondary) ? variants[variant as keyof typeof variants] : ""} 
        ${full ? "w-full" : ""} 
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={18} />}
          {children}
        </>
      )}
    </button>
  );
};

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "success" | "danger" | "ghost";
  full?: boolean;
  disabled?: boolean;
  icon?: any;
  loading?: boolean;
  title?: string;
}

function Input({ label, icon: Icon, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          {...props}
          className={`
            w-full bg-white border border-slate-200 rounded-xl py-2.5 
            ${Icon ? "pl-11" : "pl-4"} pr-4 text-sm outline-none 
            focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all
            placeholder:text-slate-400
          `}
        />
      </div>
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: any;
  [key: string]: any;
}

function Card({ children, className = "", animate = true, ...props }: CardProps) {
  const Component = animate ? motion.div : "div";
  return (
    <Component
      {...props}
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-5 ${className}`}
    >
      {children}
    </Component>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  [key: string]: any;
}

function Badge({ status, map }) {
  const s = map[status] || { label: status, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100", icon: AlertCircle };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider ${s.color} ${s.bg} ${s.border}`}>
      <Icon size={12} />
      {s.label}
    </span>
  );
}

// ── Modals ─────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Pages ─────────────────────────────────────────────

function LoginPage({ type, nav, onLogin, showToast, settings }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !pw) return showToast("Preencha todos os campos.");
    setLoading(true);
    setShowResend(false);
    console.log(`[Login Debug] Attempting login to: ${window.location.origin}/api/authenticate`);
    try {
      const res = await fetch("/api/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw })
      });
      
      console.log(`[Login Debug] Status: ${res.status} ${res.statusText}`);
      const contentType = res.headers.get("content-type");
      console.log(`[Login Debug] Content-Type: ${contentType}`);

      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("[Login Debug] Expected JSON but got:", text.substring(0, 100));
        showToast(`Erro do servidor: Resposta inválida (${res.status}).`);
        setLoading(false);
        return;
      }

      if (res.ok && data.success) {
        if (data.user.role !== type) {
          console.warn(`[Login Debug] Role mismatch. Esperado: ${type}, Recebido: ${data.user.role}`);
          showToast(`Esta conta não tem permissão de ${type}.`);
          setLoading(false);
          return;
        }
        onLogin(data.user);
      } else {
        console.error("[Login Debug] Erro retornado pela API:", data);
        showToast(data.message || `Erro ${res.status}: Falha na autenticação.`);
        if (res.status === 403) setShowResend(true);
      }
    } catch (err) {
      console.error("[Login Debug] Erro de conexão:", err);
      showToast("Erro de conexão com o servidor. Verifique se o servidor está online.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      showToast(data.message);
    } catch (err) {
      showToast("Erro ao reenviar e-mail.");
    }
    setLoading(false);
  };

  const config = {
    client: { badge: "Estudante", color: "bg-emerald-600", icon: User },
    admin: { badge: "Administrador", color: "bg-primary", icon: ShieldCheck },
    operator: { badge: "Operador", color: "bg-secondary", icon: Users },
  };

  const c = config[type];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 flex flex-col gap-8"
      >
        <div className="flex flex-col items-center gap-6">
          <Logo size="xl" settings={settings} />
          <div 
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
            style={{ backgroundColor: type === "client" ? "#10b981" : "var(--primary-color)" }}
          >
            <c.icon size={14} />
            {c.badge}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Input 
            label="E-mail" 
            icon={Mail} 
            type="email" 
            placeholder="seu@email.com" 
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input 
            label="Senha" 
            icon={Lock} 
            type="password" 
            placeholder="••••••••" 
            value={pw}
            onChange={e => setPw(e.target.value)}
          />
        </div>

        <Button full onClick={handleLogin} loading={loading} variant={type === "client" ? "success" : "primary"}>
          Entrar no Sistema
        </Button>

        {showResend && (
          <Button variant="secondary" full onClick={handleResend} loading={loading}>
            Reenviar E-mail de Confirmação
          </Button>
        )}

        <div className="flex flex-col items-center gap-3">
          {type === "client" && (
            <button onClick={() => nav("register")} className="text-sm font-bold text-primary hover:underline">
              Criar nova conta
            </button>
          )}
          <button onClick={() => nav("recovery")} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Esqueci minha senha
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Acesso Alternativo</p>
          <div className="grid grid-cols-2 gap-3">
            {type !== "client" && (
              <Button variant="outline" full onClick={() => nav("login_client")}>Estudante</Button>
            )}
            {type !== "admin" && (
              <Button variant="outline" full onClick={() => nav("login_admin")}>Admin</Button>
            )}
            {type !== "operator" && (
              <Button variant="outline" full onClick={() => nav("login_operator")}>Operador</Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RegisterPage({ nav, showToast, settings }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [lgpd, setLgpd] = useState(false);
  const [loading, setLoading] = useState(false);
  const lgpdDoc = settings?.lgpdDocument;

  const handle = async () => {
    if (!name.trim() || !email.trim() || !pw || !pw2) { showToast("Preencha todos os campos."); return; }
    if (pw.length < 6) { showToast("Mínimo 6 caracteres."); return; }
    if (pw !== pw2) { showToast("As senhas não coincidem."); return; }
    if (!lgpd) { showToast("Aceite os termos da LGPD."); return; }
    
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pw })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Conta criada com sucesso!");
        nav("login_client");
      } else {
        showToast(data.message || "Erro ao cadastrar.");
      }
    } catch (err) {
      showToast("Erro de conexão.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-slate-100 p-10 flex flex-col gap-8"
      >
        <div className="flex flex-col items-center gap-6">
          <Logo size="lg" settings={settings} />
          <div className="w-full">
            <button onClick={() => nav("login_client")} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors mb-4">
              <ChevronLeft size={18} /> Voltar
            </button>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Criar Conta</h2>
            <p className="text-sm text-slate-500 mt-1">Cadastre-se para gerenciar seus cartões.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Input label="Nome Completo" icon={User} placeholder="Seu nome completo" value={name} onChange={e => setName(e.target.value)} />
          <Input label="E-mail" icon={Mail} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Senha" icon={Lock} type="password" placeholder="Mínimo 6 caracteres" value={pw} onChange={e => setPw(e.target.value)} />
          <Input label="Confirmar Senha" icon={Lock} type="password" placeholder="Repita a senha" value={pw2} onChange={e => setPw2(e.target.value)} />
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
          <AlertCircle className="text-amber-600 shrink-0" size={20} />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <strong>Importante:</strong> Após o cadastro, você receberá um e-mail de confirmação. Você só poderá acessar o sistema após clicar no link de validação. Verifique também sua caixa de spam.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={lgpd} onChange={e => setLgpd(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
          <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
            Li e aceito os <button onClick={() => lgpdDoc ? openDocument(lgpdDoc) : showToast("Documento não disponível.")} className="font-bold text-primary hover:underline">Termos da LGPD</button> da Prefeitura de Três Corações para tratamento de dados escolares.
          </span>
        </label>

        <Button full onClick={handle} loading={loading}>Finalizar Cadastro</Button>
      </motion.div>
    </div>
  );
}

// ── Main Application ───────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("login_client");
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [operators, setOperators] = useState([]);
  const [cardId, setCardId] = useState(null);
  const [reqId, setReqId] = useState(null);
  const [newCard, setNewCard] = useState({ name: "", serial: "" });
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState("");
  const [opModal, setOpModal] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editExpiry, setEditExpiry] = useState("");
  const [lgpdFile, setLgpdFile] = useState(null);
  const [lgpdLoading, setLgpdLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (window.location.pathname.includes("/redefinir-senha") && token) {
      setResetToken(token);
      setPage("reset_password");
    }
  }, []);

  useEffect(() => {
    console.log("[App] Testing connection to /ping...");
    fetch("/ping")
      .then(res => res.text())
      .then(data => console.log("[App] Ping response:", data))
      .catch(err => console.error("[App] Ping failed:", err));

    console.log("[App] Fetching debug headers...");
    fetch("/api/debug/headers")
      .then(res => res.json())
      .then(data => console.log("[App] Debug Headers:", data))
      .catch(err => console.error("[App] Debug Headers failed:", err));
  }, []);

  const [systemSettings, setSystemSettings] = useState({
    defaultExpiration: "30/04/2025",
    maxUploadSize: 10,
    allowedExtensions: ["PDF", "JPG", "PNG"],
    autoRenewal: false,
    lgpdDocument: "",
    validityDays: 365,
    primaryBgColor: "#f8fafc",
    secondaryBgColor: "#ffffff",
    primaryColor: "#be123c",
    secondaryColor: "#334155",
    buttonColor: "#be123c",
    buttonFontColor: "#ffffff",
    secondaryButtonColor: "transparent",
    secondaryButtonFontColor: "#be123c",
    secondaryButtonHoverColor: "transparent",
    secondaryButtonHoverFontColor: "#be123c",
    companyName: "Trectur",
    companyNameFontColor: "#0f172a",
    logoBgColor: "#be123c",
    logo: "",
    generalFontColor: "#334155",
    buttonHoverColor: "",
    buttonHoverFontColor: "",
    appUrl: ""
  });

  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpFromName: "",
    smtpFromEmail: "",
    smtpPass: "",
    hasPassword: false
  });

  const fetchSmtpSettings = async () => {
    try {
      const res = await fetch("/api/admin/smtp");
      const data = await res.json();
      setSmtpSettings({ ...data, smtpPass: "" });
    } catch (err) { console.error(err); }
  };

  const nav = (p) => { 
    setPage(p); 
    setShowReject(false); 
    setRejectReason(""); 
    setLgpdFile(null);
    window.scrollTo(0, 0);
  };

  const showToast = (msg) => { 
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(msg); 
    toastTimeoutRef.current = setTimeout(() => {
      setToast("");
      toastTimeoutRef.current = null;
    }, 4000); 
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === "client") {
        fetchStudentData();
      } else {
        fetchAdminData();
      }
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSystemSettings(prev => ({ ...prev, ...data }));
    } catch (err) { console.error(err); }
  };

  const fetchStudentData = async () => {
    try {
      const [cardsRes, reqsRes] = await Promise.all([
        fetch(`/api/cards/user/${user.id}`),
        fetch(`/api/requests/user/${user.id}`)
      ]);
      setCards(await cardsRes.json());
      setReqs(await reqsRes.json());
    } catch (err) { console.error(err); }
  };

  const fetchAdminData = async () => {
    try {
      const [reqsRes, opsRes, logsRes] = await Promise.all([
        fetch("/api/requests"),
        fetch("/api/users/operators"),
        fetch("/api/logs")
      ]);
      setReqs(await reqsRes.json());
      setOperators(await opsRes.json());
      setAuditLogs(await logsRes.json());
    } catch (err) { console.error(err); }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.role === "client") nav("home");
    else if (userData.role === "admin") nav("admin_dash");
    else nav("operator_dash");
  };

  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  const selCard = [...cards, ...reqs].find(c => c.id === cardId);
  const selReq = reqs.find(r => r.id === reqId);

  useEffect(() => {
    if (selReq?.doc && selReq.doc.startsWith('data:')) {
      try {
        const parts = selReq.doc.split(',');
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const url = URL.createObjectURL(blob);
        setDocBlobUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Erro ao criar Blob URL:", e);
        setDocBlobUrl(selReq.doc);
      }
    } else {
      setDocBlobUrl(selReq?.doc || null);
    }
  }, [selReq?.doc]);

  const filteredReqs = reqs.filter(r => {
    const t = filterText.toLowerCase();
    return (!t || r.name.toLowerCase().includes(t) || r.serial.toLowerCase().includes(t)) &&
      (filterStatus === "all" || r.status === filterStatus);
  });

  const handleAddCard = async () => {
    if (!newCard.name.trim() || !newCard.serial.trim()) { showToast("Preencha todos os campos."); return; }
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: newCard.name,
          serial: newCard.serial
        })
      });
      if (res.ok) {
        showToast("Cartão adicionado com sucesso!");
        setNewCard({ name: "", serial: "" });
        fetchStudentData();
        nav("home");
      } else {
        const data = await res.json();
        showToast(data.message || "Erro ao salvar cartão.");
      }
    } catch (err) { 
      console.error("Erro ao salvar cartão:", err);
      showToast("Erro de conexão ao salvar."); 
    }
  };

  const handleUpload = async () => {
    if (!lgpdFile && !cardId) return;
    
    try {
      let docData = lgpdFile.name;
      
      // Convert file to Data URL for preview in this demo environment
      const reader = new FileReader();
      docData = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(lgpdFile);
      });

      const res = await fetch(`/api/requests/${cardId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          doc: docData,
          fileName: lgpdFile.name 
        })
      });
      if (res.ok) {
        showToast("Declaração enviada para análise!");
        fetchStudentData();
        nav("home");
      }
    } catch (err) { showToast("Erro ao enviar."); }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/requests/${reqId}/approve`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId: user.id })
      });
      if (res.ok) {
        showToast("Solicitação aprovada!");
        fetchAdminData();
        nav(user.role === "admin" ? "admin_dash" : "operator_dash");
      }
    } catch (err) { showToast("Erro ao aprovar."); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast("Informe o motivo."); return; }
    try {
      const res = await fetch(`/api/requests/${reqId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason, operatorId: user.id })
      });
      if (res.ok) {
        showToast("Solicitação reprovada.");
        fetchAdminData();
        nav(user.role === "admin" ? "admin_dash" : "operator_dash");
      }
    } catch (err) { showToast("Erro ao reprovar."); }
  };

  const handleUpdateExpiry = async () => {
    try {
      const res = await fetch(`/api/cards/${cardId}/update-expiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiryDate: editExpiry, operatorId: user.id })
      });
      if (res.ok) {
        showToast("Validade atualizada!");
        fetchStudentData();
        setOpModal(null);
      } else {
        const data = await res.json();
        showToast(data.message || "Erro ao atualizar.");
      }
    } catch (err) { showToast("Erro de conexão."); }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchSmtpSettings();
    }
  }, [user]);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemSettings)
      });
      if (res.ok) showToast("Configurações salvas!");
    } catch (err) { showToast("Erro ao salvar."); }
  };

  const handleSaveOperator = async (data) => {
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: "operator" })
      });
      if (res.ok) {
        showToast("Operador salvo!");
        fetchAdminData();
        setOpModal(null);
      } else {
        const err = await res.json();
        showToast(err.message);
      }
    } catch (err) { showToast("Erro ao salvar."); }
  };

  const handleDeleteOperator = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Operador removido.");
        fetchAdminData();
      }
    } catch (err) { showToast("Erro ao remover."); }
  };

  const AdminSidebar = ({ page, nav, collapsed, setCollapsed }) => {
    const items = [
      { id: user?.role === "admin" ? "admin_dash" : "operator_dash", label: "Solicitações", icon: Search },
      ...(user?.role === "admin" ? [
        { id: "admin_settings", label: "Gestão", icon: Users },
        { id: "admin_logs", label: "Auditoria", icon: ShieldCheck },
        { id: "admin_system", label: "Configurações", icon: Settings },
        { id: "admin_theme", label: "Personalização", icon: Palette },
      ] : [])
    ];

    return (
      <aside className={`sticky top-0 h-screen bg-white border-r border-slate-100 transition-all duration-300 flex flex-col shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-8 flex flex-col items-center justify-center border-b border-slate-50">
          {!collapsed ? (
            <Logo size="md" settings={systemSettings} />
          ) : (
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-300"
              style={{ backgroundColor: "var(--logo-bg-color)" }}
            >
              <Bus size={24} />
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="absolute top-6 right-4 p-2 rounded-xl hover:bg-slate-50 text-slate-400">
              <Menu size={20} />
            </button>
          )}
          {collapsed && (
            <button onClick={() => setCollapsed(false)} className="mt-4 p-2 rounded-xl hover:bg-slate-50 text-slate-400">
              <Menu size={20} />
            </button>
          )}
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => nav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${page === item.id ? 'bg-primary-light text-primary' : 'text-slate-500 hover:bg-slate-50'}`}
              title={collapsed ? item.label : ""}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <Button 
            variant="secondary" 
            full={!collapsed} 
            icon={LogOut} 
            onClick={() => { setUser(null); nav("login_client"); }}
            title={collapsed ? "Sair" : ""}
          >
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>
    );
  };

  const renderContent = () => {
    const isAuthPage = ["login_client", "login_admin", "login_operator", "register", "recovery", "reset_password"].includes(page);
    if (!user && !isAuthPage) {
      return <LoginPage type="client" nav={nav} onLogin={handleLoginSuccess} showToast={showToast} settings={systemSettings} />;
    }

    switch (page) {
      case "login_client": return <LoginPage type="client" nav={nav} onLogin={handleLoginSuccess} showToast={showToast} settings={systemSettings} />;
      case "login_admin": return <LoginPage type="admin" nav={nav} onLogin={handleLoginSuccess} showToast={showToast} settings={systemSettings} />;
      case "login_operator": return <LoginPage type="operator" nav={nav} onLogin={handleLoginSuccess} showToast={showToast} settings={systemSettings} />;
      case "register": return <RegisterPage nav={nav} showToast={showToast} settings={systemSettings} />;
      case "recovery": return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
          <Card className="w-full max-w-md p-10 flex flex-col gap-6">
            <button onClick={() => nav("login_client")} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
              <ChevronLeft size={18} /> Voltar
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recuperar Senha</h2>
              <p className="text-sm text-slate-500 mt-1">Enviaremos um link de recuperação para seu e-mail.</p>
            </div>
            <Input 
              label="E-mail de Cadastro" 
              icon={Mail} 
              placeholder="seu@email.com" 
              value={recoveryEmail}
              onChange={e => setRecoveryEmail(e.target.value)}
            />
            <Button 
              full 
              loading={recoveryLoading}
              onClick={async () => {
                if (!recoveryEmail) return showToast("Digite seu e-mail.");
                setRecoveryLoading(true);
                try {
                  const res = await fetch("/api/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: recoveryEmail })
                  });
                  
                  const contentType = res.headers.get("content-type");
                  let data;
                  if (contentType && contentType.includes("application/json")) {
                    data = await res.json();
                  } else {
                    showToast(`Erro do servidor (${res.status}). Tente novamente mais tarde.`);
                    setRecoveryLoading(false);
                    return;
                  }

                  if (res.ok && data.success) {
                    showToast(data.message);
                    nav("login_client");
                  } else {
                    showToast(data.message || "Erro ao processar solicitação.");
                  }
                } catch (err) {
                  showToast("Erro de conexão com o servidor. Verifique sua internet.");
                } finally {
                  setRecoveryLoading(false);
                }
              }}
            >
              Enviar Link
            </Button>
          </Card>
        </div>
      );

      case "reset_password": return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
          <Card className="w-full max-w-md p-10 flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nova Senha</h2>
              <p className="text-sm text-slate-500 mt-1">Escolha sua nova senha de acesso.</p>
            </div>
            <Input 
              label="Nova Senha" 
              icon={Lock} 
              type="password" 
              placeholder="••••••••" 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <Input 
              label="Confirmar Senha" 
              icon={Lock} 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <Button 
              full 
              loading={recoveryLoading}
              onClick={async () => {
                if (!newPassword || !confirmPassword) return showToast("Preencha todos os campos.");
                if (newPassword !== confirmPassword) return showToast("As senhas não coincidem.");
                if (newPassword.length < 6) return showToast("A senha deve ter pelo menos 6 caracteres.");
                
                setRecoveryLoading(true);
                try {
                  const res = await fetch("/api/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: resetToken, newPassword })
                  });
                  
                  const contentType = res.headers.get("content-type");
                  let data;
                  if (contentType && contentType.includes("application/json")) {
                    data = await res.json();
                  } else {
                    showToast(`Erro do servidor (${res.status}).`);
                    setRecoveryLoading(false);
                    return;
                  }

                  if (res.ok && data.success) {
                    showToast(data.message);
                    nav("login_client");
                  } else {
                    showToast(data.message || "Erro ao redefinir senha.");
                  }
                } catch (err) {
                  showToast("Erro de conexão com o servidor.");
                } finally {
                  setRecoveryLoading(false);
                }
              }}
            >
              Alterar Senha
            </Button>
          </Card>
        </div>
      );

      case "home": return (
        <div className="min-h-screen flex flex-col bg-slate-50">
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <Logo settings={systemSettings} />
              <Button variant="secondary" icon={LogOut} onClick={() => { setUser(null); nav("login_client"); }}>
                Sair
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 sm:p-10">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meus Cartões</h1>
                  <p className="text-slate-500 mt-1">Gerencie seus benefícios de transporte escolar.</p>
                </div>
                <Button icon={Plus} onClick={() => nav("cards_new")}>Novo Cartão</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...cards, ...reqs.filter(r => r.status !== "approved")].map((c, i) => (
                  <Card key={c.id || i} className="group hover:border-primary-light hover:shadow-md transition-all">
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-primary-light group-hover:text-primary transition-colors">
                          <Bus size={24} />
                        </div>
                        <Badge status={c.status} map={STATUS_MAP} />
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Série</span>
                          <span className="text-slate-900 font-bold">{c.serial}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Solicitado em</span>
                          <span className="text-slate-900 font-bold">{c.data_envio || c.date || "Pendente"}</span>
                        </div>
                        {c.status === "approved" && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Vencimento</span>
                            <span className="text-slate-900 font-bold">{c.date || "Sem Data"}</span>
                          </div>
                        )}
                      </div>

                      {c.status === "rejected" && (
                        <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100">
                          <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">Motivo da Recusa</p>
                          <p className="text-xs text-rose-600 leading-relaxed">{c.reject_reason || c.reason}</p>
                        </div>
                      )}

                      <div className="mt-auto pt-6 flex flex-col gap-2">
                        {(c.status === "pending_upload" || c.status === "rejected") ? (
                          <Button full icon={Upload} onClick={() => { setCardId(c.id); nav("upload"); }}>
                            Enviar Declaração
                          </Button>
                        ) : (
                          <Button full variant="secondary" disabled>
                            {c.status === "approved" ? "Cartão Ativo" : "Aguardando Análise"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {cards.length === 0 && reqs.filter(r => r.status !== "approved").length === 0 && (
                <div className="py-20 flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                    <Bus size={40} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Nenhum cartão cadastrado</h3>
                    <p className="text-slate-500 max-w-xs">Adicione seu primeiro cartão de transporte para começar o recadastramento.</p>
                  </div>
                  <Button icon={Plus} onClick={() => nav("cards_new")}>Adicionar Cartão</Button>
                </div>
              )}
            </div>
          </main>
        </div>
      );

      case "cards_new": return (
        <div className="min-h-screen flex flex-col bg-slate-50">
          <header className="bg-white border-b border-slate-100 px-6 py-4">
            <div className="max-w-xl mx-auto flex items-center gap-4">
              <button onClick={() => nav("home")} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-lg font-bold text-slate-900">Adicionar Novo Cartão</h1>
            </div>
          </header>
          <main className="p-6 flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-xl p-8 flex flex-col gap-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Certifique-se de que o número de série está correto. Ele pode ser encontrado no verso do seu cartão físico.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <Input label="Nome do Titular" icon={User} placeholder="Nome completo como no cartão" value={newCard.name} onChange={e => setNewCard(p => ({ ...p, name: e.target.value }))} />
                <Input label="Número de Série" icon={FileText} placeholder="Ex: TRC-2024-001" value={newCard.serial} onChange={e => setNewCard(p => ({ ...p, serial: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" full onClick={() => nav("home")}>Cancelar</Button>
                <Button full onClick={handleAddCard}>Salvar Cartão</Button>
              </div>
            </Card>
          </main>
        </div>
      );

      case "upload": return (
        <div className="min-h-screen flex flex-col bg-slate-50">
          <header className="bg-white border-b border-slate-100 px-6 py-4">
            <div className="max-w-xl mx-auto flex items-center gap-4">
              <button onClick={() => nav("home")} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-lg font-bold text-slate-900">Enviar Documentação</h1>
            </div>
          </header>
          <main className="p-6 flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-xl p-8 flex flex-col gap-8">
              {selCard && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                    <Bus size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{selCard.name}</h3>
                    <p className="text-xs text-slate-500">Série: {selCard.serial}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documento Comprobatório</p>
                <label className="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-primary hover:bg-primary-light/30 transition-all group">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary-light group-hover:text-primary transition-colors">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">Clique para selecionar ou arraste o arquivo</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, JPG ou PNG (Máx. 10MB)</p>
                    {lgpdFile && <p className="mt-2 text-xs font-bold text-emerald-600">Arquivo selecionado: {lgpdFile.name}</p>}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={e => setLgpdFile(e.target.files?.[0])}
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" full onClick={() => nav("home")}>Cancelar</Button>
                <Button full icon={Upload} onClick={handleUpload} disabled={!lgpdFile}>Enviar Agora</Button>
              </div>
            </Card>
          </main>
        </div>
      );

      case "admin_dash":
      case "operator_dash": {
        const isAdmin = user?.role === "admin";
        
        return (
          <div className="min-h-screen flex bg-slate-50">
            <AdminSidebar page={page} nav={nav} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            
            <main className="p-6 sm:p-10 flex-1 overflow-y-auto">
              <div className="max-w-7xl mx-auto flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Controle</h1>
                    <p className="text-slate-500 mt-1">Gerencie as solicitações de recadastramento.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none w-full sm:w-64 focus:ring-2 focus:ring-primary/10 transition-all"
                        placeholder="Buscar por nome ou série..."
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                      />
                    </div>
                    <select 
                      className="bg-slate-50 border-none rounded-xl text-sm px-4 py-2 outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold text-slate-600"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Todos Status</option>
                      <option value="analyzing">Em Análise</option>
                      <option value="approved">Aprovados</option>
                      <option value="rejected">Reprovados</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredReqs.map(r => (
                    <Card key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-primary-light transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                          <User size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{r.name}</h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Série: {r.serial}</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enviado: {r.data_envio || r.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge status={r.status} map={REQ_STATUS} />
                        <Button variant="secondary" icon={Eye} onClick={() => { setReqId(r.id); nav(isAdmin ? "admin_req" : "operator_req"); }}>
                          Analisar
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {filteredReqs.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                      <Search className="mx-auto text-slate-200 mb-4" size={48} />
                      <p className="text-slate-500 font-bold">Nenhuma solicitação encontrada.</p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        );
      }

      case "admin_req":
      case "operator_req": {
        const isAdmin = page === "admin_req";
        return (
          <div className="min-h-screen flex flex-col bg-slate-50">
            <header className="bg-white border-b border-slate-100 px-6 py-4">
              <div className="max-w-4xl mx-auto flex items-center gap-4">
                <button onClick={() => nav(isAdmin ? "admin_dash" : "operator_dash")} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                  <ChevronLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-slate-900">Análise de Solicitação</h1>
              </div>
            </header>
            <main className="p-6 sm:p-10 flex-1 flex flex-col items-center">
              <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <Card className="p-0 overflow-hidden min-h-[600px] bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200 relative group">
                    {docBlobUrl ? (
                      selReq.doc.startsWith("data:image/") ? (
                        <div className="flex flex-col items-center w-full h-full">
                          <img 
                            src={docBlobUrl} 
                            alt="Documento" 
                            className="max-w-full max-h-[700px] object-contain p-4"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : selReq.doc.startsWith("data:application/pdf") ? (
                        <iframe 
                          src={docBlobUrl} 
                          className="w-full h-full border-none min-h-[700px]"
                          title="Documento PDF"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-6 text-slate-400 p-10 text-center">
                          <div className="w-24 h-24 bg-white rounded-3xl shadow-md flex items-center justify-center text-primary mb-2">
                            <FileText size={48} />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-slate-900">Documento Recebido</p>
                            <p className="text-sm text-slate-500 mt-2 max-w-xs">
                              O formato deste arquivo não permite visualização direta no navegador, mas você pode baixá-lo para conferência.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Button variant="secondary" icon={ExternalLink} onClick={() => openDocument(selReq.doc)}>
                              Abrir em nova aba
                            </Button>
                            <a 
                              href={docBlobUrl || selReq.doc} 
                              download={`documento_${selReq.serial}`}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
                            >
                              <Download size={20} />
                              Baixar Arquivo
                            </a>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-slate-400 p-10 text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-300 mb-2">
                          <FileText size={40} />
                        </div>
                        <p className="font-bold text-slate-500">Nenhum documento anexado</p>
                      </div>
                    )}
                    
                    {selReq?.doc && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" icon={ExternalLink} onClick={() => openDocument(selReq.doc)}>
                          Abrir
                        </Button>
                        <a 
                          href={docBlobUrl || selReq.doc} 
                          download={`documento_${selReq.serial}`}
                          className="p-2.5 bg-white text-slate-700 rounded-xl shadow-lg hover:bg-slate-50 transition-all border border-slate-100"
                          title="Baixar Documento"
                        >
                          <Download size={20} />
                        </a>
                      </div>
                    )}
                  </Card>
                </div>
                <div className="flex flex-col gap-6">
                  <Card className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dados do Aluno</h3>
                    {selReq && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-lg font-bold text-slate-900">{selReq.name}</p>
                          <p className="text-sm text-slate-500">Cartão: {selReq.serial}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">Data de Envio</span>
                            <span className="text-slate-900 font-bold">{selReq.date}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">Documento</span>
                            <span className="text-slate-900 font-bold truncate max-w-[150px]">
                              {selReq.doc?.startsWith("data:") ? "Arquivo Anexado" : (selReq.doc || "Nenhum")}
                            </span>
                          </div>
                        </div>
                        <div className="pt-4">
                          <Badge status={selReq.status} map={REQ_STATUS} />
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ações do Analista</h3>
                    {selReq?.status === "analyzing" ? (
                      <div className="flex flex-col gap-3">
                        {!showReject ? (
                          <>
                            <Button variant="success" full icon={CheckCircle2} onClick={handleApprove}>Aprovar Solicitação</Button>
                            <Button variant="danger" full icon={X} onClick={() => setShowReject(true)}>Reprovar Solicitação</Button>
                          </>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo da Reprovação</label>
                              <textarea 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-primary transition-all h-32 resize-none"
                                placeholder="Explique ao aluno o que precisa ser corrigido..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button variant="danger" full onClick={handleReject}>Confirmar</Button>
                              <Button variant="secondary" full onClick={() => setShowReject(false)}>Cancelar</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Solicitação Processada</p>
                        <p className="text-xs text-slate-500 mt-1">Esta solicitação já foi finalizada e não pode ser alterada.</p>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </main>
          </div>
        );
      }

      case "admin_logs": return (
        <div className="min-h-screen flex bg-slate-50">
          <AdminSidebar page={page} nav={nav} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
          <main className="p-6 sm:p-10 flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Logs de Auditoria</h1>
              <Card className="p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data/Hora</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Operador</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ação Realizada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          {(() => {
                            const dateStr = log.timestamp.includes('T') || log.timestamp.endsWith('Z') 
                              ? log.timestamp 
                              : log.timestamp.replace(' ', 'T') + 'Z';
                            return new Date(dateStr).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
                          })()}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-900">{log.operator_name}</td>
                        <td className="px-6 py-4 text-xs text-slate-600">{log.action}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-20 text-center text-slate-400 font-medium">Nenhum log registrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          </main>
        </div>
      );

      case "admin_settings": return (
        <div className="min-h-screen flex bg-slate-50">
          <AdminSidebar page={page} nav={nav} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
          
          <main className="p-6 sm:p-10 flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão do Sistema</h1>
                <Button icon={Plus} onClick={() => setOpModal({ mode: "new", data: { name: "", email: "" } })}>Novo Operador</Button>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <Card className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Users size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Operadores Ativos</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {operators.map(op => (
                      <div key={op.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold uppercase">
                            {op.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{op.name}</p>
                            <p className="text-xs text-slate-500">{op.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setOpModal({ mode: "edit", data: op })} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDeleteOperator(op.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Documento LGPD</h3>
                  </div>
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-4">
                    <FileText className={systemSettings.lgpdDocument ? "text-primary" : "text-slate-300"} size={48} />
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-900">Termos de Uso e Privacidade</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {systemSettings.lgpdDocument ? "Documento configurado e ativo." : "Nenhum PDF configurado ainda."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {systemSettings.lgpdDocument && (
                        <Button variant="outline" icon={Eye} onClick={() => openDocument(systemSettings.lgpdDocument)}>Ver Atual</Button>
                      )}
                      <div className="relative">
                        <input 
                          id="lgpd-upload"
                          type="file" 
                          className="hidden" 
                          accept=".pdf" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.type !== "application/pdf") {
                              showToast("Por favor, selecione um arquivo PDF.");
                              return;
                            }
                            
                            setLgpdLoading(true);
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              const base64 = event.target?.result as string;
                              
                              // Update state
                              setSystemSettings(prev => ({ ...prev, lgpdDocument: base64 }));
                              
                              // Auto-save only this setting to avoid large payload issues
                              try {
                                const res = await fetch("/api/settings", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ lgpdDocument: base64 })
                                });
                                if (res.ok) {
                                  showToast("Documento LGPD atualizado!");
                                } else {
                                  showToast("Erro ao salvar no servidor.");
                                }
                              } catch (err) {
                                showToast("Erro de conexão ao salvar.");
                              } finally {
                                setLgpdLoading(false);
                              }
                            };
                            reader.onerror = () => {
                              showToast("Erro ao ler o arquivo.");
                              setLgpdLoading(false);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <Button 
                          variant="secondary" 
                          icon={Upload} 
                          loading={lgpdLoading}
                          onClick={() => document.getElementById('lgpd-upload')?.click()}
                        >
                          Substituir PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </main>
        </div>
      );

      case "admin_system": return (
        <div className="min-h-screen flex bg-slate-50">
          <AdminSidebar page={page} nav={nav} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
          
          <main className="p-6 sm:p-10 flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações do Sistema</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Clock size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Prazos e Validade</h3>
                  </div>
                  <div className="space-y-4">
                    <Input 
                      label="Prazo de Validade (Dias)" 
                      type="number" 
                      placeholder="Ex: 365" 
                      value={systemSettings.validityDays}
                      onChange={async (e) => {
                        const newVal = parseInt(e.target.value) || 0;
                        setSystemSettings(p => ({ ...p, validityDays: newVal }));
                        // Auto-save
                        try {
                          await fetch("/api/settings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...systemSettings, validityDays: newVal })
                          });
                        } catch (err) { console.error(err); }
                      }}
                    />
                    <Input 
                      label="Data de Validade Padrão (Fixa)" 
                      type="text" 
                      placeholder="DD/MM/AAAA" 
                      value={systemSettings.defaultExpiration}
                      onChange={async (e) => {
                        const newVal = e.target.value;
                        setSystemSettings(p => ({ ...p, defaultExpiration: newVal }));
                        // Auto-save
                        try {
                          await fetch("/api/settings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...systemSettings, defaultExpiration: newVal })
                          });
                        } catch (err) { console.error(err); }
                      }}
                    />
                  </div>
                </Card>

                <Card className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Upload de Documentos</h3>
                  </div>
                  <div className="space-y-4">
                    <Input 
                      label="Limite de Tamanho (MB)" 
                      type="number" 
                      value={systemSettings.maxUploadSize}
                      onChange={e => setSystemSettings(p => ({ ...p, maxUploadSize: parseInt(e.target.value) }))}
                    />
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Extensões Permitidas</label>
                      <div className="flex flex-wrap gap-2">
                        {["PDF", "JPG", "PNG", "DOCX"].map(ext => (
                          <button 
                            key={ext}
                            onClick={() => {
                              const exists = systemSettings.allowedExtensions.includes(ext);
                              setSystemSettings(p => ({
                                ...p,
                                allowedExtensions: exists 
                                  ? p.allowedExtensions.filter(e => e !== ext)
                                  : [...p.allowedExtensions, ext]
                              }));
                            }}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border-2 ${systemSettings.allowedExtensions.includes(ext) ? "bg-primary border-primary text-white shadow-md" : "bg-transparent border-slate-200 text-slate-400 hover:border-slate-300"}`}
                          >
                            {ext}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <Mail size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900">Configuração de E-mail (SMTP)</h3>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <Input 
                    label="URL do Aplicativo (Obrigatório para links de e-mail)" 
                    type="text" 
                    placeholder="https://seu-app.run.app" 
                    value={systemSettings.appUrl}
                    onChange={async (e) => {
                      const newVal = e.target.value;
                      setSystemSettings(p => ({ ...p, appUrl: newVal }));
                      // Auto-save
                      try {
                        await fetch("/api/settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ...systemSettings, appUrl: newVal })
                        });
                      } catch (err) { console.error(err); }
                    }}
                  />
                  <p className="text-[10px] text-blue-600 mt-2 font-medium">
                    Esta URL é usada para gerar os links de confirmação de e-mail e redefinição de senha. 
                    Certifique-se de que ela termina em <strong>.run.app</strong> (sem barra no final).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input 
                      label="Servidor SMTP (Host)" 
                      placeholder="ex: smtp.gmail.com" 
                      value={smtpSettings.smtpHost}
                      onChange={e => setSmtpSettings(p => ({ ...p, smtpHost: e.target.value }))}
                    />
                    <Input 
                      label="Porta SMTP" 
                      type="number"
                      placeholder="ex: 465 ou 587" 
                      value={smtpSettings.smtpPort}
                      onChange={e => setSmtpSettings(p => ({ ...p, smtpPort: e.target.value }))}
                    />
                    <Input 
                      label="E-mail do Remetente" 
                      placeholder="contato@empresa.com" 
                      value={smtpSettings.smtpUser}
                      onChange={e => setSmtpSettings(p => ({ ...p, smtpUser: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-4">
                    <Input 
                      label="Nome do Remetente" 
                      placeholder="Equipe Trectur" 
                      value={smtpSettings.smtpFromName}
                      onChange={e => setSmtpSettings(p => ({ ...p, smtpFromName: e.target.value }))}
                    />
                    <Input 
                      label="E-mail de Resposta (Opcional)" 
                      placeholder="suporte@empresa.com" 
                      value={smtpSettings.smtpFromEmail}
                      onChange={e => setSmtpSettings(p => ({ ...p, smtpFromEmail: e.target.value }))}
                    />
                    <Input 
                      label={smtpSettings.hasPassword ? "Senha (Deixe vazio para manter atual)" : "Senha ou Senha de Aplicativo"} 
                      type="password"
                      placeholder="••••••••" 
                      value={smtpSettings.smtpPass}
                      onChange={e => setSmtpSettings(p => ({ ...p, smtpPass: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" loading={testingSmtp} onClick={async () => {
                    try {
                      setTestingSmtp(true);
                      showToast("Testando conexão... por favor aguarde.");
                      const res = await fetch("/api/admin/smtp/test", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(smtpSettings)
                      });
                      const data = await res.json();
                      if (data.success) {
                        showToast(data.message);
                      } else {
                        showToast(data.message || "Falha na conexão.");
                      }
                    } catch (err) { 
                      console.error(err);
                      showToast("Erro ao testar conexão. Verifique os dados.");
                    } finally {
                      setTestingSmtp(false);
                    }
                  }}>Testar Conexão</Button>
                  <Button variant="outline" onClick={async () => {
                    try {
                      const res = await fetch("/api/admin/smtp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(smtpSettings)
                      });
                      if (res.ok) {
                        showToast("Configurações de e-mail salvas!");
                        fetchSmtpSettings();
                      }
                    } catch (err) { console.error(err); }
                  }}>Salvar Configurações de E-mail</Button>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>Salvar Alterações</Button>
              </div>
            </div>
          </main>
        </div>
      );

      case "admin_theme": {
        const colorOptions = [
          "transparent",
          "#0284c7", "#0369a1", "#075985", // Ocean Blues
          "#059669", "#047857", "#065f46", // Emerald Greens
          "#ea580c", "#c2410c", "#9a3412", // Vibrant Oranges
          "#7c3aed", "#6d28d9", "#5b21b6", // Deep Purples
          "#db2777", "#be185d", "#9d174d", // Hot Pinks
          "#ca8a04", "#a16207", "#854d0e", // Sun Yellows
          "#dc2626", "#b91c1c", "#991b1b", // Bright Reds
          "#0f172a", "#1e293b", "#334155", // Slates
          "#ffffff", "#f8fafc", "#f1f5f9"  // Whites/Light
        ];

        // Contrast checking utilities
        const getLuminance = (hex: string) => {
          if (hex === "transparent") return 1;
          const rgb = hex.startsWith('#') ? hex.slice(1) : hex;
          const r = parseInt(rgb.slice(0, 2), 16) / 255;
          const g = parseInt(rgb.slice(2, 4), 16) / 255;
          const b = parseInt(rgb.slice(4, 6), 16) / 255;
          const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
          return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        };

        const getContrastRatio = (hex1: string, hex2: string) => {
          if (hex1 === "transparent" || hex2 === "transparent") return 10;
          const l1 = getLuminance(hex1);
          const l2 = getLuminance(hex2);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };

        const ColorPicker = ({ label, value, onChange, bgCheck }: { label: string, value: string, onChange: (c: string) => void, bgCheck?: string }) => {
          const contrast = bgCheck ? getContrastRatio(value, bgCheck) : 10;
          const isLowContrast = contrast < 4.5;

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                  {isLowContrast && (
                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle size={10} /> Baixo Contraste ({contrast.toFixed(1)}:1)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={value === "transparent" ? "#ffffff" : value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                  />
                  <div className="w-6 h-6 rounded-full border border-slate-200" style={{ background: value === "transparent" ? "repeating-conic-gradient(#ccc 0% 25%, #eee 0% 50%) 50% / 8px 8px" : value }} />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {colorOptions.map(col => (
                  <button 
                    key={col} 
                    className={`aspect-square rounded-lg border-2 transition-all hover:scale-110 ${value === col ? 'border-slate-900 scale-110' : 'border-white'}`}
                    style={{ background: col === "transparent" ? "repeating-conic-gradient(#ccc 0% 25%, #eee 0% 50%) 50% / 8px 8px" : col }}
                    onClick={() => onChange(col)}
                    title={col}
                  />
                ))}
              </div>
            </div>
          );
        };

        const adjustColor = (hex: string, amount: number) => {
          if (!hex || hex === "transparent") return hex;
          const rgb = hex.startsWith('#') ? hex.slice(1) : hex;
          let r = parseInt(rgb.slice(0, 2), 16);
          let g = parseInt(rgb.slice(2, 4), 16);
          let b = parseInt(rgb.slice(4, 6), 16);
          r = Math.max(0, Math.min(255, r + amount));
          g = Math.max(0, Math.min(255, g + amount));
          b = Math.max(0, Math.min(255, b + amount));
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        };

        const suggestedHover = systemSettings.buttonHoverColor || (
          getLuminance(systemSettings.buttonColor) > 0.5 
            ? adjustColor(systemSettings.buttonColor, -30) 
            : adjustColor(systemSettings.buttonColor, 30)
        );

        const suggestedHoverFont = systemSettings.buttonHoverFontColor || (
          getContrastRatio(suggestedHover, "#ffffff") > 4.5 ? "#ffffff" : "#0f172a"
        );

        const suggestedSecondaryHover = systemSettings.secondaryButtonHoverColor || (
          getLuminance(systemSettings.secondaryButtonColor) > 0.5 
            ? adjustColor(systemSettings.secondaryButtonColor, -15) 
            : adjustColor(systemSettings.secondaryButtonColor, 15)
        );

        const suggestedSecondaryHoverFont = systemSettings.secondaryButtonHoverFontColor || (
          getContrastRatio(suggestedSecondaryHover, "#ffffff") > 4.5 ? "#ffffff" : "#0f172a"
        );

        return (
          <div className="min-h-screen flex bg-slate-50">
            <AdminSidebar page={page} nav={nav} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            
            <main className="p-6 sm:p-10 flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Personalização Visual</h1>
                  <Button onClick={handleSaveSettings}>Salvar Alterações</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="flex flex-col gap-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-light text-primary rounded-lg">
                        <Palette size={20} />
                      </div>
                      <h3 className="font-bold text-slate-900">Cores do Sistema</h3>
                    </div>
                    
                    <ColorPicker 
                      label="Fundo Primário (Página)" 
                      value={systemSettings.primaryBgColor} 
                      onChange={(c) => setSystemSettings(p => ({ ...p, primaryBgColor: c }))} 
                    />
                    
                    <ColorPicker 
                      label="Fundo Secundário (Cards)" 
                      value={systemSettings.secondaryBgColor} 
                      onChange={(c) => setSystemSettings(p => ({ ...p, secondaryBgColor: c }))} 
                    />

                    <ColorPicker 
                      label="Cor da Fonte Geral" 
                      value={systemSettings.generalFontColor} 
                      bgCheck={systemSettings.primaryBgColor}
                      onChange={(c) => setSystemSettings(p => ({ ...p, generalFontColor: c }))} 
                    />

                    <div className="pt-4 border-t border-slate-100 space-y-8">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Identidade Visual</h4>
                      <ColorPicker 
                        label="Cor Primária (Destaques)" 
                        value={systemSettings.primaryColor} 
                        onChange={(c) => setSystemSettings(p => ({ ...p, primaryColor: c }))} 
                      />
                      
                      <ColorPicker 
                        label="Cor Secundária" 
                        value={systemSettings.secondaryColor} 
                        onChange={(c) => setSystemSettings(p => ({ ...p, secondaryColor: c }))} 
                      />
                    </div>
                  </Card>

                  <div className="flex flex-col gap-8">
                    <Card className="flex flex-col gap-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-light text-primary rounded-lg">
                          <Bus size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Botões</h3>
                      </div>
                      <ColorPicker 
                        label="Cor do Botão" 
                        value={systemSettings.buttonColor} 
                        onChange={(c) => setSystemSettings(p => ({ ...p, buttonColor: c }))} 
                      />
                      <ColorPicker 
                        label="Cor da Fonte do Botão" 
                        value={systemSettings.buttonFontColor} 
                        bgCheck={systemSettings.buttonColor}
                        onChange={(c) => setSystemSettings(p => ({ ...p, buttonFontColor: c }))} 
                      />

                      <div className="pt-4 border-t border-slate-100 space-y-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Estado de Destaque (Hover)</h4>
                        <ColorPicker 
                          label="Cor de Fundo (Hover)" 
                          value={systemSettings.buttonHoverColor || suggestedHover} 
                          onChange={(c) => setSystemSettings(p => ({ ...p, buttonHoverColor: c }))} 
                        />
                        <ColorPicker 
                          label="Cor da Fonte (Hover)" 
                          value={systemSettings.buttonHoverFontColor || suggestedHoverFont} 
                          bgCheck={systemSettings.buttonHoverColor || suggestedHover}
                          onChange={(c) => setSystemSettings(p => ({ ...p, buttonHoverFontColor: c }))} 
                        />
                      </div>

                      <div className="pt-8 border-t border-slate-100 space-y-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Botão Secundário (Cancelar)</h4>
                        <ColorPicker 
                          label="Cor do Botão" 
                          value={systemSettings.secondaryButtonColor} 
                          onChange={(c) => setSystemSettings(p => ({ ...p, secondaryButtonColor: c }))} 
                        />
                        <ColorPicker 
                          label="Cor da Fonte" 
                          value={systemSettings.secondaryButtonFontColor} 
                          bgCheck={systemSettings.secondaryButtonColor}
                          onChange={(c) => setSystemSettings(p => ({ ...p, secondaryButtonFontColor: c }))} 
                        />
                        <div className="pt-4 space-y-8">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Estado de Destaque (Hover)</h5>
                          <ColorPicker 
                            label="Cor de Fundo (Hover)" 
                            value={systemSettings.secondaryButtonHoverColor || suggestedSecondaryHover} 
                            onChange={(c) => setSystemSettings(p => ({ ...p, secondaryButtonHoverColor: c }))} 
                          />
                          <ColorPicker 
                            label="Cor da Fonte (Hover)" 
                            value={systemSettings.secondaryButtonHoverFontColor || suggestedSecondaryHoverFont} 
                            bgCheck={systemSettings.secondaryButtonHoverColor || suggestedSecondaryHover}
                            onChange={(c) => setSystemSettings(p => ({ ...p, secondaryButtonHoverFontColor: c }))} 
                          />
                        </div>
                      </div>
                    </Card>

                    <Card className="flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Identidade</h3>
                      </div>
                      
                      <Input 
                        label="Nome da Empresa" 
                        value={systemSettings.companyName} 
                        onChange={e => setSystemSettings(p => ({ ...p, companyName: e.target.value }))} 
                      />

                      <ColorPicker 
                        label="Cor da Fonte do Nome" 
                        value={systemSettings.companyNameFontColor} 
                        bgCheck={systemSettings.primaryBgColor}
                        onChange={(c) => setSystemSettings(p => ({ ...p, companyNameFontColor: c }))} 
                      />
                    </Card>

                    <Card className="flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Upload size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Logotipo</h3>
                      </div>
                      
                      <div className="flex flex-col items-center gap-6">
                        <div 
                          className="w-32 h-32 rounded-3xl shadow-xl flex items-center justify-center overflow-hidden border-4 border-white"
                          style={{ backgroundColor: systemSettings.logoBgColor === "transparent" ? "transparent" : systemSettings.logoBgColor }}
                        >
                          {systemSettings.logo ? (
                            <img src={systemSettings.logo} alt="Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-4xl font-bold text-white">{systemSettings.companyName.charAt(0)}</span>
                          )}
                        </div>

                        <div className="w-full space-y-4">
                          <ColorPicker 
                            label="Fundo da Logomarca" 
                            value={systemSettings.logoBgColor} 
                            onChange={(c) => setSystemSettings(p => ({ ...p, logoBgColor: c }))} 
                          />
                        </div>
                        
                        <div className="w-full mt-2">
                          <input 
                            id="logo-upload"
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              setLogoLoading(true);
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                const base64 = ev.target?.result as string;
                                
                                // Update state
                                setSystemSettings(p => ({ ...p, logo: base64 }));
                                
                                // Auto-save logo to avoid large payload in general settings
                                try {
                                  const res = await fetch("/api/settings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ logo: base64 })
                                  });
                                  if (res.ok) {
                                    showToast("Logotipo atualizado!");
                                  } else {
                                    showToast("Erro ao salvar no servidor.");
                                  }
                                } catch (err) {
                                  showToast("Erro de conexão ao salvar.");
                                } finally {
                                  setLogoLoading(false);
                                }
                              };
                              reader.onerror = () => {
                                showToast("Erro ao ler o arquivo.");
                                setLogoLoading(false);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          <Button 
                            variant="primary" 
                            full 
                            icon={Upload} 
                            loading={logoLoading}
                            onClick={() => document.getElementById('logo-upload')?.click()}
                          >
                            Fazer Upload
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>Salvar Personalização</Button>
                </div>
              </div>
            </main>
          </div>
        );
      }

      default: return null;
    }
  };

  return (
    <div className="min-h-screen">
      <style>{`
        :root {
          --primary-color: ${systemSettings.primaryColor || '#be123c'};
          --secondary-color: ${systemSettings.secondaryColor || '#334155'};
          --button-color: ${systemSettings.buttonColor || '#be123c'};
          --button-font-color: ${systemSettings.buttonFontColor || '#ffffff'};
          --button-hover-bg-color: ${systemSettings.buttonHoverColor || (
            (hex) => {
              if (!hex || hex === "transparent") return hex;
              const getLuminance = (h: string) => {
                const rgb = h.startsWith('#') ? h.slice(1) : h;
                const r = parseInt(rgb.slice(0, 2), 16) / 255;
                const g = parseInt(rgb.slice(2, 4), 16) / 255;
                const b = parseInt(rgb.slice(4, 6), 16) / 255;
                const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
                return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
              };
              const adjustColor = (h: string, amount: number) => {
                const rgb = h.startsWith('#') ? h.slice(1) : h;
                let r = parseInt(rgb.slice(0, 2), 16);
                let g = parseInt(rgb.slice(2, 4), 16);
                let b = parseInt(rgb.slice(4, 6), 16);
                r = Math.max(0, Math.min(255, r + amount));
                g = Math.max(0, Math.min(255, g + amount));
                b = Math.max(0, Math.min(255, b + amount));
                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
              };
              return getLuminance(hex) > 0.5 ? adjustColor(hex, -30) : adjustColor(hex, 30);
            }
          )(systemSettings.buttonColor)};
          --button-hover-font-color: ${systemSettings.buttonHoverFontColor || (
            (bg) => {
              const getContrastRatio = (hex1: string, hex2: string) => {
                const getLuminance = (hex: string) => {
                  const rgb = hex.startsWith('#') ? hex.slice(1) : hex;
                  const r = parseInt(rgb.slice(0, 2), 16) / 255;
                  const g = parseInt(rgb.slice(2, 4), 16) / 255;
                  const b = parseInt(rgb.slice(4, 6), 16) / 255;
                  const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
                  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                };
                const l1 = getLuminance(hex1);
                const l2 = getLuminance(hex2);
                return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
              };
              const hoverBg = systemSettings.buttonHoverColor || (
                (hex) => {
                  const getLuminance = (h: string) => {
                    const rgb = h.startsWith('#') ? h.slice(1) : h;
                    const r = parseInt(rgb.slice(0, 2), 16) / 255;
                    const g = parseInt(rgb.slice(2, 4), 16) / 255;
                    const b = parseInt(rgb.slice(4, 6), 16) / 255;
                    const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
                    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                  };
                  const adjustColor = (h: string, amount: number) => {
                    const rgb = h.startsWith('#') ? h.slice(1) : h;
                    let r = parseInt(rgb.slice(0, 2), 16);
                    let g = parseInt(rgb.slice(2, 4), 16);
                    let b = parseInt(rgb.slice(4, 6), 16);
                    r = Math.max(0, Math.min(255, r + amount));
                    g = Math.max(0, Math.min(255, g + amount));
                    b = Math.max(0, Math.min(255, b + amount));
                    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                  };
                  return getLuminance(hex) > 0.5 ? adjustColor(hex, -30) : adjustColor(hex, 30);
                }
              )(systemSettings.buttonColor);
              return getContrastRatio(hoverBg, "#ffffff") > 4.5 ? "#ffffff" : "#0f172a";
            }
          )(systemSettings.buttonColor)};
          --company-name-font-color: ${systemSettings.companyNameFontColor || '#0f172a'};
          --logo-bg-color: ${systemSettings.logoBgColor || '#be123c'};
          --primary-bg-color: ${systemSettings.primaryBgColor || '#f8fafc'};
          --secondary-bg-color: ${systemSettings.secondaryBgColor || '#ffffff'};
          --general-font-color: ${systemSettings.generalFontColor || '#334155'};
          --secondary-button-color: ${systemSettings.secondaryButtonColor || 'transparent'};
          --secondary-button-font-color: ${systemSettings.secondaryButtonFontColor || 'var(--primary-color)'};
          --secondary-button-hover-bg-color: ${systemSettings.secondaryButtonHoverColor || (
            (hex) => {
              if (hex === "transparent") return "color-mix(in srgb, var(--primary-color), transparent 90%)";
              const getLuminance = (h: string) => {
                const rgb = h.startsWith('#') ? h.slice(1) : h;
                const r = parseInt(rgb.slice(0, 2), 16) / 255;
                const g = parseInt(rgb.slice(2, 4), 16) / 255;
                const b = parseInt(rgb.slice(4, 6), 16) / 255;
                const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
                return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
              };
              const adjustColor = (h: string, amount: number) => {
                const rgb = h.startsWith('#') ? h.slice(1) : h;
                let r = parseInt(rgb.slice(0, 2), 16);
                let g = parseInt(rgb.slice(2, 4), 16);
                let b = parseInt(rgb.slice(4, 6), 16);
                r = Math.max(0, Math.min(255, r + amount));
                g = Math.max(0, Math.min(255, g + amount));
                b = Math.max(0, Math.min(255, b + amount));
                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
              };
              return getLuminance(hex) > 0.5 ? adjustColor(hex, -15) : adjustColor(hex, 15);
            }
          )(systemSettings.secondaryButtonColor)};
          --secondary-button-hover-font-color: ${systemSettings.secondaryButtonHoverFontColor || (
            (bg) => {
              const getContrastRatio = (hex1: string, hex2: string) => {
                const getLuminance = (hex: string) => {
                  const rgb = hex.startsWith('#') ? hex.slice(1) : hex;
                  const r = parseInt(rgb.slice(0, 2), 16) / 255;
                  const g = parseInt(rgb.slice(2, 4), 16) / 255;
                  const b = parseInt(rgb.slice(4, 6), 16) / 255;
                  const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
                  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                };
                const l1 = getLuminance(hex1);
                const l2 = getLuminance(hex2);
                return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
              };
              const hoverBg = systemSettings.secondaryButtonHoverColor || (
                (hex) => {
                  const getLuminance = (h: string) => {
                    const rgb = h.startsWith('#') ? h.slice(1) : h;
                    const r = parseInt(rgb.slice(0, 2), 16) / 255;
                    const g = parseInt(rgb.slice(2, 4), 16) / 255;
                    const b = parseInt(rgb.slice(4, 6), 16) / 255;
                    const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
                    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                  };
                  const adjustColor = (h: string, amount: number) => {
                    const rgb = h.startsWith('#') ? h.slice(1) : h;
                    let r = parseInt(rgb.slice(0, 2), 16);
                    let g = parseInt(rgb.slice(2, 4), 16);
                    let b = parseInt(rgb.slice(4, 6), 16);
                    r = Math.max(0, Math.min(255, r + amount));
                    g = Math.max(0, Math.min(255, g + amount));
                    b = Math.max(0, Math.min(255, b + amount));
                    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                  };
                  return getLuminance(hex) > 0.5 ? adjustColor(hex, -15) : adjustColor(hex, 15);
                }
              )(systemSettings.secondaryButtonColor);
              return getContrastRatio(hoverBg, "#ffffff") > 4.5 ? "#ffffff" : "#0f172a";
            }
          )(systemSettings.secondaryButtonColor)};
        }
        
        body {
          background-color: var(--primary-bg-color) !important;
          color: var(--general-font-color) !important;
        }

        /* Global Overrides */
        .bg-slate-50 { background-color: var(--primary-bg-color) !important; }
        .bg-white { background-color: var(--secondary-bg-color) !important; }

        .text-slate-900 { color: var(--general-font-color) !important; }
        .text-slate-600 { color: color-mix(in srgb, var(--general-font-color), transparent 20%) !important; }
        .text-slate-500 { color: color-mix(in srgb, var(--general-font-color), transparent 40%) !important; }
        .text-slate-400 { color: color-mix(in srgb, var(--general-font-color), transparent 60%) !important; }

        .text-primary { color: var(--primary-color) !important; }
        .bg-primary { background-color: var(--primary-color) !important; }
        .border-primary { border-color: var(--primary-color) !important; }
        
        .text-secondary { color: var(--secondary-color) !important; }
        .bg-secondary { background-color: var(--secondary-color) !important; }
        .border-secondary { border-color: var(--secondary-color) !important; }
        
        .bg-btn { background-color: var(--button-color) !important; }
        .text-btn-font { color: var(--button-font-color) !important; }
        
        .bg-logo-bg { background-color: var(--logo-bg-color) !important; }

        /* Button Variant Overrides */
        .bg-btn-primary { 
          background-color: var(--button-color) !important; 
          color: var(--button-font-color) !important; 
          transition: all 0.3s ease !important;
        }
        .bg-btn-primary:hover { 
          background-color: var(--button-hover-bg-color) !important; 
          color: var(--button-hover-font-color) !important; 
          opacity: 1 !important;
        }

        .bg-btn-secondary { 
          background-color: var(--secondary-button-color) !important; 
          color: var(--secondary-button-font-color) !important; 
          transition: all 0.3s ease !important;
        }
        .bg-btn-secondary:hover { 
          background-color: var(--secondary-button-hover-bg-color) !important; 
          color: var(--secondary-button-hover-font-color) !important; 
          opacity: 1 !important;
        }
        
        /* Focus states */
        .focus-border-primary:focus { border-color: var(--primary-color) !important; }
        .focus-ring-primary:focus { --tw-ring-color: var(--primary-color) !important; }
        
        /* Dynamic hover and light backgrounds */
        .bg-primary-light { background-color: color-mix(in srgb, var(--primary-color), white 90%) !important; }
        .hover-bg-primary:hover { background-color: var(--primary-color) !important; }
      `}</style>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-[100] px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]"
          >
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={14} />
            </div>
            <p className="text-sm font-bold">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {opModal && (
          <Modal title={opModal.mode === "new" ? "Novo Operador" : opModal.mode === "edit_expiry" ? "Editar Validade" : "Editar Operador"} onClose={() => setOpModal(null)}>
            {opModal.mode === "edit_expiry" ? (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-500">Alterando validade do cartão <strong>{opModal.data.serial}</strong></p>
                <Input label="Nova Data de Validade" type="text" placeholder="DD/MM/AAAA" value={editExpiry} onChange={e => setEditExpiry(e.target.value)} />
                <div className="flex gap-3 mt-4">
                  <Button variant="secondary" full onClick={() => setOpModal(null)}>Cancelar</Button>
                  <Button full onClick={handleUpdateExpiry}>Salvar Alteração</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Input label="Nome Completo" icon={User} value={opModal.data.name} onChange={e => setOpModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))} />
                <Input label="E-mail Institucional" icon={Mail} value={opModal.data.email} onChange={e => setOpModal(p => ({ ...p, data: { ...p.data, email: e.target.value } }))} />
                {opModal.mode === "new" && (
                  <Input label="Senha Provisória" icon={Lock} type="password" value={opModal.data.password || ""} onChange={e => setOpModal(p => ({ ...p, data: { ...p.data, password: e.target.value } }))} />
                )}
                <div className="flex gap-3 mt-4">
                  <Button variant="secondary" full onClick={() => setOpModal(null)}>Cancelar</Button>
                  <Button full onClick={() => handleSaveOperator(opModal.data)}>Salvar Operador</Button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
