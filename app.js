const STORAGE_KEY = "studium-state-v1";
const THEME_KEY = "studium-theme";
const TIMER_SECONDS = 25 * 60;
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function isoNowPlusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(18, 0, 0, 0);
  return date.toISOString();
}

function dateInputValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function dateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value, options = {}) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: options.dateStyle || "medium",
    timeStyle: options.timeStyle || undefined
  }).format(new Date(value));
}

function formatHours(totalSeconds) {
  const hours = totalSeconds / 3600;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  return `${minutes}min`;
}

function semesterDefaults() {
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 5);
  return { start: dateInputValue(start.toISOString()), end: dateInputValue(end.toISOString()) };
}

function createInitialState() {
  const semester = semesterDefaults();
  const calculusId = uid("subject");
  const algorithmsId = uid("subject");

  return {
    settings: {
      theme: localStorage.getItem(THEME_KEY) || "light",
      semester
    },
    profile: {
      name: "",
      course: "",
      university: "",
      photo: ""
    },
    subjects: [
      {
        id: calculusId,
        name: "Cálculo II",
        professor: "Prof. Helena Duarte",
        color: "#4b86f5",
        attendance: "88",
        notes: "Revisar séries numéricas antes da próxima lista e separar fórmulas principais.",
        resources: [{ id: uid("resource"), name: "Plano de ensino", url: "https://exemplo.local/plano-calculo" }],
        assessments: [
          { id: uid("assessment"), title: "P1", weight: "4", score: "7.5" },
          { id: uid("assessment"), title: "Lista final", weight: "2", score: "8.8" }
        ]
      },
      {
        id: algorithmsId,
        name: "Algoritmos Avançados",
        professor: "Prof. Marcelo Farias",
        color: "#63d3c5",
        attendance: "93",
        notes: "Separar exemplos de programação dinâmica e revisar complexidade assintótica.",
        resources: [{ id: uid("resource"), name: "Repositório de exercícios", url: "https://exemplo.local/algoritmos" }],
        assessments: [
          { id: uid("assessment"), title: "Seminário", weight: "3", score: "9.0" },
          { id: uid("assessment"), title: "Projeto", weight: "5", score: "8.4" }
        ]
      }
    ],
    tasks: [
      {
        id: uid("task"),
        title: "Lista 4 de integrais",
        description: "Resolver questões 1-12 e preparar dúvidas.",
        dueDate: isoNowPlusDays(2),
        priority: "high",
        subjectId: calculusId,
        status: "pending"
      },
      {
        id: uid("task"),
        title: "Resumo de grafos",
        description: "Sintetizar conceitos para o grupo de estudo.",
        dueDate: isoNowPlusDays(5),
        priority: "medium",
        subjectId: algorithmsId,
        status: "pending"
      }
    ],
    events: [
      { id: uid("event"), title: "Prova parcial", type: "Prova", date: isoNowPlusDays(4), subjectId: calculusId },
      { id: uid("event"), title: "Apresentação do projeto", type: "Trabalho", date: isoNowPlusDays(7), subjectId: algorithmsId }
    ],
    studySessions: [
      { id: uid("session"), subjectId: calculusId, duration: 50 * 60, date: new Date().toISOString() },
      { id: uid("session"), subjectId: algorithmsId, duration: 40 * 60, date: new Date(Date.now() - 86400000).toISOString() }
    ]
  };
}

function createEmptyState() {
  return {
    settings: {
      theme: localStorage.getItem(THEME_KEY) || "light",
      semester: semesterDefaults()
    },
    profile: {
      name: "",
      course: "",
      university: "",
      photo: ""
    },
    subjects: [],
    tasks: [],
    events: [],
    studySessions: []
  };
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return createInitialState();

  try {
    const parsed = JSON.parse(stored);
    parsed.settings = parsed.settings || {};
    parsed.settings.theme = parsed.settings.theme || localStorage.getItem(THEME_KEY) || "light";
    parsed.settings.semester = parsed.settings.semester || semesterDefaults();
    parsed.profile = parsed.profile || { name: "", course: "", university: "", photo: "" };
    parsed.subjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
    parsed.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    parsed.events = Array.isArray(parsed.events) ? parsed.events : [];
    parsed.studySessions = Array.isArray(parsed.studySessions) ? parsed.studySessions : [];
    return parsed;
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    return createInitialState();
  }
}

const state = loadState();
const app = {
  activeScreen: "dashboard",
  selectedSubjectId: state.subjects[0]?.id || null,
  calendarDate: new Date(),
  timerSecondsLeft: TIMER_SECONDS,
  timerRunning: false,
  timerSubjectId: null,
  timerInterval: null
};

