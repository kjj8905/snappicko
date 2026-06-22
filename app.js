const sampleFreeCapitalIncreaseUrl = "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20260512000722";
const samplePaidCapitalIncreaseUrl = "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20221129001320";
const sampleBuybackUrl = "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20251121000141";

const analyzerConfigs = [
  {
    categoryCode: "FREE_CAPITAL_INCREASE",
    label: "무상증자",
    endpoint: "/api/analyze/free-capital-increase",
    sampleUrl: sampleFreeCapitalIncreaseUrl,
    sampleCorpName: "코미코",
    samplePublishedAt: "2026-05-12T09:00:00+09:00",
  },
  {
    categoryCode: "SINGLE_SALES_CONTRACT",
    label: "단일판매계약",
    endpoint: "/api/analyze/single-sales-contract",
    sampleUrl: "https://dart.fss.or.kr/api/link.jsp?rcpNo=20260514901528",
    sampleCorpName: "엘케이켐",
    samplePublishedAt: "2026-05-14T09:01:00+09:00",
  },
  {
    categoryCode: "PAID_CAPITAL_INCREASE",
    label: "제3자배정 유상증자",
    endpoint: "/api/analyze/paid-capital-increase",
    sampleUrl: samplePaidCapitalIncreaseUrl,
    sampleCorpName: "하이퍼코퍼레이션",
    samplePublishedAt: "2022-11-29T16:53:00+09:00",
  },
  {
    categoryCode: "BUYBACK",
    label: "자사주취득",
    endpoint: "/api/analyze/buyback",
    sampleUrl: sampleBuybackUrl,
    sampleCorpName: "티쓰리",
    samplePublishedAt: "2025-11-21T14:01:07+09:00",
  },
];

let activeModuleFilter = "ALL";
let activeDiscoveryFilter = "ALL";
let signalStates = analyzerConfigs.map((config) => ({ config, loading: true, signal: null, error: null }));
const signalHistoryStorageKey = "dartscope.disclosureSignalHistory.v1";
let signalHistory = loadSignalHistory();
let rssStatusSnapshot = null;
let breakingStatusSnapshot = null;
let breakingNewsItems = [];
const breakingCardLimit = 6;
const breakingFetchLimit = 40;
const breakingLearningCandidateLimit = 8;
let breakingLearningSaving = false;
let cardsLoading = false;
let portfolioRecords = [];
let portfolioMonthlyRecords = [];
let portfolioSummary = null;
let portfolioLoaded = false;
let portfolioLoading = false;
let snappikoSnapshot = null;
let snappikoLoading = false;
let snappikoRelatedNewsItems = [];
let snappikoBondPeriod = "daily";
let activeSearchQuery = "";
const snapPickStorageKeys = {
  favorites: "snappick.favoriteSignals.v1",
  recentSearches: "snappick.recentSearches.v1",
  recentViewed: "snappick.recentViewed.v1",
  communityPosts: "snappick.communityPosts.v1",
  signupLead: "snappick.signupLead.v1",
  alertSettings: "snappick.alertSettings.v1",
  planInterest: "snappick.planInterest.v1",
};
const snapPickPopularSearches = ["무상증자", "자사주취득", "단일판매계약", "제3자배정", "환율", "유가", "금리", "나스닥"];
let favoriteSignals = loadStorageList(snapPickStorageKeys.favorites, 12);
let recentSearches = loadStorageList(snapPickStorageKeys.recentSearches, 10);
let recentViewedItems = loadStorageList(snapPickStorageKeys.recentViewed, 10);
let activeCommunityBoard = "ALL";
let communityPosts = loadCommunityPosts();
let signupLead = loadStorageObject(snapPickStorageKeys.signupLead);
let alertSettings = loadStorageObject(snapPickStorageKeys.alertSettings);
let planInterest = loadStorageObject(snapPickStorageKeys.planInterest);
let lastModalTrigger = null;

const staticPreviewNews = [
  {
    title: "[속보] 원일티엔아이, 한국가스기술공사와 113억원 규모 수소설비 공급...",
    origin_url: "https://www.cbci.co.kr/news/articleView.html?idxno=583681",
    naver_url: "https://www.cbci.co.kr/news/articleView.html?idxno=583681",
    canonical_url: "https://www.cbci.co.kr/news/articleView.html?idxno=583681",
    source_host: "cbci.co.kr",
    description: "원일티엔아이가 한국가스기술공사와 113억원 규모 설비 제작·설치 계약을 체결했다고 공시했습니다.",
    pub_date: "2026-06-22T13:24:00+09:00",
    collected_at: "2026-06-22T13:25:56+09:00",
    id: "static-breaking-001",
  },
  {
    title: "[속보] 한울반도체, 주가 상한가 도달…오전 장중 VI 2차례 발동하기도",
    origin_url: "https://www.cbci.co.kr/news/articleView.html?idxno=583679",
    naver_url: "https://www.cbci.co.kr/news/articleView.html?idxno=583679",
    canonical_url: "https://www.cbci.co.kr/news/articleView.html?idxno=583679",
    source_host: "cbci.co.kr",
    description: "한울반도체가 장중 상한가에 도달하며 강세를 나타냈습니다.",
    pub_date: "2026-06-22T13:22:00+09:00",
    collected_at: "2026-06-22T13:23:34+09:00",
    id: "static-breaking-002",
  },
  {
    title: "[속보] 25년만에 대장주 교체…SK하닉, 삼전 제치고 시총 1위",
    origin_url: "https://www.dt.co.kr/article/12068784?ref=naver",
    naver_url: "https://n.news.naver.com/mnews/article/029/0003032964?sid=101",
    canonical_url: "https://www.dt.co.kr/article/12068784?ref=naver",
    source_host: "dt.co.kr",
    description: "SK하이닉스가 삼성전자를 제치고 코스피 시가총액 1위에 올랐다는 보도입니다.",
    pub_date: "2026-06-22T13:21:00+09:00",
    collected_at: "2026-06-22T13:23:34+09:00",
    id: "static-breaking-003",
  },
  {
    title: "[속보] SK하이닉스, 삼성전자 제치고 시총 1위…26년 만에 대장주 교체",
    origin_url: "http://www.yonhapnewstv.co.kr/news/AKR20260622130631kyo",
    naver_url: "https://n.news.naver.com/mnews/article/422/0000877138?sid=101",
    canonical_url: "http://www.yonhapnewstv.co.kr/news/AKR20260622130631kyo",
    source_host: "yonhapnewstv.co.kr",
    description: "코스피 시가총액 상위주 변화 관련 속보입니다.",
    pub_date: "2026-06-22T13:07:00+09:00",
    collected_at: "2026-06-22T13:08:26+09:00",
    id: "static-breaking-004",
  },
];

const staticPreviewSignals = {
  FREE_CAPITAL_INCREASE: {
    condition: "무상증자",
    corp_name: "코미코",
    stock_code: "",
    disclosure_time: "2026.05.12 09:00",
    metrics: [
      { label: "증자 비율", value: "1:1" },
      { label: "기준일", value: "2026.05.27" },
      { label: "출처", value: "DART 샘플" },
    ],
    recommendation_type: "강력신호",
    confidence: 90,
    recommendation_reason: "보통주 1주당 1주의 신주를 배정하는 무상증자 샘플입니다. 백엔드 배포 전 화면 검증용 데이터입니다.",
    dart_url: sampleFreeCapitalIncreaseUrl,
    report_name: "주요사항보고서(무상증자결정)",
  },
  SINGLE_SALES_CONTRACT: {
    condition: "단일판매계약",
    corp_name: "엘케이켐",
    stock_code: "",
    disclosure_time: "2026.05.14 09:01",
    metrics: [
      { label: "매출 대비", value: "105.13%" },
      { label: "계약기간", value: "2026-05-14 ~ 2027-04-30" },
      { label: "출처", value: "DART 샘플" },
    ],
    recommendation_type: "강력신호",
    confidence: 90,
    recommendation_reason: "최근 매출액 대비 105.13% 규모의 단일판매계약 샘플입니다. 백엔드 배포 전 화면 검증용 데이터입니다.",
    dart_url: "https://dart.fss.or.kr/api/link.jsp?rcpNo=20260514901528",
    report_name: "단일판매ㆍ공급계약체결",
  },
  PAID_CAPITAL_INCREASE: {
    condition: "제3자배정 유상증자",
    corp_name: "하이퍼코퍼레이션",
    stock_code: "",
    disclosure_time: "2022.11.29 16:53",
    metrics: [
      { label: "희석률", value: "7.86%" },
      { label: "증자방식", value: "제3자배정증자" },
      { label: "출처", value: "DART 샘플" },
    ],
    recommendation_type: "관찰신호",
    confidence: 80,
    recommendation_reason: "제3자배정 방식과 희석률을 함께 확인하는 유상증자 샘플입니다. 백엔드 배포 전 화면 검증용 데이터입니다.",
    dart_url: samplePaidCapitalIncreaseUrl,
    report_name: "주요사항보고서(유상증자결정)",
  },
  BUYBACK: {
    condition: "자기주식취득",
    corp_name: "티쓰리",
    stock_code: "",
    disclosure_time: "2025.11.21 14:01",
    metrics: [
      { label: "취득비율", value: "3.74%" },
      { label: "취득예정주식수", value: "2,194,185" },
      { label: "출처", value: "DART 샘플" },
    ],
    recommendation_type: "관찰신호",
    confidence: 80,
    recommendation_reason: "자사주 취득비율과 취득 기간을 확인하는 자기주식취득 샘플입니다. 백엔드 배포 전 화면 검증용 데이터입니다.",
    dart_url: sampleBuybackUrl,
    report_name: "주요사항보고서(자기주식취득결정)",
  },
};

const staticPreviewSnappiko = {
  status: "static_preview",
  generated_at: "2026-06-22T13:33:58+09:00",
  overall: {
    score: 340,
    max: 1000,
    label: "300-399",
    phase: { label: "300-399", ratio: 34, percentile: 47, tone: "neutral" },
    phase_label: "300-399",
    phase_ratio: 34,
    state_percentile: 47,
    weekly_change: 0,
  },
  nasdaq_heat: {
    score: 84,
    max: 100,
    label: "80-89",
    weekly: { period_label: "주봉", score: 81, max: 100, label: "80-89", as_of: "2026-06-18", components: [] },
    monthly: { period_label: "월봉", score: 88, max: 100, label: "80-89", as_of: "2026-05-29", components: [] },
  },
  bond_stress: {
    score: 87,
    max: 100,
    label: "80-89",
    latest_date: "2026-06-20",
    markets: [
      { label: "미국 10Y", value: "4.57%", detail: "20거래일 +23bp", score: 94, components: [] },
      { label: "미국 30Y", value: "5.10%", detail: "20거래일 +18bp", score: 100, components: [] },
      { label: "일본 10Y", value: "2.686%", detail: "월중 +18bp", score: 87, components: [] },
      { label: "일본 30Y", value: "3.876%", detail: "월중 +17bp", score: 88, components: [] },
    ],
  },
  panic_boom: { panic_score: 34, boom_score: 66, panic_max: 100, boom_max: 100, fragility_overlay: 0 },
  cycle_map: [
    { group: "과열", label: "나스닥 과열", score: 84, phase: "80-89", description: "주봉·월봉 확정 기준" },
    { group: "금리", label: "채권 스트레스", score: 87, phase: "80-89", description: "미국/일본 장기금리" },
    { group: "유동성", label: "달러 유동성", score: null, phase: "대기", description: "백엔드 연결 후 갱신" },
  ],
  history: [
    { date: "2026-05-29", score: 318 },
    { date: "2026-06-05", score: 328 },
    { date: "2026-06-12", score: 340 },
    { date: "2026-06-19", score: 340 },
  ],
  dollar_index: { value: "119.28", score: 31, max: 100, phase: "관찰", detail: "FRED DTWEXBGS 정적 미리보기" },
  liquidity: { score: null, max: 100, value: "정적 미리보기", label: "백엔드 대기", detail: "Fed/TGA/RRP/Reserve 데이터는 백엔드 배포 후 표시됩니다." },
  charts: {},
  data: {
    source: "정적 미리보기",
    latest_daily_date: "2026-06-20",
    weekly_bar_date: "2026-06-18",
    monthly_bar_date: "2026-05-29",
    bond_data_date: "2026-06-20",
    last_updated: "2026-06-22 13:33",
    confidence: 52,
    data_coverage: 52,
    confidence_label: "정적 미리보기",
    data_gaps: ["실시간 백엔드 API 배포 전에는 고정 스냅샷을 표시합니다."],
    method_notes: ["백엔드 연결 시 실시간 수집값으로 교체됩니다."],
    uses_ai: false,
    interpretation_mode: "disabled",
    data_policy: "static_snapshot_until_backend_deploy",
    missing_value_policy: "missing_inputs_return_null",
    synthetic_values: false,
    model_generated_fields: [],
  },
  contributors: [
    { label: "Nasdaq Heat", value: "84 / 100", score: 84, tone: "warning", detail: "정적 미리보기" },
    { label: "Bond Stress", value: "87 / 100", score: 87, tone: "danger", detail: "정적 미리보기" },
    { label: "Dollar Index", value: "119.28", score: 31, tone: "neutral", detail: "정적 미리보기" },
  ],
  warnings: ["정적 미리보기 모드입니다. 실시간 수집은 백엔드 배포 후 활성화됩니다."],
};

function apiBaseUrl() {
  const configuredBase =
    window.DARTSCOPE_API_BASE ||
    document.querySelector('meta[name="dartscope-api-base"]')?.getAttribute("content");
  if (configuredBase) {
    return configuredBase.replace(/\/$/, "");
  }

  if (window.location.port.startsWith("800")) {
    return window.location.origin;
  }

  if (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
    return "http://localhost:8000";
  }

  return window.location.origin;
}

function apiUrl(path) {
  return new URL(path, apiBaseUrl());
}

function hasConfiguredApiBase() {
  return Boolean(
    window.DARTSCOPE_API_BASE ||
      document.querySelector('meta[name="dartscope-api-base"]')?.getAttribute("content"),
  );
}

function isStaticPreviewHost() {
  return !hasConfiguredApiBase() && ["snappiko.com", "www.snappiko.com"].includes(window.location.hostname);
}

function cloneStaticData(value) {
  return JSON.parse(JSON.stringify(value));
}

function staticPreviewStatus() {
  return {
    poll_in_progress: false,
    seconds_until_next_poll: 0,
    last_error: "",
    static_preview: true,
    store: {
      seen_count: 4,
      total_new_count: 4,
      last_new_count: 4,
      display_max_age_hours: 24,
    },
  };
}

function staticBreakingStatus() {
  return {
    poll_in_progress: false,
    seconds_until_next_poll: 0,
    last_error: "",
    provider: "static",
    store: {
      history_count: staticPreviewNews.length,
      total_new_count: staticPreviewNews.length,
      total_skipped_count: 0,
      display_max_age_hours: 24,
    },
    relevance: {
      enabled: true,
      provider: "static",
      last_summary: {
        static_preview: true,
      },
      learning: {
        total_samples: 0,
        approved_samples: 0,
        rejected_samples: 0,
        manual_approval_count: 0,
        finance_candidates: [],
        reject_candidates: [],
        manual_approvals: [],
      },
    },
  };
}

function staticPreviewResponse(path) {
  if (!isStaticPreviewHost()) {
    return { found: false, data: null };
  }

  const url = new URL(path, window.location.origin);
  const pathname = url.pathname;
  if (pathname === "/api/rss/status") {
    return { found: true, data: staticPreviewStatus() };
  }
  if (pathname === "/api/rss/new" || pathname === "/api/rss/history") {
    return { found: true, data: [] };
  }
  if (pathname === "/api/breaking/status") {
    return { found: true, data: staticBreakingStatus() };
  }
  if (pathname === "/api/breaking/news") {
    const limit = Number(url.searchParams.get("limit") || staticPreviewNews.length);
    return { found: true, data: cloneStaticData(staticPreviewNews).slice(0, limit) };
  }
  if (pathname === "/api/snappiko/index") {
    return { found: true, data: cloneStaticData(staticPreviewSnappiko) };
  }
  if (pathname === "/api/community/posts" || pathname === "/api/personal/portfolio") {
    return { found: true, data: pathname.includes("portfolio") ? { records: [], monthly_records: [], summary: null } : { posts: [] } };
  }

  return { found: false, data: null };
}

function staticMutationResponse(path, payload = null) {
  if (!isStaticPreviewHost()) {
    return { found: false, data: null };
  }

  const url = new URL(path, window.location.origin);
  const pathname = url.pathname;
  if (pathname.startsWith("/api/growth/")) {
    return { found: true, data: { ok: true, static_preview: true, item: payload } };
  }
  if (pathname === "/api/community/posts") {
    return { found: true, data: { posts: communityPosts } };
  }
  if (pathname.includes("/comments") || pathname.includes("/reactions")) {
    return { found: true, data: { posts: communityPosts } };
  }
  if (pathname === "/api/personal/portfolio") {
    return { found: true, data: { records: portfolioRecords, monthly_records: portfolioMonthlyRecords, summary: portfolioSummary } };
  }

  return { found: false, data: null };
}

