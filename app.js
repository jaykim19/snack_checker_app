const HISTORY_KEY = "snack_history";
const SETTINGS_KEY = "snack_settings";
const PERIOD_DEFAULT = 7;
const MAX_DAILY_SNACK_COUNT = 20;
const MAX_DAILY_GOAL = 10;
const SPLASH_SEEN_SESSION_KEY = "snack_splash_seen_session";
const GREETING_REFRESH_INTERVAL_MS = 30 * 1000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const KST_WEEKDAY_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  weekday: "short",
});
const CHARACTER_TYPES = ["cat", "hamster", "dog", "joy", "kai"];
const DEFAULT_SETTINGS = {
  dailyGoal: 3,
  characterType: "cat",
  theme: "light",
};

const state = {
  period: PERIOD_DEFAULT,
  history: loadSnackHistory(),
  settings: loadSnackSettings(),
};
let greetingAutoRefreshTimerId = null;
let lastRenderedGreetingMessage = "";
let lastRenderedDateKey = "";

const levelMessages = {
  0: "오늘은 아직 간식 전이에요.",
  1: "가볍게 하나 먹었어요.",
  2: "간식 타임이 즐거웠나요?",
  3: "오늘은 꽤 먹었네요.",
  4: "이제 그만 먹어도 되지 않을까요?",
  5: "더 먹으면 위험해요!!",
  6: "살이 찌고 싶으시군요!",
  7: "에휴.. 포기합니다! 마음껏 드세요!!",
};
const MAX_DEFINED_MESSAGE_LEVEL = Math.max(
  0,
  ...Object.keys(levelMessages)
    .map((key) => Number.parseInt(key, 10))
    .filter((level) => Number.isFinite(level))
);
const MAX_AVAILABLE_IMAGE_LEVEL = 5;

const characterPalettes = {
  cat: ["#f6d9bc", "#f4d1b2", "#f3c8a6", "#efbd97", "#e8af87", "#df9f76"],
  hamster: ["#f0cf9e", "#ecc692", "#e8ba84", "#e2ac76", "#d79e69", "#ca905a"],
  dog: ["#d7bfaa", "#ceb49e", "#c4a992", "#bb9d84", "#ad8f75", "#9e8066"],
};

const characterLabels = {
  cat: "고양이",
  hamster: "햄스터",
  dog: "초코푸들",
  joy: "조이",
  kai: "카이",
};

const CAT_IMAGE_LEVEL_THRESHOLDS = [
  { minCount: 0, level: 1 },
  { minCount: 2, level: 2 },
  { minCount: 4, level: 3 },
  { minCount: 6, level: 4 },
  { minCount: 8, level: 5 },
  { minCount: 10, level: 6 },
  { minCount: 12, level: 7 },
];

const HAMSTER_IMAGE_LEVEL_THRESHOLDS = [
  { minCount: 0, level: 1 },
  { minCount: 2, level: 2 },
  { minCount: 4, level: 3 },
  { minCount: 6, level: 4 },
  { minCount: 8, level: 5 },
  { minCount: 10, level: 6 },
  { minCount: 12, level: 7 },
];

const PUDDLE_IMAGE_LEVEL_THRESHOLDS = [
  { minCount: 0, level: 1 },
  { minCount: 2, level: 2 },
  { minCount: 4, level: 3 },
  { minCount: 6, level: 4 },
  { minCount: 8, level: 5 },
  { minCount: 10, level: 6 },
  { minCount: 12, level: 7 },
];

const JOY_IMAGE_LEVEL_THRESHOLDS = [
  { minCount: 0, level: 1 },
  { minCount: 2, level: 2 },
  { minCount: 4, level: 3 },
  { minCount: 6, level: 4 },
  { minCount: 8, level: 5 },
  { minCount: 10, level: 6 },
  { minCount: 12, level: 7 },
];

const KAI_IMAGE_LEVEL_THRESHOLDS = [
  { minCount: 0, level: 1 },
  { minCount: 2, level: 2 },
  { minCount: 4, level: 3 },
  { minCount: 6, level: 4 },
  { minCount: 8, level: 5 },
  { minCount: 10, level: 6 },
  { minCount: 12, level: 7 },
];

const mainView = document.getElementById("mainView");
const historyView = document.getElementById("historyView");
const settingsView = document.getElementById("settingsView");
const aboutView = document.getElementById("aboutView");
const historyChart = document.getElementById("historyChart");
const splashView = document.getElementById("splashView");
const appShell = document.getElementById("appShell");
const mainGreetingTitle = document.getElementById("mainGreetingTitle");

const todayLabel = document.getElementById("todayLabel");
const countLabel = document.getElementById("countLabel");
const snackMessage = document.getElementById("snackMessage");
const characterImage = document.getElementById("characterImage");
const decreaseBtn = document.getElementById("decreaseBtn");

