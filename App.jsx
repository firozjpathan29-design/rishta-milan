import { useState, useMemo, useEffect, useRef } from "react";
import { Heart, Shield, Briefcase, Landmark, User, Globe2, Search, X, Check, Sparkles, Crown, Gem, Phone, LogOut, Users, UserCircle, Send, MessageCircle, Lock, Video, VideoOff, Mic, MicOff, PhoneOff, Trash2, LayoutDashboard, BadgeCheck } from "lucide-react";

// ---------- Mock data (no API, no backend cost) ----------
const SEED_PROFILES = [
  { id: 1, name: "Priya Sharma", age: 26, city: "Ahmedabad", religion: "Hindu", caste: "Brahmin", edu: "M.Tech, IT", job: "govt", jobLabel: "Bank PO (SBI)", marital: "single", verified: true, income: "₹8-10 LPA", img: "🌸" },
  { id: 2, name: "Rohit Patel", age: 29, city: "Surat", religion: "Hindu", caste: "Patel", edu: "MBA", job: "business", jobLabel: "Textile Business (₹50L turnover)", marital: "single", verified: true, income: "₹12-15 LPA", img: "🌼" },
  { id: 3, name: "Ayesha Khan", age: 31, city: "Vadodara", religion: "Muslim", caste: "-", edu: "MBBS", job: "govt", jobLabel: "Govt. Doctor", marital: "widow", verified: true, income: "₹10-12 LPA", img: "🌷" },
  { id: 4, name: "Vikram Singh", age: 34, city: "Toronto, Canada", religion: "Hindu", caste: "Rajput", edu: "B.E. Mechanical", job: "nri", jobLabel: "Engineer, PR Holder", marital: "single", verified: true, income: "CAD 85,000", img: "🌻" },
  { id: 5, name: "Neha Joshi", age: 27, city: "Ahmedabad", religion: "Hindu", caste: "Brahmin", edu: "CA", job: "business", jobLabel: "Own CA Firm", marital: "single", verified: false, income: "₹15+ LPA", img: "🌺" },
  { id: 6, name: "Farhan Sheikh", age: 33, city: "Rajkot", religion: "Muslim", caste: "-", edu: "Graduate", job: "govt", jobLabel: "Railway (Group B)", marital: "widower", verified: true, income: "₹7-9 LPA", img: "🌹" },
  { id: 7, name: "Simran Kaur", age: 24, city: "Ahmedabad", religion: "Sikh", caste: "-", edu: "B.Com", job: "private", jobLabel: "Private Job, HDFC", marital: "single", verified: true, income: "₹5-6 LPA", img: "🌸" },
  { id: 8, name: "Arjun Mehta", age: 30, city: "Dubai, UAE", religion: "Hindu", caste: "Vaishnav", edu: "MS", job: "nri", jobLabel: "Sr. Consultant", marital: "single", verified: true, income: "AED 25,000/mo", img: "🌼" },
];

const JOB_META = {
  govt: { label: "Govt Job", icon: Landmark, color: "#7A1F2B" },
  business: { label: "Self Business", icon: Briefcase, color: "#8A5A00" },
  private: { label: "Private Job", icon: User, color: "#3E5C50" },
  nri: { label: "NRI / Abroad", icon: Globe2, color: "#1F4E5A" },
};

const PLANS = [
  { key: "free", name: "Free", price: "₹0", icon: Sparkles, tagline: "Start looking", features: ["Create profile", "5 profile views/day", "Basic search"] },
  { key: "silver", name: "Silver", price: "₹299/mo", icon: Shield, tagline: "Serious search", features: ["Unlimited views", "All filters unlocked", "10 interests/day", "Chat after mutual match"] },
  { key: "gold", name: "Gold", price: "₹599/mo", icon: Crown, tagline: "Most chosen", features: ["Everything in Silver", "Unlimited interests", "Direct messaging", "Verified badge", "Priority listing"], popular: true },
  { key: "platinum", name: "Platinum", price: "₹1,199/mo", icon: Gem, tagline: "Full service", features: ["Everything in Gold", "Personal matchmaker", "Unlimited video calls", "Homepage featured"] },
];

const FILTER_DEFAULTS = { govt: false, business: false, single: false, widow: false, nri: false };