function staticAnalyzeDisclosure(config) {
  if (!isStaticPreviewHost()) {
    return null;
  }

  const signal = staticPreviewSignals[config.categoryCode];
  if (!signal) {
    return null;
  }

  return {
    ...cloneStaticData(signal),
    category_code: config.categoryCode,
    category_label: config.label,
    is_sample: true,
    is_static_preview: true,
    source_disclosure: {
      origin: "static_preview",
      label: "정적 미리보기",
      corp_name: signal.corp_name,
      report_name: signal.report_name,
      published_at: signal.disclosure_time,
    },
    observed_at: new Date().toISOString(),
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMetricValue(signal, labelPart) {
  const metric = (signal?.metrics || []).find((item) => item.label.includes(labelPart));
  return metric?.value || "-";
}

function getDisclosureClock(signal) {
  const disclosureTime = signal?.disclosure_time || "";
  const timeMatch = disclosureTime.match(/(\d{1,2}:\d{2})/);
  if (timeMatch) {
    return timeMatch[1];
  }

  return "확인 중";
}

function getPrimaryMetrics(signal) {
  const metrics = signal?.metrics || [];
  if (!metrics.length) {
    return [{ label: "조건", value: signal?.condition || "-" }];
  }

  return metrics.slice(0, 3);
}

function loadSignalHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(signalHistoryStorageKey) || "[]");
    return Array.isArray(stored) ? stored.slice(0, 80) : [];
  } catch {
    return [];
  }
}

function saveSignalHistory() {
  try {
    localStorage.setItem(signalHistoryStorageKey, JSON.stringify(signalHistory.slice(0, 80)));
  } catch {
    // 브라우저 저장소가 막혀도 현재 화면의 기록은 메모리에서 유지합니다.
  }
}

function loadStorageList(key, limit) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(stored) ? stored.slice(0, limit) : [];
  } catch {
    return [];
  }
}

function saveStorageList(key, items, limit) {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, limit)));
  } catch {
    // 저장소 사용이 불가하면 현재 세션 메모리 상태만 유지합니다.
  }
}

function loadStorageObject(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function saveStorageObject(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소 사용이 불가하면 현재 세션 메모리 상태만 유지합니다.
  }
}