const elements = {
  navItems: document.querySelectorAll(".nav-item"),
  screens: document.querySelectorAll(".screen"),
  screenTitle: document.querySelector("#screen-title"),
  topbarKicker: document.querySelector("#topbar-kicker"),
  topbarSubtitle: document.querySelector("#topbar-subtitle"),
  welcomeLabel: document.querySelector("#welcome-label"),
  topbarAvatar: document.querySelector("#topbar-avatar"),
  themeChoices: document.querySelectorAll("[data-theme-choice]"),
  themeToggleButton: document.querySelector("#settings-theme-toggle"),
  dashboardMetrics: document.querySelector("#dashboard-metrics"),
  alertList: document.querySelector("#alert-list"),
  dashboardTaskList: document.querySelector("#dashboard-task-list"),
  dashboardEventList: document.querySelector("#dashboard-event-list"),
  weeklySummary: document.querySelector("#weekly-summary"),
  studyTimer: document.querySelector("#study-timer"),
  studySubjectSelect: document.querySelector("#study-subject-select"),
  timerToggle: document.querySelector("#timer-toggle"),
  timerReset: document.querySelector("#timer-reset"),
  studyHistoryPreview: document.querySelector("#study-history-preview"),
  subjectForm: document.querySelector("#subject-form"),
  subjectId: document.querySelector("#subject-id"),
  subjectName: document.querySelector("#subject-name"),
  subjectProfessor: document.querySelector("#subject-professor"),
  subjectColor: document.querySelector("#subject-color"),
  subjectAttendance: document.querySelector("#subject-attendance"),
  subjectNotes: document.querySelector("#subject-notes"),
  subjectFormReset: document.querySelector("#subject-form-reset"),
  subjectList: document.querySelector("#subject-list"),
  subjectDetailTitle: document.querySelector("#subject-detail-title"),
  subjectDetail: document.querySelector("#subject-detail"),
  eventForm: document.querySelector("#event-form"),
  eventId: document.querySelector("#event-id"),
  eventTitle: document.querySelector("#event-title"),
  eventType: document.querySelector("#event-type"),
  eventDate: document.querySelector("#event-date"),
  eventSubject: document.querySelector("#event-subject"),
  eventFormReset: document.querySelector("#event-form-reset"),
  calendarTitle: document.querySelector("#calendar-title"),
  calendarGrid: document.querySelector("#calendar-grid"),
  calendarWeekdays: document.querySelector("#calendar-weekdays"),
  calendarPrev: document.querySelector("#calendar-prev"),
  calendarNext: document.querySelector("#calendar-next"),
  eventList: document.querySelector("#event-list"),
  taskForm: document.querySelector("#task-form"),
  taskId: document.querySelector("#task-id"),
  taskTitle: document.querySelector("#task-title"),
  taskDescription: document.querySelector("#task-description"),
  taskDueDate: document.querySelector("#task-due-date"),
  taskPriority: document.querySelector("#task-priority"),
  taskSubject: document.querySelector("#task-subject"),
  taskStatus: document.querySelector("#task-status"),
  taskFormReset: document.querySelector("#task-form-reset"),
  taskFilterStatus: document.querySelector("#task-filter-status"),
  taskFilterSubject: document.querySelector("#task-filter-subject"),
  taskSort: document.querySelector("#task-sort"),
  taskList: document.querySelector("#task-list"),
  statsMetrics: document.querySelector("#stats-metrics"),
  studyChart: document.querySelector("#study-chart"),
  gradeChart: document.querySelector("#grade-chart"),
  taskChart: document.querySelector("#task-chart"),
  studySessionList: document.querySelector("#study-session-list"),
  profileForm: document.querySelector("#profile-form"),
  profileName: document.querySelector("#profile-name"),
  profileCourse: document.querySelector("#profile-course"),
  profileUniversity: document.querySelector("#profile-university"),
  profilePhoto: document.querySelector("#profile-photo"),
  profilePreview: document.querySelector("#profile-preview"),
  profileSubjects: document.querySelector("#profile-subjects"),
  shareProfile: document.querySelector("#share-profile"),
  semesterForm: document.querySelector("#semester-form"),
  semesterStart: document.querySelector("#semester-start"),
  semesterEnd: document.querySelector("#semester-end"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data"),
  resetData: document.querySelector("#reset-data"),
  onboardingModal: document.querySelector("#onboarding-modal"),
  onboardingForm: document.querySelector("#onboarding-form"),
  onboardingName: document.querySelector("#onboarding-name"),
  onboardingCourse: document.querySelector("#onboarding-course"),
  onboardingUniversity: document.querySelector("#onboarding-university")
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function subjectById(subjectId) {
  return state.subjects.find((subject) => subject.id === subjectId) || null;
}

function averageFromAssessments(assessments) {
  if (!assessments.length) return 0;
  let weightSum = 0;
  let weightedScore = 0;
  assessments.forEach((assessment) => {
    const weight = Number(assessment.weight) || 0;
    const score = Number(assessment.score) || 0;
    weightSum += weight;
    weightedScore += score * weight;
  });
  return weightSum ? weightedScore / weightSum : 0;
}

function overallAverage() {
  const averages = state.subjects.map((subject) => averageFromAssessments(subject.assessments)).filter((average) => average > 0);
  if (!averages.length) return 0;
  return averages.reduce((sum, item) => sum + item, 0) / averages.length;
}

function semesterProgress() {
  const { start, end } = state.settings.semester;
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (endTime <= startTime) return 0;
  return Math.max(0, Math.min(100, ((Date.now() - startTime) / (endTime - startTime)) * 100));
}

function isOverdue(value) {
  return new Date(value).getTime() < Date.now();
}

function upcomingTasks() {
  return [...state.tasks].filter((task) => task.status !== "done").sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function upcomingEvents() {
  return [...state.events].sort((a, b) => new Date(a.date) - new Date(b.date)).filter((event) => new Date(event.date).getTime() >= Date.now() - 86400000);
}

function weeklyStudySeconds() {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return state.studySessions.filter((session) => new Date(session.date).getTime() >= weekAgo).reduce((sum, session) => sum + session.duration, 0);
}

function todayStudySeconds() {
  const key = new Date().toISOString().slice(0, 10);
  return state.studySessions.filter((session) => session.date.slice(0, 10) === key).reduce((sum, session) => sum + session.duration, 0);
}

function buildAlerts() {
  const list = [];
  state.tasks.filter((task) => task.status !== "done" && isOverdue(task.dueDate)).forEach((task) => {
    list.push({ type: "danger", title: "Tarefa atrasada", description: `${task.title} venceu em ${formatDate(task.dueDate, { dateStyle: "short", timeStyle: "short" })}.` });
  });
  upcomingEvents().filter((event) => new Date(event.date).getTime() <= Date.now() + (3 * 24 * 60 * 60 * 1000)).forEach((event) => {
    list.push({ type: "warning", title: "Evento próximo", description: `${event.title} acontece em ${formatDate(event.date, { dateStyle: "short", timeStyle: "short" })}.` });
  });
  state.subjects.filter((subject) => {
    const average = averageFromAssessments(subject.assessments);
    return average > 0 && average < 6;
  }).forEach((subject) => {
    list.push({ type: "info", title: "Média baixa", description: `${subject.name} está com média ${averageFromAssessments(subject.assessments).toFixed(1)}.` });
  });
  return list.slice(0, 6);
}

function applyTheme(theme) {
  state.settings.theme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = state.settings.theme;
  localStorage.setItem(THEME_KEY, state.settings.theme);
  elements.themeChoices.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.themeChoice === state.settings.theme);
  });
  saveState();
}

function profileInitial() {
  return (state.profile.name || "S").trim().charAt(0).toUpperCase() || "S";
}

function hasProfile() {
  return Boolean(state.profile.name && state.profile.course && state.profile.university);
}

function syncTopbarProfile() {
  elements.welcomeLabel.textContent = state.profile.name ? `Olá, ${state.profile.name}` : "Olá, estudante";
  if (state.profile.photo) {
    elements.topbarAvatar.textContent = "";
    elements.topbarAvatar.style.backgroundImage = `url(${state.profile.photo})`;
    elements.topbarAvatar.style.backgroundSize = "cover";
    elements.topbarAvatar.style.backgroundPosition = "center";
  } else {
    elements.topbarAvatar.textContent = profileInitial();
    elements.topbarAvatar.style.backgroundImage = "";
  }
}