export default function MarriageBureauDemo() {
  const [profiles, setProfiles] = useState(SEED_PROFILES);
  const [tab, setTab] = useState("browse");
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(null);
  const [interests, setInterests] = useState({});
  const [plan, setPlan] = useState("free");
  const [dataLoading, setDataLoading] = useState(true);
  const [storageOK, setStorageOK] = useState(true);

  // ---------- Mock payment (Razorpay-style UI, no real gateway/API cost) ----------
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [payMethod, setPayMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("form"); // form -> processing -> success

  // ---------- Chat (mock — local/personal only, no messaging API cost) ----------
  const [conversations, setConversations] = useState({}); // { [profileId]: [{from, text, ts}] }
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatDraft, setChatDraft] = useState("");
  const CANNED_REPLIES = [
    "Ji shukriya, aapki profile bhi achi lagi 🙂",
    "Family se baat karke bataata/bataati hoon.",
    "Aapka native place kaunsa hai?",
    "Kya hum call pe baat kar sakte hain?",
    "Theek hai, aage baat badhate hain.",
  ];

  // ---------- Video call (self-camera preview only, mock connection — no WebRTC/Agora API cost) ----------
  const [callProfile, setCallProfile] = useState(null);
  const [callStatus, setCallStatus] = useState("calling"); // calling -> connected -> ended
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camError, setCamError] = useState("");
  const [callSeconds, setCallSeconds] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  function startCall(p) {
    setCallProfile(p);
    setCallStatus("calling");
    setCallSeconds(0);
    setCamError("");
    setTimeout(() => setCallStatus("connected"), 1800);
  }

  async function attachCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCamError("Camera access nahi mili — browser permission check karein.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function endCall() {
    stopCamera();
    setCallStatus("ended");
    setTimeout(() => setCallProfile(null), 900);
  }

  useEffect(() => {
    if (callStatus === "connected" && camOn) attachCamera();
    if (!camOn) stopCamera();
    return () => {};
  }, [callStatus, camOn]);

  useEffect(() => {
    if (callStatus !== "connected") return;
    const t = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  function fmtTime(s) {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  }

  function openCheckout(pl) {
    setCheckoutPlan(pl);
    setPaymentStatus("form");
    setPayMethod("upi");
    setUpiId("");
    setCardNumber("");
  }
  function closeCheckout() {
    setCheckoutPlan(null);
    setPaymentStatus("form");
  }
  function payNow() {
    setPaymentStatus("processing");
    setTimeout(() => {
      setPaymentStatus("success");
      savePlan(checkoutPlan.key);
    }, 1600);
  }

  // ---------- Real persistence (window.storage — survives refresh, no server cost) ----------
  // Profiles are "shared" so every visitor sees profiles others created — like a real matchmaking DB.
  // Interests & plan are "personal" — specific to this user.
  useEffect(() => {
    (async () => {
      try {
        let loadedProfiles = SEED_PROFILES;
        try {
          const res = await window.storage.get("profiles", true);
          if (res && res.value) loadedProfiles = JSON.parse(res.value);
        } catch {
          await window.storage.set("profiles", JSON.stringify(SEED_PROFILES), true);
        }
        setProfiles(loadedProfiles);

        try {
          const res = await window.storage.get("interests", false);
          if (res && res.value) setInterests(JSON.parse(res.value));
        } catch {}

        try {
          const res = await window.storage.get("plan", false);
          if (res && res.value) setPlan(res.value);
        } catch {}

        try {
          const res = await window.storage.get("conversations", false);
          if (res && res.value) setConversations(JSON.parse(res.value));
        } catch {}

        try {
          const res = await window.storage.get("sb_session", false);
          if (res && res.value) {
            const s = JSON.parse(res.value);
            setSession(s);
            setAuthed(true);
          }
        } catch {}
      } catch (err) {
        console.error("Storage load failed:", err);
        setStorageOK(false);
      } finally {
        setDataLoading(false);
      }
    })();
  }, []);

  async function saveProfiles(next) {
    setProfiles(next);
    try {
      const result = await window.storage.set("profiles", JSON.stringify(next), true);
      if (!result) setStorageOK(false);
    } catch (err) {
      console.error("Save profiles failed:", err);
      setStorageOK(false);
    }
  }

  // ---------- Admin (mock PIN gate — local only, no separate auth backend) ----------
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminPinError, setAdminPinError] = useState("");
  const ADMIN_PIN = "9999";

  function toggleVerified(id) {
    saveProfiles(profiles.map((p) => (p.id === id ? { ...p, verified: !p.verified } : p)));
  }
  function deleteProfile(id) {
    saveProfiles(profiles.filter((p) => p.id !== id));
  }

  async function saveInterests(next) {
    setInterests(next);
    try {
      await window.storage.set("interests", JSON.stringify(next), false);
    } catch (err) {
      console.error("Save interests failed:", err);
    }
  }

  async function savePlan(next) {
    setPlan(next);
    try {
      await window.storage.set("plan", next, false);
    } catch (err) {
      console.error("Save plan failed:", err);
    }
  }

  async function saveConversations(next) {
    setConversations(next);
    try {
      await window.storage.set("conversations", JSON.stringify(next), false);
    } catch (err) {
      console.error("Save conversations failed:", err);
    }
  }

  function sendMessage() {
    if (!chatDraft.trim() || !activeChatId) return;
    const thread = conversations[activeChatId] || [];
    const myMsg = { from: "me", text: chatDraft.trim(), ts: Date.now() };
    const next = { ...conversations, [activeChatId]: [...thread, myMsg] };
    saveConversations(next);
    setChatDraft("");
    // Mock auto-reply so the chat feels alive — no AI/messaging API involved
    setTimeout(() => {
      const reply = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
      setConversations((c) => {
        const t = c[activeChatId] || [];
        const updated = { ...c, [activeChatId]: [...t, { from: "them", text: reply, ts: Date.now() }] };
        window.storage.set("conversations", JSON.stringify(updated), false).catch(() => {});
        return updated;
      });
    }, 1400);
  }

  // ---------- Profile creation ----------
  const EMPTY_FORM = {
    name: "", age: "", gender: "Female", city: "", religion: "Hindu", caste: "", maritalStatus: "single",
    height: "", weight: "", complexion: "Fair", build: "Average",
    edu: "", jobType: "govt", jobLabel: "", income: "",
    familyType: "Joint", fatherOcc: "",
    partnerAgeMin: "", partnerAgeMax: "", partnerJobPref: [],
    img: "🌸", photoUrl: "",
  };
  const [profileStep, setProfileStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [profileCreated, setProfileCreated] = useState(false);
  const [photoError, setPhotoError] = useState("");

  function updateForm(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function togglePartnerPref(key) {
    setForm((f) => ({
      ...f,
      partnerJobPref: f.partnerJobPref.includes(key)
        ? f.partnerJobPref.filter((k) => k !== key)
        : [...f.partnerJobPref, key],
    }));
  }
  function submitProfile() {
    const newProfile = {
      id: Date.now(),
      name: form.name || "Unnamed",
      age: form.age || "-",
      city: form.city || "-",
      height: form.height || "-",
      weight: form.weight || "-",
      complexion: form.complexion,
      build: form.build,
      religion: form.religion,
      caste: form.caste || "-",
      edu: form.edu || "-",
      job: form.jobType,
      jobLabel: form.jobLabel || JOB_META[form.jobType].label,
      marital: form.maritalStatus,
      verified: false,
      income: form.income || "Not specified",
      img: form.img,
      photoUrl: form.photoUrl || "",
    };
    saveProfiles([newProfile, ...profiles]);
    setProfileCreated(true);
  }
  function resetProfileForm() {
    setForm(EMPTY_FORM);
    setProfileStep(1);
    setProfileCreated(false);
    setPhotoError("");
  }

  // ---------- Auth — REAL Supabase Auth via REST (no SDK needed, zero extra cost) ----------
  const SUPABASE_URL = "https://nhjrgoowbkgfozyazhzf.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oanJnb293YmtnZm96eWF6aHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjIyNzgsImV4cCI6MjEwMDE5ODI3OH0.C3p_XiPMocZUxgrAZeoSRhc1fMoABH4BvddVFAL9H5A";

  const [authed, setAuthed] = useState(false);
  const [authStep, setAuthStep] = useState("role"); // role -> auth
  const [role, setRole] = useState(null);
  const [authMode, setAuthMode] = useState("signup"); // signup | login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState(null); // { access_token, user }

  async function supaAuth(path, body) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || data.error || "Kuch galat ho gaya");
    return data;
  }

  async function saveSession(next) {
    setSession(next);
    setAuthed(!!next);
    try {
      if (next) await window.storage.set("sb_session", JSON.stringify(next), false);
      else await window.storage.delete("sb_session", false);
    } catch {}
  }

  async function handleSignup() {
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await supaAuth("signup", { email, password, data: { role } });
      if (data.access_token) {
        saveSession({ access_token: data.access_token, user: data.user });
      } else {
        setAuthError("Signup ho gaya! Email check karke confirm karein, phir login karein.");
        setAuthMode("login");
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogin() {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.msg || "Login fail hua");
      saveSession({ access_token: data.access_token, user: data.user });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    saveSession(null);
    setAuthStep("role");
    setEmail("");
    setPassword("");
  }

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (filters.govt && p.job !== "govt") return false;
      if (filters.business && p.job !== "business") return false;
      if (filters.nri && p.job !== "nri") return false;
      if (filters.single && p.marital !== "single") return false;
      if (filters.widow && !(p.marital === "widow" || p.marital === "widower")) return false;
      return true;
    });
  }, [filters, profiles]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function toggleFilter(key) {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  }

  function sendInterest(id) {
    saveInterests({ ...interests, [id]: true });
  }

  const authFont = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Mukta:wght@400;500;600;700&display=swap');
      .display { font-family: 'Rozha One', serif; }
      .card-shadow { box-shadow: 0 4px 18px rgba(122,31,43,0.10); }
    `}</style>
  );

  if (dataLoading) {
    return (
      <div style={{ fontFamily: "'Mukta', sans-serif", background: "#FBF6EE", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ textAlign: "center", color: "#7A1F2B" }}>
          <Heart size={28} fill="#7A1F2B" className="mx-auto mb-2" style={{ animation: "pulse 1.2s ease-in-out infinite" }} />
          <p className="text-sm" style={{ color: "#6B5B4D" }}>Loading profiles…</p>
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ fontFamily: "'Mukta', sans-serif", background: "#FBF6EE", minHeight: "100%", color: "#241C15", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        {authFont}
        <div className="card-shadow bg-white rounded-2xl p-6 w-full" style={{ maxWidth: 360 }}>
          <div className="flex items-center gap-2 justify-center mb-5">
            <Heart size={22} color="#7A1F2B" fill="#7A1F2B" />
            <span className="display text-2xl" style={{ color: "#7A1F2B" }}>Rishta Milan</span>
          </div>

          {authStep === "role" && (
            <>
              <p className="text-sm text-center mb-4" style={{ color: "#6B5B4D" }}>Aap kaise register karna chahte hain?</p>
              <div className="space-y-2.5">
                {[
                  ["self", "Main khud dhoondh raha hoon", UserCircle],
                  ["family", "Family member hoon", Users],
                  ["agent", "Marriage Bureau Agent hoon", Briefcase],
                ].map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => { setRole(key); setAuthStep("auth"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left"
                    style={{ border: "1px solid #C89B3C55", color: "#4A3F35" }}
                  >
                    <Icon size={18} color="#7A1F2B" /> {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {authStep === "auth" && (
            <>
              <div className="flex gap-2 mb-4">
                {["signup", "login"].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setAuthMode(m); setAuthError(""); }}
                    className="flex-1 py-2 rounded-full text-xs font-semibold"
                    style={{ background: authMode === m ? "#7A1F2B" : "#F4DCC7", color: authMode === m ? "#FBF6EE" : "#6B4A1F" }}
                  >
                    {m === "signup" ? "Sign Up" : "Login"}
                  </button>
                ))}
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAuthError(""); }}
                placeholder="Email address"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
                style={{ border: "1px solid #C89B3C55" }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
                placeholder="Password (min 6 characters)"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-2"
                style={{ border: "1px solid #C89B3C55" }}
              />
              {authError && <p className="text-xs text-center mb-2" style={{ color: authError.includes("Signup ho gaya") ? "#3E5C50" : "#B3261E" }}>{authError}</p>}

              <button
                onClick={authMode === "signup" ? handleSignup : handleLogin}
                disabled={authLoading || !email || password.length < 6}
                className="w-full py-2.5 rounded-full text-sm font-semibold"
                style={{ background: (!authLoading && email && password.length >= 6) ? "#7A1F2B" : "#C89B3C55", color: "#FBF6EE" }}
              >
                {authLoading ? "Please wait…" : authMode === "signup" ? "Create Account" : "Login"}
              </button>
              <button onClick={() => setAuthStep("role")} className="w-full mt-2 py-2 text-xs" style={{ color: "#6B5B4D" }}>← Back</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Mukta', sans-serif", background: "#FBF6EE", minHeight: "100%", color: "#241C15" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Mukta:wght@400;500;600;700&display=swap');
        .display { font-family: 'Rozha One', serif; }
        .arch-card { position: relative; border-radius: 999px 999px 14px 14px; }
        .arch-top {
          height: 64px;
          background: linear-gradient(135deg, #7A1F2B, #9C2C3A);
          border-radius: 999px 999px 0 0;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .arch-top::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 50%; transform: translateX(-50%);
          width: 40px; height: 3px; background: #C89B3C; border-radius: 3px;
        }
        .motif-divider {
          display: flex; align-items: center; gap: 8px; margin: 4px 0;
        }
        .motif-divider::before, .motif-divider::after {
          content: ''; flex: 1; height: 1px; background: #C89B3C77;
        }
        .chip {
          font-size: 11px; padding: 3px 9px; border-radius: 999px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .card-shadow { box-shadow: 0 4px 18px rgba(122,31,43,0.10); }
      `}</style>

      {/* Header */}
      <header style={{ background: "#7A1F2B" }} className="px-5 py-4 flex items-center justify-between sticky top-0 z-20 card-shadow">
        <div className="flex items-center gap-2">
          <Heart size={22} color="#C89B3C" fill="#C89B3C" />
          <span className="display text-2xl" style={{ color: "#FBF6EE" }}>Rishta Milan</span>
        </div>
        <div className="flex items-center gap-1">
          <nav className="flex gap-1">
            {[
              ["browse", "Browse"],
              ["create", "Create Profile"],
              ["chat", "Chat"],
              ["subscription", "Plans"],
              ["admin", "Admin"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition"
                style={{
                  background: tab === key ? "#C89B3C" : "transparent",
                  color: tab === key ? "#3D2200" : "#F4DCC7",
                }}
              >
                {label}
              </button>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            title="Logout"
            className="ml-1 p-2 rounded-full"
            style={{ color: "#F4DCC7" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {!storageOK && (
        <div className="px-5 py-1.5 text-xs text-center" style={{ background: "#F4DCC7", color: "#6B4A1F" }}>
          Save mein dikkat aayi — data is session ke liye chalega par persist nahi hoga.
        </div>
      )}


      {tab === "browse" && (
        <main className="px-5 py-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="display text-3xl" style={{ color: "#7A1F2B" }}>Find a match</h1>
              <p className="text-sm" style={{ color: "#6B5B4D" }}>{filtered.length} profiles {activeFilterCount > 0 && `· ${activeFilterCount} filters active`}</p>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm"
              style={{ background: "#7A1F2B", color: "#FBF6EE" }}
            >
              <Search size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>

          {/* Quick filter chips (the 5 special filters from the blueprint) */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              ["govt", "Govt Job", Landmark],
              ["business", "Self Business", Briefcase],
              ["single", "Single", User],
              ["widow", "Widow/Widower", Shield],
              ["nri", "NRI/Foreigner", Globe2],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                className="chip"
                style={{
                  background: filters[key] ? "#7A1F2B" : "#F4DCC7",
                  color: filters[key] ? "#FBF6EE" : "#6B4A1F",
                  border: "1px solid #C89B3C55",
                }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20" style={{ color: "#6B5B4D" }}>
              <p className="display text-2xl mb-2">No matches for this combination</p>
              <p className="text-sm">Try removing a filter.</p>
            </div>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
              {filtered.map((p) => {
                const meta = JOB_META[p.job];
                const Icon = meta.icon;
                return (
                  <div key={p.id} className="arch-card card-shadow bg-white overflow-hidden">
                    <div className="arch-top">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #C89B3C" }} />
                      ) : (
                        <span style={{ fontSize: 30 }}>{p.img}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base" style={{ color: "#241C15" }}>{p.name}</h3>
                        {p.verified && <Check size={14} color="#3E5C50" />}
                      </div>
                      <p className="text-xs mb-2" style={{ color: "#6B5B4D" }}>{p.age} yrs · {p.city}</p>
                      <div className="motif-divider" />
                      <p className="text-xs mb-1"><b>{p.edu}</b></p>
                      <span className="chip mb-2" style={{ background: `${meta.color}15`, color: meta.color }}>
                        <Icon size={11} /> {meta.label}
                      </span>
                      <p className="text-xs mb-3" style={{ color: "#6B5B4D" }}>{p.jobLabel}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelected(p)}
                          className="flex-1 py-1.5 rounded-full text-xs font-semibold"
                          style={{ border: "1px solid #7A1F2B", color: "#7A1F2B" }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => sendInterest(p.id)}
                          disabled={interests[p.id]}
                          className="flex-1 py-1.5 rounded-full text-xs font-semibold"
                          style={{ background: interests[p.id] ? "#3E5C50" : "#7A1F2B", color: "#FBF6EE" }}
                        >
                          {interests[p.id] ? "Sent ✓" : "Send Interest"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {tab === "create" && (
        <main className="px-5 py-6 max-w-lg mx-auto">
          {profileCreated ? (
            <div className="text-center py-16 card-shadow bg-white rounded-2xl px-6">
              <Check size={40} color="#3E5C50" className="mx-auto mb-3" />
              <h2 className="display text-2xl mb-1" style={{ color: "#7A1F2B" }}>Profile Created!</h2>
              <p className="text-sm mb-5" style={{ color: "#6B5B4D" }}>Aapki profile Browse list mein add ho gayi hai. Verification pending hai.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setTab("browse")} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#7A1F2B", color: "#FBF6EE" }}>See it in Browse</button>
                <button onClick={resetProfileForm} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ border: "1px solid #7A1F2B", color: "#7A1F2B" }}>Add Another</button>
              </div>
            </div>
          ) : (
            <div className="card-shadow bg-white rounded-2xl p-6">
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mb-5">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: s <= profileStep ? "#7A1F2B" : "#F4DCC7" }} />
                ))}
              </div>
              <p className="text-xs font-semibold mb-4" style={{ color: "#C89B3C" }}>STEP {profileStep} OF 4</p>

              {profileStep === 1 && (
                <div className="space-y-3">
                  <h2 className="display text-xl mb-3" style={{ color: "#7A1F2B" }}>Personal Information</h2>
                  <input placeholder="Full Name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                  <div className="flex gap-3">
                    <input placeholder="Age" type="number" value={form.age} onChange={(e) => updateForm("age", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                    <select value={form.gender} onChange={(e) => updateForm("gender", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }}>
                      <option>Female</option><option>Male</option><option>Other</option>
                    </select>
                  </div>
                  <input placeholder="City" value={form.city} onChange={(e) => updateForm("city", e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                  <div className="flex gap-3">
                    <input placeholder="Height (e.g. 5'6&quot;)" value={form.height} onChange={(e) => updateForm("height", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                    <input placeholder="Weight (kg)" type="number" value={form.weight} onChange={(e) => updateForm("weight", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                  </div>
                  <div className="flex gap-3">
                    <select value={form.complexion} onChange={(e) => updateForm("complexion", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }}>
                      {["Very Fair", "Fair", "Wheatish", "Wheatish Brown", "Dark"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <select value={form.build} onChange={(e) => updateForm("build", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }}>
                      {["Slim", "Athletic", "Average", "Heavy"].map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <select value={form.religion} onChange={(e) => updateForm("religion", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }}>
                      {["Hindu", "Muslim", "Sikh", "Christian", "Jain", "Buddhist", "Parsi", "Other"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <input placeholder="Caste (optional)" value={form.caste} onChange={(e) => updateForm("caste", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                  </div>
                  <select value={form.maritalStatus} onChange={(e) => updateForm("maritalStatus", e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }}>
                    <option value="single">Never Married</option>
                    <option value="widow">Widow</option>
                    <option value="widower">Widower</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </div>
              )}

              {profileStep === 2 && (
                <div className="space-y-3">
                  <h2 className="display text-xl mb-3" style={{ color: "#7A1F2B" }}>Education & Career</h2>
                  <input placeholder="Highest Education (e.g. MBA, B.Tech)" value={form.edu} onChange={(e) => updateForm("edu", e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                  <p className="text-xs font-semibold mt-1" style={{ color: "#6B5B4D" }}>Occupation Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(JOB_META).map(([key, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => updateForm("jobType", key)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                          style={{ border: form.jobType === key ? `2px solid ${meta.color}` : "1px solid #C89B3C55", color: meta.color }}
                        >
                          <Icon size={14} /> {meta.label}
                        </button>
                      );
                    })}
                  </div>
                  <input placeholder="Job Title / Business (e.g. Bank PO, Own Textile Business)" value={form.jobLabel} onChange={(e) => updateForm("jobLabel", e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                  <input placeholder="Annual Income (e.g. ₹8-10 LPA)" value={form.income} onChange={(e) => updateForm("income", e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                </div>
              )}

              {profileStep === 3 && (
                <div className="space-y-3">
                  <h2 className="display text-xl mb-3" style={{ color: "#7A1F2B" }}>Family & Partner Preferences</h2>
                  <div className="flex gap-3">
                    <select value={form.familyType} onChange={(e) => updateForm("familyType", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }}>
                      <option>Joint</option><option>Nuclear</option>
                    </select>
                    <input placeholder="Father's Occupation" value={form.fatherOcc} onChange={(e) => updateForm("fatherOcc", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                  </div>
                  <p className="text-xs font-semibold mt-2" style={{ color: "#6B5B4D" }}>Preferred Partner Age Range</p>
                  <div className="flex gap-3">
                    <input placeholder="Min age" type="number" value={form.partnerAgeMin} onChange={(e) => updateForm("partnerAgeMin", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                    <input placeholder="Max age" type="number" value={form.partnerAgeMax} onChange={(e) => updateForm("partnerAgeMax", e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                  </div>
                  <p className="text-xs font-semibold mt-2" style={{ color: "#6B5B4D" }}>Preferred Partner Occupation</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(JOB_META).map(([key, meta]) => (
                      <button
                        key={key}
                        onClick={() => togglePartnerPref(key)}
                        className="chip"
                        style={{ background: form.partnerJobPref.includes(key) ? meta.color : "#F4DCC7", color: form.partnerJobPref.includes(key) ? "#fff" : "#6B4A1F" }}
                      >
                        {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {profileStep === 4 && (
                <div>
                  <h2 className="display text-xl mb-3" style={{ color: "#7A1F2B" }}>Photo & Review</h2>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#6B5B4D" }}>Upload profile photo</p>

                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ border: "1px solid #C89B3C55", background: "#FBF6EE" }}
                    >
                      {form.photoUrl ? (
                        <img src={form.photoUrl} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{form.img}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="photo-upload-input"
                        className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer inline-block"
                        style={{ background: "#7A1F2B", color: "#FBF6EE" }}
                      >
                        {form.photoUrl ? "Change Photo" : "Upload Photo"}
                      </label>
                      {form.photoUrl && (
                        <button
                          onClick={() => { updateForm("photoUrl", ""); setPhotoError(""); }}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{ border: "1px solid #7A1F2B", color: "#7A1F2B" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      id="photo-upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/")) {
                          setPhotoError("Sirf image file allowed hai (jpg/png).");
                          return;
                        }
                        if (file.size > 3 * 1024 * 1024) {
                          setPhotoError("Photo 3MB se chhoti honi chahiye.");
                          return;
                        }
                        setPhotoError("");
                        const reader = new FileReader();
                        reader.onload = () => updateForm("photoUrl", reader.result);
                        reader.onerror = () => setPhotoError("Photo read nahi ho payi, dobara try karein.");
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {photoError && <p className="text-xs mb-2" style={{ color: "#B3261E" }}>{photoError}</p>}
                  <p className="text-xs mb-3" style={{ color: "#6B5B4D" }}>Ya ek icon chunein:</p>
                  <div className="flex gap-2 mb-4">
                    {["🌸", "🌼", "🌷", "🌻", "🌺", "🌹"].map((e) => (
                      <button key={e} onClick={() => updateForm("img", e)} className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ border: form.img === e && !form.photoUrl ? "2px solid #7A1F2B" : "1px solid #C89B3C55" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-xl p-4 text-xs space-y-1" style={{ background: "#FBF6EE", color: "#4A3F35" }}>
                    <p><b>{form.name || "—"}</b>, {form.age || "—"} yrs, {form.gender}</p>
                    <p>{form.height && `${form.height}`}{form.weight && ` · ${form.weight} kg`}{form.complexion && ` · ${form.complexion}`}{form.build && ` · ${form.build}`}</p>
                    <p>{form.city || "—"} · {form.religion} {form.caste && `· ${form.caste}`}</p>
                    <p>{form.edu || "—"} · {JOB_META[form.jobType].label}{form.jobLabel && ` — ${form.jobLabel}`}</p>
                    <p>Income: {form.income || "Not specified"}</p>
                    <p>Family: {form.familyType}{form.fatherOcc && `, Father: ${form.fatherOcc}`}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-5">
                {profileStep > 1 && (
                  <button onClick={() => setProfileStep((s) => s - 1)} className="flex-1 py-2.5 rounded-full text-sm font-semibold" style={{ border: "1px solid #7A1F2B", color: "#7A1F2B" }}>
                    Back
                  </button>
                )}
                {profileStep < 4 ? (
                  <button onClick={() => setProfileStep((s) => s + 1)} className="flex-1 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#7A1F2B", color: "#FBF6EE" }}>
                    Next
                  </button>
                ) : (
                  <button onClick={submitProfile} className="flex-1 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#3E5C50", color: "#FBF6EE" }}>
                    Submit Profile
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {tab === "chat" && (
        <main className="px-5 py-6 max-w-3xl mx-auto">
          <h1 className="display text-3xl mb-4" style={{ color: "#7A1F2B" }}>Messages</h1>

          {plan === "free" ? (
            <div className="text-center py-16 card-shadow bg-white rounded-2xl px-6">
              <Lock size={32} color="#C89B3C" className="mx-auto mb-3" />
              <h2 className="display text-xl mb-1" style={{ color: "#7A1F2B" }}>Chat Silver plan se unlock hota hai</h2>
              <p className="text-sm mb-5" style={{ color: "#6B5B4D" }}>Mutual match ke baad chat karne ke liye upgrade karein.</p>
              <button onClick={() => setTab("subscription")} className="px-5 py-2 rounded-full text-sm font-semibold" style={{ background: "#7A1F2B", color: "#FBF6EE" }}>
                See Plans
              </button>
            </div>
          ) : (
            <div className="card-shadow bg-white rounded-2xl overflow-hidden" style={{ minHeight: 420, display: "flex" }}>
              {/* Thread list */}
              <div style={{ width: activeChatId ? "40%" : "100%", borderRight: "1px solid #F4DCC7" }} className="overflow-y-auto">
                {Object.keys(interests).length === 0 ? (
                  <p className="text-sm text-center p-6" style={{ color: "#6B5B4D" }}>Koi interest bheja nahi hai abhi. Browse tab se kisi ko interest bhejein.</p>
                ) : (
                  Object.keys(interests).map((idStr) => {
                    const id = Number(idStr);
                    const p = profiles.find((pr) => pr.id === id);
                    if (!p) return null;
                    const thread = conversations[id] || [];
                    const last = thread[thread.length - 1];
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveChatId(id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        style={{ background: activeChatId === id ? "#FBF6EE" : "transparent", borderBottom: "1px solid #F4DCC722" }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: "#F4DCC7" }}>
                          {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <span>{p.img}</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          <p className="text-xs truncate" style={{ color: "#6B5B4D" }}>{last ? last.text : "Interest sent — chat shuru karein"}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Active thread */}
              {activeChatId && (() => {
                const p = profiles.find((pr) => pr.id === activeChatId);
                const thread = conversations[activeChatId] || [];
                return (
                  <div className="flex flex-col" style={{ width: "60%" }}>
                    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #F4DCC7" }}>
                      <button onClick={() => setActiveChatId(null)} className="text-xs mr-1" style={{ color: "#6B5B4D" }}>←</button>
                      <span className="text-sm font-semibold flex-1">{p ? p.name : ""}</span>
                      <button
                        onClick={() => p && startCall(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#7A1F2B" }}
                        title="Video Call"
                      >
                        <Video size={16} color="#FBF6EE" strokeWidth={2.5} />
                        <span className="text-xs font-semibold" style={{ color: "#FBF6EE" }}>Video Call</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: 300 }}>
                      {thread.length === 0 && <p className="text-xs text-center" style={{ color: "#6B5B4D" }}>Abhi tak koi message nahi. Namaste bolke shuru karein!</p>}
                      {thread.map((m, i) => (
                        <div key={i} className="flex" style={{ justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
                          <span
                            className="px-3 py-2 rounded-2xl text-sm max-w-[75%]"
                            style={{ background: m.from === "me" ? "#7A1F2B" : "#F4DCC7", color: m.from === "me" ? "#FBF6EE" : "#4A3F35" }}
                          >
                            {m.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 flex gap-2" style={{ borderTop: "1px solid #F4DCC7" }}>
                      <input
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Message likhein…"
                        className="flex-1 px-3 py-2 rounded-full text-sm outline-none"
                        style={{ border: "1px solid #C89B3C55" }}
                      />
                      <button onClick={sendMessage} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#7A1F2B" }}>
                        <Send size={15} color="#FBF6EE" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </main>
      )}

      {tab === "admin" && (
        <main className="px-5 py-6 max-w-4xl mx-auto">
          {!adminAuthed ? (
            <div className="card-shadow bg-white rounded-2xl p-6 max-w-xs mx-auto text-center mt-10">
              <Lock size={28} color="#7A1F2B" className="mx-auto mb-3" />
              <h2 className="display text-xl mb-1" style={{ color: "#7A1F2B" }}>Admin Login</h2>
              <p className="text-xs mb-4" style={{ color: "#6B5B4D" }}>Bureau/Agent staff ke liye (demo PIN: 9999)</p>
              <input
                type="password"
                value={adminPin}
                onChange={(e) => { setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setAdminPinError(""); }}
                placeholder="4-digit PIN"
                className="w-full text-center text-lg tracking-widest px-3 py-2.5 rounded-xl mb-2 outline-none"
                style={{ border: "1px solid #C89B3C55" }}
              />
              {adminPinError && <p className="text-xs mb-2" style={{ color: "#B3261E" }}>{adminPinError}</p>}
              <button
                onClick={() => (adminPin === ADMIN_PIN ? setAdminAuthed(true) : setAdminPinError("Galat PIN. Demo ke liye 9999 try karein."))}
                disabled={adminPin.length !== 4}
                className="w-full py-2.5 rounded-full text-sm font-semibold"
                style={{ background: adminPin.length === 4 ? "#7A1F2B" : "#C89B3C55", color: "#FBF6EE" }}
              >
                Login
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <h1 className="display text-3xl flex items-center gap-2" style={{ color: "#7A1F2B" }}>
                  <LayoutDashboard size={26} /> Admin Dashboard
                </h1>
                <button onClick={() => { setAdminAuthed(false); setAdminPin(""); }} className="text-xs font-semibold" style={{ color: "#6B5B4D" }}>Logout</button>
              </div>

              {/* Stats cards */}
              <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                {[
                  { label: "Total Profiles", value: profiles.length, real: true },
                  { label: "Verified", value: profiles.filter((p) => p.verified).length, real: true },
                  { label: "Pending Verification", value: profiles.filter((p) => !p.verified).length, real: true },
                  { label: "Est. Monthly Revenue*", value: "₹16.4L", real: false },
                ].map((s) => (
                  <div key={s.label} className="card-shadow bg-white rounded-xl p-4">
                    <p className="text-2xl font-bold" style={{ color: "#7A1F2B" }}>{s.value}</p>
                    <p className="text-xs" style={{ color: "#6B5B4D" }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mb-5" style={{ color: "#C89B3C" }}>*Sample projection from the blueprint — real revenue tracking needs a payments backend, isn't live data.</p>

              {/* Profile management */}
              <div className="card-shadow bg-white rounded-2xl overflow-hidden">
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #F4DCC7" }}>
                  <h3 className="font-semibold text-sm">Profile Management</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "#FBF6EE", color: "#6B5B4D" }}>
                        <th className="text-left px-4 py-2 font-semibold">Name</th>
                        <th className="text-left px-4 py-2 font-semibold">City</th>
                        <th className="text-left px-4 py-2 font-semibold">Occupation</th>
                        <th className="text-left px-4 py-2 font-semibold">Status</th>
                        <th className="text-left px-4 py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((p) => (
                        <tr key={p.id} style={{ borderTop: "1px solid #F4DCC722" }}>
                          <td className="px-4 py-2.5 font-semibold">{p.name}</td>
                          <td className="px-4 py-2.5" style={{ color: "#6B5B4D" }}>{p.city}</td>
                          <td className="px-4 py-2.5" style={{ color: "#6B5B4D" }}>{JOB_META[p.job]?.label || p.job}</td>
                          <td className="px-4 py-2.5">
                            {p.verified ? (
                              <span className="chip" style={{ background: "#3E5C5022", color: "#3E5C50" }}><BadgeCheck size={11} /> Verified</span>
                            ) : (
                              <span className="chip" style={{ background: "#C89B3C22", color: "#8A5A00" }}>Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-2">
                              <button onClick={() => toggleVerified(p.id)} className="text-xs font-semibold" style={{ color: "#7A1F2B" }}>
                                {p.verified ? "Unverify" : "Verify"}
                              </button>
                              <button onClick={() => deleteProfile(p.id)} title="Delete">
                                <Trash2 size={13} color="#B3261E" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      )}

      {tab === "subscription" && (
        <main className="px-5 py-8 max-w-6xl mx-auto">
          <h1 className="display text-3xl text-center mb-1" style={{ color: "#7A1F2B" }}>Choose a plan</h1>
          <p className="text-center text-sm mb-8" style={{ color: "#6B5B4D" }}>Upgrade anytime. Cancel anytime.</p>
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {PLANS.map((pl) => {
              const Icon = pl.icon;
              const active = plan === pl.key;
              return (
                <div
                  key={pl.key}
                  className="card-shadow bg-white rounded-2xl p-5 relative"
                  style={{ border: pl.popular ? "2px solid #C89B3C" : "1px solid #eee" }}
                >
                  {pl.popular && (
                    <span className="chip absolute -top-3 left-1/2" style={{ transform: "translateX(-50%)", background: "#C89B3C", color: "#3D2200" }}>
                      Most Chosen
                    </span>
                  )}
                  <Icon size={26} color="#7A1F2B" />
                  <h3 className="display text-xl mt-2" style={{ color: "#241C15" }}>{pl.name}</h3>
                  <p className="text-xs mb-2" style={{ color: "#6B5B4D" }}>{pl.tagline}</p>
                  <p className="text-2xl font-bold mb-3" style={{ color: "#7A1F2B" }}>{pl.price}</p>
                  <ul className="text-xs space-y-1.5 mb-4" style={{ color: "#4A3F35" }}>
                    {pl.features.map((f) => (
                      <li key={f} className="flex gap-1.5"><Check size={13} color="#3E5C50" style={{ flexShrink: 0, marginTop: 1 }} /> {f}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => (pl.key === "free" ? savePlan("free") : openCheckout(pl))}
                    className="w-full py-2 rounded-full text-sm font-semibold"
                    style={{ background: active ? "#3E5C50" : "#7A1F2B", color: "#FBF6EE" }}
                  >
                    {active ? "Current Plan ✓" : pl.key === "free" ? "Select" : `Pay ${pl.price}`}
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* Profile detail modal */}
      {selected && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" style={{ background: "#00000066" }} onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="arch-top" style={{ height: 90 }}>
              {selected.photoUrl ? (
                <img src={selected.photoUrl} alt={selected.name} style={{ width: 74, height: 74, borderRadius: "50%", objectFit: "cover", border: "3px solid #C89B3C" }} />
              ) : (
                <span style={{ fontSize: 48 }}>{selected.img}</span>
              )}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3"><X size={18} color="#FBF6EE" /></button>
            </div>
            <div className="p-5">
              <h2 className="display text-2xl">{selected.name}</h2>
              <p className="text-sm mb-3" style={{ color: "#6B5B4D" }}>{selected.age} yrs · {selected.city} · {selected.religion}</p>
              <div className="motif-divider" />
              <div className="text-sm space-y-1.5 mt-2" style={{ color: "#4A3F35" }}>
                {(selected.height || selected.weight || selected.complexion || selected.build) && (
                  <p><b>Physical:</b> {[selected.height, selected.weight && `${selected.weight} kg`, selected.complexion, selected.build].filter(Boolean).join(" · ")}</p>
                )}
                <p><b>Education:</b> {selected.edu}</p>
                <p><b>Occupation:</b> {selected.jobLabel}</p>
                <p><b>Income:</b> {selected.income}</p>
                <p><b>Marital Status:</b> {selected.marital}</p>
                <p><b>Verified:</b> {selected.verified ? "Yes ✓" : "Pending"}</p>
              </div>
              <button
                onClick={() => { sendInterest(selected.id); }}
                disabled={interests[selected.id]}
                className="w-full mt-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: interests[selected.id] ? "#3E5C50" : "#7A1F2B", color: "#FBF6EE" }}
              >
                {interests[selected.id] ? "Interest Sent ✓" : "Send Interest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" style={{ background: "#00000066" }} onClick={() => setShowFilters(false)}>
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="display text-xl" style={{ color: "#7A1F2B" }}>Filters</h3>
              <button onClick={() => setShowFilters(false)}><X size={18} /></button>
            </div>
            {[
              ["govt", "Government Job Only", Landmark],
              ["business", "Self Business Only", Briefcase],
              ["single", "Never Married Only", User],
              ["widow", "Widow / Widower Only", Shield],
              ["nri", "NRI / Foreigner Only", Globe2],
            ].map(([key, label, Icon]) => (
              <label key={key} className="flex items-center gap-2.5 py-2 text-sm cursor-pointer" style={{ color: "#4A3F35" }}>
                <input type="checkbox" checked={filters[key]} onChange={() => toggleFilter(key)} style={{ accentColor: "#7A1F2B" }} />
                <Icon size={15} /> {label}
              </label>
            ))}
            <button
              onClick={() => { setFilters(FILTER_DEFAULTS); }}
              className="w-full mt-3 py-2 rounded-full text-xs font-semibold"
              style={{ border: "1px solid #7A1F2B", color: "#7A1F2B" }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Payment checkout (Razorpay-style mock — no real gateway) */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "#00000077" }} onClick={paymentStatus === "form" ? closeCheckout : undefined}>
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden card-shadow" onClick={(e) => e.stopPropagation()}>
            {/* Header styled like a payment gateway */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: "#241C15" }}>
              <div>
                <p className="text-xs" style={{ color: "#C89B3C" }}>Rishta Milan · Secure Checkout (Demo)</p>
                <p className="text-lg font-bold" style={{ color: "#FBF6EE" }}>{checkoutPlan.price}</p>
              </div>
              {paymentStatus === "form" && (
                <button onClick={closeCheckout}><X size={18} color="#FBF6EE" /></button>
              )}
            </div>

            {paymentStatus === "form" && (
              <div className="p-5">
                <p className="text-xs mb-3" style={{ color: "#6B5B4D" }}>{checkoutPlan.name} Plan · Monthly</p>
                <div className="flex gap-2 mb-4">
                  {["upi", "card"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPayMethod(m)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold"
                      style={{ border: payMethod === m ? "2px solid #7A1F2B" : "1px solid #C89B3C55", color: payMethod === m ? "#7A1F2B" : "#6B5B4D" }}
                    >
                      {m === "upi" ? "UPI" : "Card"}
                    </button>
                  ))}
                </div>

                {payMethod === "upi" ? (
                  <input
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
                    style={{ border: "1px solid #C89B3C55" }}
                  />
                ) : (
                  <>
                    <input
                      placeholder="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
                      style={{ border: "1px solid #C89B3C55" }}
                    />
                    <div className="flex gap-3 mb-3">
                      <input placeholder="MM/YY" className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                      <input placeholder="CVV" className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1px solid #C89B3C55" }} />
                    </div>
                  </>
                )}

                <p className="text-xs text-center mb-3" style={{ color: "#C89B3C" }}>Demo mode — koi real paisa nahi katega</p>

                <button
                  onClick={payNow}
                  disabled={payMethod === "upi" ? upiId.length < 3 : cardNumber.length < 12}
                  className="w-full py-2.5 rounded-full text-sm font-semibold"
                  style={{ background: (payMethod === "upi" ? upiId.length >= 3 : cardNumber.length >= 12) ? "#7A1F2B" : "#C89B3C55", color: "#FBF6EE" }}
                >
                  Pay {checkoutPlan.price}
                </button>
              </div>
            )}

            {paymentStatus === "processing" && (
              <div className="p-10 text-center">
                <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #C89B3C55", borderTopColor: "#7A1F2B", margin: "0 auto 14px", animation: "spin 0.8s linear infinite" }} />
                <p className="text-sm" style={{ color: "#6B5B4D" }}>Payment process ho raha hai…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "50%", background: "#3E5C5022" }}>
                  <Check size={24} color="#3E5C50" />
                </div>
                <h3 className="display text-xl mb-1" style={{ color: "#7A1F2B" }}>Payment Successful</h3>
                <p className="text-xs mb-5" style={{ color: "#6B5B4D" }}>{checkoutPlan.name} plan activate ho gaya (demo).</p>
                <button onClick={closeCheckout} className="w-full py-2.5 rounded-full text-sm font-semibold" style={{ background: "#7A1F2B", color: "#FBF6EE" }}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video call overlay (self-camera preview + simulated connection) */}
      {callProfile && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#1A1410" }}>
          <div className="flex-1 relative flex items-center justify-center">
            {/* "Other person" side — since there's no real second user, this stays a static avatar */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden mb-4" style={{ border: "3px solid #C89B3C" }}>
                {callProfile.photoUrl ? (
                  <img src={callProfile.photoUrl} alt={callProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <span style={{ fontSize: 48 }}>{callProfile.img}</span>
                )}
              </div>
              <p className="display text-2xl" style={{ color: "#FBF6EE" }}>{callProfile.name}</p>
              <p className="text-sm mt-1" style={{ color: "#C89B3C" }}>
                {callStatus === "calling" && "Calling…"}
                {callStatus === "connected" && fmtTime(callSeconds)}
                {callStatus === "ended" && "Call ended"}
              </p>
              {callStatus === "connected" && (
                <p className="text-xs mt-3 max-w-xs text-center" style={{ color: "#8A7A6A" }}>
                  Demo call — dusri taraf koi real insaan connect nahi hai. Real app mein Agora/Twilio jaisi service se dono users live connect honge.
                </p>
              )}
            </div>

            {/* Self camera preview */}
            {callStatus === "connected" && (
              <div className="absolute bottom-5 right-5 rounded-xl overflow-hidden" style={{ width: 110, height: 150, background: "#241C15", border: "2px solid #C89B3C" }}>
                {camOn && !camError ? (
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoOff size={20} color="#8A7A6A" />
                  </div>
                )}
              </div>
            )}
            {camError && callStatus === "connected" && (
              <p className="absolute top-4 left-1/2" style={{ transform: "translateX(-50%)", color: "#E0B0A0", fontSize: 11 }}>{camError}</p>
            )}
          </div>

          {/* Call controls */}
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => setMicOn((m) => !m)}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: micOn ? "#3A2E22" : "#C89B3C" }}
            >
              {micOn ? <Mic size={18} color="#FBF6EE" /> : <MicOff size={18} color="#1A1410" />}
            </button>
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "#B3261E" }}
            >
              <PhoneOff size={20} color="#FBF6EE" />
            </button>
            <button
              onClick={() => setCamOn((c) => !c)}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: camOn ? "#3A2E22" : "#C89B3C" }}
            >
              {camOn ? <Video size={18} color="#FBF6EE" /> : <VideoOff size={18} color="#1A1410" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