function normalizeSearchTerm(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function addRecentSearch(value) {
  const term = normalizeSearchTerm(value);
  if (!term) {
    return;
  }

  recentSearches = [term, ...recentSearches.filter((item) => item !== term)].slice(0, 10);
  saveStorageList(snapPickStorageKeys.recentSearches, recentSearches, 10);
  renderSnapPickHome();
}

function addFavoriteSignal(item) {
  if (!item?.label) {
    return;
  }

  const saved = {
    id: item.id || `${item.type || "signal"}:${item.label}`,
    type: item.type || "관심",
    label: item.label,
    meta: item.meta || "",
    saved_at: new Date().toISOString(),
  };
  favoriteSignals = [saved, ...favoriteSignals.filter((signal) => signal.id !== saved.id)].slice(0, 12);
  saveStorageList(snapPickStorageKeys.favorites, favoriteSignals, 12);
  renderSnapPickHome();
}

function signalToRecentViewedItem(signal, config) {
  if (!signal || !config) {
    return null;
  }

  return {
    id: `signal:${config.categoryCode}:${signal.corp_name || signal.report_name || config.label}`,
    type: config.label,
    label: signal.corp_name || config.label,
    meta: `${signal.report_name || "공시 분석"} · 신뢰도 ${signal.confidence || "-"}%`,
    categoryCode: config.categoryCode,
    searchTerm: signal.corp_name || config.label,
    url: signal.dart_url || "",
    viewed_at: new Date().toISOString(),
  };
}

function addRecentViewed(item) {
  if (!item?.label) {
    return;
  }

  const saved = {
    id: item.id || `${item.type || "view"}:${item.label}`,
    type: item.type || "최근 확인",
    label: item.label,
    meta: item.meta || "",
    categoryCode: item.categoryCode || "",
    searchTerm: item.searchTerm || item.label,
    url: item.url || "",
    viewed_at: item.viewed_at || new Date().toISOString(),
  };
  recentViewedItems = [saved, ...recentViewedItems.filter((viewed) => viewed.id !== saved.id)].slice(0, 10);
  saveStorageList(snapPickStorageKeys.recentViewed, recentViewedItems, 10);
  renderSnapPickHome();
}

function clearRecentViewed() {
  recentViewedItems = [];
  saveStorageList(snapPickStorageKeys.recentViewed, recentViewedItems, 10);
  renderSnapPickHome();
}

function clearFavoriteSignals() {
  favoriteSignals = [];
  saveStorageList(snapPickStorageKeys.favorites, favoriteSignals, 12);
  renderSnapPickHome();
}

function setSearchQuery(value) {
  activeSearchQuery = normalizeSearchTerm(value);
  document.getElementById("homeSearchInput")?.value !== undefined &&
    (document.getElementById("homeSearchInput").value = activeSearchQuery);
  document.getElementById("disclosureSearchInput")?.value !== undefined &&
    (document.getElementById("disclosureSearchInput").value = activeSearchQuery);
  if (activeSearchQuery) {
    addRecentSearch(activeSearchQuery);
  }
  renderSignalCards();
  renderDiscoveredList();
  renderSnapPickHome();
}

function signalMatchesSearch(signal, config, query = activeSearchQuery) {
  const term = normalizeSearchTerm(query).toLowerCase();
  if (!term) {
    return true;
  }

  const haystack = [
    config?.label,
    config?.categoryCode,
    signal?.corp_name,
    signal?.report_name,
    signal?.condition,
    signal?.recommendation_type,
    signal?.recommendation_reason,
    ...(signal?.metrics || []).flatMap((metric) => [metric.label, metric.value]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
}

function renderChipButton(label, className = "") {
  return `<button class="${className}" type="button" data-search-term="${escapeHtml(label)}">${escapeHtml(label)}</button>`;
}

function currentSearchResultStates(limit = 4) {
  if (!activeSearchQuery) {
    return [];
  }

  return signalStates
    .filter((state) => state.signal && !state.signal.excluded && signalMatchesSearch(state.signal, state.config))
    .sort((a, b) => Number(b.signal.confidence || 0) - Number(a.signal.confidence || 0))
    .slice(0, limit);
}

function buildSearchSuggestions() {
  const terms = [
    ...recentSearches.map((term) => ({ group: "최근", term })),
    ...snapPickPopularSearches.map((term) => ({ group: "인기", term })),
    ...analyzerConfigs.map((config) => ({ group: "조건", term: config.label })),
  ];
  const seen = new Set();
  return terms.filter((item) => {
    if (seen.has(item.term)) {
      return false;
    }
    seen.add(item.term);
    return true;
  });
}

function renderSnapPickHome() {
  const disclosureCount = document.getElementById("homeDisclosureCount");
  const disclosureMeta = document.getElementById("homeDisclosureMeta");
  const breakingCount = document.getElementById("homeBreakingCount");
  const breakingMeta = document.getElementById("homeBreakingMeta");
  const snappikoScore = document.getElementById("homeSnappikoScore");
  const snappikoMeta = document.getElementById("homeSnappikoMeta");
  const portfolioCount = document.getElementById("homePortfolioCount");
  const portfolioMeta = document.getElementById("homePortfolioMeta");
  const favoriteList = document.getElementById("favoriteSignalList");
  const recentList = document.getElementById("recentSearchList");
  const recommendationList = document.getElementById("recommendationList");
  const recentViewedList = document.getElementById("recentViewedList");
  const suggestions = document.getElementById("homeSearchSuggestions");
  const searchResults = document.getElementById("homeSearchResults");

  const rssStore = rssStatusSnapshot?.store || {};
  if (disclosureCount) {
    disclosureCount.textContent = String(rssStore.seen_count ?? "--");
  }
  if (disclosureMeta) {
    disclosureMeta.textContent = `누적 신규 ${rssStore.total_new_count || 0}건 · 최근 ${rssStore.last_new_count || 0}건`;
  }

  const breakingStore = breakingStatusSnapshot?.store || {};
  if (breakingCount) {
    breakingCount.textContent = String(breakingNewsItems.length || breakingStore.history_count || "--");
  }
  if (breakingMeta) {
    breakingMeta.textContent = `제외 ${breakingStore.total_skipped_count || 0}건 · ${breakingStore.display_max_age_hours || 24}시간 표시`;
  }

  const overall = snappikoSnapshot?.overall || {};
  if (snappikoScore) {
    snappikoScore.textContent = overall.score ?? "--";
  }
  if (snappikoMeta) {
    snappikoMeta.textContent = `점수대 ${overall.phase_label || overall.label || "대기"} · ${snappikoSnapshot?.data?.last_updated || "-"}`;
  }

  const portfolioSummary = getPortfolioSummary();
  if (portfolioCount) {
    portfolioCount.textContent = String(portfolioSummary.record_count ?? 0);
  }
  if (portfolioMeta) {
    portfolioMeta.textContent = portfolioSummary.latest_record_date
      ? `${formatRecordDate(portfolioSummary.latest_record_date)} · ${formatPercent(portfolioSummary.latest_return_rate)}`
      : "기록을 추가하면 개인화됩니다.";
  }

  if (favoriteList) {
    favoriteList.innerHTML = favoriteSignals.length
      ? favoriteSignals
          .map(
            (item) => `
              <button type="button" data-search-term="${escapeHtml(item.label)}">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.type)}${item.meta ? ` · ${escapeHtml(item.meta)}` : ""}</span>
              </button>
            `,
          )
          .join("")
      : `<span class="home-empty">관심 신호를 저장하면 여기에 표시됩니다.</span>`;
  }

  if (recentList) {
    recentList.innerHTML = recentSearches.length
      ? recentSearches.map((term) => renderChipButton(term)).join("")
      : snapPickPopularSearches.slice(0, 5).map((term) => renderChipButton(term, "is-suggested")).join("");
  }

  if (recommendationList) {
    const strongSignals = signalStates
      .filter((state) => state.signal && !state.signal.excluded)
      .sort((a, b) => Number(b.signal.confidence || 0) - Number(a.signal.confidence || 0))
      .slice(0, 3);
    recommendationList.innerHTML = strongSignals.length
      ? strongSignals
          .map(
            ({ signal, config }) => `
              <button type="button" data-save-signal="${escapeHtml(config.categoryCode)}">
                <span>${escapeHtml(config.label)}</span>
                <strong>${escapeHtml(signal.corp_name || "공시 분석")}</strong>
                <small>신뢰도 ${escapeHtml(signal.confidence || "-")}% · ${escapeHtml(signal.recommendation_type || "대기")}</small>
              </button>
            `,
          )
          .join("")
      : `
        <button type="button" data-view-target="snappiko" data-nav-key="snappiko">
          <span>시장 위험</span>
          <strong>스냅픽코 지수 확인</strong>
          <small>채권·달러·유동성 기준</small>
        </button>
      `;
  }

  if (recentViewedList) {
    recentViewedList.innerHTML = recentViewedItems.length
      ? recentViewedItems
          .slice(0, 4)
          .map(
            (item) => `
              <button type="button" data-view-result-category="${escapeHtml(item.categoryCode)}" data-search-term="${escapeHtml(item.searchTerm || item.label)}">
                <span>${escapeHtml(item.type)}</span>
                <strong>${escapeHtml(item.label)}</strong>
                <small>${escapeHtml(item.meta || "최근 확인")}</small>
              </button>
            `,
          )
          .join("")
      : `<span class="home-empty">공시 카드나 검색 결과를 열면 여기에 쌓입니다.</span>`;
  }

  if (suggestions) {
    suggestions.innerHTML = buildSearchSuggestions()
      .map(
        (item) => `
          <button type="button" data-search-term="${escapeHtml(item.term)}">
            <span>${escapeHtml(item.group)}</span>
            <strong>${escapeHtml(item.term)}</strong>
          </button>
        `,
      )
      .join("");
  }

  if (searchResults) {
    const resultStates = currentSearchResultStates(4);
    if (!activeSearchQuery) {
      searchResults.innerHTML = "";
    } else {
      const resultBody = resultStates.length
        ? resultStates
            .map(
              ({ signal, config }) => `
                <button type="button" data-view-result-category="${escapeHtml(config.categoryCode)}" data-search-term="${escapeHtml(signal.corp_name || config.label)}">
                  <span>${escapeHtml(config.label)}</span>
                  <strong>${escapeHtml(signal.corp_name || "공시 분석")}</strong>
                  <small>${escapeHtml(signal.report_name || "")} · 신뢰도 ${escapeHtml(signal.confidence || "-")}%</small>
                </button>
              `,
            )
            .join("")
        : `<div class="home-search-empty">"${escapeHtml(activeSearchQuery)}"에 맞는 분석 카드가 없습니다.</div>`;
      searchResults.innerHTML = `
        <div class="home-search-result-head">
          <strong>검색 결과 ${resultStates.length}건</strong>
          <button type="button" data-clear-search>검색 초기화</button>
        </div>
        <div class="home-search-result-list">${resultBody}</div>
      `;
    }
  }
}

function createDefaultCommunityPosts() {
  return [];
}

function sanitizeCommunityPosts(posts) {
  return posts
    .filter((post) => post && !String(post.id || "").startsWith("seed-"))
    .map((post) => ({
      ...post,
      comments: (post.comments || []).filter((comment) => !String(comment.id || "").startsWith("seed-")),
    }));
}

function loadCommunityPosts() {
  try {
    const stored = JSON.parse(localStorage.getItem(snapPickStorageKeys.communityPosts) || "[]");
    return Array.isArray(stored) ? sanitizeCommunityPosts(stored) : createDefaultCommunityPosts();
  } catch {
    return createDefaultCommunityPosts();
  }
}

function saveCommunityPosts() {
  try {
    localStorage.setItem(snapPickStorageKeys.communityPosts, JSON.stringify(communityPosts));
  } catch {
    // 로컬 저장소를 사용할 수 없으면 현재 세션 상태만 유지합니다.
  }
}

function applyServerCommunityState(data) {
  if (!Array.isArray(data?.posts)) {
    return;
  }
  communityPosts = sanitizeCommunityPosts(data.posts);
  saveCommunityPosts();
  renderCommunityBoard();
}

async function loadCommunityPostsFromServer() {
  try {
    const data = await fetchJson("/api/community/posts?limit=100");
    applyServerCommunityState(data);
  } catch {
    renderCommunityBoard();
  }
}

async function syncCommunityPostToServer(post) {
  try {
    const data = await sendJson("/api/community/posts", "POST", {
      id: post.id,
      board: post.board,
      author: post.author,
      title: post.title,
      body: post.body,
      created_at: post.created_at,
    });
    applyServerCommunityState(data);
  } catch {
    // 서버가 꺼져 있으면 로컬 MVP 상태를 유지합니다.
  }
}

async function syncCommunityCommentToServer(postId, comment) {
  try {
    const data = await sendJson(`/api/community/posts/${encodeURIComponent(postId)}/comments`, "POST", comment);
    applyServerCommunityState(data);
  } catch {
    // 서버가 꺼져 있으면 로컬 MVP 상태를 유지합니다.
  }
}

async function syncCommunityReactionToServer(postId, action, active) {
  try {
    const data = await sendJson(`/api/community/posts/${encodeURIComponent(postId)}/reactions`, "POST", { action, active });
    applyServerCommunityState(data);
  } catch {
    // 서버가 꺼져 있으면 로컬 MVP 상태를 유지합니다.
  }
}

function getCommunityBoardLabel(board) {
  const labels = {
    FREE: "자유게시판",
    QUESTION: "질문게시판",
    REVIEW: "후기게시판",
  };
  return labels[board] || "자유게시판";
}

function getCommunityStats() {
  const myPosts = communityPosts.filter((post) => post.author === "나").length;
  const comments = communityPosts.reduce((total, post) => total + (post.comments || []).filter((comment) => comment.author === "나").length, 0);
  const bookmarks = communityPosts.filter((post) => post.bookmarked).length;
  const likes = communityPosts.filter((post) => post.liked).length;
  const score = myPosts * 12 + comments * 5 + bookmarks * 3 + likes * 2;
  return { myPosts, comments, bookmarks, likes, score };
}

function getCommunityLevel(stats = getCommunityStats()) {
  if (stats.score >= 120) {
    return { label: "L4 Signal Builder", badges: ["공시 해석 기여", "북마크 큐레이터", "활동 상위"] };
  }
  if (stats.score >= 60) {
    return { label: "L3 Market Helper", badges: ["댓글 기여", "질문 응답", "관심 신호"] };
  }
  if (stats.score >= 20) {
    return { label: "L2 Active Picker", badges: ["첫 게시글", "좋아요 참여"] };
  }
  return { label: "L1 Observer", badges: ["신규 관찰자"] };
}

function formatCommunityTime(value) {
  const timestamp = Date.parse(value || "");
  if (!Number.isFinite(timestamp)) {
    return "시각 대기";
  }
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }
  return `${Math.floor(diffHours / 24)}일 전`;
}

function getCommunityActivityItems() {
  const items = [];
  communityPosts.forEach((post) => {
    if (post.author === "나") {
      items.push({ at: post.created_at, text: `게시글 작성 · ${post.title}` });
    }
    if (post.liked) {
      items.push({ at: post.updated_at || post.created_at, text: `좋아요 · ${post.title}` });
    }
    if (post.bookmarked) {
      items.push({ at: post.updated_at || post.created_at, text: `북마크 · ${post.title}` });
    }
    (post.comments || []).forEach((comment) => {
      if (comment.author === "나") {
        items.push({ at: comment.created_at, text: `댓글 작성 · ${post.title}` });
      }
    });
  });
  return items.sort((a, b) => Date.parse(b.at || "") - Date.parse(a.at || "")).slice(0, 5);
}

function renderCommunityProfile() {
  const stats = getCommunityStats();
  const level = getCommunityLevel(stats);
  const levelElement = document.getElementById("communityProfileLevel");
  const metrics = document.getElementById("communityProfileMetrics");
  const badges = document.getElementById("communityBadgeList");
  const activityList = document.getElementById("communityActivityList");

  if (levelElement) {
    levelElement.textContent = level.label;
  }
  if (metrics) {
    metrics.innerHTML = `
      <span><strong>${stats.myPosts}</strong>글</span>
      <span><strong>${stats.comments}</strong>댓글</span>
      <span><strong>${stats.bookmarks}</strong>북마크</span>
      <span><strong>${stats.score}</strong>점수</span>
    `;
  }
  if (badges) {
    badges.innerHTML = level.badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join("");
  }
  if (activityList) {
    const items = getCommunityActivityItems();
    activityList.innerHTML = items.length
      ? items.map((item) => `<div><span>${escapeHtml(formatCommunityTime(item.at))}</span><strong>${escapeHtml(item.text)}</strong></div>`).join("")
      : `<div class="community-empty">활동 기록 대기</div>`;
  }
}

function renderCommunityPost(post) {
  const comments = post.comments || [];
  const commentBody = comments.length
    ? comments
        .map(
          (comment) => `
            <div class="reply-item">
              <span class="avatar small">${escapeHtml((comment.author || "?").slice(0, 1))}</span>
              <p><strong>${escapeHtml(comment.author || "익명")}</strong> ${escapeHtml(comment.body || "")}</p>
            </div>
          `,
        )
        .join("")
    : `<p class="empty-reply">아직 댓글이 없습니다.</p>`;

  return `
    <article class="discussion-post" data-community-post-id="${escapeHtml(post.id)}">
      <div class="post-head">
        <span class="avatar">${escapeHtml((post.author || "?").slice(0, 1))}</span>
        <div>
          <strong>${escapeHtml(post.author || "익명")}</strong>
          <span>${escapeHtml(getCommunityBoardLabel(post.board))} · ${escapeHtml(formatCommunityTime(post.created_at))}</span>
        </div>
      </div>
      <h3>${escapeHtml(post.title || "제목 없음")}</h3>
      <p>${escapeHtml(post.body || "")}</p>
      <div class="post-actions">
        <button class="${post.liked ? "is-active" : ""}" type="button" data-community-action="like">좋아요 ${post.likes || 0}</button>
        <button class="${post.bookmarked ? "is-active" : ""}" type="button" data-community-action="bookmark">북마크</button>
        <button type="button" data-community-action="focus-comment">댓글 ${comments.length}</button>
      </div>
      <div class="reply-list">${commentBody}</div>
      <div class="reply-input-row">
        <input class="forum-input" type="text" placeholder="댓글 남기기..." />
        <button class="mini-submit-button" type="button" data-community-action="comment">등록</button>
      </div>
    </article>
  `;
}

function renderCommunityBoard() {
  const list = document.getElementById("discussionPostList");
  const count = document.getElementById("communityPostCount");
  if (!list) {
    return;
  }

  const visiblePosts = communityPosts
    .filter((post) => activeCommunityBoard === "ALL" || post.board === activeCommunityBoard)
    .sort((a, b) => Date.parse(b.created_at || "") - Date.parse(a.created_at || ""));

  list.innerHTML = visiblePosts.length
    ? visiblePosts.map(renderCommunityPost).join("")
    : `<div class="community-empty">해당 게시판의 글이 없습니다.</div>`;

  if (count) {
    count.textContent = `${visiblePosts.length}개 게시글`;
  }
  document.querySelectorAll("[data-community-board]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.communityBoard === activeCommunityBoard);
  });
  renderCommunityProfile();
}

function addCommunityPost(board, title, body) {
  const post = {
    id: `post-${Date.now()}`,
    board,
    author: "나",
    title,
    body,
    created_at: new Date().toISOString(),
    likes: 0,
    liked: false,
    bookmarked: false,
    comments: [],
  };
  communityPosts = [
    post,
    ...communityPosts,
  ];
  saveCommunityPosts();
  renderCommunityBoard();
  syncCommunityPostToServer(post);
}

function updateCommunityPost(postId, updater) {
  let updatedPost = null;
  communityPosts = communityPosts.map((post) => {
    if (post.id !== postId) {
      return post;
    }
    updatedPost = updater({ ...post });
    return updatedPost;
  });
  saveCommunityPosts();
  renderCommunityBoard();
  return updatedPost;
}

function signalCategoryClass(config) {
  const categoryCode = String(config?.categoryCode || "")
    .toLowerCase()
    .replace(/_/g, "-");
  return categoryCode ? `signal-${categoryCode}` : "";
}

function isStrongSignal(signal) {
  return Number(signal?.confidence || 0) >= 90 || signal?.recommendation_type === "강력매수";
}

function signalHistoryKey(signal, config) {
  const disclosure = signal?.source_disclosure || {};
  return [
    config?.categoryCode || signal?.category_code || "",
    disclosure.rcept_no || "",
    signal?.dart_url || "",
    signal?.corp_name || "",
    signal?.report_name || "",
  ].join("|");
}

function sourceDisclosureSummary(disclosure, origin = "sample") {
  if (!disclosure) {
    return null;
  }

  return {
    origin,
    rcept_no: disclosure.rcept_no || "",
    title: disclosure.title || "",
    published_at: disclosure.published_at || "",
    raw_pub_date: disclosure.raw_pub_date || "",
    received_at: disclosure.received_at || "",
  };
}

function createSignalHistoryItem(signal, config) {
  return {
    key: signalHistoryKey(signal, config),
    categoryCode: config.categoryCode,
    categoryLabel: config.label,
    corp_name: signal.corp_name,
    report_name: signal.report_name,
    condition: signal.condition,
    disclosure_time: signal.disclosure_time,
    recommendation_type: signal.recommendation_type,
    confidence: signal.confidence,
    metrics: signal.metrics || [],
    recommendation_reason: signal.recommendation_reason,
    dart_url: signal.dart_url,
    source_disclosure: signal.source_disclosure,
    observed_at: signal.observed_at || new Date().toISOString(),
  };
}

function mergeSignalHistory(states) {
  const nextItems = states
    .filter((state) => state.signal && !state.signal.excluded && !state.signal.is_sample)
    .map((state) => createSignalHistoryItem(state.signal, state.config))
    .filter((item) => item.key.trim() !== "||||");

  if (!nextItems.length) {
    renderDiscoveredList();
    return;
  }

  const byKey = new Map(signalHistory.map((item) => [item.key, item]));
  nextItems.forEach((item) => {
    byKey.set(item.key, { ...byKey.get(item.key), ...item });
  });

  signalHistory = [...byKey.values()]
    .sort((a, b) => new Date(b.observed_at || 0).getTime() - new Date(a.observed_at || 0).getTime())
    .slice(0, 80);
  saveSignalHistory();
  renderDiscoveredList();
}

function formatSignalHistoryTime(value) {
  if (!value) {
    return "시간 확인 필요";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isImportantDisclosureMetric(metric) {
  const label = String(metric?.label || "");
  const importantLabels = [
    "증자 비율",
    "기준일",
    "매출 대비",
    "계약기간",
    "희석률",
    "증자방식",
    "할인율",
    "취득비율",
    "취득예정주식수",
    "취득기간",
  ];
  return importantLabels.some((importantLabel) => label.includes(importantLabel));
}

function renderSignalMetricRow(metric) {
  const importantClass = isImportantDisclosureMetric(metric) ? " is-important" : "";
  return `
    <div class="metric-row${importantClass}">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${escapeHtml(metric.value)}</strong>
    </div>
  `;
}

function renderSignalCard(signal, config) {
  const confidence = Number(signal.confidence || 0);
  const confidencePercent = Math.max(0, Math.min(100, confidence));
  const categoryClass = signalCategoryClass(config);
  const strongSignal = isStrongSignal(signal);
  const cardClass = `signal-card is-hot ${categoryClass}${strongSignal ? " is-critical" : ""}`.trim();

  return `
    <article class="${cardClass}" data-category="${escapeHtml(config.categoryCode)}" data-track-signal="${escapeHtml(config.categoryCode)}">
      <div class="signal-topline">
        <div class="badge-row">
          <span class="badge info signal-type-badge">공시조건 ${escapeHtml(signal.condition)}</span>
          <h3 class="company-title">${escapeHtml(signal.corp_name)} <span>${escapeHtml(signal.report_name)}</span></h3>
        </div>
        <span class="change-chip ${strongSignal ? "danger" : "up"}">${strongSignal ? "강력신호" : "NEW"}</span>
      </div>

      <p class="disclosure-time">공시 시간: ${escapeHtml(signal.disclosure_time)}</p>

      <div class="metric-table">
        <h4>주요지표</h4>
        ${(signal.metrics || [])
          .map((metric) => renderSignalMetricRow(metric))
          .join("")}
      </div>

      <div class="recommend-row${strongSignal ? " is-critical" : ""}">
        <span>추천 타입</span>
        <strong>${escapeHtml(signal.recommendation_type)}</strong>
      </div>

      <div class="score-block${strongSignal ? " is-critical" : ""}">
        <div class="score-line">
          <span>신뢰도</span>
          <strong>${confidence}%</strong>
        </div>
        <div class="progress${strongSignal ? " is-critical" : ""}"><span style="width: ${confidencePercent}%"></span></div>
      </div>

      <div class="reason-box">
        <h4>추천 이유</h4>
        <ul class="reason-list">
          <li>${escapeHtml(signal.recommendation_reason)}</li>
        </ul>
      </div>

      <div class="card-actions">
        <span>조건: ${escapeHtml(config.label)}</span>
        <button class="link-button" type="button" data-save-signal="${escapeHtml(config.categoryCode)}">저장</button>
        <button class="link-button" type="button" data-alert-topic="${escapeHtml(config.label)}">알림</button>
        <button class="link-button" type="button" data-share-title="${escapeHtml(signal.corp_name || config.label)}" data-share-url="${escapeHtml(signal.dart_url)}">공유</button>
        <a class="link-button" href="${escapeHtml(signal.dart_url)}" target="_blank" rel="noreferrer">원문</a>
      </div>
    </article>
  `;
}

function renderLoadingCard(config) {
  const categoryClass = signalCategoryClass(config);
  return `
    <article class="signal-card ${categoryClass}" data-category="${escapeHtml(config.categoryCode)}">
      <div class="signal-topline">
        <div class="badge-row">
          <span class="badge info signal-type-badge">${escapeHtml(config.label)}</span>
          <h3 class="company-title">공시 분석 대기 <span>DART</span></h3>
        </div>
        <span class="change-chip">LOADING</span>
      </div>
      <p class="disclosure-time">RSS 신규 공시와 샘플 원문을 확인하고 있습니다.</p>
    </article>
  `;
}

function renderErrorCard(config, message) {
  const categoryClass = signalCategoryClass(config);
  return `
    <article class="signal-card ${categoryClass}" data-category="${escapeHtml(config.categoryCode)}">
      <div class="signal-topline">
        <div class="badge-row">
          <span class="badge risk">연결 필요</span>
          <h3 class="company-title">${escapeHtml(config.label)} 분석 API <span>대기</span></h3>
        </div>
      </div>
      <p class="disclosure-time">${escapeHtml(message)}</p>
      <div class="reason-box">
        <h4>확인할 것</h4>
        <ul class="reason-list">
          <li>Python 백엔드를 실행하면 DART 원문 분석 카드가 표시됩니다.</li>
          <li>실행 명령: npm run backend</li>
        </ul>
      </div>
    </article>
  `;
}

function renderEmptyCard(label = "현재 조건") {
  return `
    <article class="signal-card">
      <div class="signal-topline">
        <div class="badge-row">
          <span class="badge info">조건 대기</span>
          <h3 class="company-title">표시할 공시 없음 <span>DART</span></h3>
        </div>
      </div>
      <p class="disclosure-time">${escapeHtml(label)}에 맞는 분석 카드가 아직 없습니다.</p>
    </article>
  `;
}

function renderSignalCards() {
  const container = document.getElementById("signalList");
  if (!container) {
    return;
  }

  const visibleStates =
    activeModuleFilter === "ALL"
      ? signalStates
      : signalStates.filter((state) => state.config.categoryCode === activeModuleFilter);

  const cards = visibleStates
    .filter((state) => state.loading || state.error || signalMatchesSearch(state.signal, state.config))
    .map((state) => {
      if (state.loading) {
        return renderLoadingCard(state.config);
      }

      if (state.error) {
        return renderErrorCard(state.config, state.error);
      }

      if (state.signal?.excluded) {
        return "";
      }

      if (state.signal) {
        return renderSignalCard(state.signal, state.config);
      }

      return "";
    })
    .filter(Boolean)
    .join("");

  const activeLabel =
    activeModuleFilter === "ALL"
      ? "실시간 호재 종목"
      : analyzerConfigs.find((config) => config.categoryCode === activeModuleFilter)?.label;

  container.innerHTML = cards || renderEmptyCard(activeLabel);
}

function renderDiscoveredList() {
  const container = document.getElementById("discoveredList");
  if (!container) {
    return;
  }

  const count = document.getElementById("discoveredSignalCount");
  const filteredHistory = signalHistory.filter((signal) => {
    const categoryMatched = activeDiscoveryFilter === "ALL" || signal.categoryCode === activeDiscoveryFilter;
    const config = analyzerConfigs.find((item) => item.categoryCode === signal.categoryCode);
    return categoryMatched && signalMatchesSearch(signal, config);
  });

  if (count) {
    count.textContent = `${filteredHistory.length}건 기록`;
  }

  const rows = filteredHistory
    .map((signal) => {
      const confidence = Number(signal.confidence || 0);
      const confidencePercent = Math.max(0, Math.min(100, confidence));
      const strongSignal = isStrongSignal(signal);
      const rowClass = `condition-row-card ${signalCategoryClass({ categoryCode: signal.categoryCode })}${strongSignal ? " is-critical" : ""}`.trim();
      const metricChips = getPrimaryMetrics(signal)
        .map(
          (metric) => `
            <span class="condition-chip${isImportantDisclosureMetric(metric) ? " is-important" : ""}">
              ${escapeHtml(metric.label)}: <strong>${escapeHtml(metric.value)}</strong>
            </span>
          `,
        )
        .join("");
      const sourceLabel = signal.source_disclosure?.origin === "new" ? "신규 RSS" : "RSS 기록";

      return `
        <a class="${rowClass}" href="${escapeHtml(signal.dart_url)}" target="_blank" rel="noreferrer" data-track-signal="${escapeHtml(signal.categoryCode)}">
          <div class="condition-main">
            <strong>${escapeHtml(signal.corp_name)}</strong>
            <span>${escapeHtml(signal.report_name)}</span>
            <em>${escapeHtml(signal.categoryLabel || signal.condition || "")}</em>
          </div>
          <div class="condition-metrics">
            ${metricChips}
            <span class="condition-confidence${strongSignal ? " is-critical" : ""}">
              신뢰도:
              <i><em style="width: ${confidencePercent}%"></em></i>
              <strong>${confidence}%</strong>
            </span>
          </div>
          <div class="condition-time">
            <strong>${escapeHtml(sourceLabel)}</strong>
            <span>공시 ${escapeHtml(getDisclosureClock(signal))}</span>
            <small>포착 ${escapeHtml(formatSignalHistoryTime(signal.observed_at))}</small>
          </div>
        </a>
      `;
    })
    .join("");

  const activeLabel =
    activeDiscoveryFilter === "ALL"
      ? "전체"
      : analyzerConfigs.find((config) => config.categoryCode === activeDiscoveryFilter)?.label || "선택 조건";
  container.innerHTML =
    rows ||
    `<div class="condition-empty">${escapeHtml(activeLabel)}에 기록된 실제 RSS 분석 신호가 아직 없습니다.</div>`;
}

function renderAll() {
  renderSignalCards();
  renderDiscoveredList();
  renderSnapPickHome();
  renderCommunityBoard();
}

function formatCountdown(seconds) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
}

function secondsUntilNextPoll() {
  if (!rssStatusSnapshot) {
    return 0;
  }

  if (rssStatusSnapshot.next_poll_at) {
    const nextTime = new Date(rssStatusSnapshot.next_poll_at).getTime();
    if (!Number.isNaN(nextTime)) {
      return Math.max(0, Math.ceil((nextTime - Date.now()) / 1000));
    }
  }

  return Number(rssStatusSnapshot.seconds_until_next_poll || 0);
}

function updateRssStatusText() {
  const countdown = document.getElementById("rssCountdown");
  const summary = document.getElementById("rssSummary");
  if (!countdown || !summary) {
    return;
  }

  if (!rssStatusSnapshot) {
    countdown.textContent = "다음 업데이트 확인 중";
    summary.textContent = "수집 상태를 불러오는 중입니다.";
    return;
  }

  if (rssStatusSnapshot.poll_in_progress) {
    countdown.textContent = "RSS 수집 중";
  } else {
    countdown.textContent = `다음 업데이트 ${formatCountdown(secondsUntilNextPoll())}`;
  }

  const store = rssStatusSnapshot.store || {};
  const errorText = rssStatusSnapshot.last_error ? ` · 오류: ${rssStatusSnapshot.last_error}` : "";
  summary.textContent = `누적 신규 ${store.total_new_count || 0}건 · 최근 통과 ${store.last_new_count || 0}건 · 감시 ${store.seen_count || 0}건${errorText}`;
}

async function refreshRssStatus() {
  try {
    rssStatusSnapshot = await fetchJson("/api/rss/status");
    updateRssStatusText();
    renderSnapPickHome();
  } catch {
    rssStatusSnapshot = null;
    updateRssStatusText();
    renderSnapPickHome();
  }
}

function formatBreakingTime(value) {
  if (!value) {
    return "시간 확인 중";
  }

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return value;
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSeconds < 60) {
    return "방금 전";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function breakingArticleUrl(article) {
  return article.origin_url || article.naver_url || article.canonical_url || "#";
}

function renderBreakingNewsCard(article, index) {
  const href = breakingArticleUrl(article);
  const source = article.source_host || "news";
  const badgeClass = index === 0 ? "danger" : "info";
  const badgeLabel = index === 0 ? "신규" : "속보";
  const title = article.title || "제목 확인 중";

  return `
    <article class="breaking-news-card ${index === 0 ? "is-hot" : ""}">
      <div class="breaking-news-meta">
        <time class="breaking-news-age">${escapeHtml(formatBreakingTime(article.pub_date || article.collected_at))}</time>
        <span class="badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <h2><a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(title)}</a></h2>
      <p>${escapeHtml(article.description || "원문 링크에서 자세한 내용을 확인하세요.")}</p>
      <div class="breaking-news-footer">
        <span class="breaking-news-source">${escapeHtml(source)}</span>
        <div class="breaking-news-actions">
          <button type="button" data-alert-topic="${escapeHtml(title)}">알림</button>
          <button type="button" data-share-title="${escapeHtml(title)}" data-share-url="${escapeHtml(href)}">공유</button>
        </div>
      </div>
    </article>
  `;
}

function renderBreakingNewsEmpty(message) {
  return `
    <article class="breaking-news-card is-empty">
      <div class="breaking-news-meta">
        <span class="badge neutral">대기</span>
      </div>
      <h2>속보뉴스 수집 대기</h2>
      <p>${escapeHtml(message)}</p>
    </article>
  `;
}

function renderBreakingNewsListItem(article) {
  const href = breakingArticleUrl(article);
  return `
    <a class="breaking-news-list-item" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">
      ${escapeHtml(article.title || "제목 확인 중")}
    </a>
  `;
}

function renderBreakingNewsArchive(articles) {
  if (!articles.length) {
    return "";
  }

  return `
    <div class="breaking-news-list-header">
      <h2>최신 속보 목록</h2>
      <span>${articles.length}개</span>
    </div>
    <div class="breaking-news-list-items">
      ${articles.map(renderBreakingNewsListItem).join("")}
    </div>
  `;
}

function renderBreakingLearningCandidate(candidate, tone) {
  const term = candidate.term || "-";
  const rate = Math.round(Number(candidate.rate || 0) * 100);
  const approved = Number(candidate.approved_count || 0);
  const rejected = Number(candidate.rejected_count || 0);
  const total = Number(candidate.total_count || 0);
  return `
    <li class="breaking-learning-candidate ${tone}">
      <strong>${escapeHtml(term)}</strong>
      <span>${rate}% · 통과 ${approved} · 제외 ${rejected} · 총 ${total}</span>
    </li>
  `;
}

function renderBreakingLearningColumn(title, candidates, tone) {
  const visibleCandidates = (candidates || []).slice(0, breakingLearningCandidateLimit);
  const body = visibleCandidates.length
    ? visibleCandidates.map((candidate) => renderBreakingLearningCandidate(candidate, tone)).join("")
    : `<li class="breaking-learning-empty">후보가 쌓이면 여기에 표시됩니다.</li>`;

  return `
    <section class="breaking-learning-column">
      <h3>${escapeHtml(title)}</h3>
      <ul>${body}</ul>
    </section>
  `;
}

function renderManualApprovals(approvals) {
  const container = document.getElementById("breakingManualApprovals");
  if (!container) {
    return;
  }

  const visibleApprovals = (approvals || []).slice(0, 5);
  if (!visibleApprovals.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="breaking-manual-title">직접 통과 기준</div>
    <div class="breaking-manual-list">
      ${visibleApprovals
        .map((approval) => {
          const label = approval.title || approval.canonical_url || approval.value || "-";
          const type = approval.type === "url" ? "URL" : "제목";
          const count = Number(approval.match_count || 0);
          return `
            <span class="breaking-manual-chip">
              <strong>${escapeHtml(type)}</strong>
              ${escapeHtml(label)}
              ${count ? `<em>${count}회</em>` : ""}
            </span>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderBreakingLearning() {
  const container = document.getElementById("breakingLearningList");
  const summary = document.getElementById("breakingLearningSummary");
  if (!container || !summary) {
    return;
  }

  const learning = breakingStatusSnapshot?.relevance?.learning || {};
  const sampleCount = Number(learning.total_samples || 0);
  const approvedCount = Number(learning.approved_samples || 0);
  const rejectedCount = Number(learning.rejected_samples || 0);
  const manualCount = Number(learning.manual_approval_count || 0);
  summary.textContent = `검증 대기 · 직접 통과 ${manualCount}건 · 샘플 ${sampleCount}건 · 통과 ${approvedCount}건 · 제외 ${rejectedCount}건`;
  renderManualApprovals(learning.manual_approvals || []);

  container.innerHTML = [
    renderBreakingLearningColumn("금융 후보", learning.finance_candidates || [], "positive"),
    renderBreakingLearningColumn("제외 후보", learning.reject_candidates || [], "negative"),
  ].join("");
}

async function saveBreakingLearningApproval(event) {
  event.preventDefault();
  if (breakingLearningSaving) {
    return;
  }

  const input = document.getElementById("breakingLearningInput");
  const feedback = document.getElementById("breakingLearningFeedback");
  const value = input?.value.trim() || "";
  if (!input || !feedback) {
    return;
  }

  if (value.length < 2) {
    feedback.textContent = "URL 또는 제목을 입력해주세요.";
    feedback.className = "breaking-learning-feedback is-error";
    return;
  }

  breakingLearningSaving = true;
  feedback.textContent = "통과 기준으로 저장하는 중입니다.";
  feedback.className = "breaking-learning-feedback";

  try {
    const result = await sendJson("/api/breaking/learning/approve", "POST", { value });
    input.value = "";
    breakingStatusSnapshot = {
      ...(breakingStatusSnapshot || {}),
      relevance: {
        ...((breakingStatusSnapshot || {}).relevance || {}),
        learning: result.learning,
      },
    };
    renderBreakingLearning();
    const removedCount = Number(result.removed_skipped_count || 0);
    feedback.textContent = `통과 기준으로 저장했습니다.${removedCount ? ` 기존 제외 기록 ${removedCount}건도 해제했습니다.` : ""}`;
    feedback.className = "breaking-learning-feedback is-success";
    await sendJson("/api/breaking/poll", "POST");
    await loadBreakingNews();
  } catch (error) {
    feedback.textContent = getFriendlyFetchError(error, "통과 학습 저장에 실패했습니다.");
    feedback.className = "breaking-learning-feedback is-error";
  } finally {
    breakingLearningSaving = false;
  }
}

function updateBreakingStatusText() {
  const status = document.getElementById("breakingNewsStatus");
  const count = document.getElementById("breakingNewsCount");
  if (!status || !count) {
    return;
  }

  if (!breakingStatusSnapshot) {
    status.textContent = "백엔드 연결을 기다리고 있습니다.";
    count.textContent = "연결 대기";
    return;
  }

  const store = breakingStatusSnapshot.store || {};
  const relevance = breakingStatusSnapshot.relevance || {};
  const relevanceSummary = relevance.last_summary || {};
  const filterLabel =
    relevance.enabled === false
      ? "금융필터 꺼짐"
      : relevance.provider === "static"
        ? "정적 미리보기"
        : relevance.provider === "gemini"
          ? "Gemini 금융필터"
          : "키워드 금융필터";
  const cardCount = Math.min(breakingNewsItems.length, breakingCardLimit);
  const archiveCount = Math.max(0, breakingNewsItems.length - breakingCardLimit);
  count.textContent = `${cardCount}개 카드${archiveCount ? ` · 목록 ${archiveCount}개` : ""}`;

  if (breakingStatusSnapshot.poll_in_progress) {
    status.textContent = "네이버 최신순 속보를 수집하는 중입니다.";
    return;
  }

  if (breakingStatusSnapshot.last_error) {
    status.textContent = `수집 대기: ${breakingStatusSnapshot.last_error}`;
    return;
  }

  let secondsUntilNext = Number(breakingStatusSnapshot.seconds_until_next_poll || 0);
  if (breakingStatusSnapshot.next_poll_at) {
    const nextTime = new Date(breakingStatusSnapshot.next_poll_at).getTime();
    if (!Number.isNaN(nextTime)) {
      secondsUntilNext = Math.max(0, Math.ceil((nextTime - Date.now()) / 1000));
    }
  }

  const filterError = relevanceSummary.ai_error || "";
  const filterErrorText = filterError ? ` · ${filterError.slice(0, 90)}` : "";
  const displayWindow = store.display_max_age_hours || 24;
  status.textContent = `${filterLabel} · 최근 ${displayWindow}시간 ${breakingNewsItems.length}건 · 누적 신규 ${store.total_new_count || 0}건 · 제외 ${store.total_skipped_count || 0}건 · 다음 확인 ${formatCountdown(
    secondsUntilNext,
  )}${filterErrorText}`;
}

function renderBreakingNews() {
  const container = document.getElementById("breakingNewsList");
  const archiveContainer = document.getElementById("breakingNewsArchiveList");
  if (!container) {
    return;
  }

  updateBreakingStatusText();

  if (!breakingNewsItems.length) {
    const message = breakingStatusSnapshot?.last_error || "새 속보가 들어오면 이곳에 표시됩니다.";
    container.innerHTML = renderBreakingNewsEmpty(message);
    if (archiveContainer) {
      archiveContainer.innerHTML = "";
    }
    renderBreakingLearning();
    return;
  }

  const cardArticles = breakingNewsItems.slice(0, breakingCardLimit);
  const archiveArticles = breakingNewsItems.slice(breakingCardLimit);
  container.innerHTML = cardArticles.map(renderBreakingNewsCard).join("");
  if (archiveContainer) {
    archiveContainer.innerHTML = renderBreakingNewsArchive(archiveArticles);
  }
  renderBreakingLearning();
}

async function loadBreakingNews() {
  try {
    const [status, articles] = await Promise.all([
      fetchJson("/api/breaking/status"),
      fetchJson(`/api/breaking/news?limit=${breakingFetchLimit}`),
    ]);
    breakingStatusSnapshot = status;
    breakingNewsItems = articles || [];
  } catch (error) {
    breakingStatusSnapshot = {
      last_error: getFriendlyFetchError(error, "속보뉴스 API 연결 실패"),
      store: {},
    };
    breakingNewsItems = [];
  }

  renderBreakingNews();
  renderSnapPickHome();
}

function formatSnappikoValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }
  return `${Math.round(numericValue)}${suffix}`;
}

function formatSnappikoScore(value, max = 100, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }
  return `${Math.round(numericValue)} / ${max}${suffix}`;
}

function formatSnappikoChange(value) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }
  if (numericValue > 0) {
    return `+${Math.round(numericValue)}p`;
  }
  return `${Math.round(numericValue)}p`;
}

function translateSnappikoStatus(value) {
  const map = {
    system_data: "시스템 산출",
    static_preview: "정적 미리보기",
    system_unavailable: "시스템 대기",
    draft: "시스템 산출",
    stale: "캐시",
    unavailable: "대기",
    error: "오류",
  };
  return map[value] || value || "시스템 산출";
}

function formatSnappikoDecimal(value, digits = 2, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }
  return `${numericValue.toFixed(digits)}${suffix}`;
}

function formatSnappikoShortDate(value) {
  if (!value) {
    return "-";
  }
  const parts = String(value).split("-");
  if (parts.length >= 3) {
    return `${Number(parts[1])}.${Number(parts[2])}`;
  }
  return String(value);
}

function isSnappikoNumericValue(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  return Number.isFinite(Number(value));
}

function getSnappikoLastPoint(points, key) {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (isSnappikoNumericValue(points[index]?.[key])) {
      const value = Number(points[index][key]);
      return { date: points[index].date, value };
    }
  }
  return null;
}

function getSnappikoNearestPriorPoint(points, key, targetDate) {
  if (!targetDate) {
    return getSnappikoLastPoint(points, key);
  }
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index];
    if (point?.date <= targetDate && isSnappikoNumericValue(point?.[key])) {
      return { date: point.date, value: Number(point[key]) };
    }
  }
  return null;
}

function getSnappikoBondPeriodConfig(ratesChart = {}) {
  return ratesChart.periods?.[snappikoBondPeriod] || ratesChart.periods?.daily || {
    label: "일봉",
    range: "최근 6개월",
    frequency: "daily",
    points: ratesChart.points || [],
  };
}

function buildSnappikoFocusedBondRows(ratesChart = {}, dollarChart = {}) {
  const periodConfig = getSnappikoBondPeriodConfig(ratesChart);
  const ratePoints = periodConfig.points || ratesChart.points || [];
  const dollarPoints = (dollarChart.points || []).map((point) => ({
    date: point.date,
    dollar: point.value,
  }));
  const japanDates = ratePoints
    .filter((point) => isSnappikoNumericValue(point?.jp10y) || isSnappikoNumericValue(point?.jp30y))
    .map((point) => point.date);
  const focusDates = [...new Set(ratePoints.map((point) => point.date))];
  const rows = focusDates
    .map((observedDate) => {
      const sourcePoint = ratePoints.find((point) => point.date === observedDate) || {};
      return {
        date: observedDate,
        us10y: getSnappikoNearestPriorPoint(ratePoints, "us10y", observedDate)?.value,
        us30y: getSnappikoNearestPriorPoint(ratePoints, "us30y", observedDate)?.value,
        jp10y: sourcePoint.jp10y,
        jp30y: sourcePoint.jp30y,
        dollar: getSnappikoNearestPriorPoint(dollarPoints, "dollar", observedDate)?.value,
      };
    })
    .filter((point) => ["us10y", "us30y", "jp10y", "jp30y", "dollar"].some((key) => isSnappikoNumericValue(point[key])));

  return {
    rows,
    mode: periodConfig.frequency || "daily",
    label: periodConfig.label || "일봉",
    range: periodConfig.range || "최근 구간",
    firstDate: rows[0]?.date || "",
    lastDate: rows[rows.length - 1]?.date || "",
    japanCount: japanDates.length,
  };
}

function getSnappikoChartSeries(ratesChart = {}, dollarChart = {}, chartRows = null) {
  const ratePoints = chartRows || ratesChart.points || [];
  const dollarPoints =
    chartRows ||
    (dollarChart.points || []).map((point) => ({
      date: point.date,
      dollar: point.value,
    }));
  return [
    { key: "us10y", label: "미국 10Y", color: "#facc15", digits: 2, suffix: "%", points: ratePoints },
    { key: "us30y", label: "미국 30Y", color: "#fb7185", digits: 2, suffix: "%", points: ratePoints },
    { key: "jp10y", label: "일본 10Y", color: "#38bdf8", digits: 3, suffix: "%", points: ratePoints, focus: true },
    { key: "jp30y", label: "일본 30Y", color: "#a78bfa", digits: 3, suffix: "%", points: ratePoints, focus: true },
    { key: "dollar", label: "광의 달러지수", color: "#34d399", digits: 2, suffix: "", points: dollarPoints, dashed: true },
  ];
}

function buildSnappikoLinePath(points, key, width, height, padding) {
  const values = points.filter((point) => isSnappikoNumericValue(point?.[key])).map((point) => Number(point[key]));
  if (values.length < 2) {
    return "";
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = points.length > 1 ? (width - padding.left - padding.right) / (points.length - 1) : 0;
  let path = "";
  let hasOpenSegment = false;

  points.forEach((point, index) => {
    if (!isSnappikoNumericValue(point?.[key])) {
      hasOpenSegment = false;
      return;
    }
    const value = Number(point[key]);
    const ratio = max === min ? 0.5 : (value - min) / range;
    const x = padding.left + xStep * index;
    const y = padding.top + (1 - ratio) * (height - padding.top - padding.bottom);
    path += `${hasOpenSegment ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
    hasOpenSegment = true;
  });

  return path.trim();
}

function getSnappikoLastCoordinate(points, key, width, height, padding) {
  const values = points.filter((point) => isSnappikoNumericValue(point?.[key])).map((point) => Number(point[key]));
  if (values.length < 2) {
    return null;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = points.length > 1 ? (width - padding.left - padding.right) / (points.length - 1) : 0;
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (!isSnappikoNumericValue(points[index]?.[key])) {
      continue;
    }
    const value = Number(points[index][key]);
    const ratio = max === min ? 0.5 : (value - min) / range;
    return {
      x: padding.left + xStep * index,
      y: padding.top + (1 - ratio) * (height - padding.top - padding.bottom),
    };
  }
  return null;
}

function renderSnappikoBondChart(ratesChart = {}, dollarChart = {}) {
  const width = 720;
  const height = 278;
  const padding = { top: 18, right: 30, bottom: 38, left: 34 };
  const chartData = buildSnappikoFocusedBondRows(ratesChart, dollarChart);
  const series = getSnappikoChartSeries(ratesChart, dollarChart, chartData.rows).filter((item) => getSnappikoLastPoint(item.points, item.key));
  if (!series.length) {
    return `<div class="snappiko-chart-empty">차트 데이터 대기</div>`;
  }

  const firstDate = chartData.firstDate || series[0].points.find((point) => isSnappikoNumericValue(point?.[series[0].key]))?.date || "";
  const lastDate = chartData.lastDate || ratesChart.latest?.date || dollarChart.latest?.date || "";
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const y = padding.top + ratio * (height - padding.top - padding.bottom);
      return `<line x1="${padding.left}" y1="${y.toFixed(1)}" x2="${width - padding.right}" y2="${y.toFixed(1)}" />`;
    })
    .join("");
  const paths = series
    .map((item) => {
      const path = buildSnappikoLinePath(item.points, item.key, width, height, padding);
      if (!path) {
        return "";
      }
      const point = getSnappikoLastCoordinate(item.points, item.key, width, height, padding);
      return `
        <path d="${path}" stroke="${item.color}" class="${[item.dashed ? "is-dashed" : "", item.focus ? "is-focus" : ""].filter(Boolean).join(" ")}" />
        ${point ? `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${item.focus ? "5.2" : "4.2"}" fill="${item.color}" />` : ""}
      `;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="미국 일본 장기금리와 광의 달러지수 통합 차트">
      <g class="snappiko-chart-grid">${gridLines}</g>
      <g class="snappiko-chart-lines">${paths}</g>
      <text x="${padding.left}" y="14" class="snappiko-chart-axis">상대 고점</text>
      <text x="${padding.left}" y="${height - 28}" class="snappiko-chart-axis">상대 저점</text>
      <text x="${padding.left}" y="${height - 12}" class="snappiko-chart-axis">${escapeHtml(formatSnappikoShortDate(firstDate))}</text>
      <text x="${width - padding.right}" y="${height - 12}" text-anchor="end" class="snappiko-chart-axis">${escapeHtml(formatSnappikoShortDate(lastDate))}</text>
    </svg>
    <p>mode=${escapeHtml(chartData.mode)} · range=${escapeHtml(chartData.range)} · points=${chartData.rows.length}</p>
  `;
}

function renderSnappikoBondLegend(ratesChart = {}, dollarChart = {}) {
  const chartData = buildSnappikoFocusedBondRows(ratesChart, dollarChart);
  const series = getSnappikoChartSeries(ratesChart, dollarChart, chartData.rows).filter((item) => getSnappikoLastPoint(item.points, item.key));
  if (!series.length) {
    return `<span class="snappiko-legend-empty">범례 대기</span>`;
  }

  return series
    .map((item) => {
      const latest = getSnappikoLastPoint(item.points, item.key);
      return `
        <span class="${item.dashed ? "is-dashed" : ""}" style="--line-color:${item.color}">
          ${escapeHtml(item.label)}
          <strong>${formatSnappikoDecimal(latest?.value, item.digits, item.suffix)}</strong>
        </span>
      `;
    })
    .join("");
}

function getSnappikoBondChartMeta(ratesChart = {}, dollarChart = {}) {
  const chartData = buildSnappikoFocusedBondRows(ratesChart, dollarChart);
  const range = chartData.firstDate && chartData.lastDate ? `${formatSnappikoShortDate(chartData.firstDate)}~${formatSnappikoShortDate(chartData.lastDate)}` : "범위 대기";
  const dollarCount = dollarChart.points?.length || 0;
  return `${chartData.label} · ${chartData.range} · ${chartData.rows.length}개 표시 · 달러 ${dollarCount}개 관측치 · ${range}`;
}

function renderSnappikoDollarIndexCard(dollarIndex = {}, dollarChart = {}) {
  const latest = dollarIndex.value
    ? { value: dollarIndex.value, date: dollarIndex.as_of }
    : getSnappikoLastPoint((dollarChart.points || []).map((point) => ({ date: point.date, value: point.value })), "value");
  if (!latest) {
    return `
      <div class="snappiko-dollar-head">
        <span>광의 달러지수</span>
        <small>FRED DTWEXBGS</small>
      </div>
      <strong>--</strong>
      <p>달러지수 데이터 대기</p>
    `;
  }

  return `
    <div class="snappiko-dollar-head">
      <span>광의 달러지수</span>
      <small>FRED DTWEXBGS</small>
    </div>
    <strong>${escapeHtml(latest.value)}</strong>
    <small>점수대 ${escapeHtml(dollarIndex.phase || "대기")} · 점수 ${formatSnappikoScore(dollarIndex.score, dollarIndex.max || 100)} · ${escapeHtml(latest.date || "-")}</small>
    <p>${escapeHtml(dollarIndex.detail || dollarChart.source || "source=FRED DTWEXBGS")}</p>
  `;
}

function renderSnappikoLiquidityChart(liquidityChart = {}) {
  const points = liquidityChart.points || [];
  const series = [
    { key: "net_fed_liquidity", label: "순 Fed", color: "#34d399", digits: 0, suffix: "B", points },
    { key: "fed_assets", label: "Fed 총자산", color: "#facc15", digits: 0, suffix: "B", points },
    { key: "reserves", label: "지급준비금", color: "#38bdf8", digits: 0, suffix: "B", points },
    { key: "rrp", label: "ON RRP", color: "#a78bfa", digits: 0, suffix: "B", points, dashed: true },
    { key: "tga", label: "TGA", color: "#fb7185", digits: 0, suffix: "B", points, dashed: true },
  ].filter((item) => getSnappikoLastPoint(item.points, item.key));

  if (!series.length) {
    return `<div class="snappiko-chart-empty">유동성 차트 데이터 대기</div>`;
  }

  const width = 720;
  const height = 260;
  const padding = { top: 18, right: 30, bottom: 38, left: 34 };
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const y = padding.top + ratio * (height - padding.top - padding.bottom);
      return `<line x1="${padding.left}" y1="${y.toFixed(1)}" x2="${width - padding.right}" y2="${y.toFixed(1)}" />`;
    })
    .join("");
  const paths = series
    .map((item) => {
      const path = buildSnappikoLinePath(item.points, item.key, width, height, padding);
      const point = getSnappikoLastCoordinate(item.points, item.key, width, height, padding);
      return path
        ? `
          <path d="${path}" stroke="${item.color}" class="${item.dashed ? "is-dashed" : ""}" />
          ${point ? `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4.2" fill="${item.color}" />` : ""}
        `
        : "";
    })
    .join("");
  const firstDate = points.find((point) => series.some((item) => isSnappikoNumericValue(point[item.key])))?.date || "";
  const lastDate = points[points.length - 1]?.date || "";
  const legend = series
    .map((item) => {
      const latest = getSnappikoLastPoint(item.points, item.key);
      return `<span style="--line-color:${item.color}">${escapeHtml(item.label)} <strong>${formatSnappikoDecimal(latest?.value, item.digits, item.suffix)}</strong></span>`;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="달러 유동성 차트">
      <g class="snappiko-chart-grid">${gridLines}</g>
      <g class="snappiko-chart-lines">${paths}</g>
      <text x="${padding.left}" y="14" class="snappiko-chart-axis">상대 고점</text>
      <text x="${padding.left}" y="${height - 28}" class="snappiko-chart-axis">상대 저점</text>
      <text x="${padding.left}" y="${height - 12}" class="snappiko-chart-axis">${escapeHtml(formatSnappikoShortDate(firstDate))}</text>
      <text x="${width - padding.right}" y="${height - 12}" text-anchor="end" class="snappiko-chart-axis">${escapeHtml(formatSnappikoShortDate(lastDate))}</text>
    </svg>
    <p>formula=${escapeHtml(liquidityChart.formula || "WALCL - WTREGEN - RRPONTSYD")} · points=${points.length}</p>
    <div class="snappiko-liquidity-legend">${legend}</div>
  `;
}

function renderSnappikoLiquidityComponents(liquidity = {}) {
  const components = liquidity.components || [];
  if (!components.length) {
    return `<div class="snappiko-component is-empty">유동성 구성 데이터 대기</div>`;
  }

  return components
    .map(
      (component) => `
        <div class="snappiko-liquidity-component">
          <span>${escapeHtml(component.label || "-")}</span>
          <strong>${escapeHtml(component.value || "--")}</strong>
          <small>${escapeHtml(component.change || "변화 대기")} · 점수 ${formatSnappikoScore(component.score, 100)}</small>
          <p>${escapeHtml(component.detail || "")}</p>
        </div>
      `,
    )
    .join("");
}

function snappikoImpactTag(article) {
  const text = `${article?.title || ""} ${article?.description || ""}`.toLowerCase();
  if (text.includes("금리") || text.includes("국채") || text.includes("채권")) {
    return "금리";
  }
  if (text.includes("나스닥") || text.includes("반도체") || text.includes("ai")) {
    return "나스닥";
  }
  if (text.includes("환율") || text.includes("달러") || text.includes("엔화") || text.includes("원화")) {
    return "FX";
  }
  if (text.includes("유가") || text.includes("원유")) {
    return "원자재";
  }
  return "시장";
}

function filterSnappikoRelatedNews(items = []) {
  const scored = items.map((article) => {
    const tag = snappikoImpactTag(article);
    const score = tag === "시장" ? 0 : 1;
    return { article, tag, score };
  });
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => ({ ...item.article, snappiko_tag: item.tag }));
}

function renderSnappikoCycleItem(item) {
  const max = item.group === "종합" ? 1000 : 100;
  const scoreText = item.score === null || item.score === undefined ? "점수 대기" : formatSnappikoScore(item.score, max);
  return `
    <div class="snappiko-cycle-item">
      <div>
        <small>${escapeHtml(item.group || "GROUP")}</small>
        <strong>${escapeHtml(item.label || "대기")}</strong>
          <span>${escapeHtml(item.description || scoreText)}</span>
      </div>
      <em>점수대 ${escapeHtml(item.phase || "대기")}</em>
    </div>
  `;
}

function renderSnappikoContributor(contributor) {
  const tone = contributor.tone === "warning" ? "warning" : "neutral";
  return `
    <div class="snappiko-contributor ${tone}">
      <div>
        <strong>${escapeHtml(contributor.label || "대기")}</strong>
        <span>${escapeHtml(contributor.detail || "")}</span>
      </div>
      <em>${escapeHtml(contributor.value || "--")}</em>
    </div>
  `;
}

function renderSnappikoHistory(history = []) {
  const safeHistory = history.slice(-52);
  if (!safeHistory.length) {
    return `<div class="snappiko-history-empty">히스토리 계산 대기</div>`;
  }

  const bars = safeHistory
    .map((item) => {
      const score = Number(item.score || 0);
      const height = Math.max(8, Math.min(100, score / 10));
      const tone = score >= 700 ? "hot" : score <= 350 ? "cool" : "mild";
      return `<span class="snappiko-history-bar ${tone}" style="height:${height}%" title="${escapeHtml(item.date)} · ${score}/1000" aria-label="${escapeHtml(item.date)} ${score}/1000"></span>`;
    })
    .join("");

  return `
    <div class="snappiko-history-bar-row">${bars}</div>
    <div class="snappiko-history-scale">
      <span>0</span>
      <span>500</span>
      <span>1000</span>
    </div>
  `;
}

function renderSnappikoRelatedNews(items = []) {
  if (!items.length) {
    return `
      <div class="snappiko-related-empty">
        <strong>연결된 영향 뉴스 대기</strong>
        <span>금리, 나스닥, 환율, 원자재 태그가 붙은 금융 속보가 들어오면 여기에 표시합니다.</span>
      </div>
    `;
  }

  return items
    .slice(0, 4)
    .map(
      (article) => `
        <a class="snappiko-related-item" href="${escapeHtml(article.url || article.origin_url || article.naver_url || "#")}" target="_blank" rel="noreferrer">
          <span>${escapeHtml(article.snappiko_tag || snappikoImpactTag(article))}</span>
          <strong>${escapeHtml(article.title || "제목 대기")}</strong>
          <small>${escapeHtml(article.source_host || article.publisher || "출처 대기")} · ${escapeHtml(article.published_at || article.pub_date || "시각 대기")}</small>
        </a>
      `,
    )
    .join("");
}

function renderSnappikoPeriodHeat(title, heat) {
  const components = heat?.components || [];
  const body = components.length
    ? components
        .map(
          (component) => `
            <div class="snappiko-component">
              <span>${escapeHtml(component.label || "-")}</span>
              <strong>${escapeHtml(component.value || "--")}</strong>
              <small>백분위 ${formatSnappikoValue(component.percentile, "%")}</small>
            </div>
          `,
        )
        .join("")
    : `<div class="snappiko-component is-empty">지표 계산 대기</div>`;

  return `
    <section class="snappiko-heat-block">
      <div>
        <span>${escapeHtml(title)}</span>
        <strong>${formatSnappikoScore(heat?.score, heat?.max || 100)}</strong>
        <small>점수대 ${escapeHtml(heat?.label || "대기")} · ${escapeHtml(heat?.as_of || "확정 전")}</small>
      </div>
      <div class="snappiko-component-grid">${body}</div>
    </section>
  `;
}

function renderSnappikoBondMarket(market) {
  const components = market?.components || [];
  const body = components.length
    ? components
        .map(
          (component) => `
            <div class="snappiko-component">
              <span>${escapeHtml(component.label || "-")}</span>
              <strong>${escapeHtml(component.value || "--")}</strong>
              <small>점수 ${formatSnappikoScore(component.percentile, 100)}</small>
            </div>
          `,
        )
        .join("")
    : `<div class="snappiko-component is-empty">채권 지표 계산 대기</div>`;

  return `
    <section class="snappiko-heat-block">
      <div>
        <span>${escapeHtml(market?.label || "채권 대기")}</span>
        <strong>${escapeHtml(market?.value || "--")}</strong>
        <small>${escapeHtml(market?.detail || market?.source || "데이터 대기")}</small>
      </div>
      <div class="snappiko-component-grid">${body}</div>
    </section>
  `;
}

function renderSnappikoIndex() {
  const status = document.getElementById("snappikoIndexStatus");
  const count = document.getElementById("snappikoIndexCount");
  const overallScore = document.getElementById("snappikoOverallScore");
  const overallLabel = document.getElementById("snappikoOverallLabel");
  const heatScore = document.getElementById("snappikoHeatScore");
  const heatLabel = document.getElementById("snappikoHeatLabel");
  const bondScore = document.getElementById("snappikoBondScore");
  const bondLabel = document.getElementById("snappikoBondLabel");
  const confidence = document.getElementById("snappikoConfidence");
  const dataNote = document.getElementById("snappikoDataNote");
  const summary = document.getElementById("snappikoSummary");
  const contributors = document.getElementById("snappikoContributors");
  const heatDetails = document.getElementById("snappikoHeatDetails");
  const heatAsOf = document.getElementById("snappikoHeatAsOf");
  const bondDetails = document.getElementById("snappikoBondDetails");
  const bondAsOf = document.getElementById("snappikoBondAsOf");
  const bondChart = document.getElementById("snappikoBondChart");
  const bondLegend = document.getElementById("snappikoBondLegend");
  const bondChartMeta = document.getElementById("snappikoBondChartMeta");
  const dollarIndexBadge = document.getElementById("snappikoDollarIndexBadge");
  const dollarIndexCard = document.getElementById("snappikoDollarIndexCard");
  const liquidityAsOf = document.getElementById("snappikoLiquidityAsOf");
  const liquidityScore = document.getElementById("snappikoLiquidityScore");
  const liquidityLabel = document.getElementById("snappikoLiquidityLabel");
  const liquiditySummary = document.getElementById("snappikoLiquiditySummary");
  const liquidityChart = document.getElementById("snappikoLiquidityChart");
  const liquidityComponents = document.getElementById("snappikoLiquidityComponents");
  const cycleBoard = document.getElementById("snappikoCycleBoard");
  const phaseLabel = document.getElementById("snappikoPhaseLabel");
  const gaugeScore = document.getElementById("snappikoGaugeScore");
  const gaugeMeta = document.getElementById("snappikoGaugeMeta");
  const gaugeNeedle = document.getElementById("snappikoGaugeNeedle");
  const panicScore = document.getElementById("snappikoPanicScore");
  const boomScore = document.getElementById("snappikoBoomScore");
  const fragilityScore = document.getElementById("snappikoFragilityScore");
  const weeklyChange = document.getElementById("snappikoWeeklyChange");
  const historyBars = document.getElementById("snappikoHistoryBars");
  const historySummary = document.getElementById("snappikoHistorySummary");
  const relatedNews = document.getElementById("snappikoRelatedNews");
  const sourceNote = document.getElementById("snappikoSourceNote");

  if (!status || !count) {
    return;
  }

  if (!snappikoSnapshot) {
    status.textContent = "스냅픽코 지수 API 연결을 기다리고 있습니다.";
    count.textContent = "연결 대기";
    return;
  }

  const overall = snappikoSnapshot.overall || {};
  const nasdaqHeat = snappikoSnapshot.nasdaq_heat || {};
  const bondStress = snappikoSnapshot.bond_stress || {};
  const dollarIndex = snappikoSnapshot.dollar_index || {};
  const liquidity = snappikoSnapshot.liquidity || {};
  const charts = snappikoSnapshot.charts || {};
  const panicBoom = snappikoSnapshot.panic_boom || {};
  const phase = overall.phase || {};
  const data = snappikoSnapshot.data || {};
  const source = data.source || "source";
  const latestDate = data.latest_daily_date || "날짜 대기";
  const dataGaps = (data.data_gaps || []).filter(Boolean);
  const confidenceText = formatSnappikoValue(data.confidence, "%");
  const coverageText = formatSnappikoValue(data.data_coverage, "%");
  const methodNotes = (data.method_notes || []).filter(Boolean);
  const dataOnlyStatus = dataGaps.length
    ? `데이터 공백: ${dataGaps[0]}`
    : methodNotes.length
      ? `시스템 산식: ${methodNotes[0]}`
      : "시스템 수집값과 코드 산식만 표시합니다. 없는 항목은 대기/빈 값입니다.";

  const coverageLabel = data.confidence_label || "데이터 커버리지";
  const statusCoverage = confidenceText === coverageText ? `${coverageLabel} ${coverageText}` : `${coverageLabel} ${confidenceText} · 데이터 커버리지 ${coverageText}`;
  status.textContent = `${source} · 최신 ${latestDate} · ${statusCoverage}`;
  count.textContent = `DATA ONLY · ${translateSnappikoStatus(snappikoSnapshot.status)}`;

  if (overallScore) {
    overallScore.textContent = formatSnappikoScore(overall.score, overall.max || 1000);
  }
  if (overallLabel) {
    overallLabel.textContent = `점수대 ${overall.phase_label || overall.label || "대기"} · 종합 점수`;
  }
  if (heatScore) {
    heatScore.textContent = formatSnappikoScore(nasdaqHeat.score, nasdaqHeat.max || 100);
  }
  if (heatLabel) {
    heatLabel.textContent = `점수대 ${nasdaqHeat.label || "대기"} · Nasdaq Heat`;
  }
  if (bondScore) {
    bondScore.textContent = formatSnappikoScore(bondStress.score, bondStress.max || 100);
  }
  if (bondLabel) {
    bondLabel.textContent = `점수대 ${bondStress.label || "대기"} · Bond Stress`;
  }
  if (confidence) {
    confidence.textContent = confidenceText;
  }
  if (dataNote) {
    dataNote.textContent = `커버리지 ${coverageText} · 주봉 ${data.weekly_bar_date || "-"} · 월봉 ${data.monthly_bar_date || "-"}`;
  }
  if (summary) {
    summary.textContent = dataOnlyStatus;
  }
  if (cycleBoard) {
    const items = snappikoSnapshot.cycle_map || [];
    cycleBoard.innerHTML = items.length ? items.map(renderSnappikoCycleItem).join("") : `<div class="snappiko-related-empty">순환판 대기</div>`;
  }
  if (phaseLabel) {
    phaseLabel.textContent = `점수대 ${overall.phase_label || "대기"}`;
  }
  if (gaugeScore) {
    gaugeScore.textContent = formatSnappikoValue(overall.score);
  }
  if (gaugeMeta) {
    const percentile = phase.percentile ?? overall.state_percentile;
    gaugeMeta.textContent = `백분위 ${formatSnappikoValue(percentile, "%")} · 전주 변화 ${formatSnappikoChange(overall.weekly_change)}`;
  }
  if (gaugeNeedle) {
    const ratio = Number(overall.phase_ratio || phase.ratio || 0);
    const angle = -70 + Math.max(0, Math.min(100, ratio)) * 1.4;
    gaugeNeedle.style.setProperty("--snappiko-angle", `${angle}deg`);
  }
  if (panicScore) {
    panicScore.textContent = formatSnappikoScore(panicBoom.panic_score, panicBoom.panic_max || 100);
  }
  if (boomScore) {
    boomScore.textContent = formatSnappikoScore(panicBoom.boom_score, panicBoom.boom_max || 100);
  }
  if (fragilityScore) {
    fragilityScore.textContent = formatSnappikoChange(panicBoom.fragility_overlay);
  }
  if (weeklyChange) {
    weeklyChange.textContent = formatSnappikoChange(overall.weekly_change);
  }
  if (historyBars) {
    historyBars.innerHTML = renderSnappikoHistory(snappikoSnapshot.history || []);
    historyBars.setAttribute("aria-label", `${overall.phase_label || "대기"} 점수대의 최근 점수 히스토리`);
  }
  if (historySummary) {
    const history = snappikoSnapshot.history || [];
    const first = history[0]?.date || data.history_start_date || "-";
    const last = history[history.length - 1]?.date || data.latest_daily_date || "-";
    historySummary.textContent = `${first} ~ ${last} · ${history.length || 0}개 주봉`;
  }
  if (relatedNews) {
    relatedNews.innerHTML = renderSnappikoRelatedNews(snappikoRelatedNewsItems);
  }
  if (contributors) {
    const items = snappikoSnapshot.contributors || [];
    contributors.innerHTML = items.length
      ? items.map(renderSnappikoContributor).join("")
      : `<div class="snappiko-contributor neutral"><strong>입력 데이터 대기</strong><em>--</em></div>`;
  }
  if (heatDetails) {
    heatDetails.innerHTML = [
      renderSnappikoPeriodHeat("주봉 60%", nasdaqHeat.weekly || {}),
      renderSnappikoPeriodHeat("월봉 40%", nasdaqHeat.monthly || {}),
    ].join("");
  }
  if (heatAsOf) {
    heatAsOf.textContent = `확정 주봉 ${data.weekly_bar_date || "-"} · 확정 월봉 ${data.monthly_bar_date || "-"}`;
  }
  if (bondDetails) {
    const markets = bondStress.markets || [];
    bondDetails.innerHTML = markets.length
      ? markets.map(renderSnappikoBondMarket).join("")
      : `<section class="snappiko-heat-block"><div><span>미국/일본 채권</span><strong>--</strong><small>데이터 대기</small></div></section>`;
  }
  if (bondChart) {
    bondChart.innerHTML = renderSnappikoBondChart(charts.rates_4way || {}, charts.dollar_index || {});
  }
  if (bondLegend) {
    bondLegend.innerHTML = renderSnappikoBondLegend(charts.rates_4way || {}, charts.dollar_index || {});
  }
  if (bondChartMeta) {
    bondChartMeta.textContent = getSnappikoBondChartMeta(charts.rates_4way || {}, charts.dollar_index || {});
  }
  document.querySelectorAll("[data-bond-period]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.bondPeriod === snappikoBondPeriod);
  });
  if (dollarIndexBadge) {
    dollarIndexBadge.textContent = dollarIndex.value
      ? `DTWEXBGS ${dollarIndex.value} · 점수대 ${dollarIndex.phase || "대기"}`
      : "달러지수 대기";
  }
  if (dollarIndexCard) {
    dollarIndexCard.innerHTML = renderSnappikoDollarIndexCard(dollarIndex, charts.dollar_index || {});
  }
  if (liquidityScore) {
    liquidityScore.textContent = formatSnappikoScore(liquidity.score, liquidity.max || 100);
  }
  if (liquidityLabel) {
    liquidityLabel.textContent = `${liquidity.value || "대기"} · 점수 ${formatSnappikoScore(liquidity.score, liquidity.max || 100)}`;
  }
  if (liquiditySummary) {
    liquiditySummary.textContent = liquidity.detail || "유동성 데이터 대기";
  }
  if (liquidityAsOf) {
    liquidityAsOf.textContent = `최신 유동성 ${liquidity.as_of || charts.liquidity?.latest?.date || "-"}`;
  }
  if (liquidityChart) {
    liquidityChart.innerHTML = renderSnappikoLiquidityChart(charts.liquidity || {});
  }
  if (liquidityComponents) {
    liquidityComponents.innerHTML = renderSnappikoLiquidityComponents(liquidity);
  }
  if (bondAsOf) {
    bondAsOf.textContent = `최신 채권 ${bondStress.latest_date || data.bond_data_date || "-"}`;
  }
  if (sourceNote) {
    sourceNote.textContent = `출처: ${source} · 주봉 ${data.weekly_bar_date || "-"} 확정 · 월봉 ${data.monthly_bar_date || "-"} 확정 · 최신 갱신 ${data.last_updated || "-"} · ${statusCoverage}`;
  }
}

async function loadSnappikoIndex({ forceRefresh = false } = {}) {
  if (snappikoLoading) {
    return;
  }

  snappikoLoading = true;
  const status = document.getElementById("snappikoIndexStatus");
  const refreshButton = document.getElementById("snappikoRefreshButton");
  if (status) {
    status.textContent = "Nasdaq Heat와 미국/일본 채권 스트레스를 계산하는 중입니다.";
  }
  if (refreshButton) {
    refreshButton.disabled = true;
  }

  try {
    const query = forceRefresh ? "?force_refresh=true" : "";
    const [snapshot, relatedNews] = await Promise.all([
      fetchJson(`/api/snappiko/index${query}`),
      fetchJson("/api/breaking/news?limit=12").catch(() => []),
    ]);
    snappikoSnapshot = snapshot;
    snappikoRelatedNewsItems = filterSnappikoRelatedNews(relatedNews || []);
  } catch (error) {
    const errorMessage = getFriendlyFetchError(error, "스냅픽코 지수 API 연결 실패");
    snappikoSnapshot = {
      status: "error",
      overall: {
        score: null,
        label: "대기",
        phase: { label: "대기", ratio: 0 },
        summary: null,
      },
      nasdaq_heat: {
        score: null,
        label: "대기",
        weekly: {},
        monthly: {},
        adjustment_points: null,
        adjustment_label: "formula=max(0,min(15,(score-60)/30*15)); value=unavailable",
      },
      bond_stress: {
        score: null,
        label: "대기",
        adjustment_points: null,
        adjustment_label: "formula=max(0,min(20,(score-55)/40*20)); value=unavailable",
        latest_date: "",
        markets: [],
      },
      panic_boom: { panic_score: null, boom_score: null, panic_max: 100, boom_max: 100, fragility_overlay: null },
      cycle_map: [],
      history: [],
      dollar_index: {},
      liquidity: {},
      charts: {},
      data: {
        confidence: 0,
        data_coverage: 0,
        confidence_label: "데이터 커버리지",
        data_gaps: [errorMessage],
        uses_ai: false,
        interpretation_mode: "disabled",
        data_policy: "collected_series_and_code_formula_only",
        missing_value_policy: "missing_inputs_return_null",
        synthetic_values: false,
        model_generated_fields: [],
      },
      contributors: [],
      warnings: [errorMessage],
    };
    snappikoRelatedNewsItems = [];
  } finally {
    snappikoLoading = false;
    if (refreshButton) {
      refreshButton.disabled = false;
    }
  }

  renderSnappikoIndex();
  renderSnapPickHome();
}

function getFriendlyFetchError(error, fallbackMessage) {
  const message = error?.message || "";
  if (error?.name === "TypeError" || message.includes("Failed to fetch")) {
    return "서버 연결이 끊겼습니다. 백엔드 서버를 다시 켜주세요.";
  }
  return message || fallbackMessage;
}

async function fetchJson(path) {
  try {
    const response = await fetch(apiUrl(path));
    if (!response.ok) {
      const fallback = staticPreviewResponse(path);
      if (fallback.found) {
        return fallback.data;
      }
      throw new Error(`API 오류 ${response.status}`);
    }

    return response.json();
  } catch (error) {
    const fallback = staticPreviewResponse(path);
    if (fallback.found) {
      return fallback.data;
    }
    throw error;
  }
}

async function sendJson(path, method, payload = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  let response = null;
  try {
    response = await fetch(apiUrl(path), options);
  } catch (error) {
    const fallback = staticMutationResponse(path, payload);
    if (fallback.found) {
      return fallback.data;
    }
    throw error;
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const fallback = staticMutationResponse(path, payload);
    if (fallback.found) {
      return fallback.data;
    }
    const detail = Array.isArray(data?.detail) ? data.detail.map((item) => item.msg).join(", ") : data?.detail;
    throw new Error(data?.error || detail || `API 오류 ${response.status}`);
  }

  return data;
}

function formatWon(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "-";
  }

  return `${Math.round(number).toLocaleString("ko-KR")}원`;
}

function formatSignedWon(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "-";
  }

  const sign = number > 0 ? "+" : number < 0 ? "-" : "";
  return `${sign}${formatWon(Math.abs(number))}`;
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "-";
  }

  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}%`;
}

function formatRecordDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(date);
}

function formatMonth(value) {
  if (!value) {
    return "-";
  }

  const [year, month] = String(value).split("-");
  if (!year || !month) {
    return value;
  }

  return `${year}.${month}`;
}

function getRecordAsset(record) {
  return finiteNumberOrNull(record?.ending_net_asset ?? record?.asset_value);
}

function getRecordProfit(record) {
  return finiteNumberOrNull(record?.investment_profit_loss ?? record?.daily_profit_loss);
}

function getRecordReturn(record) {
  return finiteNumberOrNull(record?.daily_return_rate);
}

function finiteNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function valueToneClass(value) {
  const number = Number(value);
  if (number > 0) {
    return "positive";
  }
  if (number < 0) {
    return "negative";
  }
  return "";
}

function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setPortfolioFeedback(message, tone = "") {
  const feedback = document.getElementById("portfolioFeedback");
  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.classList.toggle("is-error", tone === "error");
  feedback.classList.toggle("is-success", tone === "success");
}

function getPortfolioSummary() {
  if (portfolioSummary) {
    return portfolioSummary;
  }

  const [latest, previous] = [...portfolioRecords].sort((a, b) => b.record_date.localeCompare(a.record_date));
  const [latestMonth] = [...portfolioMonthlyRecords].sort((a, b) => b.month.localeCompare(a.month));
  if (!latest) {
    return {
      latest_asset: null,
      latest_return_rate: null,
      latest_profit_loss: null,
      latest_record_date: null,
      record_count: 0,
      asset_change: null,
      asset_change_rate: null,
      latest_month: latestMonth || null,
      updated_at: null,
    };
  }

  const assetChange = Number.isFinite(getRecordProfit(latest))
    ? getRecordProfit(latest)
    : previous
      ? getRecordAsset(latest) - getRecordAsset(previous)
      : null;
  const previousAsset = getRecordAsset(previous);
  const assetChangeRate = previous && previousAsset ? (assetChange / previousAsset) * 100 : null;

  return {
    latest_asset: getRecordAsset(latest),
    latest_return_rate: latest.daily_return_rate ?? assetChangeRate,
    latest_profit_loss: latest.investment_profit_loss ?? assetChange,
    latest_record_date: latest.record_date,
    record_count: portfolioRecords.length,
    asset_change: assetChange,
    asset_change_rate: assetChangeRate,
    latest_month: latestMonth || null,
    d2_cash: latest.snapshot?.d2_cash,
    short_sale_valuation: latest.snapshot?.short_sale_valuation,
    updated_at: latest.updated_at,
  };
}

function renderPortfolioSummary() {
  const summary = getPortfolioSummary();
  const returnElement = document.getElementById("portfolioDailyReturn");
  const dailyProfitElement = document.getElementById("portfolioDailyProfit");
  const monthlyProfitElement = document.getElementById("portfolioMonthlyProfit");
  const monthlyReturnElement = document.getElementById("portfolioMonthlyReturn");
  const latestMonth = summary.latest_month || null;

  setText("portfolioLatestAsset", formatWon(summary.latest_asset));
  setText("portfolioLatestDate", summary.latest_record_date ? `${formatRecordDate(summary.latest_record_date)} 기준` : "기록 대기");
  setText("portfolioDailyProfit", formatSignedWon(summary.latest_profit_loss));
  setText("portfolioDailyProfitHint", summary.latest_profit_loss === null || summary.latest_profit_loss === undefined ? "첫 기록은 기준값" : "입출금 보정 후");
  setText("portfolioDailyReturn", formatPercent(summary.latest_return_rate));
  setText("portfolioReturnHint", summary.latest_record_date ? `누적 ${summary.record_count || 0}건` : "API 기록 대기");
  setText("portfolioMonthlyProfit", formatSignedWon(latestMonth?.monthly_profit_loss));
  setText("portfolioMonthlyDays", latestMonth ? `${formatMonth(latestMonth.month)} · ${latestMonth.trading_days || 0}일` : "월별 기록 대기");
  setText("portfolioMonthlyReturn", formatPercent(latestMonth?.monthly_return_rate));
  setText("portfolioMonthlyBase", latestMonth?.return_base ? `기준 ${formatWon(latestMonth.return_base)}` : "기준금액 대기");
  setText("portfolioExposure", `${formatWon(summary.d2_cash).replace("원", "")} / ${formatWon(summary.short_sale_valuation).replace("원", "")}`);
  setText("portfolioUpdatedAt", summary.updated_at ? `최근 저장 ${summary.updated_at.replace("T", " ").slice(0, 16)}` : "API 연결 대기");

  returnElement?.classList.toggle("positive", Number(summary.latest_return_rate) > 0);
  returnElement?.classList.toggle("negative", Number(summary.latest_return_rate) < 0);
  dailyProfitElement?.classList.toggle("positive", Number(summary.latest_profit_loss) > 0);
  dailyProfitElement?.classList.toggle("negative", Number(summary.latest_profit_loss) < 0);
  monthlyProfitElement?.classList.toggle("positive", Number(latestMonth?.monthly_profit_loss) > 0);
  monthlyProfitElement?.classList.toggle("negative", Number(latestMonth?.monthly_profit_loss) < 0);
  monthlyReturnElement?.classList.toggle("positive", Number(latestMonth?.monthly_return_rate) > 0);
  monthlyReturnElement?.classList.toggle("negative", Number(latestMonth?.monthly_return_rate) < 0);
}

function renderPortfolioChart() {
  const chart = document.getElementById("portfolioChart");
  if (!chart) {
    return;
  }

  const records = [...portfolioRecords]
    .sort((a, b) => a.record_date.localeCompare(b.record_date))
    .slice(-14);

  if (!records.length) {
    chart.innerHTML = `<div class="portfolio-empty">아직 기록된 자산 데이터가 없습니다.</div>`;
    return;
  }

  const values = records.map(getRecordAsset).filter(Number.isFinite);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  chart.innerHTML = records
    .map((record) => {
      const asset = getRecordAsset(record);
      const height = 18 + ((asset - minValue) / range) * 76;
      return `
        <div class="asset-bar" title="${escapeHtml(record.record_date)} ${escapeHtml(formatWon(asset))}">
          <i style="height: ${height}%"></i>
          <span>${escapeHtml(formatWon(asset).replace("원", ""))}</span>
          <small>${escapeHtml(formatRecordDate(record.record_date).replace(".", "/"))}</small>
        </div>
      `;
    })
    .join("");
}

function renderPortfolioTable() {
  const table = document.getElementById("portfolioTable");
  if (!table) {
    return;
  }

  const records = [...portfolioRecords].sort((a, b) => b.record_date.localeCompare(a.record_date));
  if (!records.length) {
    table.innerHTML = `<div class="portfolio-empty">기록을 저장하면 여기에 날짜별 자산과 수익률이 표시됩니다.</div>`;
    return;
  }

  const rows = records
    .map((record) => {
      const returnValue = getRecordReturn(record);
      const profitLoss = getRecordProfit(record);
      const flowText = `${formatSignedWon(record.net_external_flow)} 순`;
      return `
        <div class="portfolio-row">
          <strong>${escapeHtml(formatRecordDate(record.record_date))}</strong>
          <span>${escapeHtml(formatWon(getRecordAsset(record)))}</span>
          <span>${escapeHtml(formatWon(record.snapshot?.total_purchase_amount))}</span>
          <span>${escapeHtml(formatWon(record.snapshot?.total_evaluation_amount))}</span>
          <span class="${valueToneClass(profitLoss)}">${escapeHtml(formatSignedWon(profitLoss))}</span>
          <span class="${valueToneClass(returnValue)}">${escapeHtml(formatPercent(returnValue))}</span>
          <span>${escapeHtml(flowText)}</span>
          <span>${escapeHtml(formatWon(record.snapshot?.d2_cash))}</span>
          <button class="portfolio-delete-button" type="button" data-delete-record="${escapeHtml(record.record_date)}" aria-label="${escapeHtml(record.record_date)} 기록 삭제">×</button>
        </div>
      `;
    })
    .join("");

  table.innerHTML = `
    <div class="portfolio-row header">
      <span>날짜</span>
      <span>기말 순자산</span>
      <span>총매입금액</span>
      <span>총평가금액</span>
      <span>일 손익</span>
      <span>수익률</span>
      <span>입출금</span>
      <span>예수금</span>
      <span></span>
    </div>
    ${rows}
  `;
}

function renderMonthlyTable() {
  const table = document.getElementById("portfolioMonthlyTable");
  if (!table) {
    return;
  }

  const records = [...portfolioMonthlyRecords].sort((a, b) => b.month.localeCompare(a.month));
  if (!records.length) {
    table.innerHTML = `<div class="portfolio-empty">일별 기록이 쌓이면 월별 수익률이 표시됩니다.</div>`;
    return;
  }

  const rows = records
    .map((record) => {
      const bestDay = record.best_day
        ? `${formatRecordDate(record.best_day.record_date)} ${formatSignedWon(record.best_day.profit_loss)}`
        : "-";
      const worstDay = record.worst_day
        ? `${formatRecordDate(record.worst_day.record_date)} ${formatSignedWon(record.worst_day.profit_loss)}`
        : "-";
      return `
        <div class="portfolio-row monthly-row">
          <strong>${escapeHtml(formatMonth(record.month))}</strong>
          <span>${escapeHtml(formatWon(record.start_equity))}</span>
          <span>${escapeHtml(formatWon(record.end_equity))}</span>
          <span class="${valueToneClass(record.monthly_profit_loss)}">${escapeHtml(formatSignedWon(record.monthly_profit_loss))}</span>
          <span class="${valueToneClass(record.monthly_return_rate)}">${escapeHtml(formatPercent(record.monthly_return_rate))}</span>
          <span>${escapeHtml(formatSignedWon(record.net_external_flow))}</span>
          <span>${escapeHtml(`${record.trading_days || 0}일`)}</span>
          <span>${escapeHtml(bestDay)}</span>
          <span>${escapeHtml(worstDay)}</span>
        </div>
      `;
    })
    .join("");

  table.innerHTML = `
    <div class="portfolio-row header monthly-row">
      <span>월</span>
      <span>월초 순자산</span>
      <span>월말 순자산</span>
      <span>월 손익</span>
      <span>월 수익률</span>
      <span>순입출금</span>
      <span>기록일</span>
      <span>최고일</span>
      <span>최저일</span>
    </div>
    ${rows}
  `;
}

function renderPortfolioBoard() {
  renderPortfolioSummary();
  renderPortfolioChart();
  renderMonthlyTable();
  renderPortfolioTable();
}

async function loadPortfolioRecords({ showFeedback = false } = {}) {
  if (portfolioLoading) {
    return;
  }

  portfolioLoading = true;
  if (showFeedback) {
    setPortfolioFeedback("기록을 불러오는 중입니다.");
  }

  try {
    const data = await fetchJson("/api/personal/portfolio");
    portfolioRecords = data.records || [];
    portfolioMonthlyRecords = data.monthly_records || [];
    portfolioSummary = data.summary || null;
    portfolioLoaded = true;
    renderPortfolioBoard();
    renderSnapPickHome();
    if (showFeedback) {
      setPortfolioFeedback("개인 메인보드를 불러왔습니다.", "success");
    }
  } catch (error) {
    portfolioLoaded = false;
    portfolioRecords = [];
    portfolioMonthlyRecords = [];
    portfolioSummary = null;
    renderPortfolioBoard();
    renderSnapPickHome();
    setPortfolioFeedback(`개인 보드 API 연결이 필요합니다. ${error.message}`, "error");
  } finally {
    portfolioLoading = false;
  }
}

async function savePortfolioRecord(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = {
    record_date: String(formData.get("record_date") || ""),
    ending_net_asset: Number(formData.get("ending_net_asset")),
    cash_in: Number(formData.get("cash_in") || 0),
    cash_out: Number(formData.get("cash_out") || 0),
    stock_in_value: Number(formData.get("stock_in_value") || 0),
    stock_out_value: Number(formData.get("stock_out_value") || 0),
    source: "manual",
    snapshot_type: "manual",
    is_manual_flow_confirmed: true,
    memo: String(formData.get("memo") || "").trim(),
  };

  const numericFields = ["ending_net_asset", "cash_in", "cash_out", "stock_in_value", "stock_out_value"];
  if (!payload.record_date || numericFields.some((field) => !Number.isFinite(payload[field]) || payload[field] < 0)) {
    setPortfolioFeedback("날짜, 순자산, 입출금 값을 확인해 주세요.", "error");
    return;
  }

  setPortfolioFeedback("기록을 저장하는 중입니다.");

  try {
    const data = await sendJson("/api/personal/portfolio", "POST", payload);
    portfolioRecords = data.records || [];
    portfolioMonthlyRecords = data.monthly_records || [];
    portfolioSummary = data.summary || null;
    portfolioLoaded = true;
    const memoInput = form.querySelector("[name='memo']");
    if (memoInput) {
      memoInput.value = "";
    }
    renderPortfolioBoard();
    renderSnapPickHome();
    setPortfolioFeedback("일별 기록을 저장했습니다.", "success");
  } catch (error) {
    setPortfolioFeedback(`저장 실패: ${error.message}`, "error");
  }
}

async function deletePortfolioRecord(recordDate) {
  if (!recordDate || !window.confirm(`${recordDate} 기록을 삭제할까요?`)) {
    return;
  }

  setPortfolioFeedback("기록을 삭제하는 중입니다.");

  try {
    const data = await sendJson(`/api/personal/portfolio/${recordDate}`, "DELETE");
    portfolioRecords = data.records || [];
    portfolioMonthlyRecords = data.monthly_records || [];
    portfolioSummary = data.summary || null;
    renderPortfolioBoard();
    renderSnapPickHome();
    setPortfolioFeedback("기록을 삭제했습니다.", "success");
  } catch (error) {
    setPortfolioFeedback(`삭제 실패: ${error.message}`, "error");
  }
}

function matchesCategory(disclosure, categoryCode) {
  const routes = disclosure?.distribution?.routes || [];
  return routes.some((route) => route.category_code === categoryCode);
}

async function loadDisclosureCandidates() {
  const [newDisclosures, historyDisclosures] = await Promise.all([
    fetchJson("/api/rss/new").catch(() => []),
    fetchJson("/api/rss/history?limit=120").catch(() => []),
  ]);

  return {
    newDisclosures: Array.isArray(newDisclosures) ? newDisclosures : [],
    historyDisclosures: Array.isArray(historyDisclosures) ? historyDisclosures : [],
  };
}

function findLatestDisclosure(categoryCode, candidates) {
  const newDisclosure =
    candidates.newDisclosures.find((disclosure) => matchesCategory(disclosure, categoryCode)) || null;
  if (newDisclosure) {
    return { disclosure: newDisclosure, origin: "new" };
  }

  const historyDisclosure =
    candidates.historyDisclosures.find((disclosure) => matchesCategory(disclosure, categoryCode)) || null;
  if (historyDisclosure) {
    return { disclosure: historyDisclosure, origin: "history" };
  }

  return { disclosure: null, origin: "sample" };
}

async function analyzeDisclosure(config, candidates) {
  const latest = findLatestDisclosure(config.categoryCode, candidates);
  const latestDisclosure = latest.disclosure;
  const staticSignal = staticAnalyzeDisclosure(config);
  if (staticSignal) {
    return staticSignal;
  }

  const url = apiUrl(config.endpoint);
  url.searchParams.set("url", latestDisclosure?.dart_url || config.sampleUrl);
  url.searchParams.set("published_at", latestDisclosure?.published_at || config.samplePublishedAt);

  const corpName = latestDisclosure?.corp_name || config.sampleCorpName;
  if (corpName) {
    url.searchParams.set("corp_name", corpName);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${config.label} 분석 API 오류 ${response.status}`);
  }

  const signal = await response.json();
  return {
    ...signal,
    category_code: config.categoryCode,
    category_label: config.label,
    is_sample: !latestDisclosure,
    source_disclosure: sourceDisclosureSummary(latestDisclosure, latest.origin),
    observed_at: new Date().toISOString(),
  };
}

