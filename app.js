const API_BASE_URL = "/api";
let lightboxPhotos = [];
let lightboxIndex = 0;
let lightboxScale = 1;
let pinchStartDistance = null;
let pinchStartScale = 1;
let liveRefreshTimer = null;
const LIVE_REFRESH_MS = 8000;
let issuesMap = null;
let mapLayerGroup = null;
let knownStatuses = new Map();
let lastFeedData = [];
let demoModeEnabled = false;
let juryModeEnabled = localStorage.getItem("jury-mode") === "1";
let pitchFlowTimer = null;
let currentPitchFocusId = "";
let activePitchNodeIds = [];
let currentPitchStepIndex = -1;
const PITCH_FLOW_INTERVAL_MS = 4200;
const PITCH_FLOW_SEQUENCE = ["juryStory", "statsCards", "kpiCards", "transparencyFeed", "architectureTitle", "impactTitle", "scalabilityTitle"];
const filters = {
  search: "",
  status: "",
  department: "",
};
let currentUiLanguage = localStorage.getItem("uiLanguage") || "en";
const I18N = {
  en: {
    navbarBrand: "CCIRS Public Dashboard",
    authTitle: "Login / Register",
    authSubtitle: "Login first to access the full application.",
    logout: "Logout",
    login: "Login",
    register: "Register",
    refreshData: "Refresh Data",
    recentIssues: "Recent Issues",
    transparencyFeed: "Public Transparency Feed",
    mapTitle: "Neighborhood Issue Map",
    mapped: "mapped",
    architectureTitle: "System Architecture",
    impactTitle: "Operational Impact",
    scalabilityTitle: "Scalability Plan",
    darkMode: "Dark",
    highContrast: "High Contrast",
    largeText: "Large Text",
    privacyConsentLabel: "I consent to secure processing of this report data.",
    privacyDetails: "Privacy details",
    privacyTitle: "Data Privacy and Consent",
    exportCsv: "Export CSV",
    demoModeOn: "Demo Mode: On",
    demoModeOff: "Demo Mode",
    juryModeOn: "Jury Mode: On",
    juryModeOff: "Jury Mode",
    pitchFlowStart: "Start Pitch Flow",
    pitchFlowStop: "Stop Pitch Flow",
    pitchPrev: "Prev",
    pitchNext: "Next",
    pitchReset: "Reset",
    pitchFullscreenOn: "Fullscreen",
    pitchFullscreenOff: "Exit Fullscreen",
    pitchHintText: "Keys: Left/Right to move steps, F for fullscreen.",
    pitchStep: "STEP",
    pitchModeAuto: "AUTO",
    pitchModeManual: "MANUAL",
    pitchGuideTitle: "Presenter Guide",
    pitchGuideDefault: "Use Start Pitch Flow to auto-walk the jury through impact, trust, and scale evidence.",
    pitchScriptStory: "Start with the citizen journey: one complaint goes from report to resolution with full public visibility.",
    pitchScriptStats: "These totals show real-time civic pressure and the current service backlog.",
    pitchScriptKpis: "This panel proves operational quality: response volume, routing precision, and closure expectations.",
    pitchScriptFeed: "The transparency feed provides immutable-style accountability updates for every issue lifecycle.",
    pitchScriptArchitecture: "Architecture is modular: UI, routing intelligence, and data services can scale independently.",
    pitchScriptImpact: "Operational impact is measurable through faster response loops and better public trust.",
    pitchScriptScale: "Scalability plan supports city-wide expansion with policy-ready governance and resilient infra.",
    juryStoryTitle: "Why This Matters",
    juryStoryText: "Citizens submit geotagged issues, AI routes them instantly, and transparency timelines maintain public trust from submission to resolution.",
    reportsTodayLabel: "Reports Today",
    routingLabel: "Auto-routing Accuracy",
    etaLabel: "Avg Resolution ETA",
    close: "Close",
    clearFilters: "Clear Filters",
    allDepartments: "All Departments",
    issueSearchPlaceholder: "Search issues...",
    timelineTitle: "Issue Timeline",
    timelineClose: "Close",
    noTimelineEvents: "No transparency events found for this issue yet.",
    reportTitle: "Report a Civic Issue",
    title: "Title",
    description: "Description",
    priority: "Priority",
    language: "Language",
    latitude: "Latitude",
    longitude: "Longitude",
    address: "Address (optional)",
    photos: "Photos (optional)",
    voice: "Voice Note (optional)",
    submit: "Submit Issue",
    submitting: "Uploading media and submitting issue...",
    submitted: "Issue submitted successfully.",
    routedTo: "Auto-routed to",
    confidence: "confidence",
    department: "Department",
    votes: "Votes",
    comments: "Comments",
    photos: "Photos",
    voiceLabel: "Voice",
    yes: "Yes",
    no: "No",
    loginRequired: "Please login first.",
    authRequired: "Email and password are required.",
    authFailed: "Authentication failed. Make sure the server is running and try again.",
    consentRequired: "Please accept data privacy consent before submitting.",
    timelineOpen: "View Timeline",
    integrityOn: "Integrity: verified",
    integrityOff: "Integrity: pending",
  },
  hi: {
    navbarBrand: "CCIRS सार्वजनिक डैशबोर्ड",
    authTitle: "लॉगिन / रजिस्टर",
    authSubtitle: "पूरा एप्लिकेशन देखने के लिए पहले लॉगिन करें।",
    logout: "लॉगआउट",
    login: "लॉगिन",
    register: "रजिस्टर",
    refreshData: "डेटा रिफ्रेश करें",
    recentIssues: "हाल की समस्याएँ",
    transparencyFeed: "पब्लिक ट्रांसपेरेंसी फीड",
    mapTitle: "पड़ोस समस्या मानचित्र",
    mapped: "मैप्ड",
    architectureTitle: "सिस्टम आर्किटेक्चर",
    impactTitle: "ऑपरेशनल प्रभाव",
    scalabilityTitle: "स्केलेबिलिटी योजना",
    darkMode: "डार्क",
    highContrast: "हाई कॉन्ट्रास्ट",
    largeText: "बड़ा टेक्स्ट",
    privacyConsentLabel: "मैं इस रिपोर्ट डेटा के सुरक्षित प्रोसेसिंग के लिए सहमति देता/देती हूं।",
    privacyDetails: "गोपनीयता विवरण",
    privacyTitle: "डेटा गोपनीयता और सहमति",
    exportCsv: "CSV निर्यात",
    demoModeOn: "डेमो मोड: चालू",
    demoModeOff: "डेमो मोड",
    juryModeOn: "जूरी मोड: चालू",
    juryModeOff: "जूरी मोड",
    pitchFlowStart: "पिच फ्लो शुरू करें",
    pitchFlowStop: "पिच फ्लो बंद करें",
    pitchPrev: "पिछला",
    pitchNext: "अगला",
    pitchReset: "रीसेट",
    pitchFullscreenOn: "फुलस्क्रीन",
    pitchFullscreenOff: "फुलस्क्रीन बंद करें",
    pitchHintText: "कुंजियाँ: चरण बदलने के लिए बायाँ/दायाँ, फुलस्क्रीन के लिए F।",
    pitchStep: "चरण",
    pitchModeAuto: "ऑटो",
    pitchModeManual: "मैन्युअल",
    pitchGuideTitle: "प्रेजेंटर गाइड",
    pitchGuideDefault: "पिच फ्लो शुरू करें और जूरी को प्रभाव, भरोसा और स्केल के प्रमाण क्रम से दिखाएँ।",
    pitchScriptStory: "नागरिक यात्रा से शुरू करें: एक शिकायत रिपोर्ट से समाधान तक पूरी पारदर्शिता के साथ जाती है।",
    pitchScriptStats: "ये आंकड़े रीयल-टाइम नागरिक दबाव और मौजूदा सेवा बैकलॉग दिखाते हैं।",
    pitchScriptKpis: "यह पैनल ऑपरेशनल गुणवत्ता दिखाता है: रिपोर्ट मात्रा, रूटिंग सटीकता और समाधान की अपेक्षा।",
    pitchScriptFeed: "ट्रांसपेरेंसी फीड हर शिकायत चरण के लिए जवाबदेही अपडेट दिखाती है।",
    pitchScriptArchitecture: "आर्किटेक्चर मॉड्यूलर है: UI, रूटिंग इंटेलिजेंस और डेटा सेवाएँ अलग-अलग स्केल हो सकती हैं।",
    pitchScriptImpact: "ऑपरेशनल प्रभाव तेज प्रतिक्रिया चक्र और बेहतर सार्वजनिक भरोसे से मापा जा सकता है।",
    pitchScriptScale: "स्केलेबिलिटी योजना शहर-स्तरीय विस्तार, गवर्नेंस और मजबूत इंफ्रा का समर्थन करती है।",
    juryStoryTitle: "यह क्यों महत्वपूर्ण है",
    juryStoryText: "नागरिक जियोटैग्ड शिकायतें भेजते हैं, AI तुरंत विभाग तय करता है और ट्रांसपेरेंसी टाइमलाइन भरोसा बनाती है।",
    reportsTodayLabel: "आज की रिपोर्ट",
    routingLabel: "ऑटो-रूटिंग सटीकता",
    etaLabel: "औसत समाधान समय",
    close: "बंद करें",
    clearFilters: "फ़िल्टर साफ़ करें",
    allDepartments: "सभी विभाग",
    issueSearchPlaceholder: "समस्याएँ खोजें...",
    timelineTitle: "समस्या टाइमलाइन",
    timelineClose: "बंद करें",
    noTimelineEvents: "इस समस्या के लिए अभी कोई ट्रांसपेरेंसी इवेंट नहीं मिला।",
    reportTitle: "नागरिक समस्या दर्ज करें",
    title: "शीर्षक",
    description: "विवरण",
    priority: "प्राथमिकता",
    language: "भाषा",
    latitude: "अक्षांश",
    longitude: "देशांतर",
    address: "पता (वैकल्पिक)",
    photos: "फोटो (वैकल्पिक)",
    voice: "वॉइस नोट (वैकल्पिक)",
    submit: "समस्या सबमिट करें",
    submitting: "मीडिया अपलोड कर के समस्या सबमिट की जा रही है...",
    submitted: "समस्या सफलतापूर्वक सबमिट हो गई।",
    routedTo: "अपने आप भेजा गया",
    confidence: "विश्वसनीयता",
    department: "विभाग",
    votes: "वोट",
    comments: "टिप्पणियाँ",
    photos: "फोटो",
    voiceLabel: "वॉइस",
    yes: "हाँ",
    no: "नहीं",
    loginRequired: "कृपया पहले लॉगिन करें।",
    authRequired: "ईमेल और पासवर्ड आवश्यक हैं।",
    authFailed: "प्रमाणीकरण विफल रहा। सर्वर चल रहा है या नहीं, जांचें।",
    consentRequired: "सबमिट करने से पहले डेटा गोपनीयता सहमति स्वीकार करें।",
    timelineOpen: "टाइमलाइन देखें",
    integrityOn: "इंटीग्रिटी: सत्यापित",
    integrityOff: "इंटीग्रिटी: लंबित",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

// Event listeners setup
function setupEventListeners() {
  document.getElementById("complaintForm").addEventListener("submit", handleSubmitIssue);
  document.getElementById("getLocationBtn").addEventListener("click", getLocation);
  document.getElementById("refreshBtn").addEventListener("click", loadDashboard);
  document.getElementById("issueLanguage").addEventListener("change", handleLanguageChange);
  document.getElementById("localLoginBtn").addEventListener("click", () => handleLocalAuth("login"));
  document.getElementById("localRegisterBtn").addEventListener("click", () => handleLocalAuth("register"));
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document.getElementById("uiLanguage").addEventListener("change", handleUiLanguageChange);
  document.getElementById("issueSearch").addEventListener("input", handleIssueSearch);
  document.getElementById("issueStatusFilter").addEventListener("change", handleIssueStatusFilter);
  document.getElementById("issueDepartmentFilter").addEventListener("change", handleIssueDepartmentFilter);
  document.getElementById("clearFiltersBtn").addEventListener("click", clearIssueFilters);
  document.getElementById("toggleDarkModeBtn").addEventListener("click", () => toggleBodyClass("dark-mode"));
  document.getElementById("toggleContrastBtn").addEventListener("click", () => toggleBodyClass("high-contrast"));
  document.getElementById("toggleLargeTextBtn").addEventListener("click", () => toggleBodyClass("large-text"));
  document.getElementById("viewPrivacyBtn").addEventListener("click", openPrivacyModal);
  document.getElementById("exportFeedBtn").addEventListener("click", exportFeedCsv);
  document.getElementById("toggleDemoModeBtn").addEventListener("click", toggleDemoMode);
  document.getElementById("toggleJuryModeBtn").addEventListener("click", toggleJuryMode);
  document.getElementById("togglePitchFlowBtn").addEventListener("click", togglePitchFlow);
  document.getElementById("togglePitchFullscreenBtn").addEventListener("click", togglePitchFullscreen);
  document.getElementById("privacyClose").addEventListener("click", closePrivacyModal);
  document.addEventListener("click", handleGlobalClick);
  document.addEventListener("keydown", handleLightboxKeydown);
  document.addEventListener("keydown", handlePitchKeydown);
  document.addEventListener("wheel", handleLightboxWheel, { passive: false });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  document.addEventListener("fullscreenchange", syncPitchFullscreenUi);
  initPhotoLightbox();
  initIssuesMap();
  const uiSelect = document.getElementById("uiLanguage");
  if (uiSelect) {
    uiSelect.value = currentUiLanguage;
  }
  restoreAccessibilityModes();
  applyUiLanguage(currentUiLanguage);
  applyIssueFormLanguage(document.getElementById("issueLanguage").value || "en");
}

function restoreAuthState() {
  const savedEmail = localStorage.getItem("localAuthEmail") || "";
  if (savedEmail) {
    document.getElementById("authEmail").value = savedEmail;
  }
}

function showApp() {
  document.getElementById("authSection").classList.add("d-none");
  document.getElementById("appSection").classList.remove("d-none");
  document.getElementById("logoutBtn").classList.remove("d-none");
  document.getElementById("liveBadge").classList.remove("d-none");
  document.getElementById("toggleJuryModeBtn").classList.remove("d-none");
  document.getElementById("togglePitchFlowBtn").classList.remove("d-none");
  document.getElementById("togglePitchFullscreenBtn").classList.remove("d-none");
  applyJuryMode(juryModeEnabled);
  startLiveRefresh();
}

function hideApp() {
  document.getElementById("authSection").classList.remove("d-none");
  document.getElementById("appSection").classList.add("d-none");
  document.getElementById("logoutBtn").classList.add("d-none");
  document.getElementById("liveBadge").classList.add("d-none");
  document.getElementById("toggleJuryModeBtn").classList.add("d-none");
  document.getElementById("togglePitchFlowBtn").classList.add("d-none");
  document.getElementById("togglePitchFullscreenBtn").classList.add("d-none");
  exitPitchFullscreenIfNeeded();
  stopPitchFlow();
  applyJuryMode(false);
  const copy = I18N[currentUiLanguage] || I18N.en;
  setApiStatus(copy.loginRequired, "text-light");
  stopLiveRefresh();
}

function handleLogout() {
  storeAuthToken("");
  hideApp();
  knownStatuses.clear();
}

function getStoredAuthToken() {
  return localStorage.getItem("authToken") || "";
}

function storeAuthToken(token) {
  if (token) {
    localStorage.setItem("authToken", token);
  } else {
    localStorage.removeItem("authToken");
  }
}

async function handleLocalAuth(mode) {
  hideMessage("authError");
  hideMessage("authSuccess");

  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const name = document.getElementById("authName").value.trim();

  if (!email || !password) {
    const copy = I18N[currentUiLanguage] || I18N.en;
    showMessage("authError", copy.authRequired);
    return;
  }

  const path = mode === "register" ? "/auth/register" : "/auth/login";
  const payload = mode === "register"
    ? { name: name || "Citizen", email, password }
    : { email, password };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let result = await safeJson(response);
    if (!response.ok) {
      if (mode === "register" && response.status === 409) {
        // If user already exists, treat Register as "Login with same credentials".
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const loginResult = await safeJson(loginResponse);
        if (!loginResponse.ok) {
          throw new Error(loginResult.error || loginResult.message || "Account already exists. Please login.");
        }

        result = loginResult;
        mode = "login";
      } else {
        throw new Error(result.error || result.message || `Auth failed (${response.status})`);
      }
    }

    const token = result.tokens?.accessToken || "";
    if (!token) {
      throw new Error("Token not returned from auth API");
    }

    storeAuthToken(token);
    localStorage.setItem("localAuthEmail", email);
    showMessage(
      "authSuccess",
      mode === "register"
        ? "Registration successful. You can now submit issues."
        : "Login successful. You can now submit issues."
    );
    showApp();
    await loadDashboard();
  } catch (error) {
    const copy = I18N[currentUiLanguage] || I18N.en;
    showMessage("authError", error.message || copy.authFailed);
  }
}

async function loadDashboard(silent = false) {
  clearIssuesError();
  if (!silent) {
    setApiStatus("Checking API...", "text-warning");
  }

  try {
    const query = new URLSearchParams();
    query.set("limit", "20");
    if (filters.status) query.set("status", filters.status);
    if (filters.search) query.set("search", filters.search);
    if (filters.department) query.set("department", filters.department);

    const [issuesResponse, statsResponse, feedResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/issues?${query.toString()}`),
      fetch(`${API_BASE_URL}/transparency/stats`),
      fetch(`${API_BASE_URL}/transparency/issues?${query.toString()}`),
    ]);

    if (!issuesResponse.ok) {
      throw new Error(`Failed to load issues (${issuesResponse.status})`);
    }
    if (!statsResponse.ok) {
      throw new Error(`Failed to load stats (${statsResponse.status})`);
    }
    if (!feedResponse.ok) {
      throw new Error(`Failed to load feed (${feedResponse.status})`);
    }

    let issues = await issuesResponse.json();
    const stats = await statsResponse.json();
    let feed = await feedResponse.json();

    if (demoModeEnabled) {
      const demoIssues = getDemoIssues();
      issues = [...demoIssues, ...(Array.isArray(issues) ? issues : [])].slice(0, 20);
      const demoFeed = demoIssues.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        category: i.category,
        department: i.department,
        voteCount: i.voteCount || 0,
        commentCount: i.commentCount || 0,
        updatedAt: i.updatedAt,
        createdAt: i.createdAt,
      }));
      feed = [...demoFeed, ...(Array.isArray(feed) ? feed : [])].slice(0, 20);
    }

    setApiStatus("API online", "text-success");
    renderStats(stats);
    renderKpis(issues);
    renderIssues(issues);
    renderTransparencyFeed(feed);
    renderIssuesMap(issues);
    detectStatusChanges(feed);
  } catch (error) {
    setApiStatus("API unavailable", "text-danger");
    showIssuesError(error.message || "Unable to load dashboard data");
  }
}

async function handleSubmitIssue(e) {
  e.preventDefault();
  hideMessage("complaintError");
  hideMessage("complaintSuccess");

  const token = getStoredAuthToken();
  if (!token) {
    const copy = I18N[currentUiLanguage] || I18N.en;
    showMessage("complaintError", copy.loginRequired);
    return;
  }

  try {
    const consentChecked = document.getElementById("privacyConsent")?.checked;
    if (!consentChecked) {
      const copy = I18N[currentUiLanguage] || I18N.en;
      showMessage("complaintError", copy.consentRequired);
      return;
    }

    const selectedLanguage = document.getElementById("issueLanguage").value || "en";
    const copy = I18N[selectedLanguage] || I18N.en;
    const photos = await readFilesAsDataUrls(document.getElementById("issuePhotos").files, 4);
    const voiceFiles = await readFilesAsDataUrls(document.getElementById("issueVoiceNote").files, 1);
    setSubmitLoading(true);

    showMessage("complaintSuccess", copy.submitting);

    const payload = {
      title: document.getElementById("issueTitle").value.trim(),
      description: document.getElementById("issueDescription").value.trim(),
      latitude: Number(document.getElementById("issueLatitude").value),
      longitude: Number(document.getElementById("issueLongitude").value),
      address: document.getElementById("issueAddress").value.trim(),
      language: selectedLanguage,
      photoUrls: photos,
      voiceNoteUrl: voiceFiles[0] || "",
      priority: document.getElementById("issueSeverity").value,
    };

    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/issues`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err.error || err.message || `Submit failed (${response.status})`);
    }

    const createdIssue = await safeJson(response);
    document.getElementById("complaintForm").reset();
    applyIssueFormLanguage(selectedLanguage);
    setSubmitLoading(false);
    showSubmitCheck();
    const routeHint = createdIssue.department
      ? ` ${copy.routedTo}: ${createdIssue.department} (${copy.confidence} ${Math.round((createdIssue.aiConfidence || 0) * 100)}%).`
      : "";
    showMessage("complaintSuccess", `${copy.submitted}${routeHint}`);
    await loadDashboard();
  } catch (error) {
    setSubmitLoading(false);
    showMessage("complaintError", error.message || "Failed to submit issue");
  }
}

