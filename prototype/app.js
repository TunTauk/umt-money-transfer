(() => {
  "use strict";

  const app = document.querySelector("#app");
  const toastNode = document.querySelector("#toast");
  const money = (value) => `K ${Number(value || 0).toLocaleString("en-US")}`;
  const numberValue = (value) => Number(String(value ?? "0").replace(/[^0-9.-]/g, "")) || 0;
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    in: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 21h14"/>',
    out: '<path d="M12 21V9m0 0 4 4m-4-4-4 4"/><path d="M5 3h14"/>',
    transfer: '<path d="m17 3 4 4-4 4"/><path d="M3 7h18"/><path d="m7 21-4-4 4-4"/><path d="M21 17H3"/>',
    wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M16 15h.01"/>',
    account: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
    provider: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    report: '<path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrow: '<path d="m15 18-6-6 6-6"/>',
    upload: '<path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M4 15v4h16v-4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
    swap: '<path d="m7 7 3-3 3 3M10 4v16m7-3-3 3-3-3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
    alert: '<path d="M10.3 2.8 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
    circleAlert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    logout: '<path d="M10 17l5-5-5-5m5 5H3"/><path d="M15 3h6v18h-6"/>'
  };
  const icon = (name, label = "") => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="${label ? "false" : "true"}"${label ? ` aria-label="${esc(label)}"` : ""}>${paths[name] || paths.info}</svg>`;

  const navItems = [
    ["dashboard", "ဒက်ရှ်ဘုတ်", "dashboard"], ["cash-in", "ငွေပို့", "in"], ["cash-out", "ငွေထုတ်", "out"],
    ["transfers", "အတွင်းပိုင်းငွေလွှဲ", "transfer"], ["capital", "ရင်းနှီးငွေ", "wallet"], ["accounts", "အကောင့်များ", "account"],
    ["providers", "ဝန်ဆောင်မှုပေးသူများ", "provider"], ["users", "အသုံးပြုသူများ", "users"], ["summary", "အနှစ်ချုပ်", "report"]
  ];

  const state = {
    authenticated: false,
    loginState: "default",
    showPassword: false,
    providerOpen: false,
    transactionProvider: "KBZ Bank",
    uploaded: true,
    modal: null,
    sort: {},
    filters: {},
    accountType: "ဘဏ်",
    capitalType: "ငွေသွင်း",
    staffRole: "ငွေကိုင်",
    generatedPassword: "Kx7#mQ2p",
    counts: [38200000, 14900000, 18670000, 12480000, 4870000],
    accounts: [
      { id: 1, name: "KBZ - 09512345xx", type: "ဘဏ်", provider: "KBZ Bank", number: "09512345678", balance: 38200000, active: true },
      { id: 2, name: "KBZ - 09598765xx", type: "ဘဏ်", provider: "KBZ Bank", number: "09598765432", balance: 14900000, active: true },
      { id: 3, name: "Wave - 09777123xx", type: "ဘဏ်", provider: "Wave Money", number: "09777123456", balance: 18670000, active: true },
      { id: 4, name: "ငွေသားဗီရို", type: "ငွေသား", provider: "—", number: "—", balance: 12480000, active: true },
      { id: 5, name: "KBZ - 09112223334 (ဟောင်း)", type: "ဘဏ်", provider: "KBZ Bank", number: "09112223334", balance: 0, active: false }
    ],
    providers: [
      { id: 1, name: "KBZ Bank", ocr: true, accounts: 2 }, { id: 2, name: "Wave Money", ocr: true, accounts: 1 },
      { id: 3, name: "AYA Bank", ocr: false, accounts: 0 }, { id: 4, name: "CB Bank", ocr: false, accounts: 0 }, { id: 5, name: "True Money", ocr: false, accounts: 0 }
    ],
    users: [
      { id: 1, name: "ဒေါ်လှ", phone: "09512345678", role: "ပိုင်ရှင်", active: true, date: "12 Jan 2025" },
      { id: 2, name: "အောင်ကို", phone: "09598765432", role: "ငွေကိုင်", active: true, date: "3 Mar 2025" },
      { id: 3, name: "မြမြ", phone: "09777123456", role: "ငွေကိုင်", active: true, date: "20 Jun 2025" },
      { id: 4, name: "နီလာအေး", phone: "09533221100", role: "ငွေကိုင်", active: false, date: "15 Aug 2025" }
    ],
    cashIn: [
      { id: "CI-10231", customer: "မြသီတာ", account: "KBZ - 09512345xx", amount: 200000, fee: 2000, status: "ပြီးစီး", creator: "အောင်ကို", date: "28 Aug, 9:14 AM" },
      { id: "CI-10230", customer: "ဦးကျော်ဇင်", account: "Wave - 09777123xx", amount: 150000, fee: 1500, status: "ပြီးစီး", creator: "မြမြ", date: "28 Aug, 8:50 AM" },
      { id: "CI-10229", customer: "ဒေါ်နီလာ", account: "KBZ - 09598765xx", amount: 500000, fee: 5000, status: "ဆိုင်းငံ့", creator: "မြမြ", date: "28 Aug, 8:10 AM" },
      { id: "CI-10228", customer: "ကိုထက်", account: "KBZ - 09512345xx", amount: 300000, fee: 3000, status: "ပယ်ဖျက်ပြီး", creator: "အောင်ကို", date: "27 Aug, 4:32 PM" },
      { id: "CI-10227", customer: "မအိအိ", account: "Wave - 09777123xx", amount: 250000, fee: 2500, status: "ပျက်ပြယ်ပြီး", creator: "ဒေါ်လှ", date: "27 Aug, 2:15 PM" }
    ],
    cashOut: [
      { id: "CO-8821", customer: "ကိုဇော်မင်း", account: "Wave - 09777123xx", amount: 2150000, fee: 50000, status: "ဆိုင်းငံ့", creator: "မြမြ", date: "28 Aug, 8:05 AM" },
      { id: "CO-8820", customer: "မိမိစံ", account: "KBZ - 09512345xx", amount: 640000, fee: 15000, status: "ပြီးစီး", creator: "အောင်ကို", date: "28 Aug, 7:40 AM" },
      { id: "CO-8819", customer: "ဒေါ်နီလာ", account: "KBZ - 09598765xx", amount: 1000000, fee: 20000, status: "ပြီးစီး", creator: "မြမြ", date: "27 Aug, 3:10 PM" },
      { id: "CO-8818", customer: "ကိုထက်နိုင်", account: "Wave - 09777123xx", amount: 320000, fee: 30000, status: "ပျက်ပြယ်ပြီး", creator: "ဒေါ်လှ", date: "27 Aug, 1:05 PM" }
    ],
    transfers: [
      { id: "TRF-441", from: "KBZ - 09512345xx", to: "Wave - 09777123xx", amount: 5000000, status: "ပြီးစီး", creator: "ဒေါ်လှ", date: "28 Aug" },
      { id: "TRF-440", from: "ငွေသားဗီရို", to: "KBZ - 09598765xx", amount: 2000000, status: "ပြီးစီး", creator: "ဒေါ်လှ", date: "28 Aug" },
      { id: "TRF-439", from: "Wave - 09777123xx", to: "KBZ - 09512345xx", amount: 1200000, status: "ဆိုင်းငံ့", creator: "ဒေါ်လှ", date: "28 Aug" },
      { id: "TRF-438", from: "KBZ - 09598765xx", to: "ငွေသားဗီရို", amount: 3500000, status: "ပျက်ပြယ်ပြီး", creator: "ဒေါ်လှ", date: "27 Aug" }
    ],
    capital: [
      { id: "CAP-115", type: "ငွေသွင်း", account: "KBZ - 09512345xx", amount: 10000000, status: "ပြီးစီး", creator: "ဒေါ်လှ", date: "28 Aug" },
      { id: "CAP-114", type: "ငွေထုတ်ယူ", account: "ငွေသားဗီရို", amount: 1500000, status: "ပြီးစီး", creator: "ဒေါ်လှ", date: "28 Aug" },
      { id: "CAP-113", type: "ငွေသွင်း", account: "Wave - 09777123xx", amount: 3000000, status: "ဆိုင်းငံ့", creator: "ဒေါ်လှ", date: "28 Aug" },
      { id: "CAP-112", type: "ငွေထုတ်ယူ", account: "KBZ - 09598765xx", amount: 2200000, status: "ပျက်ပြယ်ပြီး", creator: "ဒေါ်လှ", date: "27 Aug" }
    ]
  };

  const currentRoute = () => (location.hash.replace(/^#\/?/, "") || "login").split("?")[0];
  const routeTo = (route) => { location.hash = `#${route}`; };
  if (currentRoute() !== "login") state.authenticated = true;
  const toast = (message) => {
    toastNode.textContent = message;
    toastNode.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toastNode.classList.remove("show"), 2300);
  };
  const statusTone = (status) => status.includes("ပြီးစီး") || status.includes("အသုံးပြု") || status.includes("ကိုက်ညီ") || status.includes("ပံ့ပိုး") ? "success" : status.includes("ဆိုင်းငံ့") ? "pending" : status.includes("ကွာဟ") ? "error" : "muted";
  const status = (text) => `<span class="status ${statusTone(text)}">${esc(text)}</span>`;
  const accountOptions = (selected = "") => state.accounts.filter((item) => item.active).map((item) => `<option${item.name === selected ? " selected" : ""}>${esc(item.name)}</option>`).join("");

  function renderLogin() {
    const message = state.loginState === "error"
      ? `<div class="alert error">${icon("circleAlert")}<span>ဖုန်းနံပါတ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။ ထပ်မံကြိုးစားပါ။</span></div>`
      : state.loginState === "disabled"
        ? `<div class="alert error">${icon("ban")}<span>ဤအကောင့်ကို ပိတ်ထားပါသည်။ အသုံးပြုခွင့် ပြန်လည်ရရှိရန် အက်ဒမင်ကို ဆက်သွယ်ပါ။</span></div>` : "";
    app.innerHTML = `<main class="login-page">
      <section class="login-main">
        <form class="login-card" id="login-form">
          <h2>ဝင်ရောက်ရန်</h2><p>ဆက်လက်ရန် ဖုန်းနံပါတ်နှင့် စကားဝှက်ကို ထည့်သွင်းပါ။</p>
          ${message}
          <div class="field ${state.loginState === "error" ? "invalid" : ""}"><label for="phone">ဖုန်းနံပါတ်</label><input id="phone" name="phone" inputmode="tel" autocomplete="username" placeholder="09xxxxxxxxx" value="${state.loginState === "default" ? "" : "09123456789"}" required></div>
          <div class="field ${state.loginState === "error" ? "invalid" : ""}" style="margin-top:16px"><label for="password">စကားဝှက်</label><div class="input-wrap"><input id="password" name="password" type="${state.showPassword ? "text" : "password"}" autocomplete="current-password" placeholder="စကားဝှက်ထည့်ပါ" value="${state.loginState === "default" ? "" : "wrong"}" required><button type="button" data-action="show-password" aria-label="စကားဝှက်ပြရန်">${icon("eye")}</button></div></div>
          <button class="btn primary" style="width:100%;margin-top:22px" ${state.loginState === "disabled" ? "disabled" : ""}>ဝင်ရောက်ရန်</button>
        </form>
      </section>
    </main>`;
  }

  function shell(content, active) {
    return `<div class="app-shell">
      <aside class="sidebar"><div class="wordmark"><span class="mark">U</span> UMT</div><nav class="nav" aria-label="အဓိကလမ်းညွှန်">${navItems.map(([route, label, glyph]) => `<a href="#${route}" class="${active === route ? "active" : ""}">${icon(glyph)}<span>${label}</span></a>`).join("")}</nav><div class="sidebar-foot">UMT Money Transfer<br>Prototype · v1.0</div></aside>
      <button class="drawer-backdrop" data-action="drawer-close" aria-label="မီနူးပိတ်ရန်"></button>
      <header class="topbar"><div class="topbar-brand"><button class="mobile-menu" data-action="drawer-open" aria-label="မီနူးဖွင့်ရန်">${icon("menu")}</button><span>ငွေလွှဲစီမံခန့်ခွဲမှု</span></div><div class="profile"><span class="avatar">ဒ</span><div><strong>ဒေါ်လှ</strong><small>ပိုင်ရှင်</small></div><button class="btn ghost" data-action="logout" title="ထွက်ရန်">${icon("logout")}</button></div></header>
      <main class="main">${content}</main>
    </div>${state.modal ? renderModal() : ""}`;
  }

  const pageHead = (title, subtitle, action = "", eyebrow = "စီမံခန့်ခွဲမှု") => `<header class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${action ? `<div class="head-actions">${action}</div>` : ""}</header>`;

  function renderDashboard() {
    const accountRows = state.accounts.filter((item) => item.active).map((item) => `<tr><td><strong>${esc(item.name)}</strong></td><td>${esc(item.type)}</td><td>${esc(item.provider)}</td><td>${status("အသုံးပြုနေဆဲ")}</td><td class="num"><strong>${money(item.balance)}</strong></td></tr>`).join("");
    const activity = [
      ["မသီတာ", "ငွေပို့ · K 320,000", "ပြီးစီး", "in"], ["KBZ #1 မှ Wave #2 သို့", "အတွင်းပိုင်းငွေလွှဲ · K 5,000,000", "ပြီးစီး", "transfer"],
      ["ဦးအောင်ကို", "ငွေပို့ · K 1,000,000", "ပြီးစီး", "in"], ["ပိုင်ရှင်ရင်းနှီးငွေ မှ KBZ #1 သို့", "ရင်းနှီးငွေထည့်သွင်းခြင်း · K 10,000,000", "ပြီးစီး", "wallet"]
    ].map(([name, detail, st, glyph]) => `<div class="activity-item"><span class="activity-icon">${icon(glyph)}</span><div><strong>${name}</strong><p>${detail}</p></div>${status(st)}</div>`).join("");
    const pending = [["ကိုဇော်မင်း", "ငွေထုတ် · K 2,150,000", "2h 14m"], ["မိမိစံ", "ငွေထုတ် · K 640,000", "48m"], ["ဦးအောင်ကို", "ငွေပို့ · K 1,000,000", "22m"], ["မသီတာ", "ငွေပို့ · K 320,000", "6m"]]
      .map(([name, detail, time]) => `<div class="activity-item"><span class="activity-icon">${icon("alert")}</span><div><strong>${name}</strong><p>${detail}</p></div><span class="tiny num">${time}</span></div>`).join("");
    return shell(`${pageHead("ဒက်ရှ်ဘုတ်", "ယနေ့ လက်ကျန်ငွေနှင့် လှုပ်ရှားမှုများ", '<span class="muted">သောကြာ၊ သြဂုတ် 28၊ 2026</span>', "ယနေ့အခြေအနေ")}
      <section class="metrics"><article class="card metric total"><div class="metric-label">စုစုပေါင်းလက်ကျန်</div><div class="metric-value">K 84,250,000</div><div class="metric-note">အကောင့် 4 ခုမှ</div></article><article class="card metric"><div class="metric-label">ငွေသားဗီရို</div><div class="metric-value">K 12.48m</div><div class="metric-note">လက်ရှိငွေသား</div></article><article class="card metric"><div class="metric-label">အနည်းဆုံးလက်ကျန်</div><div class="metric-value">K 12.48m</div><div class="metric-note">ငွေသားဗီရို</div></article><article class="card metric"><div class="metric-label">အကြာကျန်နေသော ဆိုင်းငံ့</div><div class="metric-value">2h 14m</div><div class="metric-note">ငွေထုတ် — ကိုဇော်မင်း</div></article></section>
      <section class="dashboard-grid"><div class="stack"><article class="card"><div class="card-head"><h2>အကောင့်လက်ကျန်များ</h2><a class="btn ghost small" href="#accounts">အကောင့်အားလုံးကြည့်ရန်</a></div><div class="table-wrap"><table><thead><tr><th>အကောင့်</th><th>အမျိုးအစား</th><th>ဝန်ဆောင်မှုပေးသူ</th><th>အခြေအနေ</th><th>လက်ကျန်ငွေ</th></tr></thead><tbody>${accountRows}</tbody></table></div></article><article class="card"><div class="card-head"><h2>လတ်တလောလှုပ်ရှားမှု</h2></div><div class="card-body activity">${activity}</div></article></div><article class="card"><div class="card-head"><h2>ဆိုင်းငံ့ — အဟောင်းဆုံးအရင်</h2><span class="status pending">4</span></div><div class="card-body activity">${pending}</div></article></section>`, "dashboard");
  }

  const listConfigs = {
    "cash-in": { title: "ငွေပို့ လုပ်ငန်းစဉ်များ", subtitle: "ဖောက်သည်ထံမှငွေသားလက်ခံပြီး လက်ခံသူ၏အကောင့်သို့ လွှဲပို့ပါသည်။", button: "ငွေပို့ အသစ်ထည့်ရန်", next: "cash-in-new", data: "cashIn", columns: [["id","ကိုးကားနံပါတ်"],["customer","ဖောက်သည်"],["account","ပို့ဆောင်ရာ"],["amount","ပမာဏ"],["fee","အခကြေးငွေ"],["status","အခြေအနေ"],["creator","ဖန်တီးသူ"],["date","ရက်စွဲ"]] },
    "cash-out": { title: "ငွေထုတ် လုပ်ငန်းစဉ်များ", subtitle: "ဝင်ငွေလွှဲကို စစ်ဆေးပြီးနောက် လက်ခံသူထံ ငွေသားပေးချေပါ။", button: "ငွေထုတ် အသစ်ထည့်ရန်", next: "cash-out-new", data: "cashOut", columns: [["id","ကိုးကားနံပါတ်"],["customer","ဖောက်သည်"],["account","ဇစ်မြစ်"],["amount","ပမာဏ"],["fee","အခကြေးငွေ"],["status","အခြေအနေ"],["creator","ဖန်တီးသူ"],["date","ရက်စွဲ"]] },
    transfers: { title: "အတွင်းပိုင်းငွေလွှဲ", subtitle: "ကျွန်ုပ်တို့ကိုယ်ပိုင်အကောင့်များအကြား ငွေလွှဲခြင်း — အခကြေးငွေမရှိ၊ အက်ဒမင်/ပိုင်ရှင်သာ။", button: "ငွေလွှဲ အသစ်ထည့်ရန်", modal: "transfer", data: "transfers", columns: [["id","ကိုးကားနံပါတ်"],["from","ထံမှ"],["to","ထံသို့"],["amount","ပမာဏ"],["status","အခြေအနေ"],["creator","ဖန်တီးသူ"]] },
    capital: { title: "ရင်းနှီးငွေ ထည့်သွင်း/ထုတ်ယူ", subtitle: "ပိုင်ရှင်မှ အကောင့် သို့မဟုတ် ငွေသားဗီရိုသို့ ရင်းနှီးငွေ ထည့်သွင်း/ထုတ်ယူခြင်း။", button: "စာရင်းအသစ်ထည့်ရန်", modal: "capital", data: "capital", columns: [["id","ကိုးကားနံပါတ်"],["type","အမျိုးအစား"],["account","အကောင့်"],["amount","ပမာဏ"],["status","အခြေအနေ"],["creator","ဖန်တီးသူ"]] }
  };

  function renderList(route) {
    const config = listConfigs[route];
    const query = state.filters[route]?.query || "";
    const filterStatus = state.filters[route]?.status || "";
    const filterDate = state.filters[route]?.date || "";
    const filterAccount = state.filters[route]?.account || "";
    const filterCreator = state.filters[route]?.creator || "";
    const filterAmount = state.filters[route]?.amount || "";
    const [sortKey, sortDirection = "asc"] = state.sort[route] || [];
    let rows = [...state[config.data]].filter((row) => {
      const accountText = [row.account, row.from, row.to].filter(Boolean).join(" ");
      const amountMatches = !filterAmount || (filterAmount === "small" && row.amount < 500000) || (filterAmount === "medium" && row.amount >= 500000 && row.amount < 2000000) || (filterAmount === "large" && row.amount >= 2000000);
      return Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())
        && (!filterStatus || row.status === filterStatus)
        && (!filterDate || String(row.date || "").includes(filterDate))
        && (!filterAccount || accountText.includes(filterAccount))
        && (!filterCreator || row.creator === filterCreator)
        && amountMatches;
    });
    if (sortKey) rows.sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey]), "my", { numeric: true }) * (sortDirection === "asc" ? 1 : -1));
    const tableRows = rows.map((row) => `<tr>${config.columns.map(([key]) => `<td class="${["amount", "fee"].includes(key) ? "num" : ""}">${key === "status" ? status(row[key]) : ["amount", "fee"].includes(key) ? `<strong>${money(row[key])}</strong>` : esc(row[key])}</td>`).join("")}<td><div class="actions">${row.status === "ဆိုင်းငံ့" ? `<button class="btn small secondary" data-action="edit-sim">ပြင်ဆင်</button><button class="btn small primary" data-action="complete" data-list="${route}" data-id="${row.id}">ပြီးစီး</button><button class="btn small danger" data-action="cancel-row" data-list="${route}" data-id="${row.id}">ပယ်ဖျက်ရန်</button>` : row.status === "ပြီးစီး" ? `<button class="btn small danger" data-action="void-row" data-list="${route}" data-id="${row.id}">ပျက်ပြယ်</button>` : ""}</div></td></tr>`).join("");
    const add = config.next ? `<a class="btn primary" href="#${config.next}">${icon("plus")}${config.button}</a>` : `<button class="btn primary" data-open-modal="${config.modal}">${icon("plus")}${config.button}</button>`;
    const accountNames = [...new Set(state.accounts.filter((item) => item.active).map((item) => item.name))];
    const creators = [...new Set(state[config.data].map((item) => item.creator))];
    return shell(`${pageHead(config.title, config.subtitle, add)}<section class="card"><div class="toolbar"><div class="search">${icon("search")}<input data-filter-query="${route}" value="${esc(query)}" placeholder="အကောင့်၊ အမည်၊ ကိုးကားနံပါတ်ဖြင့်ရှာပါ..."></div><select data-filter-key="status" data-filter-route="${route}" aria-label="အခြေအနေ"><option value="">အခြေအနေအားလုံး</option>${["ဆိုင်းငံ့","ပြီးစီး","ပယ်ဖျက်ပြီး","ပျက်ပြယ်ပြီး"].map((item) => `<option${filterStatus === item ? " selected" : ""}>${item}</option>`).join("")}</select><select data-filter-key="date" data-filter-route="${route}" aria-label="ရက်စွဲအပိုင်းအခြား"><option value="">ရက်စွဲအားလုံး</option><option value="28 Aug"${filterDate === "28 Aug" ? " selected" : ""}>ယနေ့</option><option value="27 Aug"${filterDate === "27 Aug" ? " selected" : ""}>ယခင်ရက်</option></select><select data-filter-key="account" data-filter-route="${route}" aria-label="အကောင့်"><option value="">အကောင့်အားလုံး</option>${accountNames.map((item) => `<option${filterAccount === item ? " selected" : ""}>${esc(item)}</option>`).join("")}</select><select data-filter-key="creator" data-filter-route="${route}" aria-label="ဖန်တီးသူ"><option value="">ဖန်တီးသူအားလုံး</option>${creators.map((item) => `<option${filterCreator === item ? " selected" : ""}>${esc(item)}</option>`).join("")}</select><select data-filter-key="amount" data-filter-route="${route}" aria-label="ပမာဏ"><option value="">ပမာဏအားလုံး</option><option value="small"${filterAmount === "small" ? " selected" : ""}>K 500,000 အောက်</option><option value="medium"${filterAmount === "medium" ? " selected" : ""}>K 500,000–2m</option><option value="large"${filterAmount === "large" ? " selected" : ""}>K 2m နှင့်အထက်</option></select></div><div class="table-wrap"><table><thead><tr>${config.columns.map(([key, label]) => `<th class="sortable" data-sort-route="${route}" data-sort-key="${key}">${label}${sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}</th>`).join("")}<th></th></tr></thead><tbody>${tableRows || `<tr><td colspan="${config.columns.length + 1}" class="empty">ရှာဖွေမှုနှင့် ကိုက်ညီသည့်စာရင်း မရှိပါ။</td></tr>`}</tbody></table></div></section>`, route);
  }

  function transactionForm(type) {
    const out = type === "cash-out";
    const provider = state.providers.find((item) => item.name === state.transactionProvider) || state.providers[0];
    const noOcr = out && !provider.ocr;
    const values = noOcr ? { reference: "", time: "", amount: 0, filename: `${provider.name.split(" ")[0].toLowerCase()}_transfer_20260828.jpg` } : { reference: "WM2408241", time: "28 Aug 2026, 8:42 AM", amount: out ? 2150000 : 200000, filename: out ? "kbz_transfer_20260828.jpg" : "kbz_outbound_20260828.jpg" };
    const fee = out ? 50000 : 3000;
    const title = out ? "ငွေထုတ် အသစ်" : "ငွေပို့ အသစ်";
    const subtitle = noOcr ? `${provider.name} တွင် OCR ပံ့ပိုးမှု မရှိသေးပါ — ငွေလွှဲအသေးစိတ်ကို ကိုယ်တိုင်ထည့်ပါ။` : out ? "ငွေလွှဲ screenshot တင်ပြီး ပုံစံကို အလိုအလျောက်ဖြည့်ပါ၊ ထို့နောက် ငွေမပေးချေမီ စစ်ဆေးပါ။" : "ဖောက်သည်ထံမှငွေသားလက်ခံပြီး လက်ခံသူ၏အကောင့်သို့ လွှဲပို့ပါသည်။";
    const providerMenu = `<div class="provider-select"><button type="button" class="btn secondary" style="width:100%;justify-content:space-between" data-action="provider-toggle"><span>${esc(provider.name)}</span><span>⌄</span></button>${state.providerOpen ? `<div class="provider-menu">${state.providers.map((item) => `<button type="button" data-provider="${esc(item.name)}"><span>${esc(item.name)}</span><small class="tiny">${item.ocr ? "OCR" : "ကိုယ်တိုင်"}</small></button>`).join("")}</div>` : ""}</div>`;
    const section = (num, heading, body) => `<section class="form-section"><h2 class="section-title"><span class="section-num">${num}</span>${heading}</h2>${body}</section>`;
    const fields = (noOcrClass = "") => `<div class="field-grid"><div class="field ${noOcrClass}"><label>ပြင်ပကိုးကားနံပါတ်${!noOcr ? '<span class="ocr-tag">OCR</span>' : ""}</label><input name="reference" value="${values.reference}" placeholder="ဥပမာ- WM2408241"></div><div class="field ${noOcrClass}"><label>လွှဲပြောင်းသည့်ရက်/အချိန်${!noOcr ? '<span class="ocr-tag">OCR</span>' : ""}</label><input name="time" value="${values.time}" placeholder="ရက်စွဲနှင့်အချိန်ရွေးပါ"></div></div>`;
    return shell(`<a class="back" href="#${out ? "cash-out" : "cash-in"}">${icon("arrow")}${out ? "ငွေထုတ်" : "ငွေပို့"} စာရင်းသို့</a>${pageHead(title, subtitle)}<form id="transaction-form" data-kind="${type}" class="form-layout"><article class="card form-card">
      ${section(1, "စကရင်ရှော့", `<div class="field-grid"><div class="field"><label>ဝန်ဆောင်မှုပေးသူ</label>${providerMenu}</div><div class="field"><label>အထောက်အထားပုံ</label><div class="upload"><span class="upload-icon">${icon("upload")}</span><div class="upload-copy"><strong>${state.uploaded ? values.filename : "Screenshot ရွေးချယ်ပါ"}</strong><small>${state.uploaded ? `အပ်လုဒ်တင်ပြီး · ${noOcr ? "ကိုယ်တိုင်ထည့်ရန်လိုအပ်သည်" : "OCR ပြီးစီး"}` : "JPG သို့မဟုတ် PNG"}</small></div><label class="btn secondary small">${state.uploaded ? "အစားထိုးရန်" : "ရွေးရန်"}<input type="file" accept="image/*" data-action="upload" hidden></label></div></div></div>`)}
      ${section(2, out ? "လက်ခံသူ (လာရောက်သောဖောက်သည်)" : "လက်ခံသူ", `<div class="field-grid"><div class="field ${!out && !noOcr ? "ocr" : ""}"><label>${out ? "လက်ခံသူအမည်" : "အမည်"}${!out && !noOcr ? '<span class="ocr-tag">OCR</span>' : ""}</label><input name="customer" value="${!out && !noOcr ? "မိမိစံ" : ""}" placeholder="အမည်အပြည့်အစုံ" required></div><div class="field"><label>ဖုန်းနံပါတ်</label><input name="phone" inputmode="tel" placeholder="09xxxxxxxxx"></div></div>`)}
      ${section(3, "ကိုးကားနံပါတ်နှင့် လွှဲပြောင်းချိန်", fields(!noOcr ? "ocr" : ""))}
      ${section(4, "ကျွန်ုပ်တို့၏အကောင့်", `<div class="field-grid"><div class="field"><label>${out ? "ဘဏ်အကောင့် (ဝင်ငွေလက်ခံသည့်)" : "ဘဏ်အကောင့်"}</label><select name="bank">${accountOptions("KBZ - 09512345xx")}</select></div><div class="field"><label>ငွေသားအကောင့်</label><select name="cash">${accountOptions("ငွေသားဗီရို")}</select></div></div>`)}
      ${section(5, "ပမာဏ", `<div class="field-grid"><div class="field ${!noOcr ? "ocr" : ""}"><label>${out ? "ပမာဏ" : "အရင်းအမြစ်"} (ကျပ်)${!noOcr ? '<span class="ocr-tag">OCR</span>' : ""}</label><input name="amount" data-total-input value="${values.amount.toLocaleString("en-US")}" inputmode="numeric"></div><div class="field"><label>အခကြေးငွေ (ကျပ်)</label><input name="fee" data-total-input value="${fee.toLocaleString("en-US")}" inputmode="numeric"></div><div class="field span-2"><label>အခကြေးငွေ သိမ်းမည့်နေရာ</label><select>${accountOptions(out ? "Wave - 09777123xx" : "ငွေသားဗီရို")}</select></div></div>`)}
      ${out ? section(6, "အတည်ပြုခြင်း", `<label class="check-row"><input type="checkbox" name="verified" required><span>ဘဏ်/wallet အက်ပ်တွင် (screenshot တစ်ခုတည်းမက) ကိုယ်တိုင်စစ်ဆေးပြီး ငွေလွှဲမှု အမှန်ရောက်ရှိကြောင်း အတည်ပြုပါသည်။</span></label>`) : section(6, "မှတ်ချက် (ရွေးချယ်ခွင့်)", `<textarea name="note" placeholder="လိုက်နာမှုဆိုင်ရာ အသေးစိတ်ထည့်ပါ..."></textarea>`)}
      <section class="form-section"><div class="head-actions" style="justify-content:flex-end"><a class="btn secondary" href="#${out ? "cash-out" : "cash-in"}">ပယ်ဖျက်ရန်</a><button class="btn primary">ဆိုင်းငံ့အဖြစ် သိမ်းရန်</button></div></section>
      </article><aside class="stack"><article class="card summary-card"><h2>အနှစ်ချုပ်</h2><div class="summary-row"><span>${out ? "လက်ခံရရှိငွေပမာဏ" : "အရင်းအမြစ်"}</span><strong data-summary-amount>${money(values.amount)}</strong></div><div class="summary-row"><span>အခကြေးငွေ</span><strong data-summary-fee>${money(fee)}</strong></div><div class="summary-row total-row"><span>${out ? "ပေးချေရမည့်ငွေသား" : "ဖောက်သည်ပေးချေမည့်ပမာဏ"}</span><strong data-summary-total>${money(out ? values.amount - fee : values.amount + fee)}</strong></div>${!out ? `<div class="summary-row"><span>လွှဲပို့ပြီး</span><strong data-summary-deposited>${money(values.amount)}</strong></div><div class="side-note">KBZ - 09512345xx အကောင့်သည် ဤငွေလွှဲပြီးနောက် ဇီရိုအောက်ရောက်နိုင်ပါသည်။ ဆက်လက်လုပ်ဆောင်နိုင်ပါသည်။</div>` : ""}</article>${out ? `<article class="card card-body">${noOcr ? `<div class="alert warning">${icon("alert")}<span><strong>OCR မရရှိနိုင်ပါ</strong><br>${esc(provider.name)} အတွက် အသေးစိတ်ကို screenshot နှင့် နှိုင်းယှဉ်စစ်ဆေးပါ။</span></div>` : `<div class="alert error">${icon("alert")}<span>တူညီနိုင်သော ကိုးကားနံပါတ် — WM2408241 ကို ပြီးစီးသော ငွေထုတ်တွင် အသုံးပြုပြီးပါပြီ။</span></div>`}<h2 class="section-title">ဤသည်မှာ အလုပ်လုပ်ပုံ</h2><div class="guide">${[["အပ်လုဒ်တင်ရန်","ဝန်ဆောင်မှုပေးသူနှင့် screenshot ကို ရွေးပါ။"],["စစ်ဆေးရန်","ဖြည့်ထားသောအကွက်တိုင်းကို နှိုင်းယှဉ်ပါ။"],["ငွေပေးချေရန်","ငွေသားပေးပြီး ပြီးစီးအဖြစ် သတ်မှတ်ပါ။"]].map(([a,b],i)=>`<div class="guide-step"><b>${i+1}</b><span><strong>${a}</strong><br>${b}</span></div>`).join("")}</div></article>` : ""}</aside></form>`, out ? "cash-out" : "cash-in");
  }

  function renderAccounts() {
    const rows = state.accounts.map((item) => `<tr><td><strong>${esc(item.name)}</strong></td><td>${item.type}</td><td>${item.provider}</td><td class="num">${item.number}</td><td class="num"><strong>${money(item.balance)}</strong></td><td>${status(item.active ? "အသုံးပြုနေဆဲ" : "ရပ်ဆိုင်းထား")}</td><td><div class="actions"><button class="btn small secondary" data-action="edit-sim">ပြင်ဆင်</button><button class="btn small ${item.active ? "danger" : "secondary"}" data-toggle-account="${item.id}">${item.active ? "ရပ်ဆိုင်းရန်" : "ပြန်ဖွင့်ရန်"}</button></div></td></tr>`).join("");
    return shell(`${pageHead("အကောင့်များ", "ငွေသား၊ ဘဏ်နှင့် wallet အကောင့်များ။", `<button class="btn primary" data-open-modal="account">${icon("plus")}အကောင့်အသစ်ထည့်ရန်</button>`)}<section class="card"><div class="table-wrap"><table><thead><tr><th>အကောင့်အမည်</th><th>အမျိုးအစား</th><th>ဝန်ဆောင်မှုပေးသူ</th><th>အကောင့်နံပါတ်</th><th>လက်ကျန်ငွေ</th><th>အခြေအနေ</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`, "accounts");
  }

  function renderProviders() {
    const rows = state.providers.map((item) => `<tr><td><strong>${esc(item.name)}</strong></td><td>${status(item.ocr ? "ပံ့ပိုးထားသည်" : "မရရှိသေး")}</td><td>${item.accounts} အကောင့်</td><td><div class="actions"><button class="btn small secondary" data-toggle-ocr="${item.id}">${item.ocr ? "OCR ပိတ်ရန်" : "OCR ဖွင့်ရန်"}</button></div></td></tr>`).join("");
    return shell(`${pageHead("ဝန်ဆောင်မှုပေးသူများ", "ငွေလွှဲလက်ခံနိုင်သော ဘဏ်နှင့် wallet များ။", `<button class="btn primary" data-open-modal="provider">${icon("plus")}ဝန်ဆောင်မှုပေးသူ အသစ်ထည့်ရန်</button>`)}<section class="card"><div class="table-wrap"><table><thead><tr><th>ဝန်ဆောင်မှုပေးသူ</th><th>OCR ပံ့ပိုးမှု</th><th>အသုံးပြုနေသောအကောင့်</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`, "providers");
  }

  function renderUsers() {
    const rows = state.users.map((item) => `<tr><td><div style="display:flex;align-items:center;gap:10px"><span class="avatar">${esc(item.name[0])}</span><strong>${esc(item.name)}</strong></div></td><td class="num">${item.phone}</td><td>${item.role}</td><td>${status(item.active ? "အသုံးပြုနေဆဲ" : "ပိတ်ထားပြီး")}</td><td>${item.date}</td><td><div class="actions"><button class="btn small secondary" data-action="reset-password">စကားဝှက်ပြောင်းရန်</button><button class="btn small ${item.active ? "danger" : "secondary"}" data-toggle-user="${item.id}">${item.active ? "ပိတ်ရန်" : "ဖွင့်ရန်"}</button></div></td></tr>`).join("");
    return shell(`${pageHead("ဝန်ထမ်းများ", "ငွေကိုင်နှင့် ပိုင်ရှင် အကောင့်များကို စီမံပါ။ ပိုင်ရှင်သာ။", `<button class="btn primary" data-open-modal="user">${icon("plus")}ဝန်ထမ်းအသစ်ထည့်ရန်</button>`)}<section class="card"><div class="table-wrap"><table><thead><tr><th>အမည်</th><th>ဖုန်းနံပါတ်</th><th>ရာထူး</th><th>အခြေအနေ</th><th>ဖန်တီးသည့်ရက်</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`, "users");
  }

  function renderSummary() {
    const expected = [38200000, 14900000, 18670000, 12480000, 4900000];
    const names = ["KBZ - 09512345xx", "KBZ - 09598765xx", "Wave - 09777123xx", "ငွေသားဗီရို", "KBZ - 09765119982"];
    const rows = names.map((name, index) => { const variance = state.counts[index] - expected[index]; return `<tr><td><strong>${name}</strong></td><td class="num">${money(expected[index])}</td><td class="num">${money(state.counts[index])}</td><td class="num" style="color:${variance ? "var(--error)" : "inherit"}">${variance < 0 ? "-" : ""}${money(Math.abs(variance))}</td><td>${status(variance ? "ကွာဟမှု" : "ကိုက်ညီသည်")}</td></tr>`; }).join("");
    return shell(`${pageHead("အနှစ်ချုပ်", "အမြတ်ငွေ၊ လက်ကျန်ငွေနှင့် နေ့စဉ်ချိန်ညှိမှု။", '<select aria-label="ကာလ"><option>ယခုလ</option><option>ယခင်လ</option></select>')}<section class="metrics"><article class="card metric total"><div class="metric-label">စုစုပေါင်းလက်ကျန် (အကောင့်အားလုံး)</div><div class="metric-value">K 84,250,000</div><div class="metric-note">ယခုအချိန်၊ တိုက်ရိုက်</div></article><article class="card metric"><div class="metric-label">အခကြေးငွေဝင်ငွေ (ယခုလ)</div><div class="metric-value">K 4.62m</div><div class="metric-note">လုပ်ငန်းစဉ်အားလုံး</div></article><article class="card metric"><div class="metric-label">ငွေပို့ အရေအတွက်</div><div class="metric-value">128</div><div class="metric-note">လုပ်ငန်းစဉ်</div></article><article class="card metric"><div class="metric-label">ငွေထုတ် အရေအတွက်</div><div class="metric-value">94</div><div class="metric-note">လုပ်ငန်းစဉ်</div></article></section><section class="card"><div class="card-head"><div><h2>နေ့စဉ်ချိန်ညှိမှု</h2><div class="tiny" style="margin-top:6px">စစ်ဆေးမှုသာဖြစ်ပြီး ပြင်ဆင်ခြင်းမဟုတ်ပါ — ကွာဟမှုကို စုံစမ်းမည်။</div></div><button class="btn primary" data-open-modal="count">ယနေ့ရေတွက်မှုထည့်ရန်</button></div><div class="table-wrap"><table><thead><tr><th>အကောင့်</th><th>မျှော်မှန်း</th><th>အမှန်တကယ်</th><th>ကွာဟမှု</th><th>အခြေအနေ</th></tr></thead><tbody>${rows}</tbody></table></div></section>`, "summary");
  }

  function modalFrame(title, body, submitLabel, wide = false) {
    return `<div class="modal-layer" data-action="modal-backdrop"><section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><form id="modal-form" data-modal="${state.modal}"><header class="modal-head"><h2 id="modal-title">${title}</h2><button type="button" class="btn ghost" data-action="modal-close" aria-label="ပိတ်ရန်">${icon("close")}</button></header><div class="modal-body">${body}</div><footer class="modal-actions"><button type="button" class="btn secondary" data-action="modal-close">ပယ်ဖျက်ရန်</button><button class="btn primary">${submitLabel}</button></footer></form></section></div>`;
  }

  function renderModal() {
    if (state.modal === "transfer") return modalFrame("အတွင်းပိုင်းငွေလွှဲ အသစ်", `<div class="field-grid"><div class="field span-2"><label>ထံမှအကောင့်</label><select name="from">${accountOptions("KBZ - 09512345xx")}</select></div><button type="button" class="btn secondary span-2" data-action="swap">${icon("swap")}အကောင့်နှစ်ခုလဲရန်</button><div class="field span-2"><label>ထံသို့အကောင့်</label><select name="to">${accountOptions("Wave - 09777123xx")}</select></div><div class="field span-2"><label>ပမာဏ (ကျပ်)</label><input name="amount" value="5,000,000" required></div><div class="field span-2"><label>မှတ်ချက် (ရွေးချယ်ခွင့်)</label><textarea name="note" placeholder="မှတ်ချက်ထည့်ရန်..."></textarea></div></div>`, "လွှဲမည်");
    if (state.modal === "capital") return modalFrame("ရင်းနှီးငွေ စာရင်းအသစ်", `<div class="field-grid"><div class="field span-2"><label>အမျိုးအစား</label><div class="switch-row"><button type="button" data-toggle="capitalType" data-value="ငွေသွင်း" class="${state.capitalType === "ငွေသွင်း" ? "active" : ""}">ငွေသွင်း</button><button type="button" data-toggle="capitalType" data-value="ငွေထုတ်ယူ" class="${state.capitalType === "ငွေထုတ်ယူ" ? "active" : ""}">ငွေထုတ်ယူ</button></div></div><div class="field span-2"><label>အကောင့်</label><select name="account">${accountOptions()}</select></div><div class="field span-2"><label>ပမာဏ (ကျပ်)</label><input name="amount" value="10,000,000" required></div><div class="field span-2"><label>မှတ်ချက် (ရွေးချယ်ခွင့်)</label><textarea placeholder="မှတ်ချက်ထည့်ရန်..."></textarea></div></div>`, "စာရင်းသိမ်းရန်");
    if (state.modal === "account") return modalFrame("အကောင့်အသစ်ထည့်ရန်", `<div class="field-grid"><div class="field span-2"><label>အကောင့်အမည်</label><input name="name" placeholder="Wave - 09112445810" required></div><div class="field span-2"><label>အမျိုးအစား</label><div class="switch-row"><button type="button" data-toggle="accountType" data-value="ငွေသား" class="${state.accountType === "ငွေသား" ? "active" : ""}">ငွေသား</button><button type="button" data-toggle="accountType" data-value="ဘဏ်" class="${state.accountType === "ဘဏ်" ? "active" : ""}">ဘဏ်</button></div></div><div class="field"><label>ဝန်ဆောင်မှုပေးသူ</label><select name="provider" ${state.accountType === "ငွေသား" ? "disabled" : ""}>${state.providers.map((item) => `<option>${esc(item.name)}</option>`).join("")}</select></div><div class="field"><label>အကောင့်နံပါတ်</label><input name="number" placeholder="09112445810"></div><label class="check-row span-2"><input name="active" type="checkbox" checked><span><strong>အသုံးပြုနေဆဲ</strong><br>ငွေလွှဲမှုအသစ်တွင် ရွေးချယ်နိုင်သည်</span></label></div>`, "ထည့်ရန်");
    if (state.modal === "provider") return modalFrame("ဝန်ဆောင်မှုပေးသူ အသစ်ထည့်ရန်", `<div class="field"><label>ဝန်ဆောင်မှုပေးသူအမည်</label><input name="name" placeholder="ဥပမာ- ဧရာဝတီဘဏ်" required></div><div class="alert info" style="margin-top:16px">${icon("info")}<span>ဝန်ဆောင်မှုပေးသူအသစ်များသည် OCR ပံ့ပိုးမှုမပါဘဲစတင်ပါမည်။ စည်းမျဉ်းများ စမ်းသပ်ပြီးပါက ဖွင့်ပေးပါမည်။</span></div>`, "ထည့်ရန်");
    if (state.modal === "user") return modalFrame("ဝန်ထမ်းအသစ်ထည့်ရန်", `<div class="field-grid"><div class="field span-2"><label>အမည်အပြည့်အစုံ</label><input name="name" placeholder="အမည်အပြည့်အစုံ" required></div><div class="field span-2"><label>ဖုန်းနံပါတ်</label><input name="phone" inputmode="tel" placeholder="09xxxxxxxxx" required></div><div class="field span-2"><label>ရာထူး</label><div class="switch-row"><button type="button" data-toggle="staffRole" data-value="ငွေကိုင်" class="${state.staffRole === "ငွေကိုင်" ? "active" : ""}">ငွေကိုင်</button><button type="button" data-toggle="staffRole" data-value="ပိုင်ရှင်" class="${state.staffRole === "ပိုင်ရှင်" ? "active" : ""}">ပိုင်ရှင်</button></div></div><div class="field span-2"><label>အစပိုင်းစကားဝှက်</label><div style="display:flex;gap:8px"><input name="password" value="${state.generatedPassword}" readonly><button type="button" class="btn secondary" data-action="generate-password">ထုတ်ပေးရန်</button></div><span class="tiny">ဤစကားဝှက်ကို ဝန်ထမ်းထံ တိုက်ရိုက်ပေးပါ။</span></div></div>`, "ထည့်ရန်");
    if (state.modal === "count") {
      const expected = [38200000, 14900000, 18670000, 12480000, 4900000];
      const names = ["KBZ - 09512345xx", "KBZ - 09598765xx", "Wave - 09777123xx", "ငွေသားဗီရို", "KBZ - 09765119982"];
      const rows = names.map((name, index) => { const variance = state.counts[index] - expected[index]; return `<div class="recon-grid"><strong>${name}</strong><span class="muted num">${money(expected[index])}</span><div><input name="count-${index}" data-count-index="${index}" data-expected="${expected[index]}" value="${state.counts[index].toLocaleString("en-US")}" class="${variance ? "count-error" : ""}"><div class="variance" data-variance-index="${index}">${variance ? `${variance < 0 ? "-" : "+"}${money(Math.abs(variance))} (မျှော်မှန်းချက်နှင့်)` : ""}</div></div></div>`; }).join("");
      return modalFrame("ယနေ့ရေတွက်မှုထည့်ရန်", `<p class="muted" style="margin-top:0">တနင်္လာ၊ သြဂုတ် 24၊ 2026</p><div class="alert info">${icon("info")}<span>ငွေသားကို ရေတွက်ပြီး ဘဏ်/wallet အက်ပ်တစ်ခုစီကို စစ်ဆေးပါ။ ဤသည်က စာရင်းကို မပြောင်းလဲစေဘဲ ကွာဟမှုကိုသာ အမှတ်အသားပြုပါမည်။</span></div><div class="recon-grid head"><span>အကောင့်</span><span>မျှော်မှန်း</span><span>အမှန်ရေတွက်မှု</span></div>${rows}`, "ရေတွက်မှုသိမ်းရန်", true);
    }
    return "";
  }

  function render() {
    document.body.classList.remove("drawer-open");
    const route = currentRoute();
    if (!state.authenticated || route === "login") { renderLogin(); return; }
    if (route === "dashboard") app.innerHTML = renderDashboard();
    else if (listConfigs[route]) app.innerHTML = renderList(route);
    else if (route === "cash-in-new") app.innerHTML = transactionForm("cash-in");
    else if (route === "cash-out-new") app.innerHTML = transactionForm("cash-out");
    else if (route === "accounts") app.innerHTML = renderAccounts();
    else if (route === "providers") app.innerHTML = renderProviders();
    else if (route === "users") app.innerHTML = renderUsers();
    else if (route === "summary") app.innerHTML = renderSummary();
    else routeTo("dashboard");
  }

  function closeModal() { state.modal = null; render(); }
  function formData(form) { return Object.fromEntries(new FormData(form).entries()); }

  app.addEventListener("click", (event) => {
    if (event.target.matches(".modal-layer")) { closeModal(); return; }
    const target = event.target.closest("button, a, label");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "show-password") { const input = document.querySelector("#password"); state.showPassword = !state.showPassword; input.type = state.showPassword ? "text" : "password"; input.focus(); }
    if (action === "drawer-open") document.body.classList.add("drawer-open");
    if (action === "drawer-close") document.body.classList.remove("drawer-open");
    if (action === "logout") { state.authenticated = false; state.loginState = "default"; routeTo("login"); render(); }
    if (target.dataset.openModal) { state.modal = target.dataset.openModal; render(); setTimeout(() => document.querySelector(".modal input")?.focus(), 0); }
    if (action === "modal-close") closeModal();
    if (action === "provider-toggle") { state.providerOpen = !state.providerOpen; render(); }
    if (target.dataset.provider) { state.transactionProvider = target.dataset.provider; state.providerOpen = false; render(); }
    if (target.dataset.toggle) { state[target.dataset.toggle] = target.dataset.value; render(); }
    if (action === "swap") { const from = document.querySelector('[name="from"]'); const to = document.querySelector('[name="to"]'); [from.value, to.value] = [to.value, from.value]; }
    if (action === "generate-password") { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#@"; state.generatedPassword = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""); render(); }
    if (target.dataset.sortRoute) { const route = target.dataset.sortRoute; const key = target.dataset.sortKey; const old = state.sort[route] || []; state.sort[route] = [key, old[0] === key && old[1] === "asc" ? "desc" : "asc"]; render(); }
    if (target.dataset.toggleAccount) { const item = state.accounts.find((row) => row.id === Number(target.dataset.toggleAccount)); item.active = !item.active; toast(item.active ? "အကောင့် ပြန်ဖွင့်ပြီးပါပြီ။" : "အကောင့် ရပ်ဆိုင်းပြီးပါပြီ။"); render(); }
    if (target.dataset.toggleUser) { const item = state.users.find((row) => row.id === Number(target.dataset.toggleUser)); item.active = !item.active; toast(item.active ? "အသုံးပြုသူ ဖွင့်ပြီးပါပြီ။" : "အသုံးပြုသူ ပိတ်ပြီးပါပြီ။"); render(); }
    if (target.dataset.toggleOcr) { const item = state.providers.find((row) => row.id === Number(target.dataset.toggleOcr)); item.ocr = !item.ocr; toast("OCR အခြေအနေ ပြောင်းပြီးပါပြီ။"); render(); }
    if (["complete", "cancel-row", "void-row"].includes(action)) { const config = listConfigs[target.dataset.list]; const item = state[config.data].find((row) => row.id === target.dataset.id); item.status = action === "complete" ? "ပြီးစီး" : action === "void-row" ? "ပျက်ပြယ်ပြီး" : "ပယ်ဖျက်ပြီး"; toast(`စာရင်း ${item.status} အဖြစ် ပြောင်းပြီးပါပြီ။`); render(); }
    if (["row-info", "edit-sim", "reset-password"].includes(action)) toast(action === "reset-password" ? "စကားဝှက်အသစ် ထုတ်ပေးပြီးပါပြီ။" : "နမူနာလုပ်ဆောင်ချက် အောင်မြင်ပါသည်။");
  });

  app.addEventListener("input", (event) => {
    if (event.target.dataset.filterQuery) { const route = event.target.dataset.filterQuery; state.filters[route] = { ...(state.filters[route] || {}), query: event.target.value }; render(); const input = document.querySelector(`[data-filter-query="${route}"]`); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); }
    if (event.target.dataset.totalInput !== undefined) {
      const form = event.target.form; const amount = numberValue(form.amount.value); const fee = numberValue(form.fee.value); const out = form.dataset.kind === "cash-out";
      document.querySelector("[data-summary-amount]").textContent = money(amount);
      document.querySelector("[data-summary-fee]").textContent = money(fee);
      document.querySelector("[data-summary-total]").textContent = money(out ? Math.max(0, amount - fee) : amount + fee);
      const deposited = document.querySelector("[data-summary-deposited]"); if (deposited) deposited.textContent = money(amount);
    }
    if (event.target.dataset.countIndex !== undefined) {
      const index = Number(event.target.dataset.countIndex); const variance = numberValue(event.target.value) - Number(event.target.dataset.expected); state.counts[index] = numberValue(event.target.value);
      event.target.style.borderColor = variance ? "var(--error)" : "var(--border)";
      document.querySelector(`[data-variance-index="${index}"]`).textContent = variance ? `${variance < 0 ? "-" : "+"}${money(Math.abs(variance))} (မျှော်မှန်းချက်နှင့်)` : "";
    }
  });

  app.addEventListener("change", (event) => {
    if (event.target.dataset.filterRoute) { const route = event.target.dataset.filterRoute; const key = event.target.dataset.filterKey; state.filters[route] = { ...(state.filters[route] || {}), [key]: event.target.value }; render(); }
    if (event.target.dataset.action === "upload") { state.uploaded = Boolean(event.target.files?.length); toast("Screenshot အပ်လုဒ်တင်ပြီး OCR ဖတ်ပြီးပါပြီ။"); render(); }
  });

  app.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    if (form.id === "login-form") {
      const data = formData(form);
      if (data.phone === "09999999999") state.loginState = "disabled";
      else if (data.password === "wrong") state.loginState = "error";
      else { state.authenticated = true; state.loginState = "default"; routeTo("dashboard"); }
      render(); return;
    }
    if (form.id === "transaction-form") {
      const data = formData(form); const out = form.dataset.kind === "cash-out"; const rows = out ? state.cashOut : state.cashIn;
      rows.unshift({ id: `${out ? "CO" : "CI"}-${out ? 8822 : 10232}`, customer: data.customer || "အမည်မသတ်မှတ်ရသေး", account: data.bank, amount: numberValue(data.amount), fee: numberValue(data.fee), status: "ဆိုင်းငံ့", creator: "ဒေါ်လှ", date: "ယခု" });
      toast("ဆိုင်းငံ့စာရင်းအဖြစ် သိမ်းပြီးပါပြီ။"); routeTo(out ? "cash-out" : "cash-in"); return;
    }
    if (form.id === "modal-form") {
      const data = formData(form);
      if (state.modal === "transfer") state.transfers.unshift({ id: `TRF-${442 + state.transfers.length - 4}`, from: data.from, to: data.to, amount: numberValue(data.amount), status: "ဆိုင်းငံ့", creator: "ဒေါ်လှ" });
      if (state.modal === "capital") state.capital.unshift({ id: `CAP-${116 + state.capital.length - 4}`, type: state.capitalType, account: data.account, amount: numberValue(data.amount), status: "ဆိုင်းငံ့", creator: "ဒေါ်လှ" });
      if (state.modal === "account") state.accounts.push({ id: Date.now(), name: data.name, type: state.accountType, provider: state.accountType === "ငွေသား" ? "—" : data.provider, number: data.number || "—", balance: 0, active: Boolean(data.active) });
      if (state.modal === "provider") state.providers.push({ id: Date.now(), name: data.name, ocr: false, accounts: 0 });
      if (state.modal === "user") state.users.push({ id: Date.now(), name: data.name, phone: data.phone, role: state.staffRole, active: true, date: "21 Sep 2026" });
      toast(state.modal === "count" ? "ယနေ့ရေတွက်မှု သိမ်းပြီးပါပြီ။" : "စာရင်းအသစ် ထည့်ပြီးပါပြီ။"); closeModal();
    }
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && state.modal) closeModal(); });
  render();
})();