function syncMobileNavLabels() {
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const labels = {
    dashboard: { mobile: "Inicio", desktop: "Dashboard" },
    subjects: { mobile: "Materias", desktop: "Disciplinas" },
    agenda: { mobile: "Planos", desktop: "Agenda" },
    profile: { mobile: "Perfil", desktop: "Perfil" },
    settings: { mobile: "Config.", desktop: "Configurações" }
  };

  elements.navItems.forEach((item) => {
    const config = labels[item.dataset.screen];
    if (!config) return;
    const label = item.querySelector(".nav-label");
    if (!label) return;
    label.textContent = isMobile ? config.mobile : config.desktop;
  });
}

function populateSubjectOptions() {
  const subjectOptions = state.subjects.map((subject) => `<option value="${subject.id}">${subject.name}</option>`).join("");
  const withEmpty = `<option value="">Sem disciplina</option>${subjectOptions}`;
  elements.eventSubject.innerHTML = withEmpty;
  elements.taskSubject.innerHTML = withEmpty;
  elements.taskFilterSubject.innerHTML = `<option value="all">Todas as disciplinas</option>${subjectOptions}`;
  elements.studySubjectSelect.innerHTML = `<option value="">Selecionar disciplina</option>${subjectOptions}`;
}

function populateStatusFilter() {
  elements.taskFilterStatus.innerHTML = '<option value="all">Todos os status</option><option value="pending">Pendentes</option><option value="done">Concluídas</option>';
}

function setActiveScreen(screen) {
  app.activeScreen = screen;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const labels = {
    dashboard: ["Visão geral", "Dashboard", "Seu semestre em ritmo constante."],
    subjects: ["Estrutura acadêmica", "Disciplinas", "Cadastre matérias, notas e materiais."],
    agenda: ["Planejamento", "Agenda", "Veja provas, aulas e trabalhos em calendário."],
    tasks: ["Execução", "Tarefas", "Organize entregas por prazo, disciplina e prioridade."],
    stats: ["Análise", "Estatísticas", "Acompanhe estudo, notas e produtividade."],
    profile: ["Identidade", "Perfil", "Dados pessoais, foto e cartão compartilhável."],
    settings: ["Preferências", "Configurações", "Ajuste tema, semestre e backups locais."]
  };
  elements.navItems.forEach((item) => {
    const isHubProxy = isMobile && ["agenda", "tasks", "stats"].includes(screen) && item.dataset.screen === "agenda";
    item.classList.toggle("is-active", item.dataset.screen === screen || isHubProxy);
  });
  document.querySelectorAll("[data-mobile-hub-screen]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mobileHubScreen === screen);
  });
  elements.screens.forEach((node) => node.classList.toggle("is-active", node.id === `screen-${screen}`));
  elements.screenTitle.textContent = labels[screen][1];
  elements.topbarKicker.textContent = labels[screen][0];
  elements.topbarSubtitle.textContent = labels[screen][2];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderMetrics() {
  const alerts = buildAlerts();
  const cards = [
    { label: "Média geral", value: overallAverage().toFixed(1), note: "Notas ponderadas automaticamente" },
    { label: "Progresso do semestre", value: `${semesterProgress().toFixed(0)}%`, note: `${state.settings.semester.start || "--"} até ${state.settings.semester.end || "--"}` },
    { label: "Estudo na semana", value: formatHours(weeklyStudySeconds()), note: "Somatório das sessões registradas" },
    { label: "Alertas ativos", value: String(alerts.length), note: `${upcomingTasks().length} tarefa(s) em andamento` }
  ];
  elements.dashboardMetrics.innerHTML = cards.map((card, index) => `
    <article class="glass-card metric-card ${index === 0 ? "accent-card" : ""}">
      <span class="mini-label">${card.label}</span>
      <strong>${card.value}</strong>
      <p>${card.note}</p>
    </article>
  `).join("");
}

function renderAlertList() {
  const list = buildAlerts();
  elements.alertList.innerHTML = list.length ? list.map((alert) => `
    <article class="alert-card ${alert.type}">
      <strong>${alert.title}</strong>
      <span class="list-meta">${alert.description}</span>
    </article>
  `).join("") : '<div class="empty-state">Tudo em dia. Nenhum alerta no momento.</div>';
}

function renderDashboardLists() {
  const tasks = upcomingTasks().slice(0, 5);
  const events = upcomingEvents().slice(0, 5);
  elements.dashboardTaskList.innerHTML = tasks.length ? tasks.map((task) => `
    <article class="list-card">
      <div class="list-head">
        <strong>${task.title}</strong>
        <span class="pill ${task.priority}">${task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}</span>
      </div>
      <span class="list-meta">${formatDate(task.dueDate, { dateStyle: "short", timeStyle: "short" })}</span>
      <span class="list-meta">${subjectById(task.subjectId)?.name || "Sem disciplina"}</span>
    </article>
  `).join("") : '<div class="empty-state">Sem tarefas pendentes.</div>';

  elements.dashboardEventList.innerHTML = events.length ? events.map((event) => `
    <article class="list-card">
      <div class="list-head">
        <strong>${event.title}</strong>
        <span class="pill warning">${event.type}</span>
      </div>
      <span class="list-meta">${formatDate(event.date, { dateStyle: "short", timeStyle: "short" })}</span>
      <span class="list-meta">${subjectById(event.subjectId)?.name || "Evento geral"}</span>
    </article>
  `).join("") : '<div class="empty-state">Sem eventos programados.</div>';
}

function renderWeeklySummary() {
  const completed = state.tasks.filter((task) => task.status === "done").length;
  const pending = state.tasks.filter((task) => task.status !== "done").length;
  const items = [
    { label: "Hoje", value: formatDuration(todayStudySeconds()), note: "Tempo estudado no dia" },
    { label: "Semana", value: formatDuration(weeklyStudySeconds()), note: "Tempo total acumulado" },
    { label: "Concluídas", value: String(completed), note: "Tarefas finalizadas" },
    { label: "Pendentes", value: String(pending), note: "Tarefas ainda em aberto" }
  ];
  elements.weeklySummary.innerHTML = items.map((item) => `
    <article class="summary-item">
      <span class="mini-label">${item.label}</span>
      <strong>${item.value}</strong>
      <span class="list-meta">${item.note}</span>
    </article>
  `).join("");
}

function resetSubjectForm() {
  elements.subjectForm.reset();
  elements.subjectId.value = "";
  elements.subjectColor.value = "#4b86f5";
}