function renderStats(stats) {
  const copy = I18N[currentUiLanguage] || I18N.en;
  document.getElementById("statTotal").textContent = String(stats.totalIssues || 0);
  document.getElementById("statOpen").textContent = String(stats.byStatus?.OPEN || 0);
  document.getElementById("statInProgress").textContent = String(stats.byStatus?.IN_PROGRESS || 0);
  document.getElementById("statResolved").textContent = String(stats.byStatus?.RESOLVED || 0);

  const departmentStats = document.getElementById("departmentStats");
  departmentStats.innerHTML = "";

  const entries = Object.entries(stats.byDepartment || {});
  if (entries.length === 0) {
    departmentStats.innerHTML = '<li class="list-group-item text-muted">No department data yet</li>';
    return;
  }

  entries
    .sort((a, b) => b[1] - a[1])
    .forEach(([department, count]) => {
      const li = document.createElement('li');
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `<span>${escapeHtml(department)}</span><span class="badge bg-primary rounded-pill">${count}</span>`;
      departmentStats.appendChild(li);
    });

  updateDepartmentFilterOptions(entries.map(([name]) => name), copy.allDepartments);
}

function renderKpis(issues) {
  const list = Array.isArray(issues) ? issues : [];
  const today = new Date();
  const reportsToday = list.filter((issue) => {
    const ts = new Date(issue.createdAt || 0);
    return ts.toDateString() === today.toDateString();
  }).length;

  const confidences = list
    .map((issue) => Number(issue.aiConfidence))
    .filter((v) => Number.isFinite(v) && v > 0);
  const avgConfidence = confidences.length
    ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100)
    : 0;

  const openCount = list.filter((i) => i.status === "OPEN").length;
  const inProgressCount = list.filter((i) => i.status === "IN_PROGRESS").length;
  const etaDays = Math.max(1, Math.min(14, Math.round((openCount * 1.6 + inProgressCount * 0.8) / 2 || 2)));

  const reportsEl = document.getElementById("kpiReportsToday");
  const routingEl = document.getElementById("kpiRouting");
  const etaEl = document.getElementById("kpiEta");
  if (reportsEl) reportsEl.textContent = String(reportsToday);
  if (routingEl) routingEl.textContent = `${avgConfidence}%`;
  if (etaEl) etaEl.textContent = `${etaDays} day(s)`;
}