async function loadSignalCards() {
  if (cardsLoading) {
    return;
  }

  cardsLoading = true;
  signalStates = analyzerConfigs.map((config) => ({ config, loading: true, signal: null, error: null }));
  renderAll();

  try {
    const candidates = await loadDisclosureCandidates();
    const results = await Promise.allSettled(analyzerConfigs.map((config) => analyzeDisclosure(config, candidates)));
    signalStates = results.map((result, index) => {
      const config = analyzerConfigs[index];
      if (result.status === "fulfilled") {
        return { config, loading: false, signal: result.value, error: null };
      }

      return {
        config,
        loading: false,
        signal: null,
        error: result.reason?.message || "분석 API 연결 실패",
      };
    });

    renderAll();
    mergeSignalHistory(signalStates);
  } finally {
    cardsLoading = false;
  }
}

function setActiveButton(buttons, activeButton) {
  buttons.forEach((button) => button.classList.toggle("is-active", button === activeButton));
}

function bindModuleFilters() {
  const moduleButtons = [...document.querySelectorAll("[data-module-filter]")];
  moduleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      focusDisclosureCategory(button.dataset.moduleFilter || "ALL");
    });
  });

  const discoveryButtons = [...document.querySelectorAll("[data-discovery-filter]")];
  discoveryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeDiscoveryFilter = button.dataset.discoveryFilter || "FREE_CAPITAL_INCREASE";
      setActiveButton(discoveryButtons, button);
      renderDiscoveredList();
    });
  });

  document.querySelector(".refresh-button")?.addEventListener("click", loadSignalCards);
}