function renderSubjectList() {
  if (!state.subjects.length) {
    app.selectedSubjectId = null;
    elements.subjectList.innerHTML = '<div class="empty-state">Nenhuma disciplina cadastrada.</div>';
    renderSubjectDetail();
    return;
  }

  if (!subjectById(app.selectedSubjectId)) {
    app.selectedSubjectId = state.subjects[0].id;
  }

  elements.subjectList.innerHTML = state.subjects.map((subject) => `
    <article class="subject-card ${subject.id === app.selectedSubjectId ? "is-selected" : ""}" data-subject-card="${subject.id}">
      <div class="subject-head">
        <div class="metric-inline"><span class="subject-dot" style="background:${subject.color}"></span><strong>${subject.name}</strong></div>
        <span class="pill">${averageFromAssessments(subject.assessments) ? averageFromAssessments(subject.assessments).toFixed(1) : "Sem nota"}</span>
      </div>
      <span class="list-meta">${subject.professor}</span>
      <span class="list-meta">${subject.attendance ? `${subject.attendance}% de frequência` : "Frequência não informada"}</span>
    </article>
  `).join("");

  document.querySelectorAll("[data-subject-card]").forEach((card) => {
    card.addEventListener("click", () => {
      app.selectedSubjectId = card.dataset.subjectCard;
      renderSubjectList();
      renderSubjectDetail();
    });
  });

  renderSubjectDetail();
}

function renderSubjectDetail() {
  const subject = subjectById(app.selectedSubjectId);
  if (!subject) {
    elements.subjectDetailTitle.textContent = "Selecione uma disciplina";
    elements.subjectDetail.innerHTML = '<div class="empty-state">Escolha uma disciplina para ver os detalhes.</div>';
    return;
  }

  const average = averageFromAssessments(subject.assessments);
  const assessments = subject.assessments.length ? subject.assessments.map((assessment) => `
    <article class="list-card">
      <div class="list-head">
        <strong>${assessment.title}</strong>
        <span class="pill">${Number(assessment.score || 0).toFixed(1)}</span>
      </div>
      <span class="list-meta">Peso ${assessment.weight || "0"}</span>
      <div class="task-actions">
        <button class="glass-button secondary-button" type="button" data-assessment-edit="${assessment.id}">Editar</button>
        <button class="glass-button danger-button" type="button" data-assessment-delete="${assessment.id}">Excluir</button>
      </div>
    </article>
  `).join("") : '<div class="empty-state">Sem avaliações cadastradas.</div>';

  const resources = subject.resources.length ? subject.resources.map((resource) => `
    <article class="list-card">
      <div class="list-head">
        <strong>${resource.name}</strong>
        <a class="pill" href="${resource.url}" target="_blank" rel="noreferrer">Abrir</a>
      </div>
      <span class="list-meta">${resource.url}</span>
      <button class="glass-button danger-button" type="button" data-resource-delete="${resource.id}">Excluir link</button>
    </article>
  `).join("") : '<div class="empty-state">Sem links cadastrados.</div>';

  elements.subjectDetailTitle.textContent = subject.name;
  elements.subjectDetail.innerHTML = `
    <section class="detail-section">
      <div class="detail-heading">
        <div>
          <span class="mini-label">Resumo</span>
          <h4>${subject.name}</h4>
        </div>
        <div class="badge-row">
          <span class="pill">${subject.professor}</span>
          <span class="pill">${average ? average.toFixed(1) : "Sem média"}</span>
        </div>
      </div>
      <div class="detail-grid">
        <div class="list-card"><span class="mini-label">Frequência</span><strong>${subject.attendance ? `${subject.attendance}%` : "Não informada"}</strong></div>
        <div class="list-card"><span class="mini-label">Cor</span><div class="metric-inline"><span class="subject-dot" style="background:${subject.color}"></span><span>${subject.color}</span></div></div>
      </div>
      <p class="supporting">${subject.notes || "Sem anotações registradas."}</p>
      <div class="task-actions">
        <button class="glass-button primary-button" type="button" id="edit-subject-button">Editar disciplina</button>
        <button class="glass-button danger-button" type="button" id="delete-subject-button">Excluir disciplina</button>
      </div>
    </section>
    <section class="detail-section">
      <div class="section-head"><div><span class="mini-label">Notas</span><h3>Avaliações</h3></div></div>
      <form id="assessment-form" class="form-grid compact-form">
        <input type="hidden" id="assessment-id">
        <label><span>Título</span><input id="assessment-title" class="glass-input" type="text" required></label>
        <label><span>Peso</span><input id="assessment-weight" class="glass-input" type="number" min="0" step="0.1" required></label>
        <label><span>Nota</span><input id="assessment-score" class="glass-input" type="number" min="0" max="10" step="0.1" required></label>
        <div class="form-actions">
          <button class="glass-button primary-button" type="submit">Salvar avaliação</button>
          <button class="glass-button secondary-button" type="button" id="assessment-reset">Limpar</button>
        </div>
      </form>
      <div class="stack-list">${assessments}</div>
    </section>
    <section class="detail-section">
      <div class="section-head"><div><span class="mini-label">Arquivos</span><h3>Links de apoio</h3></div></div>
      <form id="resource-form" class="form-grid compact-form">
        <label><span>Nome do arquivo</span><input id="resource-name" class="glass-input" type="text" required></label>
        <label><span>Link</span><input id="resource-url" class="glass-input" type="url" required></label>
        <div><button class="glass-button primary-button" type="submit">Adicionar link</button></div>
      </form>
      <div class="stack-list">${resources}</div>
    </section>
  `;

  document.querySelector("#edit-subject-button").addEventListener("click", () => fillSubjectForm(subject.id));
  document.querySelector("#delete-subject-button").addEventListener("click", () => deleteSubject(subject.id));
  bindAssessmentEvents(subject.id);
  bindResourceEvents(subject.id);
}

function bindAssessmentEvents(subjectId) {
  const subject = subjectById(subjectId);
  const form = document.querySelector("#assessment-form");
  const resetButton = document.querySelector("#assessment-reset");
  const assessmentId = document.querySelector("#assessment-id");
  const title = document.querySelector("#assessment-title");
  const weight = document.querySelector("#assessment-weight");
  const score = document.querySelector("#assessment-score");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!subject) return;
    const payload = { id: assessmentId.value || uid("assessment"), title: title.value.trim(), weight: weight.value, score: score.value };
    const existing = subject.assessments.findIndex((assessment) => assessment.id === payload.id);
    if (existing >= 0) subject.assessments[existing] = payload;
    else subject.assessments.push(payload);
    saveState();
    renderAll();
  });

  resetButton.addEventListener("click", () => {
    form.reset();
    assessmentId.value = "";
  });

  document.querySelectorAll("[data-assessment-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = subject?.assessments.find((assessment) => assessment.id === button.dataset.assessmentEdit);
      if (!item) return;
      assessmentId.value = item.id;
      title.value = item.title;
      weight.value = item.weight;
      score.value = item.score;
    });
  });

  document.querySelectorAll("[data-assessment-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!subject) return;
      subject.assessments = subject.assessments.filter((assessment) => assessment.id !== button.dataset.assessmentDelete);
      saveState();
      renderAll();
    });
  });
}