function renderIssues(issues) {
  const copy = I18N[currentUiLanguage] || I18N.en;
  const issuesList = document.getElementById("issuesList");
  const issuesEmpty = document.getElementById("issuesEmpty");
  const issuesMeta = document.getElementById("issuesMeta");

  issuesList.innerHTML = "";
  issuesMeta.textContent = `${Array.isArray(issues) ? issues.length : 0} issue(s)`;

  if (!Array.isArray(issues) || issues.length === 0) {
    issuesEmpty.classList.remove("d-none");
    return;
  }

  issuesEmpty.classList.add("d-none");

  issues.forEach((issue, issueIndex) => {
    const progress = getStatusProgress(issue.status);
    const photoCount = Array.isArray(issue.photoUrls) ? issue.photoUrls.length : 0;
    const hasVoice = Boolean(issue.voiceNoteUrl);
    const photoGroup = `issue-${escapeAttr(issue.id || String(issueIndex))}`;
    const photosPreview = photoCount
      ? `
        <div class="issue-media mt-2">
          <div class="small text-muted mb-1">Photos</div>
          <div class="issue-photos-grid">
            ${issue.photoUrls
              .slice(0, 4)
              .map(
                (url, idx) =>
                  `<button type="button" class="issue-photo-btn" data-photo-group="${photoGroup}" data-photo-index="${idx}" title="Photo ${idx + 1}"><img src="${escapeHtml(String(url))}" alt="Issue photo ${idx + 1}" class="issue-photo-thumb" data-photo-group="${photoGroup}" data-photo-index="${idx}"></button>`
              )
              .join("")}
          </div>
        </div>
      `
      : "";
    const voicePreview = hasVoice
      ? `
        <div class="issue-media mt-2">
          <div class="small text-muted mb-1">Voice Note</div>
          <audio controls class="w-100" preload="none" src="${escapeHtml(String(issue.voiceNoteUrl))}"></audio>
        </div>
      `
      : "";
    const card = document.createElement('div');
    const stepStates = getStatusSteps(issue.status);
    card.className = "col-md-6 col-xl-4 mb-3";
    card.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <h5 class="card-title mb-2">${escapeHtml(issue.title || "Untitled")}</h5>
          <p class="card-text text-muted mb-2">${escapeHtml(issue.description || "")}</p>
          <div class="mb-2">
            <span class="badge bg-${getStatusColor(issue.status)} me-1">${escapeHtml(issue.status || "UNKNOWN")}</span>
            <span class="badge bg-${getSeverityColor(issue.severity)} me-1">${escapeHtml(issue.severity || "N/A")}</span>
            <span class="badge bg-info text-dark">${escapeHtml(issue.category || "general")}</span>
          </div>
          <div class="mb-2">
            <div class="progress progress-thin">
              <div class="progress-bar" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <small class="text-muted">Progress: ${progress}%</small>
            <div class="status-steps mt-1">
              ${stepStates
                .map((step) => `<span class="status-step ${step.active ? "active" : ""}">${step.label}</span>`)
                .join("")}
            </div>
          </div>
          <div class="mb-2 d-flex gap-1 flex-wrap">
            <span class="badge bg-light text-dark">Lang: ${escapeHtml((issue.language || "en").toUpperCase())}</span>
            <span class="badge bg-light text-dark">${copy.photos}: ${photoCount}</span>
            <span class="badge bg-light text-dark">${copy.voiceLabel}: ${hasVoice ? copy.yes : copy.no}</span>
          </div>
          ${photosPreview}
          ${voicePreview}
          <div class="mt-2">
            <button type="button" class="btn btn-sm btn-outline-dark timeline-btn" data-issue-id="${escapeHtml(issue.id || "")}">${(I18N[currentUiLanguage] || I18N.en).timelineOpen}</button>
            <button type="button" class="btn btn-sm btn-outline-primary ms-2 upvote-btn" data-upvote-issue-id="${escapeHtml(issue.id || "")}">+1 ${copy.votes}</button>
          </div>
          <small class="text-muted d-block">${copy.department}: ${escapeHtml(issue.department || "unassigned")}</small>
          <small class="text-muted d-block">${copy.votes}: ${issue.voteCount || 0} | ${copy.comments}: ${issue.commentCount || 0}</small>
        </div>
        <div class="card-footer bg-transparent">
          <small class="text-muted">${formatDate(issue.createdAt)}</small>
        </div>
      </div>
    `;
    issuesList.appendChild(card);
  });
}

function renderTransparencyFeed(feed) {
  const copy = I18N[currentUiLanguage] || I18N.en;
  const list = document.getElementById("transparencyFeed");
  const empty = document.getElementById("transparencyEmpty");
  const meta = document.getElementById("feedMeta");

  list.innerHTML = "";
  lastFeedData = Array.isArray(feed) ? feed : [];
  const count = Array.isArray(feed) ? feed.length : 0;
  meta.textContent = `${count} update(s)`;

  if (!Array.isArray(feed) || feed.length === 0) {
    empty.classList.remove("d-none");
    return;
  }

  empty.classList.add("d-none");

  feed.slice(0, 10).forEach((item) => {
    const row = document.createElement("div");
    row.className = "list-group-item px-0";
    row.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <div class="fw-semibold">${escapeHtml(item.title || "Untitled")}</div>
          <div class="small text-muted">${escapeHtml(item.department || "Unassigned")} | ${escapeHtml(item.category || "general")}</div>
          <div class="small text-muted">${copy.votes}: ${item.voteCount || 0} | ${copy.comments}: ${item.commentCount || 0}</div>
          <button type="button" class="btn btn-sm btn-link p-0 mt-1 timeline-btn" data-issue-id="${escapeHtml(item.id || "")}">${copy.timelineOpen}</button>
        </div>
        <div class="text-end">
          <span class="badge bg-${getStatusColor(item.status)}">${escapeHtml(item.status || "UNKNOWN")}</span>
          <div class="small text-muted mt-1">${formatRelativeTime(item.updatedAt || item.createdAt)}</div>
        </div>
      </div>
    `;
    list.appendChild(row);
  });
}

