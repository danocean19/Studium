const UI_KIT_THEME_KEY = "ui-kit-theme";

const uiKit = {
  navItems: document.querySelectorAll(".nav-item"),
  screens: document.querySelectorAll(".screen"),
  screenTitle: document.querySelector("#screen-title"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeChoices: document.querySelectorAll("[data-theme-choice]"),
  financeSwitchButtons: document.querySelectorAll("[data-finance-screen]")
};

let uiKitTheme = localStorage.getItem(UI_KIT_THEME_KEY) || "light";
let uiKitActiveScreen = "home";

function uiKitApplyTheme(theme) {
  uiKitTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = uiKitTheme;
  localStorage.setItem(UI_KIT_THEME_KEY, uiKitTheme);
  uiKit.themeChoices.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.themeChoice === uiKitTheme);
  });
}

function uiKitSetActiveScreen(screen) {
  uiKitActiveScreen = screen;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  uiKit.navItems.forEach((item) => {
    const isFinanceProxy = isMobile && (screen === "accounts" || screen === "income") && item.dataset.screen === "accounts";
    item.classList.toggle("is-active", item.dataset.screen === screen || isFinanceProxy);
  });

  uiKit.financeSwitchButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.financeScreen === screen);
  });

  uiKit.screens.forEach((node) => {
    node.classList.toggle("is-active", node.id === `screen-${screen}`);
  });

  const titles = {
    home: "Home",
    accounts: "Contas",
    income: "Rendas",
    expenses: "Gastos",
    reports: "Relatórios",
    profile: "Perfil"
  };

  if (uiKit.screenTitle) {
    uiKit.screenTitle.textContent = titles[screen] || "Home";
  }

  uiKit.themeToggle?.classList.toggle("is-hidden", !(screen === "home" || screen === "profile"));
  window.scrollTo({ top: 0, behavior: isMobile ? "auto" : "smooth" });
}

uiKit.navItems.forEach((item) => {
  item.addEventListener("click", () => uiKitSetActiveScreen(item.dataset.screen));
});

uiKit.financeSwitchButtons.forEach((button) => {
  button.addEventListener("click", () => uiKitSetActiveScreen(button.dataset.financeScreen));
});

uiKit.themeChoices.forEach((button) => {
  button.addEventListener("click", () => uiKitApplyTheme(button.dataset.themeChoice));
});

uiKitApplyTheme(uiKitTheme);
uiKitSetActiveScreen(uiKitActiveScreen);