function bindResourceEvents(subjectId) {
  const subject = subjectById(subjectId);
  const form = document.querySelector("#resource-form");
  const nameInput = document.querySelector("#resource-name");
  const urlInput = document.querySelector("#resource-url");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!subject) return;
    subject.resources.push({ id: uid("resource"), name: nameInput.value.trim(), url: urlInput.value.trim() });
    saveState();
    renderAll();
  });

  document.querySelectorAll("[data-resource-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!subject) return;
      subject.resources = subject.resources.filter((resource) => resource.id !== button.dataset.resourceDelete);
      saveState();
      renderAll();
    });
  });
}

function fillSubjectForm(subjectId) {
  const subject = subjectById(subjectId);
  if (!subject) return;
  elements.subjectId.value = subject.id;
  elements.subjectName.value = subject.name;
  elements.subjectProfessor.value = subject.professor;
  elements.subjectColor.value = subject.color;
  elements.subjectAttendance.value = subject.attendance;
  elements.subjectNotes.value = subject.notes;
  setActiveScreen("subjects");
}

function deleteSubject(subjectId) {
  const subject = subjectById(subjectId);
  if (!subject || !window.confirm(`Excluir a disciplina "${subject.name}"?`)) return;
  state.subjects = state.subjects.filter((item) => item.id !== subjectId);
  state.tasks = state.tasks.map((task) => task.subjectId === subjectId ? { ...task, subjectId: "" } : task);
  state.events = state.events.map((event) => event.subjectId === subjectId ? { ...event, subjectId: "" } : event);
  state.studySessions = state.studySessions.map((session) => session.subjectId === subjectId ? { ...session, subjectId: "" } : session);
  app.selectedSubjectId = state.subjects[0]?.id || null;
  saveState();
  renderAll();
}