function setApiStatus(text, className) {
  const status = document.getElementById("apiStatus");
  status.textContent = text;
  status.className = `navbar-text ${className}`;
}

function showMessage(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.remove("d-none");
}

function hideMessage(id) {
  document.getElementById(id).classList.add("d-none");
}

function showIssuesError(text) {
  const el = document.getElementById("issuesError");
  el.textContent = text;
  el.classList.remove("d-none");
}

function clearIssuesError() {
  document.getElementById("issuesError").classList.add("d-none");
}

function getSeverityColor(severity) {
  const colors = { LOW: "success", MEDIUM: "warning", HIGH: "danger" };
  return colors[severity] || "secondary";
}

function getStatusColor(status) {
  const colors = {
    OPEN: "warning",
    IN_PROGRESS: "primary",
    RESOLVED: "success",
    CLOSED: "secondary",
  };
  return colors[status] || "dark";
}

function getStatusProgress(status) {
  const progress = {
    OPEN: 25,
    IN_PROGRESS: 65,
    RESOLVED: 100,
    CLOSED: 100,
  };
  return progress[status] || 10;
}

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

function formatRelativeTime(value) {
  if (!value) return "unknown";
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return "unknown";

  const diffMs = Date.now() - ts;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function escapeHtml(text) {
  if (typeof text !== "string") return String(text || "");
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function escapeAttr(text) {
  return String(text || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 64);
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (_err) {
    return {};
  }
}

function handleGlobalClick(event) {
  const upvoteBtn = event.target.closest(".upvote-btn");
  if (upvoteBtn) {
    const issueId = upvoteBtn.getAttribute("data-upvote-issue-id");
    if (issueId) {
      upvoteIssue(issueId);
    }
    return;
  }

  const timelineBtn = event.target.closest(".timeline-btn");
  if (timelineBtn) {
    const issueId = timelineBtn.getAttribute("data-issue-id");
    if (issueId) {
      openTimelineModal(issueId);
    }
    return;
  }

  const photoThumb = event.target.closest(".issue-photo-thumb, .issue-photo-btn");
  if (photoThumb) {
    const group = photoThumb.getAttribute("data-photo-group");
    const index = Number(photoThumb.getAttribute("data-photo-index") || "0");
    if (group) {
      openLightbox(group, index);
    }
    return;
  }

  const closeBtn = event.target.closest("#photoLightboxClose");
  if (closeBtn || event.target.id === "photoLightbox") {
    closeLightbox();
    return;
  }

  const prevBtn = event.target.closest("#photoLightboxPrev");
  if (prevBtn) {
    showPrevPhoto();
    return;
  }

  const nextBtn = event.target.closest("#photoLightboxNext");
  if (nextBtn) {
    showNextPhoto();
    return;
  }

  const zoomInBtn = event.target.closest("#photoLightboxZoomIn");
  if (zoomInBtn) {
    updateLightboxScale(0.2);
    return;
  }

  const zoomOutBtn = event.target.closest("#photoLightboxZoomOut");
  if (zoomOutBtn) {
    updateLightboxScale(-0.2);
    return;
  }

  const zoomResetBtn = event.target.closest("#photoLightboxZoomReset");
  if (zoomResetBtn) {
    resetLightboxScale();
    return;
  }

  const timelineCloseBtn = event.target.closest("#timelineClose");
  if (timelineCloseBtn || event.target.id === "timelineModal") {
    closeTimelineModal();
    return;
  }

  const privacyCloseBtn = event.target.closest("#privacyClose");
  if (privacyCloseBtn || event.target.id === "privacyModal") {
    closePrivacyModal();
  }
}

function handleLightboxKeydown(event) {
  const privacyModal = document.getElementById("privacyModal");
  if (event.key === "Escape" && privacyModal && !privacyModal.classList.contains("d-none")) {
    closePrivacyModal();
    return;
  }

  const timelineModal = document.getElementById("timelineModal");
  if (event.key === "Escape" && timelineModal && !timelineModal.classList.contains("d-none")) {
    closeTimelineModal();
    return;
  }

  const modal = document.getElementById("photoLightbox");
  if (!modal || modal.classList.contains("d-none")) return;

  if (event.key === "Escape") {
    closeLightbox();
  } else if (event.key === "ArrowLeft") {
    showPrevPhoto();
  } else if (event.key === "ArrowRight") {
    showNextPhoto();
  }
}

function handleVisibilityChange() {
  if (!getStoredAuthToken()) return;
  if (document.hidden) {
    stopLiveRefresh();
  } else {
    startLiveRefresh();
    loadDashboard(true);
  }
}

function startLiveRefresh() {
  stopLiveRefresh();
  if (document.hidden) return;
  liveRefreshTimer = setInterval(() => {
    if (getStoredAuthToken()) {
      loadDashboard(true);
    }
  }, LIVE_REFRESH_MS);
}

function stopLiveRefresh() {
  if (liveRefreshTimer) {
    clearInterval(liveRefreshTimer);
    liveRefreshTimer = null;
  }
}

function initPhotoLightbox() {
  if (document.getElementById("photoLightbox")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "photoLightbox";
  wrapper.className = "photo-lightbox d-none";
  wrapper.innerHTML = `
    <div class="photo-lightbox-content" role="dialog" aria-modal="true" aria-label="Image preview">
      <button type="button" id="photoLightboxClose" class="photo-lightbox-close" aria-label="Close">x</button>
      <button type="button" id="photoLightboxPrev" class="photo-lightbox-nav photo-lightbox-prev" aria-label="Previous image">&#10094;</button>
      <img id="photoLightboxImage" class="photo-lightbox-image" alt="Issue photo preview">
      <button type="button" id="photoLightboxNext" class="photo-lightbox-nav photo-lightbox-next" aria-label="Next image">&#10095;</button>
      <div class="photo-lightbox-zoom-controls">
        <button type="button" id="photoLightboxZoomOut" class="photo-lightbox-zoom-btn" aria-label="Zoom out">-</button>
        <button type="button" id="photoLightboxZoomReset" class="photo-lightbox-zoom-btn" aria-label="Reset zoom">100%</button>
        <button type="button" id="photoLightboxZoomIn" class="photo-lightbox-zoom-btn" aria-label="Zoom in">+</button>
      </div>
      <div id="photoLightboxMeta" class="photo-lightbox-meta"></div>
    </div>
  `;

  document.body.appendChild(wrapper);

  const imageEl = wrapper.querySelector("#photoLightboxImage");
  if (imageEl) {
    imageEl.addEventListener("touchstart", handleLightboxTouchStart, { passive: true });
    imageEl.addEventListener("touchmove", handleLightboxTouchMove, { passive: false });
    imageEl.addEventListener("touchend", handleLightboxTouchEnd, { passive: true });
  }
}

function openLightbox(group, index) {
  const nodes = Array.from(document.querySelectorAll(`.issue-photo-thumb[data-photo-group='${group}']`));
  const photos = nodes.map((node) => node.getAttribute("src")).filter(Boolean);
  if (!photos.length) return;

  lightboxPhotos = photos;
  lightboxIndex = Math.min(Math.max(index, 0), photos.length - 1);
  resetLightboxScale();

  const modal = document.getElementById("photoLightbox");
  modal.classList.remove("d-none");
  document.body.classList.add("no-scroll");
  renderLightbox();
}

function closeLightbox() {
  const modal = document.getElementById("photoLightbox");
  if (!modal) return;

  modal.classList.add("d-none");
  document.body.classList.remove("no-scroll");
  lightboxPhotos = [];
  lightboxIndex = 0;
  resetLightboxScale();
}

function showPrevPhoto() {
  if (!lightboxPhotos.length) return;
  lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
  resetLightboxScale();
  renderLightbox();
}

function showNextPhoto() {
  if (!lightboxPhotos.length) return;
  lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
  resetLightboxScale();
  renderLightbox();
}

function renderLightbox() {
  const img = document.getElementById("photoLightboxImage");
  const meta = document.getElementById("photoLightboxMeta");
  const prev = document.getElementById("photoLightboxPrev");
  const next = document.getElementById("photoLightboxNext");
  if (!img || !meta || !prev || !next || !lightboxPhotos.length) return;

  img.src = lightboxPhotos[lightboxIndex];
  applyLightboxScale();
  meta.textContent = `Photo ${lightboxIndex + 1} of ${lightboxPhotos.length}`;
  const shouldShowNav = lightboxPhotos.length > 1;
  prev.classList.toggle("d-none", !shouldShowNav);
  next.classList.toggle("d-none", !shouldShowNav);

  const zoomReset = document.getElementById("photoLightboxZoomReset");
  if (zoomReset) {
    zoomReset.textContent = `${Math.round(lightboxScale * 100)}%`;
  }
}

function handleLightboxWheel(event) {
  const modal = document.getElementById("photoLightbox");
  if (!modal || modal.classList.contains("d-none")) return;

  const targetInside = event.target && modal.contains(event.target);
  if (!targetInside) return;

  event.preventDefault();
  const delta = event.deltaY < 0 ? 0.1 : -0.1;
  updateLightboxScale(delta);
}

function handleLightboxTouchStart(event) {
  if (event.touches.length !== 2) {
    pinchStartDistance = null;
    return;
  }

  pinchStartDistance = getTouchDistance(event.touches[0], event.touches[1]);
  pinchStartScale = lightboxScale;
}

function handleLightboxTouchMove(event) {
  if (event.touches.length !== 2 || pinchStartDistance === null) return;
  event.preventDefault();

  const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
  if (!currentDistance || !pinchStartDistance) return;

  const ratio = currentDistance / pinchStartDistance;
  lightboxScale = clampScale(pinchStartScale * ratio);
  applyLightboxScale();

  const zoomReset = document.getElementById("photoLightboxZoomReset");
  if (zoomReset) {
    zoomReset.textContent = `${Math.round(lightboxScale * 100)}%`;
  }
}

function handleLightboxTouchEnd() {
  pinchStartDistance = null;
}

function getTouchDistance(touchA, touchB) {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function updateLightboxScale(delta) {
  lightboxScale = clampScale(lightboxScale + delta);
  applyLightboxScale();
  const zoomReset = document.getElementById("photoLightboxZoomReset");
  if (zoomReset) {
    zoomReset.textContent = `${Math.round(lightboxScale * 100)}%`;
  }
}

function resetLightboxScale() {
  lightboxScale = 1;
  applyLightboxScale();
  const zoomReset = document.getElementById("photoLightboxZoomReset");
  if (zoomReset) {
    zoomReset.textContent = "100%";
  }
}

function applyLightboxScale() {
  const img = document.getElementById("photoLightboxImage");
  if (!img) return;
  img.style.transform = `scale(${lightboxScale})`;
}

function clampScale(scale) {
  return Math.min(4, Math.max(0.6, scale));
}

function handleLanguageChange(e) {
  applyIssueFormLanguage(e.target.value || "en");
}

function handleUiLanguageChange(e) {
  const lang = e.target.value || "en";
  currentUiLanguage = lang;
  localStorage.setItem("uiLanguage", lang);
  applyUiLanguage(lang);
  renderIssueLanguageButtons();
}

function handleIssueSearch(e) {
  filters.search = e.target.value.trim();
  loadDashboard(true);
}

function handleIssueStatusFilter(e) {
  filters.status = e.target.value;
  loadDashboard(true);
}

function handleIssueDepartmentFilter(e) {
  filters.department = e.target.value;
  loadDashboard(true);
}

function clearIssueFilters() {
  filters.search = "";
  filters.status = "";
  filters.department = "";
  const searchInput = document.getElementById("issueSearch");
  const statusSelect = document.getElementById("issueStatusFilter");
  const departmentSelect = document.getElementById("issueDepartmentFilter");
  if (searchInput) searchInput.value = "";
  if (statusSelect) statusSelect.value = "";
  if (departmentSelect) departmentSelect.value = "";
  loadDashboard(true);
}

function applyUiLanguage(lang) {
  const copy = I18N[lang] || I18N.en;
  setText("navbarBrand", copy.navbarBrand);
  setText("authTitle", copy.authTitle);
  setText("authSubtitle", copy.authSubtitle);
  setText("localLoginBtn", copy.login);
  setText("localRegisterBtn", copy.register);
  setText("logoutBtn", copy.logout);
  setText("refreshBtn", copy.refreshData);
  setText("recentIssuesTitle", copy.recentIssues);
  setText("transparencyTitle", copy.transparencyFeed);
  setText("mapTitle", copy.mapTitle);
  setText("architectureTitle", copy.architectureTitle);
  setText("impactTitle", copy.impactTitle);
  setText("scalabilityTitle", copy.scalabilityTitle);
  setText("toggleDarkModeBtn", copy.darkMode);
  setText("toggleContrastBtn", copy.highContrast);
  setText("toggleLargeTextBtn", copy.largeText);
  setText("privacyConsentLabel", copy.privacyConsentLabel);
  setText("viewPrivacyBtn", copy.privacyDetails);
  setText("privacyTitle", copy.privacyTitle);
  setText("privacyClose", copy.close);
  setText("exportFeedBtn", copy.exportCsv);
  setText("toggleDemoModeBtn", demoModeEnabled ? copy.demoModeOn : copy.demoModeOff);
  setText("toggleJuryModeBtn", juryModeEnabled ? copy.juryModeOn : copy.juryModeOff);
  setText("togglePitchFlowBtn", pitchFlowTimer ? copy.pitchFlowStop : copy.pitchFlowStart);
  setText("togglePitchFullscreenBtn", document.fullscreenElement ? copy.pitchFullscreenOff : copy.pitchFullscreenOn);
  setText("pitchHintText", copy.pitchHintText);
  setText("pitchGuideTitle", copy.pitchGuideTitle);
  setText("juryStoryTitle", copy.juryStoryTitle);
  setText("juryStoryText", copy.juryStoryText);
  updatePitchHud();
  setText("kpiReportsTodayLabel", copy.reportsTodayLabel);
  setText("kpiRoutingLabel", copy.routingLabel);
  setText("kpiEtaLabel", copy.etaLabel);
  setText("clearFiltersBtn", copy.clearFilters);
  setText("timelineTitle", copy.timelineTitle);
  setText("timelineClose", copy.timelineClose);

  const search = document.getElementById("issueSearch");
  if (search) search.placeholder = copy.issueSearchPlaceholder;

  const deptSelect = document.getElementById("issueDepartmentFilter");
  if (deptSelect && deptSelect.options.length > 0) {
    deptSelect.options[0].textContent = copy.allDepartments;
  }
}

function getStatusSteps(status) {
  const steps = ["SUBMITTED", "VERIFIED", "IN_PROGRESS", "RESOLVED"];
  let currentIndex = 0;
  if (status === "OPEN") currentIndex = 1;
  if (status === "IN_PROGRESS") currentIndex = 2;
  if (status === "RESOLVED" || status === "CLOSED") currentIndex = 3;

  return steps.map((label, idx) => ({
    label,
    active: idx <= currentIndex,
  }));
}

function initIssuesMap() {
  if (issuesMap || typeof window.L === "undefined") return;
  const mapNode = document.getElementById("issuesMap");
  if (!mapNode) return;

  issuesMap = window.L.map("issuesMap").setView([20.5937, 78.9629], 4);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(issuesMap);

  mapLayerGroup = window.L.layerGroup().addTo(issuesMap);
}

function renderIssuesMap(issues) {
  if (!issuesMap || !mapLayerGroup) return;
  mapLayerGroup.clearLayers();

  const points = (Array.isArray(issues) ? issues : []).filter(
    (i) => Number.isFinite(Number(i.latitude)) && Number.isFinite(Number(i.longitude))
  );

  points.forEach((issue) => {
    const marker = window.L.circleMarker([Number(issue.latitude), Number(issue.longitude)], {
      radius: 8,
      color: "#2563eb",
      fillColor: "#60a5fa",
      fillOpacity: 0.75,
      weight: 1,
    });
    marker.bindPopup(`<strong>${escapeHtml(issue.title || "Issue")}</strong><br>${escapeHtml(issue.status || "UNKNOWN")}<br>${escapeHtml(issue.address || "")}`);
    marker.addTo(mapLayerGroup);
  });

  const meta = document.getElementById("mapMeta");
  if (meta) {
    const copy = I18N[currentUiLanguage] || I18N.en;
    meta.textContent = `${points.length} ${copy.mapped}`;
  }

  if (points.length > 0) {
    const bounds = window.L.latLngBounds(points.map((i) => [Number(i.latitude), Number(i.longitude)]));
    issuesMap.fitBounds(bounds.pad(0.2));
  }
}

function detectStatusChanges(feed) {
  if (!Array.isArray(feed)) return;

  feed.forEach((item) => {
    if (!item?.id) return;
    const prev = knownStatuses.get(item.id);
    if (prev && prev !== item.status) {
      showStatusToast(`${item.title || "Issue"}: ${prev} -> ${item.status}`);
    }
    knownStatuses.set(item.id, item.status);
  });
}

function showStatusToast(message) {
  const body = document.getElementById("statusToastBody");
  const toastEl = document.getElementById("statusToast");
  if (!body || !toastEl || typeof window.bootstrap === "undefined") return;
  body.textContent = message;
  window.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3200 }).show();
}

function setSubmitLoading(isLoading) {
  const submitBtn = document.getElementById("submitIssueBtn");
  const spinner = document.getElementById("submitSpinner");
  if (!submitBtn || !spinner) return;

  submitBtn.disabled = isLoading;
  spinner.classList.toggle("d-none", !isLoading);
}

function showSubmitCheck() {
  const check = document.getElementById("submitCheck");
  if (!check) return;
  check.classList.remove("d-none");
  setTimeout(() => check.classList.add("d-none"), 2200);
}

async function upvoteIssue(issueId) {
  const token = getStoredAuthToken();
  if (!token) {
    const copy = I18N[currentUiLanguage] || I18N.en;
    showMessage("complaintError", copy.loginRequired);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/issues/${encodeURIComponent(issueId)}/vote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err.error || `Vote failed (${response.status})`);
    }

    await loadDashboard(true);
  } catch (error) {
    showMessage("complaintError", error.message || "Failed to upvote");
  }
}