const totalCount = document.getElementById("totalCount");
const avgCount = document.getElementById("avgCount");
const maxDay = document.getElementById("maxDay");
const minDay = document.getElementById("minDay");

const dailyGoalInput = document.getElementById("dailyGoalInput");
const characterTypeSelect = document.getElementById("characterTypeSelect");
const themeSelect = document.getElementById("themeSelect");
const settingsStatus = document.getElementById("settingsStatus");
const settingsCharacterPreview = document.getElementById("settingsCharacterPreview");

const periodButtons = Array.from(document.querySelectorAll(".period-btn"));

bindEvents();
applyTheme();
renderMain();
startGreetingAutoRefresh();
runSplashIntro();

function bindEvents() {
  document.getElementById("increaseBtn").addEventListener("click", () => updateTodayCount(1));
  document.getElementById("decreaseBtn").addEventListener("click", () => updateTodayCount(-1));
  document.getElementById("resetBtn").addEventListener("click", resetTodayCount);
  document.getElementById("infoBtn")?.addEventListener("click", () => {
    setActiveView("about");
  });
  dailyGoalInput.max = String(MAX_DAILY_GOAL);
  dailyGoalInput.addEventListener("input", normalizeDailyGoalInputValue);

  document.getElementById("goHistoryBtn").addEventListener("click", () => {
    setActiveView("history");
    renderHistory();
  });
  document.getElementById("goSettingsBtn").addEventListener("click", () => {
    setActiveView("settings");
    renderSettings();
  });
  document.getElementById("backBtn").addEventListener("click", () => {
    setActiveView("main");
    renderMain();
  });
  document.getElementById("backFromSettingsBtn").addEventListener("click", () => {
    setActiveView("main");
    renderMain();
  });
  document.getElementById("backFromAboutBtn")?.addEventListener("click", () => {
    setActiveView("main");
    renderMain();
  });

  periodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.period = Number(button.dataset.days);
      periodButtons.forEach((btn) => btn.classList.remove("period-active"));
      button.classList.add("period-active");
      renderHistory();
    });
  });

  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettingsFromForm);
  document.getElementById("clearAllBtn").addEventListener("click", clearAllHistory);
  characterTypeSelect.addEventListener("change", () => {
    updateSettingsCharacterPreview(characterTypeSelect.value);
  });
}

function runSplashIntro() {
  if (!splashView || !appShell) {
    return;
  }

  if (hasSeenSplashInSession()) {
    splashView.classList.add("splash-hidden");
    appShell.classList.remove("app-shell-hidden");
    return;
  }

  let isSplashDismissing = false;

  const dismissSplash = () => {
    if (isSplashDismissing || splashView.classList.contains("splash-hidden")) {
      return;
    }
    isSplashDismissing = true;
    splashView.classList.add("splash-closing");
    appShell.classList.remove("app-shell-hidden");

    let isSplashDismissFinalized = false;
    const finalizeSplashDismiss = () => {
      if (isSplashDismissFinalized) {
        return;
      }
      isSplashDismissFinalized = true;
      splashView.classList.remove("splash-closing");
      splashView.classList.add("splash-hidden");
      markSplashSeenInSession();
    };

    splashView.addEventListener("transitionend", (event) => {
      if (event.propertyName === "opacity") {
        finalizeSplashDismiss();
      }
    }, { once: true });

    // Fallback for browsers that may skip transitionend in edge cases.
    window.setTimeout(finalizeSplashDismiss, 2000);
  };

  splashView.addEventListener("pointerdown", dismissSplash, { once: true });
}