function renderCalendar() {
  const year = app.calendarDate.getFullYear();
  const month = app.calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const start = new Date(year, month, 1 - firstWeekday);
  const todayKey = new Date().toISOString().slice(0, 10);

  elements.calendarTitle.textContent = `${MONTHS[month]} ${year}`;
  elements.calendarWeekdays.innerHTML = WEEKDAYS.map((day) => `<div class="calendar-weekday">${day}</div>`).join("");

  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    const dayEvents = state.events.filter((event) => event.date.slice(0, 10) === key).slice(0, 2);
    cells.push(`
      <article class="calendar-day ${day.getMonth() !== month ? "is-outside" : ""} ${key === todayKey ? "is-today" : ""}">
        <div class="calendar-date">
          <span>${day.getDate()}</span>
          ${dayEvents.length ? `<span class="pill">${dayEvents.length}</span>` : ""}
        </div>
        ${dayEvents.map((event) => `<div class="calendar-event" style="background:${subjectById(event.subjectId)?.color || "#4b86f5"}">${event.title}</div>`).join("")}
      </article>
    `);
  }

  elements.calendarGrid.innerHTML = cells.join("");
}

function fillEventForm(eventId) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) return;
  elements.eventId.value = event.id;
  elements.eventTitle.value = event.title;
  elements.eventType.value = event.type;
  elements.eventDate.value = dateTimeInputValue(event.date);
  elements.eventSubject.value = event.subjectId || "";
  setActiveScreen("agenda");
}

function renderEventList() {
  const items = [...state.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  elements.eventList.innerHTML = items.length ? items.map((event) => `
    <article class="list-card">
      <div class="list-head">
        <strong>${event.title}</strong>
        <span class="pill warning">${event.type}</span>
      </div>
      <span class="list-meta">${formatDate(event.date, { dateStyle: "medium", timeStyle: "short" })}</span>
      <span class="list-meta">${subjectById(event.subjectId)?.name || "Sem disciplina"}</span>
      <div class="task-actions">
        <button class="glass-button secondary-button" type="button" data-event-edit="${event.id}">Editar</button>
        <button class="glass-button danger-button" type="button" data-event-delete="${event.id}">Excluir</button>
      </div>
    </article>
  `).join("") : '<div class="empty-state">Sem eventos cadastrados.</div>';

  document.querySelectorAll("[data-event-edit]").forEach((button) => button.addEventListener("click", () => fillEventForm(button.dataset.eventEdit)));
  document.querySelectorAll("[data-event-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.events = state.events.filter((event) => event.id !== button.dataset.eventDelete);
      saveState();
      renderAll();
    });
  });
}

function fillTaskForm(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  elements.taskId.value = task.id;
  elements.taskTitle.value = task.title;
  elements.taskDescription.value = task.description;
  elements.taskDueDate.value = dateTimeInputValue(task.dueDate);
  elements.taskPriority.value = task.priority;
  elements.taskSubject.value = task.subjectId || "";
  elements.taskStatus.value = task.status;
  setActiveScreen("tasks");
}

function renderTaskList() {
  const statusFilter = elements.taskFilterStatus.value || "all";
  const subjectFilter = elements.taskFilterSubject.value || "all";
  const sort = elements.taskSort.value || "due-asc";
  let tasks = [...state.tasks];

  if (statusFilter !== "all") tasks = tasks.filter((task) => task.status === statusFilter);
  if (subjectFilter !== "all") tasks = tasks.filter((task) => task.subjectId === subjectFilter);

  tasks.sort((a, b) => {
    if (sort === "due-desc") return new Date(b.dueDate) - new Date(a.dueDate);
    if (sort === "priority") {
      const weight = { high: 3, medium: 2, low: 1 };
      return weight[b.priority] - weight[a.priority];
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  elements.taskList.innerHTML = tasks.length ? tasks.map((task) => {
    const overdue = task.status !== "done" && isOverdue(task.dueDate);
    return `
      <article class="task-split">
        <div class="task-row-head">
          <div>
            <strong>${task.title}</strong>
            <p class="supporting">${task.description || "Sem descrição."}</p>
          </div>
          <div class="badge-row">
            <span class="pill ${task.priority}">${task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}</span>
            <span class="pill ${task.status === "done" ? "success" : overdue ? "danger" : ""}">${task.status === "done" ? "Concluída" : overdue ? "Atrasada" : "Pendente"}</span>
          </div>
        </div>
        <span class="list-meta">${formatDate(task.dueDate, { dateStyle: "medium", timeStyle: "short" })}</span>
        <span class="list-meta">${subjectById(task.subjectId)?.name || "Sem disciplina"}</span>
        <div class="task-actions">
          <button class="glass-button secondary-button" type="button" data-task-toggle="${task.id}">${task.status === "done" ? "Reabrir" : "Concluir"}</button>
          <button class="glass-button secondary-button" type="button" data-task-edit="${task.id}">Editar</button>
          <button class="glass-button danger-button" type="button" data-task-delete="${task.id}">Excluir</button>
        </div>
      </article>
    `;
  }).join("") : '<div class="empty-state">Nenhuma tarefa encontrada para esse filtro.</div>';

  document.querySelectorAll("[data-task-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = state.tasks.find((item) => item.id === button.dataset.taskToggle);
      if (!task) return;
      task.status = task.status === "done" ? "pending" : "done";
      saveState();
      renderAll();
    });
  });
  document.querySelectorAll("[data-task-edit]").forEach((button) => button.addEventListener("click", () => fillTaskForm(button.dataset.taskEdit)));
  document.querySelectorAll("[data-task-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tasks = state.tasks.filter((task) => task.id !== button.dataset.taskDelete);
      saveState();
      renderAll();
    });
  });
}

function renderStats() {
  const cards = [
    { label: "Disciplinas", value: state.subjects.length, note: "matérias ativas" },
    { label: "Sessões", value: state.studySessions.length, note: "registros salvos" },
    { label: "Média geral", value: overallAverage().toFixed(1), note: "desempenho consolidado" },
    { label: "Semestre", value: `${semesterProgress().toFixed(0)}%`, note: "progresso temporal" }
  ];

  elements.statsMetrics.innerHTML = cards.map((item, index) => `
    <article class="glass-card metric-card ${index === 2 ? "accent-card" : ""}">
      <span class="mini-label">${item.label}</span>
      <strong>${item.value}</strong>
      <p>${item.note}</p>
    </article>
  `).join("");

  const weeklySessions = state.studySessions.filter((session) => new Date(session.date).getTime() >= Date.now() - (7 * 24 * 60 * 60 * 1000));
  const studyBySubject = state.subjects.map((subject) => ({
    subject,
    seconds: weeklySessions.filter((session) => session.subjectId === subject.id).reduce((sum, session) => sum + session.duration, 0)
  }));
  const maxStudy = Math.max(...studyBySubject.map((item) => item.seconds), 1);
  elements.studyChart.innerHTML = studyBySubject.length ? studyBySubject.map((item) => `
    <article class="chart-row">
      <div class="chart-head"><strong>${item.subject.name}</strong><span>${formatDuration(item.seconds)}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(item.seconds / maxStudy) * 100}%; background:linear-gradient(90deg, ${item.subject.color}, rgba(142,231,216,0.95));"></div></div>
    </article>
  `).join("") : '<div class="empty-state">Cadastre disciplinas para ver o gráfico de estudos.</div>';

  elements.gradeChart.innerHTML = state.subjects.length ? state.subjects.map((subject) => {
    const average = averageFromAssessments(subject.assessments);
    return `
      <article class="chart-row">
        <div class="chart-head"><strong>${subject.name}</strong><span>${average ? average.toFixed(1) : "0.0"}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min((average / 10) * 100, 100)}%; background:linear-gradient(90deg, ${subject.color}, rgba(75,134,245,0.95));"></div></div>
      </article>
    `;
  }).join("") : '<div class="empty-state">Cadastre disciplinas para ver o gráfico de médias.</div>';

  const doneTasks = state.tasks.filter((task) => task.status === "done").length;
  const pendingTasks = state.tasks.length - doneTasks;
  const doneAngle = state.tasks.length ? Math.round((doneTasks / state.tasks.length) * 360) : 0;
  elements.taskChart.innerHTML = `
    <div class="task-ring">
      <div class="ring-visual" style="--done-angle:${doneAngle}deg"><div class="ring-inner">${state.tasks.length}</div></div>
      <div class="task-legend">
        <span class="pill success">Concluídas: ${doneTasks}</span>
        <span class="pill warning">Pendentes: ${pendingTasks}</span>
      </div>
    </div>
  `;

  const sessions = [...state.studySessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  elements.studySessionList.innerHTML = sessions.length ? sessions.map((session) => `
    <article class="list-card">
      <strong>${subjectById(session.subjectId)?.name || "Sessão livre"}</strong>
      <span class="list-meta">${formatDate(session.date, { dateStyle: "short", timeStyle: "short" })}</span>
      <span class="list-meta">${formatDuration(session.duration)}</span>
    </article>
  `).join("") : '<div class="empty-state">Nenhuma sessão registrada ainda.</div>';
}

function renderTimer() {
  const minutes = Math.floor(app.timerSecondsLeft / 60);
  const seconds = app.timerSecondsLeft % 60;
  elements.studyTimer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  elements.timerToggle.textContent = app.timerRunning ? "Parar" : "Iniciar";
}

function completeStudySession(duration) {
  if (duration <= 0) return;
  state.studySessions.push({ id: uid("session"), subjectId: app.timerSubjectId || "", duration, date: new Date().toISOString() });
  saveState();
  renderAll();
}

function startTimer() {
  if (app.timerRunning) return;
  app.timerRunning = true;
  app.timerSubjectId = elements.studySubjectSelect.value || "";
  app.timerInterval = window.setInterval(() => {
    app.timerSecondsLeft -= 1;
    renderTimer();
    if (app.timerSecondsLeft <= 0) {
      stopTimer(true);
      app.timerSecondsLeft = TIMER_SECONDS;
      renderTimer();
    }
  }, 1000);
  renderTimer();
}

function stopTimer(completed = false) {
  if (!app.timerRunning) return;
  window.clearInterval(app.timerInterval);
  app.timerRunning = false;
  const elapsed = completed ? TIMER_SECONDS : TIMER_SECONDS - app.timerSecondsLeft;
  if (elapsed > 0) completeStudySession(elapsed);
  renderTimer();
}

function resetTimer() {
  if (app.timerRunning) stopTimer(false);
  app.timerSecondsLeft = TIMER_SECONDS;
  renderTimer();
}

function renderStudyHistoryPreview() {
  const sessions = [...state.studySessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  elements.studyHistoryPreview.innerHTML = sessions.length ? sessions.map((session) => `
    <article class="list-card">
      <strong>${subjectById(session.subjectId)?.name || "Sessão livre"}</strong>
      <span class="list-meta">${formatDuration(session.duration)} • ${formatDate(session.date, { dateStyle: "short", timeStyle: "short" })}</span>
    </article>
  `).join("") : '<div class="empty-state">Nenhuma sessão concluída.</div>';
}

function renderProfile() {
  elements.profileName.value = state.profile.name || "";
  elements.profileCourse.value = state.profile.course || "";
  elements.profileUniversity.value = state.profile.university || "";

  const photoMarkup = state.profile.photo
    ? `<img class="profile-avatar" src="${state.profile.photo}" alt="Foto do perfil">`
    : `<div class="profile-avatar-placeholder">${profileInitial()}</div>`;

  elements.profilePreview.innerHTML = `
    <div class="profile-preview-head">
      ${photoMarkup}
      <div class="profile-meta">
        <span class="mini-label">Studium</span>
        <h3>${state.profile.name || "Seu nome"}</h3>
        <p>${state.profile.course || "Seu curso"}</p>
        <p>${state.profile.university || "Sua universidade"}</p>
      </div>
    </div>
    <div class="list-card">
      <strong>Matérias ativas</strong>
      <span class="list-meta">${state.subjects.length ? `${state.subjects.length} cadastrada(s)` : "Nenhuma cadastrada ainda."}</span>
    </div>
    <div class="list-card">
      <strong>Compartilhamento</strong>
      <span class="list-meta">Gere uma imagem com o perfil em um cartão visual da plataforma.</span>
    </div>
  `;

  elements.profileSubjects.innerHTML = state.subjects.length
    ? state.subjects.map((subject) => `<span class="pill">${subject.name}</span>`).join("")
    : '<div class="empty-state">As matérias cadastradas aparecerão aqui.</div>';
}

function toggleOnboarding() {
  elements.onboardingModal.hidden = hasProfile();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function processProfilePhoto(file) {
  const raw = await readFileAsDataURL(file);
  if (!raw) return "";

  const image = await loadImage(raw);
  if (!image) return "";

  const maxSize = 512;
  const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function shareProfileCard() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#eef5fd");
  gradient.addColorStop(0.55, "#dfeaf7");
  gradient.addColorStop(1, "#e8f4f1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const orbA = ctx.createRadialGradient(250, 140, 0, 250, 140, 220);
  orbA.addColorStop(0, "rgba(75, 134, 245, 0.32)");
  orbA.addColorStop(1, "rgba(75, 134, 245, 0)");
  ctx.fillStyle = orbA;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const orbB = ctx.createRadialGradient(1120, 160, 0, 1120, 160, 240);
  orbB.addColorStop(0, "rgba(142, 231, 216, 0.28)");
  orbB.addColorStop(1, "rgba(142, 231, 216, 0)");
  ctx.fillStyle = orbB;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cardX = 110;
  const cardY = 110;
  const cardW = 1180;
  const cardH = 680;
  ctx.fillStyle = "rgba(255,255,255,0.48)";
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 42);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#244b95";
  ctx.font = "700 28px 'Space Grotesk', sans-serif";
  ctx.fillText("Studium", cardX + 56, cardY + 70);
  ctx.fillStyle = "#61748d";
  ctx.font = "600 18px 'Manrope', sans-serif";
  ctx.fillText("Painel pessoal do estudante", cardX + 56, cardY + 102);

  const image = await loadImage(state.profile.photo);
  const avatarX = cardX + 58;
  const avatarY = cardY + 150;
  const avatarSize = 180;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 36);
  ctx.clip();
  if (image) {
    ctx.drawImage(image, avatarX, avatarY, avatarSize, avatarSize);
  } else {
    const avatarGradient = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
    avatarGradient.addColorStop(0, "#4b86f5");
    avatarGradient.addColorStop(1, "#8ee7d8");
    ctx.fillStyle = avatarGradient;
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = "#f6fbff";
    ctx.font = "700 84px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(profileInitial(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 6);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  ctx.fillStyle = "#14253d";
  ctx.font = "700 58px 'Space Grotesk', sans-serif";
  ctx.fillText(state.profile.name || "Seu nome", cardX + 290, cardY + 220);
  ctx.fillStyle = "#4b86f5";
  ctx.font = "700 26px 'Manrope', sans-serif";
  ctx.fillText(state.profile.course || "Seu curso", cardX + 292, cardY + 268);
  ctx.fillStyle = "#61748d";
  ctx.font = "600 24px 'Manrope', sans-serif";
  ctx.fillText(state.profile.university || "Sua universidade", cardX + 292, cardY + 312);

  ctx.fillStyle = "rgba(20,37,61,0.08)";
  ctx.beginPath();
  ctx.roundRect(cardX + 54, cardY + 382, 1072, 190, 28);
  ctx.fill();

  ctx.fillStyle = "#244b95";
  ctx.font = "700 22px 'Space Grotesk', sans-serif";
  ctx.fillText("Materias cursadas", cardX + 84, cardY + 426);

  const subjectNames = state.subjects.map((subject) => subject.name).slice(0, 8);
  ctx.font = "600 20px 'Manrope', sans-serif";
  let pillX = cardX + 84;
  let pillY = cardY + 470;
  subjectNames.forEach((name) => {
    const width = Math.min(ctx.measureText(name).width + 38, 280);
    if (pillX + width > cardX + 1040) {
      pillX = cardX + 84;
      pillY += 58;
    }
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, width, 40, 20);
    ctx.fill();
    ctx.fillStyle = "#14253d";
    ctx.fillText(name, pillX + 18, pillY + 26);
    pillX += width + 14;
  });

  if (!subjectNames.length) {
    ctx.fillStyle = "#61748d";
    ctx.fillText("Nenhuma materia cadastrada ainda.", cardX + 84, pillY + 26);
  }

  ctx.fillStyle = "#61748d";
  ctx.font = "600 18px 'Manrope', sans-serif";
  ctx.fillText("Criado com Studium", cardX + 56, cardY + 622);
  ctx.fillText("Criador: Daniel Delfino", cardX + 56, cardY + 654);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "studium-perfil.png";
  link.click();
}

function renderSettings() {
  elements.semesterStart.value = state.settings.semester.start || "";
  elements.semesterEnd.value = state.settings.semester.end || "";
}

function renderAll() {
  const currentStatus = elements.taskFilterStatus.value || "all";
  const currentSubject = elements.taskFilterSubject.value || "all";
  const currentSort = elements.taskSort.value || "due-asc";
  populateSubjectOptions();
  populateStatusFilter();
  elements.taskFilterStatus.value = currentStatus;
  if ([...elements.taskFilterSubject.options].some((option) => option.value === currentSubject)) elements.taskFilterSubject.value = currentSubject;
  elements.taskSort.value = currentSort;
  renderMetrics();
  renderAlertList();
  renderDashboardLists();
  renderWeeklySummary();
  renderSubjectList();
  renderCalendar();
  renderEventList();
  renderTaskList();
  renderStats();
  renderTimer();
  renderStudyHistoryPreview();
  renderProfile();
  renderSettings();
  syncTopbarProfile();
  syncMobileNavLabels();
  toggleOnboarding();
}

elements.navItems.forEach((item) => item.addEventListener("click", () => setActiveScreen(item.dataset.screen)));
document.querySelectorAll("[data-mobile-hub-screen]").forEach((button) => {
  button.addEventListener("click", () => setActiveScreen(button.dataset.mobileHubScreen));
});
elements.themeChoices.forEach((button) => button.addEventListener("click", () => applyTheme(button.dataset.themeChoice)));
elements.themeToggleButton.addEventListener("click", () => applyTheme(state.settings.theme === "dark" ? "light" : "dark"));

elements.profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedPhoto = elements.profilePhoto.files?.[0];
  state.profile.name = elements.profileName.value.trim();
  state.profile.course = elements.profileCourse.value.trim();
  state.profile.university = elements.profileUniversity.value.trim();
  if (selectedPhoto) {
    state.profile.photo = await processProfilePhoto(selectedPhoto);
  }
  try {
    saveState();
    renderAll();
  } catch (error) {
    window.alert("Nao foi possivel salvar a foto do perfil. Tente uma imagem menor.");
  }
});

elements.profilePhoto.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  state.profile.photo = await processProfilePhoto(file);
  try {
    saveState();
    renderAll();
  } catch (error) {
    window.alert("Nao foi possivel salvar a foto do perfil. Tente uma imagem menor.");
  }
});

elements.shareProfile.addEventListener("click", () => {
  shareProfileCard().catch(() => window.alert("Nao foi possivel gerar o cartao do perfil."));
});

elements.onboardingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.profile.name = elements.onboardingName.value.trim();
  state.profile.course = elements.onboardingCourse.value.trim();
  state.profile.university = elements.onboardingUniversity.value.trim();
  saveState();
  renderAll();
});

elements.subjectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = {
    id: elements.subjectId.value || uid("subject"),
    name: elements.subjectName.value.trim(),
    professor: elements.subjectProfessor.value.trim(),
    color: elements.subjectColor.value,
    attendance: elements.subjectAttendance.value.trim(),
    notes: elements.subjectNotes.value.trim(),
    resources: [],
    assessments: []
  };
  const index = state.subjects.findIndex((subject) => subject.id === payload.id);
  if (index >= 0) {
    payload.resources = state.subjects[index].resources;
    payload.assessments = state.subjects[index].assessments;
    state.subjects[index] = payload;
  } else {
    state.subjects.unshift(payload);
  }
  app.selectedSubjectId = payload.id;
  resetSubjectForm();
  saveState();
  renderAll();
});

elements.subjectFormReset.addEventListener("click", resetSubjectForm);

elements.eventForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = {
    id: elements.eventId.value || uid("event"),
    title: elements.eventTitle.value.trim(),
    type: elements.eventType.value,
    date: new Date(elements.eventDate.value).toISOString(),
    subjectId: elements.eventSubject.value
  };
  const index = state.events.findIndex((item) => item.id === payload.id);
  if (index >= 0) state.events[index] = payload;
  else state.events.push(payload);
  elements.eventForm.reset();
  elements.eventId.value = "";
  saveState();
  renderAll();
});

elements.eventFormReset.addEventListener("click", () => {
  elements.eventForm.reset();
  elements.eventId.value = "";
});

elements.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = {
    id: elements.taskId.value || uid("task"),
    title: elements.taskTitle.value.trim(),
    description: elements.taskDescription.value.trim(),
    dueDate: new Date(elements.taskDueDate.value).toISOString(),
    priority: elements.taskPriority.value,
    subjectId: elements.taskSubject.value,
    status: elements.taskStatus.value
  };
  const index = state.tasks.findIndex((item) => item.id === payload.id);
  if (index >= 0) state.tasks[index] = payload;
  else state.tasks.push(payload);
  elements.taskForm.reset();
  elements.taskId.value = "";
  saveState();
  renderAll();
});

elements.taskFormReset.addEventListener("click", () => {
  elements.taskForm.reset();
  elements.taskId.value = "";
});

[elements.taskFilterStatus, elements.taskFilterSubject, elements.taskSort].forEach((select) => select.addEventListener("change", renderTaskList));
elements.calendarPrev.addEventListener("click", () => {
  app.calendarDate.setMonth(app.calendarDate.getMonth() - 1);
  renderCalendar();
});
elements.calendarNext.addEventListener("click", () => {
  app.calendarDate.setMonth(app.calendarDate.getMonth() + 1);
  renderCalendar();
});
elements.timerToggle.addEventListener("click", () => app.timerRunning ? stopTimer(false) : startTimer());
elements.timerReset.addEventListener("click", resetTimer);

elements.semesterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings.semester = { start: elements.semesterStart.value, end: elements.semesterEnd.value };
  saveState();
  renderAll();
});

elements.exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "studium-backup.json";
  link.click();
  URL.revokeObjectURL(url);
});

elements.importData.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    state.settings = { theme: imported.settings?.theme || "light", semester: imported.settings?.semester || semesterDefaults() };
    state.profile = imported.profile || { name: "", course: "", university: "", photo: "" };
    state.subjects = Array.isArray(imported.subjects) ? imported.subjects : [];
    state.tasks = Array.isArray(imported.tasks) ? imported.tasks : [];
    state.events = Array.isArray(imported.events) ? imported.events : [];
    state.studySessions = Array.isArray(imported.studySessions) ? imported.studySessions : [];
    app.selectedSubjectId = state.subjects[0]?.id || null;
    saveState();
    applyTheme(state.settings.theme);
    renderAll();
  } catch (error) {
    window.alert("Não foi possível importar esse arquivo JSON.");
  } finally {
    event.target.value = "";
  }
});

elements.resetData.addEventListener("click", () => {
  if (!window.confirm("Deseja apagar todos os dados locais do Studium?")) return;
  const fresh = createEmptyState();
  state.settings = fresh.settings;
  state.profile = fresh.profile;
  state.subjects = fresh.subjects;
  state.tasks = fresh.tasks;
  state.events = fresh.events;
  state.studySessions = fresh.studySessions;
  app.selectedSubjectId = state.subjects[0]?.id || null;
  app.calendarDate = new Date();
  resetTimer();
  saveState();
  applyTheme(state.settings.theme);
  renderAll();
});

applyTheme(state.settings.theme);
setActiveScreen(app.activeScreen);
renderAll();