function toggleBodyClass(className) {
  document.body.classList.toggle(className);
  localStorage.setItem(className, document.body.classList.contains(className) ? "1" : "0");
}

function restoreAccessibilityModes() {
  ["dark-mode", "high-contrast", "large-text"].forEach((key) => {
    if (localStorage.getItem(key) === "1") {
      document.body.classList.add(key);
    }
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderIssueLanguageButtons() {
  document.querySelectorAll(".timeline-btn").forEach((btn) => {
    btn.textContent = (I18N[currentUiLanguage] || I18N.en).timelineOpen;
  });
}

function openPrivacyModal() {
  const modal = document.getElementById("privacyModal");
  if (!modal) return;
  modal.classList.remove("d-none");
  document.body.classList.add("no-scroll");
}

function closePrivacyModal() {
  const modal = document.getElementById("privacyModal");
  if (!modal) return;
  modal.classList.add("d-none");
  document.body.classList.remove("no-scroll");
}

function exportFeedCsv() {
  const data = Array.isArray(lastFeedData) ? lastFeedData : [];
  if (!data.length) {
    showStatusToast("No feed data to export");
    return;
  }

  const headers = ["id", "title", "status", "department", "category", "voteCount", "commentCount", "updatedAt"];
  const rows = [headers.join(",")];
  data.forEach((item) => {
    const line = headers
      .map((h) => toCsvValue(item?.[h]))
      .join(",");
    rows.push(line);
  });

  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ccirs-transparency-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCsvValue(value) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function toggleDemoMode() {
  demoModeEnabled = !demoModeEnabled;
  const badge = document.getElementById("demoBadge");
  if (badge) {
    badge.classList.toggle("d-none", !demoModeEnabled);
  }
  applyUiLanguage(currentUiLanguage);
  loadDashboard();
}

function toggleJuryMode() {
  juryModeEnabled = !juryModeEnabled;
  localStorage.setItem("jury-mode", juryModeEnabled ? "1" : "0");
  applyJuryMode(juryModeEnabled);
  applyUiLanguage(currentUiLanguage);
}

function applyJuryMode(enabled) {
  const inApp = !document.getElementById("appSection")?.classList.contains("d-none");
  const shouldEnable = enabled && inApp;
  if (!shouldEnable) {
    stopPitchFlow();
  }
  document.body.classList.toggle("jury-mode", shouldEnable);

  const badge = document.getElementById("juryBadge");
  if (badge) {
    badge.classList.toggle("d-none", !shouldEnable);
  }

  const story = document.getElementById("juryStory");
  if (story) {
    story.classList.toggle("d-none", !shouldEnable);
  }

  const guide = document.getElementById("pitchScriptCard");
  if (guide) {
    guide.classList.toggle("d-none", !shouldEnable);
  }

  const hints = document.getElementById("pitchKeyHints");
  if (hints) {
    hints.classList.toggle("d-none", !shouldEnable);
  }

  if (shouldEnable) {
    updatePitchHud();
  }
}

function togglePitchFlow() {
  if (pitchFlowTimer) {
    stopPitchFlow();
    return;
  }
  startPitchFlow();
}

function stepPitchFlow(delta) {
  if (!ensurePitchReady()) return;
  if (pitchFlowTimer) {
    stopPitchFlow();
    if (!ensurePitchReady()) return;
  }

  const total = activePitchNodeIds.length;
  const nextIndex = ((currentPitchStepIndex + delta) % total + total) % total;
  const nextId = activePitchNodeIds[nextIndex];
  const node = document.getElementById(nextId);
  if (!node) return;
  runPitchStep(node, nextIndex, total);
}

function ensurePitchReady() {
  const inApp = !document.getElementById("appSection")?.classList.contains("d-none");
  if (!inApp) return false;

  if (!juryModeEnabled) {
    juryModeEnabled = true;
    localStorage.setItem("jury-mode", "1");
    applyJuryMode(true);
  }

  const sequenceNodes = PITCH_FLOW_SEQUENCE
    .map((id) => document.getElementById(id))
    .filter((node) => node && !node.classList.contains("d-none"));

  if (!sequenceNodes.length) return false;

  activePitchNodeIds = sequenceNodes.map((node) => node.id).filter(Boolean);

  if (currentPitchStepIndex < 0 || currentPitchStepIndex >= activePitchNodeIds.length) {
    currentPitchStepIndex = 0;
  }

  if (!currentPitchFocusId) {
    runPitchStep(sequenceNodes[currentPitchStepIndex], currentPitchStepIndex, sequenceNodes.length);
  }

  return true;
}

function startPitchFlow() {
  if (!ensurePitchReady()) return;

  const sequenceNodes = activePitchNodeIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sequenceNodes.length) return;

  if (currentPitchStepIndex < 0 || currentPitchStepIndex >= sequenceNodes.length) {
    currentPitchStepIndex = 0;
  }
  runPitchStep(sequenceNodes[currentPitchStepIndex], currentPitchStepIndex, sequenceNodes.length);

  pitchFlowTimer = setInterval(() => {
    currentPitchStepIndex = (currentPitchStepIndex + 1) % sequenceNodes.length;
    runPitchStep(sequenceNodes[currentPitchStepIndex], currentPitchStepIndex, sequenceNodes.length);
  }, PITCH_FLOW_INTERVAL_MS);

  applyUiLanguage(currentUiLanguage);
}

function runPitchStep(node, index, total) {
  if (!node) return;
  clearPitchFocus();
  currentPitchFocusId = node.id || "";
  node.classList.add("pitch-focus");
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  if (Number.isInteger(index)) {
    currentPitchStepIndex = index;
  }
  if (Number.isInteger(total) && total > 0) {
    activePitchNodeIds = activePitchNodeIds.length ? activePitchNodeIds : [currentPitchFocusId];
  }
  updatePitchHud();
}

function stopPitchFlow() {
  if (pitchFlowTimer) {
    clearInterval(pitchFlowTimer);
    pitchFlowTimer = null;
  }
  clearPitchFocus();
  currentPitchStepIndex = -1;
  activePitchNodeIds = [];
  updatePitchHud();
  applyUiLanguage(currentUiLanguage);
}

function handlePitchKeydown(event) {
  if (!document.body.classList.contains("jury-mode")) return;
  if (event.target?.matches?.("input, textarea, select")) return;

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    stepPitchFlow(1);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    stepPitchFlow(1);
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepPitchFlow(-1);
    return;
  }

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    togglePitchFullscreen();
  }
}

async function togglePitchFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.warn("Fullscreen toggle failed", error);
  } finally {
    syncPitchFullscreenUi();
  }
}