function focusDisclosureCategory(categoryCode = "ALL", options = {}) {
  activeModuleFilter = categoryCode || "ALL";
  const moduleButtons = [...document.querySelectorAll("[data-module-filter]")];
  const activeButton = moduleButtons.find((button) => button.dataset.moduleFilter === activeModuleFilter);
  if (activeButton) {
    setActiveButton(moduleButtons, activeButton);
  }
  renderSignalCards();
  if (options.scroll) {
    document.getElementById("signalList")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function getSignalStateByCategory(categoryCode) {
  return signalStates.find((item) => item.config.categoryCode === categoryCode && item.signal && !item.signal.excluded);
}

function favoriteFromCategory(categoryCode) {
  const state = signalStates.find((item) => item.config.categoryCode === categoryCode);
  if (state?.signal && !state.signal.excluded) {
    addRecentViewed(signalToRecentViewedItem(state.signal, state.config));
    addFavoriteSignal({
      id: `signal:${categoryCode}:${state.signal.corp_name || state.signal.report_name || state.config.label}`,
      type: state.config.label,
      label: state.signal.corp_name || state.config.label,
      meta: state.signal.recommendation_type || `신뢰도 ${state.signal.confidence || "-"}%`,
    });
    return;
  }

  const config = analyzerConfigs.find((item) => item.categoryCode === categoryCode);
  if (config) {
    addFavoriteSignal({
      id: `condition:${config.categoryCode}`,
      type: "공시조건",
      label: config.label,
      meta: "신규 공시 감시",
    });
  }
}

function getReferralCode() {
  if (signupLead.referral_code) {
    return signupLead.referral_code;
  }
  const code = `SP${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  signupLead = { ...signupLead, referral_code: code };
  saveStorageObject(snapPickStorageKeys.signupLead, signupLead);
  return code;
}

function getModalByName(name) {
  const map = {
    signup: "signupModal",
    alert: "alertModal",
    share: "shareModal",
    plan: "planModal",
    trust: "trustModal",
  };
  return document.getElementById(map[name] || "");
}

function closeModal(modal) {
  if (!modal) {
    return;
  }
  modal.hidden = true;
  if (lastModalTrigger && typeof lastModalTrigger.focus === "function") {
    lastModalTrigger.focus();
  }
}

function closeAllModals() {
  document.querySelectorAll(".auth-modal").forEach((modal) => {
    modal.hidden = true;
  });
}

function buildShareLink(url = window.location.href, title = "SnapPick") {
  const shareUrl = new URL(window.location.origin + window.location.pathname);
  shareUrl.searchParams.set("ref", getReferralCode());
  shareUrl.searchParams.set("source", "share");
  if (url && url !== "#") {
    shareUrl.searchParams.set("target", url);
  }
  if (title) {
    shareUrl.searchParams.set("title", title.slice(0, 80));
  }
  return shareUrl.toString();
}

function openConversionModal(name, options = {}) {
  const modal = getModalByName(name);
  if (!modal) {
    return;
  }

  lastModalTrigger = options.trigger || document.activeElement;
  closeAllModals();

  if (name === "signup") {
    const emailInput = document.getElementById("signupEmail");
    const interestInput = document.getElementById("signupInterest");
    const digestInput = document.getElementById("signupDigest");
    if (emailInput) {
      emailInput.value = signupLead.email || "";
    }
    if (interestInput) {
      interestInput.value = signupLead.interest || "disclosure";
    }
    if (digestInput) {
      digestInput.checked = signupLead.digest !== false;
    }
    const feedback = document.getElementById("signupFeedback");
    if (feedback) {
      feedback.textContent = "";
    }
  }

  if (name === "alert") {
    modal.dataset.topic = options.topic || "";
    const emailInput = document.getElementById("alertEmail");
    if (emailInput) {
      emailInput.value = alertSettings.email || signupLead.email || "";
    }
    const selectedChannels = new Set(alertSettings.channels || ["breaking", "disclosure"]);
    modal.querySelectorAll(".modal-option-grid input[type='checkbox']").forEach((input) => {
      input.checked = selectedChannels.has(input.value);
    });
    const feedback = document.getElementById("alertFeedback");
    if (feedback) {
      feedback.textContent = options.topic ? `대상: ${options.topic}` : "";
    }
  }

  if (name === "share") {
    const input = document.getElementById("shareLinkInput");
    const feedback = document.getElementById("shareFeedback");
    if (input) {
      input.value = buildShareLink(options.url || window.location.href, options.title || "SnapPick");
    }
    if (feedback) {
      feedback.textContent = "";
    }
  }

  if (name === "plan") {
    const emailInput = document.getElementById("planEmail");
    const planInput = document.getElementById("planType");
    const useCaseInput = document.getElementById("planUseCase");
    const budgetInput = document.getElementById("planBudget");
    const feedback = document.getElementById("planFeedback");
    if (emailInput) {
      emailInput.value = planInterest.email || signupLead.email || alertSettings.email || "";
    }
    if (planInput) {
      planInput.value = planInterest.plan || "pro";
    }
    if (useCaseInput) {
      useCaseInput.value = planInterest.use_case || "";
    }
    if (budgetInput) {
      budgetInput.value = planInterest.budget || "undecided";
    }
    if (feedback) {
      feedback.textContent = "";
    }
  }

  modal.hidden = false;
  const firstField = modal.querySelector("input:not([readonly]), select, textarea, button");
  firstField?.focus();
}

async function saveSignupLead() {
  const email = document.getElementById("signupEmail")?.value.trim() || "";
  const interest = document.getElementById("signupInterest")?.value || "disclosure";
  const digest = Boolean(document.getElementById("signupDigest")?.checked);
  const feedback = document.getElementById("signupFeedback");

  if (!email || !email.includes("@")) {
    if (feedback) {
      feedback.textContent = "이메일을 입력해야 관심 계정을 저장할 수 있습니다.";
    }
    return;
  }

  signupLead = {
    ...signupLead,
    email,
    interest,
    digest,
    referral_code: getReferralCode(),
    saved_at: new Date().toISOString(),
  };
  saveStorageObject(snapPickStorageKeys.signupLead, signupLead);
  addFavoriteSignal({
    id: `signup-interest:${interest}`,
    type: "가입관심",
    label: document.getElementById("signupInterest")?.selectedOptions?.[0]?.textContent || "관심 신호",
    meta: "가입 퍼널",
  });
  if (feedback) {
    feedback.textContent = "이 기기에 저장했습니다. 서버 동기화 중입니다.";
  }

  try {
    await sendJson("/api/growth/signup", "POST", signupLead);
    if (feedback) {
      feedback.textContent = "서버에 관심 계정 리드를 저장했습니다.";
    }
  } catch {
    if (feedback) {
      feedback.textContent = "로컬에 저장했습니다. 백엔드 연결 후 서버에 동기화됩니다.";
    }
  }
}

async function saveAlertSettings() {
  const modal = document.getElementById("alertModal");
  const email = document.getElementById("alertEmail")?.value.trim() || "";
  const feedback = document.getElementById("alertFeedback");
  const channels = [...document.querySelectorAll("#alertModal .modal-option-grid input[type='checkbox']:checked")].map((input) => input.value);

  if (!email || !email.includes("@")) {
    if (feedback) {
      feedback.textContent = "알림을 저장하려면 이메일이 필요합니다.";
    }
    return;
  }
  if (!channels.length) {
    if (feedback) {
      feedback.textContent = "최소 1개 알림 조건을 선택하세요.";
    }
    return;
  }

  alertSettings = {
    email,
    channels,
    topic: modal?.dataset.topic || "",
    saved_at: new Date().toISOString(),
  };
  saveStorageObject(snapPickStorageKeys.alertSettings, alertSettings);
  if (feedback) {
    feedback.textContent = "알림 조건을 이 기기에 저장했습니다. 서버 동기화 중입니다.";
  }

  try {
    await sendJson("/api/growth/alerts", "POST", alertSettings);
    if (feedback) {
      feedback.textContent = "서버에 알림 조건을 저장했습니다. 실제 발송 기능은 별도 연결 단계입니다.";
    }
  } catch {
    if (feedback) {
      feedback.textContent = "로컬에 저장했습니다. 백엔드 연결 후 서버에 동기화됩니다.";
    }
  }
}

async function copyShareLink() {
  const input = document.getElementById("shareLinkInput");
  const feedback = document.getElementById("shareFeedback");
  const value = input?.value || "";
  if (!value) {
    return;
  }

  let copied = false;
  try {
    await navigator.clipboard.writeText(value);
    copied = true;
    if (feedback) {
      feedback.textContent = "공유 링크를 복사했습니다.";
    }
  } catch {
    input?.select();
    if (feedback) {
      feedback.textContent = "클립보드 권한이 없어 링크를 선택했습니다.";
    }
  }

  try {
    const shareUrl = new URL(value);
    await sendJson("/api/growth/share", "POST", {
      url: value,
      target: shareUrl.searchParams.get("target") || "",
      title: shareUrl.searchParams.get("title") || "",
      referral_code: shareUrl.searchParams.get("ref") || getReferralCode(),
      source: shareUrl.searchParams.get("source") || "share",
    });
    if (feedback) {
      feedback.textContent = copied ? "공유 링크를 복사하고 서버에 기록했습니다." : "공유 링크를 선택하고 서버에 기록했습니다.";
    }
  } catch {
    if (feedback) {
      feedback.textContent = copied ? "공유 링크를 복사했습니다. 서버 기록은 대기 중입니다." : "공유 링크를 선택했습니다. 서버 기록은 대기 중입니다.";
    }
  }
}

async function savePlanInterest() {
  const email = document.getElementById("planEmail")?.value.trim() || "";
  const plan = document.getElementById("planType")?.value || "pro";
  const useCase = document.getElementById("planUseCase")?.value.trim() || "";
  const budget = document.getElementById("planBudget")?.value || "undecided";
  const feedback = document.getElementById("planFeedback");

  if (!email || !email.includes("@")) {
    if (feedback) {
      feedback.textContent = "프로 관심 등록에는 이메일이 필요합니다.";
    }
    return;
  }

  planInterest = {
    email,
    plan,
    use_case: useCase,
    budget,
    referral_code: getReferralCode(),
    source: "pro-plan",
    saved_at: new Date().toISOString(),
  };
  saveStorageObject(snapPickStorageKeys.planInterest, planInterest);
  addFavoriteSignal({
    id: `plan-interest:${plan}`,
    type: "프로관심",
    label: document.getElementById("planType")?.selectedOptions?.[0]?.textContent || "프로 기능",
    meta: budget === "undecided" ? "지불 의사 미정" : budget,
  });
  if (feedback) {
    feedback.textContent = "이 기기에 프로 관심 정보를 저장했습니다. 서버 동기화 중입니다.";
  }

  try {
    await sendJson("/api/growth/plan-interest", "POST", planInterest);
    if (feedback) {
      feedback.textContent = "서버에 프로 관심 등록을 저장했습니다. 실제 결제는 아직 연결하지 않았습니다.";
    }
  } catch {
    if (feedback) {
      feedback.textContent = "로컬에 저장했습니다. 백엔드 연결 후 서버에 동기화됩니다.";
    }
  }
}

function bindConversionModals() {
  document.addEventListener("click", (event) => {
    const modalTarget = event.target.closest("[data-modal-target]");
    if (modalTarget) {
      openConversionModal(modalTarget.dataset.modalTarget || "signup", { trigger: modalTarget });
      return;
    }

    const alertTarget = event.target.closest("[data-alert-topic]");
    if (alertTarget) {
      openConversionModal("alert", {
        trigger: alertTarget,
        topic: alertTarget.dataset.alertTopic || "",
      });
      return;
    }

    const shareTarget = event.target.closest("[data-share-url]");
    if (shareTarget) {
      openConversionModal("share", {
        trigger: shareTarget,
        title: shareTarget.dataset.shareTitle || "SnapPick",
        url: shareTarget.dataset.shareUrl || window.location.href,
      });
      return;
    }

    if (event.target.matches("[data-close-modal]")) {
      closeModal(event.target.closest(".auth-modal"));
      return;
    }

    if (event.target.classList.contains("auth-modal")) {
      closeModal(event.target);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });

  document.getElementById("signupSubmitButton")?.addEventListener("click", saveSignupLead);
  document.getElementById("alertSubmitButton")?.addEventListener("click", saveAlertSettings);
  document.getElementById("copyShareLinkButton")?.addEventListener("click", copyShareLink);
  document.getElementById("planSubmitButton")?.addEventListener("click", savePlanInterest);
}

function bindSnapPickHome() {
  const homeSearchInput = document.getElementById("homeSearchInput");
  const disclosureSearchInput = document.getElementById("disclosureSearchInput");
  const homeSearchButton = document.getElementById("homeSearchButton");

  const submitSearch = (value) => setSearchQuery(value);
  const handleSearchKeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch(event.currentTarget.value);
    }
  };
  const handleSearchInput = (event) => {
    activeSearchQuery = normalizeSearchTerm(event.currentTarget.value);
    renderSignalCards();
    renderDiscoveredList();
  };

  homeSearchInput?.addEventListener("keydown", handleSearchKeydown);
  homeSearchInput?.addEventListener("input", handleSearchInput);
  disclosureSearchInput?.addEventListener("keydown", handleSearchKeydown);
  disclosureSearchInput?.addEventListener("input", handleSearchInput);
  homeSearchButton?.addEventListener("click", () => submitSearch(homeSearchInput?.value || ""));

  document.getElementById("saveInterestButton")?.addEventListener("click", () => {
    if (activeSearchQuery) {
      addFavoriteSignal({
        id: `search:${activeSearchQuery}`,
        type: "검색조건",
        label: activeSearchQuery,
        meta: "홈 검색",
      });
      return;
    }

    if (activeModuleFilter !== "ALL") {
      favoriteFromCategory(activeModuleFilter);
      return;
    }

    addFavoriteSignal({
      id: "radar:all-signals",
      type: "관심조건",
      label: "실시간 호재 종목",
      meta: "전체 공시 모듈",
    });
  });

  document.getElementById("clearInterestButton")?.addEventListener("click", clearFavoriteSignals);
  document.getElementById("clearViewedButton")?.addEventListener("click", clearRecentViewed);

  document.addEventListener("click", (event) => {
    const resultButton = event.target.closest("[data-view-result-category]");
    if (resultButton) {
      const categoryCode = resultButton.dataset.viewResultCategory || "ALL";
      const state = getSignalStateByCategory(categoryCode);
      if (state) {
        addRecentViewed(signalToRecentViewedItem(state.signal, state.config));
      }
      setSearchQuery(resultButton.dataset.searchTerm || activeSearchQuery);
      focusDisclosureCategory(categoryCode, { scroll: true });
      return;
    }

    const trackedSignal = event.target.closest("[data-track-signal]");
    if (trackedSignal) {
      const state = getSignalStateByCategory(trackedSignal.dataset.trackSignal || "");
      if (state) {
        addRecentViewed(signalToRecentViewedItem(state.signal, state.config));
      }
    }

    if (event.target.closest("[data-clear-search]")) {
      setSearchQuery("");
      return;
    }

    const searchButton = event.target.closest("[data-search-term]");
    if (searchButton) {
      setSearchQuery(searchButton.dataset.searchTerm || "");
      return;
    }

    const saveButton = event.target.closest("[data-save-signal]");
    if (saveButton) {
      favoriteFromCategory(saveButton.dataset.saveSignal || "");
    }
  });
}

function bindDisclosureHelp() {
  const button = document.getElementById("signalHelpButton");
  const panel = document.getElementById("signalHelpPanel");
  if (!button || !panel) {
    return;
  }

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || panel.hidden) {
      return;
    }

    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.focus();
  });
}

function bindDiscussion() {
  const discussion = document.querySelector(".discussion-card");
  if (!discussion) {
    return;
  }

  discussion.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }

    if (button.id === "newPostButton") {
      const boardInput = document.getElementById("newPostBoard");
      const titleInput = document.getElementById("newPostTitle");
      const bodyInput = document.getElementById("newPostBody");
      const board = boardInput?.value || "FREE";
      const title = titleInput?.value.trim();
      const body = bodyInput?.value.trim();
      if (!title || !body) {
        return;
      }

      addCommunityPost(board, title, body);
      titleInput.value = "";
      bodyInput.value = "";
      return;
    }

    if (button.dataset.communityBoard) {
      activeCommunityBoard = button.dataset.communityBoard || "ALL";
      renderCommunityBoard();
      return;
    }

    const post = button.closest("[data-community-post-id]");
    const postId = post?.dataset.communityPostId;
    const action = button.dataset.communityAction;
    if (!postId || !action) {
      return;
    }

    if (action === "like") {
      const updated = updateCommunityPost(postId, (item) => {
        const liked = !item.liked;
        return {
          ...item,
          liked,
          likes: Math.max(0, Number(item.likes || 0) + (liked ? 1 : -1)),
          updated_at: new Date().toISOString(),
        };
      });
      syncCommunityReactionToServer(postId, "like", Boolean(updated?.liked));
      return;
    }

    if (action === "bookmark") {
      const updated = updateCommunityPost(postId, (item) => ({
        ...item,
        bookmarked: !item.bookmarked,
        updated_at: new Date().toISOString(),
      }));
      syncCommunityReactionToServer(postId, "bookmark", Boolean(updated?.bookmarked));
      return;
    }

    if (action === "focus-comment") {
      post.querySelector(".reply-input-row input")?.focus();
      return;
    }

    if (action === "comment") {
      const input = post.querySelector(".reply-input-row input");
      const value = input?.value.trim();
      if (!value) {
        return;
      }
      const comment = {
        id: `comment-${Date.now()}`,
        author: "나",
        body: value,
        created_at: new Date().toISOString(),
      };
      updateCommunityPost(postId, (item) => ({
        ...item,
        comments: [
          ...(item.comments || []),
          comment,
        ],
        updated_at: new Date().toISOString(),
      }));
      syncCommunityCommentToServer(postId, comment);
    }
  });

  renderCommunityBoard();
}

function switchView(targetView, navKey) {
  document.querySelectorAll("[data-view]").forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === targetView);
  });

  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.navKey === navKey);
  });

  if (targetView === "personal" && !portfolioLoaded) {
    loadPortfolioRecords({ showFeedback: true });
  }

  if (targetView === "breaking") {
    loadBreakingNews();
  }

  if (targetView === "snappiko") {
    loadSnappikoIndex();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function isActiveView(viewName) {
  return document.querySelector(`.view-section[data-view="${viewName}"]`)?.classList.contains("is-active") || false;
}

function bindViewNavigation() {
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.viewTarget || "market", button.dataset.navKey || "stock");
    });
  });
}

function bindBreakingLearning() {
  document.getElementById("breakingLearningForm")?.addEventListener("submit", saveBreakingLearningApproval);
}

function bindSnappikoControls() {
  document.getElementById("snappikoRefreshButton")?.addEventListener("click", () => {
    loadSnappikoIndex({ forceRefresh: true });
  });
  document.querySelectorAll("[data-bond-period]").forEach((button) => {
    button.addEventListener("click", () => {
      snappikoBondPeriod = button.dataset.bondPeriod || "daily";
      renderSnappikoIndex();
    });
  });
}

function bindPersonalTabs() {
  const buttons = [...document.querySelectorAll("[data-personal-tab-target]")];
  const panels = [...document.querySelectorAll("[data-personal-tab]")];
  if (!buttons.length || !panels.length) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.personalTabTarget || "returns";
      buttons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.personalTab === target);
      });
    });
  });
}

function bindPortfolioBoard() {
  const dateInput = document.getElementById("portfolioDate");
  const form = document.getElementById("portfolioForm");
  const reloadButton = document.getElementById("portfolioReloadButton");
  const table = document.getElementById("portfolioTable");

  if (dateInput && !dateInput.value) {
    dateInput.value = toDateInputValue();
  }

  form?.addEventListener("submit", savePortfolioRecord);
  form?.querySelector("[type='submit']")?.addEventListener("click", (event) => {
    event.preventDefault();
    savePortfolioRecord({ preventDefault() {}, currentTarget: form });
  });
  reloadButton?.addEventListener("click", () => loadPortfolioRecords({ showFeedback: true }));
  table?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-record]");
    if (button) {
      deletePortfolioRecord(button.dataset.deleteRecord);
    }
  });

  renderPortfolioBoard();
}

bindViewNavigation();
bindBreakingLearning();
bindSnappikoControls();
bindPersonalTabs();
bindModuleFilters();
bindDisclosureHelp();
bindSnapPickHome();
bindConversionModals();
bindDiscussion();
bindPortfolioBoard();
loadCommunityPostsFromServer();
renderSnapPickHome();
loadSignalCards();
refreshRssStatus();
loadBreakingNews();
setInterval(updateRssStatusText, 1000);
setInterval(updateBreakingStatusText, 1000);
setInterval(refreshRssStatus, 10000);
setInterval(loadBreakingNews, 10000);
setInterval(() => {
  if (isActiveView("snappiko")) {
    loadSnappikoIndex();
  }
}, 600000);
setInterval(loadSignalCards, 60000);