function hasSeenSplashInSession() {
  try {
    return sessionStorage.getItem(SPLASH_SEEN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSplashSeenInSession() {
  try {
    sessionStorage.setItem(SPLASH_SEEN_SESSION_KEY, "1");
  } catch {
    // sessionStorage 접근이 제한된 환경에서는 기본 동작(스플래시 표시)을 유지합니다.
  }
}

function saveSettingsFromForm() {
  normalizeDailyGoalInputValue();
  state.settings = {
    dailyGoal: clampNumber(Number(dailyGoalInput.value || 0), 0, MAX_DAILY_GOAL),
    characterType: sanitizeCharacterType(characterTypeSelect.value),
    theme: themeSelect.value === "dark" ? "dark" : "light",
  };

  if (!saveSnackSettings()) {
    settingsStatus.textContent = "저장 공간 접근이 제한되어 설정이 임시로만 적용돼요.";
    applyTheme();
    renderMain();
    return;
  }
  applyTheme();
  renderMain();
  settingsStatus.textContent = "설정 저장 완료";
}

function clearAllHistory() {
  if (!window.confirm("모든 날짜의 간식 기록을 삭제할까요?")) {
    return;
  }
  state.history = {};
  saveSnackHistory();
  renderMain();
  renderHistory();
  settingsStatus.textContent = "전체 기록을 초기화했어요.";
}

function setActiveView(name) {
  [mainView, historyView, settingsView, aboutView].forEach((view) => view?.classList.remove("view-active"));
  let activeView = mainView;
  const shouldLockScroll = name === "about";
  document.body.classList.toggle("view-scroll-locked", shouldLockScroll);
  if (name === "history") {
    historyView.classList.add("view-active");
    activeView = historyView;
  } else if (name === "settings") {
    settingsView.classList.add("view-active");
    activeView = settingsView;
  } else if (name === "about") {
    aboutView?.classList.add("view-active");
    activeView = aboutView;
  } else {
    mainView.classList.add("view-active");
    activeView = mainView;
  }
  resetScrollToTop(activeView);
}

function resetScrollToTop(view) {
  if (view && typeof view.scrollTop === "number") {
    view.scrollTop = 0;
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function resetTodayCount() {
  if (!window.confirm("오늘 기록을 0으로 초기화할까요?")) {
    return;
  }
  state.history[getKSTDateKey()] = 0;
  persistAndRender();
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function sanitizeCharacterType(type) {
  return CHARACTER_TYPES.includes(type) ? type : DEFAULT_SETTINGS.characterType;
}

function getKSTDateKey(date = new Date()) {
  const { year, month, day } = getKSTDateParts(date);
  return `${year}-${month}-${day}`;
}

function getKSTDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function getCharacterLevel(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  return clampNumber(safeCount, 0, MAX_DEFINED_MESSAGE_LEVEL);
}

function loadSnackHistory() {
  const parsed = readStorageJson(HISTORY_KEY);
  return sanitizeHistoryObject(parsed);
}

function saveSnackHistory() {
  state.history = sanitizeHistoryObject(state.history);
  return writeStorageJson(HISTORY_KEY, state.history);
}

function loadSnackSettings() {
  const parsed = readStorageJson(SETTINGS_KEY);
  return sanitizeSettingsObject(parsed);
}

function saveSnackSettings() {
  state.settings = sanitizeSettingsObject(state.settings);
  return writeStorageJson(SETTINGS_KEY, state.settings);
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.settings.theme);
}

function getTodayCount() {
  return sanitizeSnackCount(state.history[getKSTDateKey()] || 0);
}

function updateTodayCount(delta) {
  const today = getKSTDateKey();
  const currentCount = sanitizeSnackCount(state.history[today] || 0);
  const nextCount = clampNumber(currentCount + delta, 0, MAX_DAILY_SNACK_COUNT);
  state.history[today] = nextCount;
  persistAndRender();
}

function persistAndRender() {
  saveSnackHistory();
  renderMain();
  if (historyView.classList.contains("view-active")) {
    renderHistory();
  }
}

function renderMain() {
  const todayKey = getKSTDateKey();
  const count = sanitizeSnackCount(state.history[todayKey] || 0);
  const level = getCharacterLevel(count);
  const type = state.settings.characterType;
  const goalToken = `목표(${state.settings.dailyGoal}회)`;
  const greetingMessage = getTimeBasedGreetingMessage();
  const goalMessage =
    count <= state.settings.dailyGoal
      ? `${goalToken} 안에서 기록 중이에요.`
      : `오늘 ${goalToken}를 넘겼어요. 출렁대는 지방을 보세요!!!`;

  lastRenderedGreetingMessage = greetingMessage;
  if (mainGreetingTitle) {
    mainGreetingTitle.textContent = greetingMessage;
  }
  todayLabel.textContent = `${getKSTDateLabel()} · ${characterLabels[type]}`;
  countLabel.textContent = `${count}회`;
  snackMessage.innerHTML = `${escapeHtml(levelMessages[level])}<br>${highlightGoalToken(goalMessage, goalToken)}`;
  characterImage.src = buildCharacterSvgDataUri(count, type);
  characterImage.alt = `${characterLabels[type]} 캐릭터`;
  decreaseBtn.disabled = count === 0;
  document.getElementById("increaseBtn").disabled = count >= MAX_DAILY_SNACK_COUNT;
  lastRenderedDateKey = todayKey;
}

function startGreetingAutoRefresh() {
  if (!mainGreetingTitle) {
    return;
  }
  if (greetingAutoRefreshTimerId !== null) {
    window.clearInterval(greetingAutoRefreshTimerId);
  }
  refreshMainTimeSensitiveUiIfNeeded();
  greetingAutoRefreshTimerId = window.setInterval(
    refreshMainTimeSensitiveUiIfNeeded,
    GREETING_REFRESH_INTERVAL_MS
  );
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshMainTimeSensitiveUiIfNeeded();
    }
  });
}

function refreshMainTimeSensitiveUiIfNeeded() {
  const currentDateKey = getKSTDateKey();
  if (currentDateKey !== lastRenderedDateKey) {
    initializeTodayHistoryIfMissing(currentDateKey);
    renderMain();
    if (historyView.classList.contains("view-active")) {
      renderHistory();
    }
    return;
  }
  refreshGreetingMessageIfNeeded();
}

function initializeTodayHistoryIfMissing(todayKey) {
  if (Object.prototype.hasOwnProperty.call(state.history, todayKey)) {
    return;
  }
  state.history[todayKey] = 0;
  saveSnackHistory();
}

function refreshGreetingMessageIfNeeded() {
  if (!mainGreetingTitle) {
    return;
  }
  const nextGreetingMessage = getTimeBasedGreetingMessage();
  if (nextGreetingMessage === lastRenderedGreetingMessage && mainGreetingTitle.textContent === nextGreetingMessage) {
    return;
  }
  mainGreetingTitle.textContent = nextGreetingMessage;
  lastRenderedGreetingMessage = nextGreetingMessage;
}

function highlightGoalToken(message, goalToken) {
  const escapedMessage = escapeHtml(message);
  const escapedToken = escapeHtml(goalToken);
  return escapedMessage.replace(escapedToken, `<span class="goal-token">${escapedToken}</span>`);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTimeBasedGreetingMessage() {
  const kstHour = getKSTHour();
  if (kstHour >= 0 && kstHour < 6) {
    return "지금은 새벽이에요.\n어서 주무세요!!";
  } else if (kstHour >= 6 && kstHour < 11) {
    return "좋은 아침입니다.\n상쾌하게 하루를 시작해보아요!!";
  } else if(kstHour >= 11 && kstHour < 13) {
    return "점심시간이네요. \n건강한 식단으로 챙겨드세요!!";
  } else if(kstHour >= 13 && kstHour < 18) {
    return "좋은 오후입니다!\n조금만 더 힘을 내보아요!!"
  } else if (kstHour >= 18 && kstHour < 20) {
    return "고생 많으셨어요. \n오늘 하루도 푹 쉬세요!!";
  }

  return "좋은 저녁입니다.\n오늘 하루도 잘 마무리 하세요!!";
}

function getKSTHour() {
  const now = new Date();
  const kstHourText = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hour12: false,
  }).format(now);
  return clampNumber(Number.parseInt(kstHourText, 10), 0, 23);
}

function buildCharacterSvgDataUri(count, rawType) {
  const type = sanitizeCharacterType(rawType);
  if (type === "cat") {
    return getCatImagePathByCount(count);
  }
  if (type === "hamster") {
    return getHamsterImagePathByCount(count);
  }
  if (type === "dog") {
    return getPuddleImagePathByCount(count);
  }
  if (type === "joy") {
    return getJoyImagePathByCount(count);
  }
  if (type === "kai") {
    return getKaiImagePathByCount(count);
  }
  const palette = characterPalettes[type];
  const level = getCharacterLevel(count);
  const { baseLevel, nextLevel, ratio } = getGrowthStage(count);
  const fur = mixHexColor(palette[baseLevel], palette[nextLevel], ratio);
  const furDark = shadeColor(fur, -16);
  const furLight = shadeColor(fur, 20);
  const bodyMorph = getBodyMorphByCount(count);
  const badge = `${Math.max(0, Number(count) || 0)}회`;
  const headRx = 56 + bodyMorph.headScale * 9;
  const headRy = 50 + bodyMorph.headScale * 8;
  const headY = 120 - bodyMorph.growth * 8;
  const bodyRx = 72 + bodyMorph.bodyScaleX * 22;
  const bodyRy = 84 + bodyMorph.bodyScaleY * 30;
  const bodyY = 250 + bodyMorph.growth * 10;
  const bellyRx = 30 + bodyMorph.bellyScale * 16;
  const bellyRy = 24 + bodyMorph.bellyScale * 14;
  const background = type === "dog" ? "#f4eee8" : type === "hamster" ? "#fff2df" : "#fff3e8";
  const expression = getExpressionByCount(count, headY);

  const typeFragments = {
    cat: {
      ears: `
        <g>
          <path d="M112 105 L134 54 L156 108 Z" fill="${furDark}" />
          <path d="M205 108 L226 55 L248 105 Z" fill="${furDark}" />
          <path d="M122 102 L134 73 L147 104 Z" fill="#ffd8cb" />
          <path d="M214 104 L226 73 L238 102 Z" fill="#ffd8cb" />
        </g>
      `,
      muzzle: `<ellipse cx="180" cy="${headY + 14}" rx="28" ry="20" fill="#f8e7dd" />`,
      nose: `<path d="M173 ${headY + 12} Q180 ${headY + 20} 187 ${headY + 12} Z" fill="#b66d6d" />`,
      extras: `<path d="M118 ${headY + 11} h34 M118 ${headY + 21} h34 M208 ${headY + 11} h34 M208 ${headY + 21} h34" stroke="#6a4f3a" stroke-width="3" stroke-linecap="round"/>`,
      tail: `<path d="M252 ${bodyY + 26} q44 18 28 47 q-10 15 -30 8" fill="none" stroke="${furDark}" stroke-width="14" stroke-linecap="round"/>`,
    },
    hamster: {
      ears: `
        <g>
          <circle cx="126" cy="88" r="20" fill="${furDark}" />
          <circle cx="234" cy="88" r="20" fill="${furDark}" />
          <circle cx="126" cy="88" r="11" fill="#ffd6c0" />
          <circle cx="234" cy="88" r="11" fill="#ffd6c0" />
        </g>
      `,
      muzzle: `<ellipse cx="180" cy="${headY + 16}" rx="34" ry="24" fill="#f7e5d2" />`,
      nose: `<circle cx="180" cy="${headY + 11}" r="5" fill="#a96856" />`,
      extras: `
        <ellipse cx="138" cy="${headY + 14}" rx="11" ry="8" fill="#f0b3a0" />
        <ellipse cx="222" cy="${headY + 14}" rx="11" ry="8" fill="#f0b3a0" />
      `,
      tail: `<path d="M249 ${bodyY + 30} q28 10 14 28" fill="none" stroke="${shadeColor(furDark, 10)}" stroke-width="8" stroke-linecap="round"/>`,
    },
    dog: {
      ears: `
        <g>
          <ellipse cx="118" cy="${headY + 10}" rx="18" ry="34" fill="${furDark}" />
          <ellipse cx="242" cy="${headY + 10}" rx="18" ry="34" fill="${furDark}" />
        </g>
      `,
      muzzle: `<ellipse cx="180" cy="${headY + 20}" rx="32" ry="20" fill="#f6e4d6" />`,
      nose: `<ellipse cx="180" cy="${headY + 13}" rx="8" ry="6" fill="#3b2c23" />`,
      extras: `<circle cx="158" cy="${headY + 23}" r="3" fill="#e3c1a9"/><circle cx="202" cy="${headY + 23}" r="3" fill="#e3c1a9"/>`,
      tail: `<path d="M252 ${bodyY + 28} q46 8 26 36 q-10 14 -32 6" fill="none" stroke="${furDark}" stroke-width="12" stroke-linecap="round"/>`,
    },
  };

  const selected = typeFragments[type];
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" shape-rendering="geometricPrecision">
  <defs>
    <radialGradient id="gFur" cx="40%" cy="24%">
      <stop offset="0%" stop-color="${furLight}"/>
      <stop offset="100%" stop-color="${fur}"/>
    </radialGradient>
  </defs>
  <rect width="360" height="360" rx="40" fill="${background}"/>
  <ellipse cx="180" cy="324" rx="90" ry="18" fill="#00000018"/>
  <g>
    ${typeFragments[type].tail}
  </g>
  <g>
    <ellipse cx="139" cy="${bodyY + bodyRy - 12}" rx="${14 + bodyMorph.pawScale}" ry="${10 + bodyMorph.pawScale}" fill="${furDark}" />
    <ellipse cx="221" cy="${bodyY + bodyRy - 12}" rx="${14 + bodyMorph.pawScale}" ry="${10 + bodyMorph.pawScale}" fill="${furDark}" />
  ${selected.ears}
  <ellipse cx="180" cy="${bodyY}" rx="${bodyRx}" ry="${bodyRy}" fill="url(#gFur)"/>
  <ellipse cx="180" cy="${bodyY + 10}" rx="${bellyRx}" ry="${bellyRy}" fill="${shadeColor(furLight, 10)}"/>
  <ellipse cx="180" cy="${headY}" rx="${headRx}" ry="${headRy}" fill="url(#gFur)"/>
  <ellipse cx="134" cy="${bodyY - 12}" rx="${13 + bodyMorph.armScale}" ry="${26 + bodyMorph.armScale}" fill="${furDark}" transform="rotate(18 134 ${bodyY - 12})"/>
  <ellipse cx="226" cy="${bodyY - 12}" rx="${13 + bodyMorph.armScale}" ry="${26 + bodyMorph.armScale}" fill="${furDark}" transform="rotate(-18 226 ${bodyY - 12})"/>
  ${expression.brows}
  ${expression.eyes}
  ${selected.muzzle}
  ${selected.nose}
  ${expression.mouth}
  ${selected.extras}
  </g>
  <text x="180" y="338" text-anchor="middle" font-size="20" font-weight="600" fill="#7f624d">${badge}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getHamsterImagePathByCount(count) {
  const imageLevel = getImageLevelByThresholds(count, HAMSTER_IMAGE_LEVEL_THRESHOLDS);
  return `images/characters/hamsters/hamster_lv${imageLevel}.svg`;
}

function getCatImagePathByCount(count) {
  const imageLevel = getImageLevelByThresholds(count, CAT_IMAGE_LEVEL_THRESHOLDS);
  return `images/characters/cats/cat_lv${imageLevel}.svg`;
}

function getPuddleImagePathByCount(count) {
  const imageLevel = getImageLevelByThresholds(count, PUDDLE_IMAGE_LEVEL_THRESHOLDS);
  return `images/characters/puddles/puddle_lv${imageLevel}.svg`;
}

function getJoyImagePathByCount(count) {
  const imageLevel = getImageLevelByThresholds(count, JOY_IMAGE_LEVEL_THRESHOLDS);
  return `images/characters/girls/girl_lv${imageLevel}.png`;
}

function getKaiImagePathByCount(count) {
  const imageLevel = getImageLevelByThresholds(count, KAI_IMAGE_LEVEL_THRESHOLDS);
  return `images/characters/boys/boy_lv${imageLevel}.png`;
}

function getImageLevelByThresholds(count, thresholds) {
  const safeCount = Math.max(0, Number(count) || 0);
  const safeThresholds = Array.isArray(thresholds) ? thresholds : [];
  if (safeCount >= 8) {
    return MAX_AVAILABLE_IMAGE_LEVEL;
  }
  const maxDefinedImageLevel =
    safeThresholds.length > 0
      ? Math.max(
          1,
          ...safeThresholds
            .map((rule) => Number(rule?.level))
            .filter((level) => Number.isFinite(level))
        )
      : 1;
  const cappedMaxImageLevel = Math.min(maxDefinedImageLevel, MAX_AVAILABLE_IMAGE_LEVEL);

  for (let i = safeThresholds.length - 1; i >= 0; i -= 1) {
    const rule = safeThresholds[i];
    if (safeCount >= rule.minCount) {
      return clampNumber(rule.level, 1, cappedMaxImageLevel);
    }
  }

  return 1;
}

function shadeColor(hex, percent) {
  const clamped = hex.replace("#", "");
  const num = Number.parseInt(clamped, 16);
  const factor = percent / 100;
  const r = clampNumber(Math.round((num >> 16) + 255 * factor), 0, 255);
  const g = clampNumber(Math.round(((num >> 8) & 0x00ff) + 255 * factor), 0, 255);
  const b = clampNumber(Math.round((num & 0x0000ff) + 255 * factor), 0, 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function mixHexColor(fromHex, toHex, ratio) {
  const safeRatio = clampNumber(ratio, 0, 1);
  const from = Number.parseInt(fromHex.replace("#", ""), 16);
  const to = Number.parseInt(toHex.replace("#", ""), 16);
  const r = Math.round((from >> 16) + (((to >> 16) - (from >> 16)) * safeRatio));
  const g = Math.round(((from >> 8) & 0xff) + ((((to >> 8) & 0xff) - ((from >> 8) & 0xff)) * safeRatio));
  const b = Math.round((from & 0xff) + (((to & 0xff) - (from & 0xff)) * safeRatio));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getGrowthStage(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  const raw = clampNumber((safeCount / 20) * 5, 0, 5);
  const baseLevel = Math.floor(raw);
  const nextLevel = Math.min(5, baseLevel + 1);
  return { baseLevel, nextLevel, ratio: raw - baseLevel };
}

function getBodyMorphByCount(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  const normalized = clampNumber(safeCount / 20, 0, 1);
  const growth = 1 - Math.pow(1 - normalized, 1.55);
  return {
    growth,
    headScale: growth * 0.9,
    bodyScaleX: growth * 1.2,
    bodyScaleY: growth * 1.35,
    bellyScale: growth * 1.4,
    armScale: growth * 4.8,
    pawScale: growth * 4.2,
  };
}

function getExpressionByCount(count, headY) {
  const safe = Math.max(0, Number(count) || 0);

  if (safe === 0) {
    return {
      brows: "",
      eyes: `
        <ellipse cx="154" cy="${headY - 8}" rx="8.8" ry="7.8" fill="#3b2d24"/>
        <ellipse cx="206" cy="${headY - 8}" rx="8.8" ry="7.8" fill="#3b2d24"/>
        <circle cx="151.5" cy="${headY - 10.5}" r="1.8" fill="#ffffffaa"/>
        <circle cx="203.5" cy="${headY - 10.5}" r="1.8" fill="#ffffffaa"/>
      `,
      mouth: `<path d="M166 ${headY + 24} Q180 ${headY + 32} 194 ${headY + 24}" stroke="#5d4334" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    };
  }

  if (safe <= 2) {
    return {
      brows: "",
      eyes: `
        <ellipse cx="154" cy="${headY - 8}" rx="8.6" ry="7.2" fill="#3b2d24"/>
        <ellipse cx="206" cy="${headY - 8}" rx="8.6" ry="7.2" fill="#3b2d24"/>
        <circle cx="151.5" cy="${headY - 10.2}" r="1.8" fill="#ffffffaa"/>
        <circle cx="203.5" cy="${headY - 10.2}" r="1.8" fill="#ffffffaa"/>
      `,
      mouth: `<path d="M164 ${headY + 22} Q180 ${headY + 36} 196 ${headY + 22}" stroke="#5d4334" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    };
  }

  if (safe <= 4) {
    return {
      brows: `
        <path d="M142 ${headY - 22} q12 -4 24 0" stroke="#654b3a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M194 ${headY - 22} q12 -4 24 0" stroke="#654b3a" stroke-width="3" fill="none" stroke-linecap="round"/>
      `,
      eyes: `
        <ellipse cx="154" cy="${headY - 8}" rx="8.2" ry="6.8" fill="#3b2d24"/>
        <ellipse cx="206" cy="${headY - 8}" rx="8.2" ry="6.8" fill="#3b2d24"/>
        <circle cx="151.8" cy="${headY - 10.2}" r="1.5" fill="#ffffffaa"/>
        <circle cx="203.8" cy="${headY - 10.2}" r="1.5" fill="#ffffffaa"/>
      `,
      mouth: `<path d="M162 ${headY + 23} Q180 ${headY + 38} 198 ${headY + 23}" stroke="#5d4334" stroke-width="3.3" fill="none" stroke-linecap="round"/>`,
    };
  }

  if (safe <= 7) {
    return {
      brows: `
        <path d="M141 ${headY - 23} q13 -5 26 -1" stroke="#654b3a" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <path d="M193 ${headY - 24} q13 -4 26 0" stroke="#654b3a" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      `,
      eyes: `
        <path d="M144 ${headY - 8} q10 8 20 0" stroke="#3b2d24" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M196 ${headY - 8} q10 8 20 0" stroke="#3b2d24" stroke-width="4" fill="none" stroke-linecap="round"/>
      `,
      mouth: `<path d="M160 ${headY + 22} Q180 ${headY + 41} 200 ${headY + 22}" stroke="#5d4334" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    };
  }

  return {
    brows: `
      <path d="M140 ${headY - 24} q13 -8 27 -3" stroke="#654b3a" stroke-width="3.3" fill="none" stroke-linecap="round"/>
      <path d="M193 ${headY - 24} q13 -7 27 -2" stroke="#654b3a" stroke-width="3.3" fill="none" stroke-linecap="round"/>
    `,
    eyes: `
      <path d="M143 ${headY - 7} q11 9 22 0" stroke="#3b2d24" stroke-width="4.2" fill="none" stroke-linecap="round"/>
      <path d="M195 ${headY - 7} q11 9 22 0" stroke="#3b2d24" stroke-width="4.2" fill="none" stroke-linecap="round"/>
    `,
    mouth: `<path d="M158 ${headY + 22} Q180 ${headY + 44} 202 ${headY + 22}" stroke="#5d4334" stroke-width="3.7" fill="none" stroke-linecap="round"/>`,
  };
}

function getRecentDaysData(days) {
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = getKSTDateKeyByOffset(i);
    result.push({
      key,
      label: formatHistoryLabelByOffset(key, i, days),
      count: sanitizeSnackCount(state.history[key] || 0),
    });
  }
  return result;
}

function renderHistory() {
  const data = getRecentDaysData(state.period);
  renderChart(data);
  renderSummary(data);
}

function renderChart(data) {
  const goalCount = clampNumber(Number(state.settings.dailyGoal || 0), 0, MAX_DAILY_SNACK_COUNT);
  const goalTopPercent = 100 - (goalCount / MAX_DAILY_SNACK_COUNT) * 100;
  historyChart.innerHTML = `
    <div class="bar-guide">
      <span class="bar-guide-item">20회 기준선</span>
      <span class="bar-guide-item">10회 중간선</span>
      <span class="bar-guide-item bar-guide-item-goal">하루 목표 ${goalCount}회</span>
    </div>
    <div class="bar-list"></div>
  `;
  const barList = historyChart.querySelector(".bar-list");

  data.forEach((item) => {
    const fillHeight = clampNumber((item.count / MAX_DAILY_SNACK_COUNT) * 100, 0, 100);
    const wrapper = document.createElement("div");
    wrapper.className = "bar-item";
    wrapper.title = `${item.key}: ${item.count}회`;
    wrapper.innerHTML = `
      <div class="bar-value">${item.count}회</div>
      <div class="bar-column">
        <div class="bar-cap-line" aria-hidden="true"></div>
        <div class="bar-mid-line" aria-hidden="true"></div>
        <div class="bar-goal-line" style="top:${goalTopPercent}%;" aria-hidden="true"></div>
        <div class="bar-fill" style="height:${fillHeight}%;"></div>
      </div>
      <div class="bar-label">${item.label}</div>
    `;
    barList.appendChild(wrapper);
  });
}

function sanitizeSnackCount(value) {
  return clampNumber(Math.round(Number(value) || 0), 0, MAX_DAILY_SNACK_COUNT);
}

function sanitizeHistoryObject(rawHistory) {
  if (!rawHistory || typeof rawHistory !== "object") {
    return {};
  }

  const normalized = {};
  Object.entries(rawHistory).forEach(([key, value]) => {
    const normalizedKey = normalizeHistoryDateKey(key);
    if (!normalizedKey) {
      return;
    }
    const nextValue = sanitizeSnackCount(value);
    const prevValue = sanitizeSnackCount(normalized[normalizedKey] || 0);
    normalized[normalizedKey] = Math.max(prevValue, nextValue);
  });
  return normalized;
}

function sanitizeSettingsObject(rawSettings) {
  const source = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const dailyGoalSource = source.dailyGoal ?? DEFAULT_SETTINGS.dailyGoal;
  return {
    dailyGoal: clampNumber(Number(dailyGoalSource), 0, MAX_DAILY_GOAL),
    characterType: sanitizeCharacterType(source.characterType),
    theme: source.theme === "dark" ? "dark" : "light",
  };
}

function readStorageJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStorageJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function renderSummary(data) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  const avg = total / data.length;
  const maxValue = Math.max(...data.map((item) => item.count));
  const minValue = Math.min(...data.map((item) => item.count));
  const max = data.find((item) => item.count === maxValue);
  const min = data.find((item) => item.count === minValue);

  totalCount.textContent = `${total}회`;
  avgCount.textContent = `${avg.toFixed(1)}회`;
  maxDay.textContent = `${max.label} / ${maxValue}회`;
  minDay.textContent = `${min.label} / ${minValue}회`;
}

function renderSettings() {
  dailyGoalInput.max = String(MAX_DAILY_GOAL);
  dailyGoalInput.value = String(state.settings.dailyGoal);
  characterTypeSelect.value = state.settings.characterType;
  themeSelect.value = state.settings.theme;
  updateSettingsCharacterPreview(state.settings.characterType);
  settingsStatus.textContent = "";
}

function normalizeDailyGoalInputValue() {
  dailyGoalInput.value = String(clampNumber(Number(dailyGoalInput.value || 0), 0, MAX_DAILY_GOAL));
}

function getKSTDateKeyByOffset(daysAgo) {
  const safeDaysAgo = Math.max(0, Math.floor(Number(daysAgo) || 0));
  const { year, month, day } = getKSTDateParts(new Date());
  const baseUtcMs = Date.UTC(Number(year), Number(month) - 1, Number(day)) - safeDaysAgo * DAY_MS;
  return formatDateKeyFromUTCDate(new Date(baseUtcMs));
}

function formatDateKeyFromUTCDate(date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeHistoryDateKey(rawKey) {
  if (typeof rawKey !== "string") {
    return null;
  }
  const trimmed = rawKey.trim();
  if (DATE_KEY_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const separated = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (separated) {
    const normalized = `${separated[1]}-${String(separated[2]).padStart(2, "0")}-${String(separated[3]).padStart(2, "0")}`;
    return DATE_KEY_PATTERN.test(normalized) ? normalized : null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return getKSTDateKey(parsed);
}

function formatHistoryLabelByOffset(key, daysAgo, periodDays) {
  if (daysAgo === 0) {
    return "오늘";
  }
  if (daysAgo === 1) {
    return "어제";
  }
  return `${key.slice(5)}(${getKSTWeekdayLabelByOffset(daysAgo)})`;
}

function getKSTWeekdayLabelByOffset(daysAgo) {
  const safeDaysAgo = Math.max(0, Math.floor(Number(daysAgo) || 0));
  const { year, month, day } = getKSTDateParts(new Date());
  const baseUtcMs = Date.UTC(Number(year), Number(month) - 1, Number(day)) - safeDaysAgo * DAY_MS;
  return KST_WEEKDAY_FORMATTER.format(new Date(baseUtcMs));
}

function getKSTDateParts(date = new Date()) {
  const safeDate = date instanceof Date ? date : new Date();
  const parts = KST_DATE_FORMATTER.formatToParts(safeDate);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return { year, month, day };
}

function updateSettingsCharacterPreview(type) {
  const safeType = sanitizeCharacterType(type);
  const currentCount = getTodayCount();
  settingsCharacterPreview.src = buildCharacterSvgDataUri(currentCount, safeType);
}