function exitPitchFullscreenIfNeeded() {
  if (!document.fullscreenElement) {
    syncPitchFullscreenUi();
    return;
  }
  document.exitFullscreen().catch(() => {
    syncPitchFullscreenUi();
  });
}

function syncPitchFullscreenUi() {
  const isOn = Boolean(document.fullscreenElement);
  document.body.classList.toggle("pitch-fullscreen", isOn);
  applyUiLanguage(currentUiLanguage);
}

function clearPitchFocus() {
  if (!currentPitchFocusId) return;
  const node = document.getElementById(currentPitchFocusId);
  if (node) {
    node.classList.remove("pitch-focus");
  }
  currentPitchFocusId = "";
}

function updatePitchHud() {
  const copy = I18N[currentUiLanguage] || I18N.en;
  const badge = document.getElementById("pitchStepBadge");
  const modeBadge = document.getElementById("pitchModeBadge");
  const guideText = document.getElementById("pitchGuideText");
  const inJuryMode = document.body.classList.contains("jury-mode");

  if (badge) {
    const total = activePitchNodeIds.length;
    const isActive = pitchFlowTimer && currentPitchStepIndex >= 0 && total > 0;
    badge.classList.toggle("d-none", !isActive);
    if (isActive) {
      badge.textContent = `${copy.pitchStep} ${currentPitchStepIndex + 1}/${total}`;
    }
  }

  if (modeBadge) {
    const shouldShow = inJuryMode;
    modeBadge.classList.toggle("d-none", !shouldShow);
    if (shouldShow) {
      modeBadge.textContent = pitchFlowTimer ? copy.pitchModeAuto : copy.pitchModeManual;
      modeBadge.classList.toggle("text-bg-success", Boolean(pitchFlowTimer));
      modeBadge.classList.toggle("text-bg-secondary", !pitchFlowTimer);
    }
  }

  if (!guideText) return;
  if (!inJuryMode) {
    guideText.textContent = copy.pitchGuideDefault;
    return;
  }

  if (!pitchFlowTimer || !currentPitchFocusId) {
    guideText.textContent = copy.pitchGuideDefault;
    return;
  }

  const scriptMap = {
    juryStory: copy.pitchScriptStory,
    statsCards: copy.pitchScriptStats,
    kpiCards: copy.pitchScriptKpis,
    transparencyFeed: copy.pitchScriptFeed,
    architectureTitle: copy.pitchScriptArchitecture,
    impactTitle: copy.pitchScriptImpact,
    scalabilityTitle: copy.pitchScriptScale,
  };

  guideText.textContent = scriptMap[currentPitchFocusId] || copy.pitchGuideDefault;
}

function getDemoIssues() {
  const now = Date.now();
  return [
    {
      id: "demo_issue_1",
      title: "Waterlogging near bus depot",
      description: "Heavy water accumulation causing traffic blockage.",
      status: "IN_PROGRESS",
      severity: "HIGH",
      category: "drainage",
      department: "Public Works",
      aiConfidence: 0.93,
      latitude: 28.626,
      longitude: 77.215,
      address: "Sector 5 Bus Depot",
      language: "en",
      photoUrls: [],
      voiceNoteUrl: "",
      voteCount: 24,
      commentCount: 6,
      createdAt: new Date(now - 4 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "demo_issue_2",
      title: "Street light outage cluster",
      description: "Multiple poles are not functioning since last evening.",
      status: "OPEN",
      severity: "MEDIUM",
      category: "electricity",
      department: "Electricity",
      aiConfidence: 0.89,
      latitude: 28.639,
      longitude: 77.228,
      address: "Ward 12 Main Lane",
      language: "en",
      photoUrls: [],
      voiceNoteUrl: "",
      voteCount: 17,
      commentCount: 3,
      createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now - 20 * 60 * 1000).toISOString(),
    },
  ];
}

function updateDepartmentFilterOptions(departments, firstLabel) {
  const select = document.getElementById("issueDepartmentFilter");
  if (!select) return;

  const previous = filters.department || select.value || "";
  const unique = Array.from(new Set((departments || []).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  select.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = firstLabel;
  select.appendChild(first);

  unique.forEach((department) => {
    const opt = document.createElement("option");
    opt.value = department;
    opt.textContent = department;
    select.appendChild(opt);
  });

  if (previous && unique.includes(previous)) {
    select.value = previous;
    filters.department = previous;
  } else {
    select.value = "";
    filters.department = "";
  }
}

function applyIssueFormLanguage(lang) {
  const copy = I18N[lang] || I18N.en;
  const title = document.querySelector("#appSection .card-body h5.mb-3");
  if (title) title.textContent = copy.reportTitle;

  setLabel("issueTitle", copy.title);
  setLabel("issueDescription", copy.description);
  setLabel("issueSeverity", copy.priority);
  setLabel("issueLanguage", copy.language);
  setLabel("issueLatitude", copy.latitude);
  setLabel("issueLongitude", copy.longitude);
  setLabel("issueAddress", copy.address);
  setLabel("issuePhotos", copy.photos);
  setLabel("issueVoiceNote", copy.voice);

  setText("submitBtnText", copy.submit);
}

async function openTimelineModal(issueId) {
  const copy = I18N[currentUiLanguage] || I18N.en;
  const modal = document.getElementById("timelineModal");
  const content = document.getElementById("timelineContent");
  const meta = document.getElementById("timelineIssueMeta");
  const integrity = document.getElementById("integrityBadge");

  content.innerHTML = '<div class="text-muted">Loading timeline...</div>';
  meta.textContent = `Issue ID: ${issueId}`;
  integrity.textContent = "Integrity: unknown";
  integrity.className = "badge text-bg-secondary";
  modal.classList.remove("d-none");
  document.body.classList.add("no-scroll");

  try {
    const response = await fetch(`${API_BASE_URL}/transparency/issues/${encodeURIComponent(issueId)}/timeline`);
    const data = await safeJson(response);
    if (!response.ok) {
      throw new Error(data.error || `Timeline request failed (${response.status})`);
    }

    const ok = Boolean(data.integrityCheckEnabled);
    integrity.textContent = ok ? copy.integrityOn : copy.integrityOff;
    integrity.className = `badge ${ok ? "text-bg-success" : "text-bg-warning"}`;

    const timeline = Array.isArray(data.timeline) ? data.timeline : [];
    if (!timeline.length) {
      content.innerHTML = `<div class="text-muted">${copy.noTimelineEvents}</div>`;
      return;
    }

    content.innerHTML = timeline
      .map((entry) => {
        const details = entry.details ? JSON.stringify(entry.details) : "";
        return `
          <div class="timeline-item">
            <div class="timeline-head">
              <strong>${escapeHtml(entry.eventType || "EVENT")}</strong>
              <small class="text-muted">${formatDate(entry.timestamp)}</small>
            </div>
            <div class="small text-muted">Actor: ${escapeHtml(entry.actor || "system")}</div>
            ${details ? `<pre class="timeline-details">${escapeHtml(details)}</pre>` : ""}
          </div>
        `;
      })
      .join("");
  } catch (error) {
    content.innerHTML = `<div class="text-danger">${escapeHtml(error.message || "Failed to load timeline")}</div>`;
  }
}

function closeTimelineModal() {
  const modal = document.getElementById("timelineModal");
  if (!modal) return;
  modal.classList.add("d-none");
  document.body.classList.remove("no-scroll");
}

function setLabel(forId, text) {
  const label = document.querySelector(`label[for='${forId}']`);
  if (label) label.textContent = text;
}

async function readFilesAsDataUrls(fileList, maxFiles) {
  const files = Array.from(fileList || []).slice(0, maxFiles);
  const results = [];

  for (const file of files) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
    results.push(String(dataUrl));
  }

  return results;
}


function getLocation() {
  if (!navigator.geolocation) {
    document.getElementById("locationInfo").textContent = "Geolocation is not supported by your browser.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      document.getElementById("issueLatitude").value = lat;
      document.getElementById("issueLongitude").value = lon;
      document.getElementById("locationInfo").textContent = `Location: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    },
    (error) => {
      document.getElementById("locationInfo").textContent = `Error: ${error.message}`;
    }
  );
}
