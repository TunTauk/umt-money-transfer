(() => {
  "use strict";

  const app = document.querySelector("#app");
  const toastNode = document.querySelector("#toast");
  const money = (value) => `K ${Number(value || 0).toLocaleString("en-US")}`;
  const numberValue = (value) => Number(String(value ?? "0").replace(/[^0-9.-]/g, "")) || 0;
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    in: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 21h14"/>', out: '<path d="M12 21V9m0 0 4 4m-4-4-4 4"/><path d="M5 3h14"/>',
    transfer: '<path d="m17 3 4 4-4 4"/><path d="M3 7h18"/><path d="m7 21-4-4 4-4"/><path d="M21 17H3"/>', wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M16 15h.01"/>',
    account: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>', provider: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>', users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    report: '<path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>', arrow: '<path d="m15 18-6-6 6-6"/>', info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>', ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>', logout: '<path d="M10 17l5-5-5-5m5 5H3"/><path d="M15 3h6v18h-6"/>', chevronDown: '<path d="m6 9 6 6 6-6"/>', chevronUp: '<path d="m6 15 6-6 6 6"/>', trash: '<path d="M3 6h18M8 6V4h8v2m-9 0 1 15h8l1-15M10 11v5m4-5v5"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>'
  };
  const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.info}</svg>`;

  const staff = [{ id: "s1", name: "အောင်ကို" }, { id: "s2", name: "မြမြ" }, { id: "s3", name: "နီလာအေး" }];
  const accounts = [
    { id: "b-main", kind: "bank", main: true, name: "Main Bank", provider: "KBZ Bank", number: "09512345678", balance: 38200000, active: true, staff: [] },
    { id: "b-1", kind: "bank", name: "KBZ Child 01", provider: "KBZ Bank", number: "09598765432", balance: 14900000, active: true, staff: ["s1"] },
    { id: "b-2", kind: "bank", name: "Wave Child 02", provider: "Wave Money", number: "09777123456", balance: 18670000, active: true, staff: ["s2"] },
    { id: "b-3", kind: "bank", name: "AYA Child 03", provider: "AYA Bank", number: "09111222333", balance: 8700000, active: true, staff: ["s3"] },
    { id: "b-4", kind: "bank", name: "CB Child 04", provider: "CB Bank", number: "09987654321", balance: 6200000, active: true, staff: ["s2", "s3"] },
    { id: "c-main", kind: "cash", main: true, name: "Main Cash", provider: "ငွေသား", number: "ရုံးချုပ်", balance: 12480000, active: true, staff: [] },
    { id: "c-1", kind: "cash", name: "Counter Cash 01", provider: "ငွေသား", number: "ကောင်တာ ၁", balance: 4870000, active: true, staff: ["s1"] },
    { id: "c-2", kind: "cash", name: "Counter Cash 02", provider: "ငွေသား", number: "ကောင်တာ ၂", balance: 3150000, active: true, staff: ["s2"] },
    { id: "c-3", kind: "cash", name: "Counter Cash 03", provider: "ငွေသား", number: "ကောင်တာ ၃", balance: 2780000, active: true, staff: ["s3"] },
    { id: "c-4", kind: "cash", name: "Counter Cash 04", provider: "ငွေသား", number: "ကောင်တာ ၄", balance: 1940000, active: true, staff: ["s2", "s3"] }
  ];

  const state = {
    authenticated: false, loginState: "default", showPassword: false, role: "owner", modal: null, tab: { accounts: "bank", transfers: "bank", capital: "bank" }, expanded: {}, editing: null,
    accounts,
    cashIn: [
      { id: "CI-10231", systemReference: "UMT-CI-20260828-10231", timestamp: "28 Aug 2026, 9:14 AM", customer: "မြသီတာ", phone: "09250123456", accountId: "b-1", amount: 200000, fee: 2000, creator: "အောင်ကို", note: "ပုံမှန်ငွေပို့" },
      { id: "CI-10230", systemReference: "UMT-CI-20260828-10230", timestamp: "28 Aug 2026, 8:50 AM", customer: "ဦးကျော်ဇင်", phone: "09777111222", accountId: "b-2", amount: 150000, fee: 1500, feeMode: "separate", feeAccountId: "b-main", creator: "မြမြ", note: "ဖောက်သည်အတည်ပြုပြီး" },
      { id: "CI-10229", systemReference: "UMT-CI-20260827-10229", timestamp: "27 Aug 2026, 4:10 PM", customer: "ဒေါ်နီလာ", phone: "09420003344", accountId: "b-3", amount: 500000, fee: 5000, creator: "နီလာအေး", note: "" }
    ],
    cashOut: [
      { id: "CO-8821", systemReference: "UMT-CO-20260828-08821", timestamp: "28 Aug 2026, 8:05 AM", customer: "ကိုဇော်မင်း", phone: "09510002233", accountId: "c-1", amount: 2150000, fee: 50000, creator: "အောင်ကို", note: "မှတ်ပုံတင်စစ်ဆေးပြီး" },
      { id: "CO-8820", systemReference: "UMT-CO-20260828-08820", timestamp: "28 Aug 2026, 7:40 AM", customer: "မိမိစံ", phone: "09666677889", accountId: "c-2", amount: 640000, fee: 15000, feeMode: "separate", feeAccountId: "c-main", creator: "မြမြ", note: "" },
      { id: "CO-8819", systemReference: "UMT-CO-20260827-08819", timestamp: "27 Aug 2026, 3:10 PM", customer: "ဒေါ်နီလာ", phone: "09420003344", accountId: "c-3", amount: 1000000, fee: 20000, creator: "နီလာအေး", note: "ဖောက်သည်ကိုယ်တိုင်ထုတ်" }
    ],
    transfers: [
      { id: "TRF-441", kind: "bank", direction: "main-child", childId: "b-1", amount: 5000000, note: "ကောင်တာနေ့စဉ်လည်ပတ်ငွေ", date: "28 Aug, 10:20 AM" },
      { id: "TRF-440", kind: "cash", direction: "child-main", childId: "c-2", amount: 2000000, note: "ညနေပိုင်း ပြန်အပ်ငွေ", date: "28 Aug, 6:00 PM" },
      { id: "TRF-439", kind: "bank", direction: "child-main", childId: "b-3", amount: 1200000, note: "လက်ကျန်ပိုငွေ ပြန်သိမ်း", date: "27 Aug, 5:45 PM" }
    ],
    capital: [
      { id: "CAP-115", kind: "bank", action: "deposit", amount: 10000000, note: "လုပ်ငန်းလည်ပတ်ရန် ပိုင်ရှင်ထည့်ငွေ", date: "28 Aug" },
      { id: "CAP-114", kind: "cash", action: "withdraw", amount: 1500000, note: "ပိုင်ရှင်ထုတ်ယူငွေ", date: "27 Aug" }
    ],
    providers: ["KBZ Bank", "Wave Money", "AYA Bank", "CB Bank"],
    users: [{ name: "ဒေါ်လှ", email: "owner@umt.mm", role: "ပိုင်ရှင်" }, { name: "အောင်ကို", email: "aungko@umt.mm", role: "ဝန်ထမ်း" }, { name: "မြမြ", email: "myamya@umt.mm", role: "ဝန်ထမ်း" }, { name: "နီလာအေး", email: "nilaaye@umt.mm", role: "ဝန်ထမ်း" }]
  };

  const currentRoute = () => (location.hash.replace(/^#\/?/, "") || "login").split("?")[0];
  const routeTo = (route) => { location.hash = `#${route}`; };
  if (currentRoute() !== "login") state.authenticated = true;
  const account = (id) => state.accounts.find((item) => item.id === id);
  const isOwner = () => state.role === "owner";
  const assignedIds = () => state.accounts.filter((item) => item.staff.includes("s1")).map((item) => item.id);
  const assignedAccount = (kind) => state.accounts.find((item) => item.kind === kind && item.staff.includes("s1") && item.active);
  const toast = (message) => { toastNode.textContent = message; toastNode.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => toastNode.classList.remove("show"), 2600); };
  const accountOptions = (kind, selected) => state.accounts.filter((item) => item.kind === kind && item.active && (isOwner() || assignedIds().includes(item.id))).map((item) => `<option value="${item.id}"${item.id === selected ? " selected" : ""}>${esc(item.name)}</option>`).join("");
  const tabs = (screen) => `<div class="tabs" role="tablist"><button class="${state.tab[screen] === "bank" ? "active" : ""}" data-tab-screen="${screen}" data-tab-value="bank">ဘဏ်</button><button class="${state.tab[screen] === "cash" ? "active" : ""}" data-tab-screen="${screen}" data-tab-value="cash">ငွေသား</button></div>`;
  const navItems = isOwner() ? [["dashboard", "ဒက်ရှ်ဘုတ်", "dashboard"], ["cash-in", "ငွေပို့", "in"], ["cash-out", "ငွေထုတ်", "out"], ["transfers", "အတွင်းပိုင်းငွေလွှဲ", "transfer"], ["capital", "ရင်းနှီးငွေ", "wallet"], ["accounts", "အကောင့်များ", "account"], ["providers", "ဝန်ဆောင်မှုပေးသူများ", "provider"], ["users", "အသုံးပြုသူများ", "users"], ["summary", "အနှစ်ချုပ်", "report"]] : [["dashboard", "ဒက်ရှ်ဘုတ်", "dashboard"], ["cash-in", "ငွေပို့", "in"], ["cash-out", "ငွေထုတ်", "out"]];

  function renderLogin() {
    const message = state.loginState === "error" ? `<div class="alert error">${icon("info")}<span>အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။</span></div>` : state.loginState === "disabled" ? `<div class="alert error">${icon("ban")}<span>ဤအကောင့်ကို ပိတ်ထားပါသည်။ ပိုင်ရှင်ကို ဆက်သွယ်ပါ။</span></div>` : "";
    app.innerHTML = `<main class="login-page"><section class="login-main"><form class="login-card" id="login-form"><div class="wordmark login-mark"><span class="mark">U</span> UMT</div><h2>ဝင်ရောက်ရန်</h2><p>အီးမေးလ်နှင့် စကားဝှက်ကို ထည့်သွင်းပါ။</p>${message}<div class="field ${state.loginState === "error" ? "invalid" : ""}"><label for="email">အီးမေးလ်</label><input id="email" name="email" type="email" autocomplete="username" placeholder="name@umt.mm" value="${state.loginState === "disabled" ? "disabled@umt.mm" : state.loginState === "error" ? "owner@umt.mm" : ""}" required></div><div class="field ${state.loginState === "error" ? "invalid" : ""}" style="margin-top:16px"><label for="password">စကားဝှက်</label><div class="input-wrap"><input id="password" name="password" type="${state.showPassword ? "text" : "password"}" autocomplete="current-password" placeholder="စကားဝှက်ထည့်ပါ" value="${state.loginState === "error" ? "wrong" : ""}" required><button type="button" data-action="show-password" aria-label="စကားဝှက်ပြရန်">${icon("eye")}</button></div></div><button class="btn primary login-submit" ${state.loginState === "disabled" ? "disabled" : ""}>ဝင်ရောက်ရန်</button><div class="fixture-row"><button type="button" class="btn small secondary" data-login-fixture="error">Error နမူနာ</button><button type="button" class="btn small secondary" data-login-fixture="disabled">Disabled နမူနာ</button><button type="button" class="btn small ghost" data-login-fixture="default">ပြန်ရှင်းရန်</button></div><p class="tiny demo-hint">Demo: မည်သည့် မှန်ကန်သော email/password ဖြင့်မဆို ဝင်နိုင်ပါသည်။</p></form></section></main>`;
  }

  function shell(content, active) {
    const owner = isOwner();
    return `<div class="app-shell"><aside class="sidebar"><div class="wordmark"><span class="mark">U</span> UMT</div><nav class="nav" aria-label="အဓိကလမ်းညွှန်">${navItems.map(([route, label, glyph]) => `<a href="#${route}" class="${active === route ? "active" : ""}">${icon(glyph)}<span>${label}</span></a>`).join("")}</nav><div class="sidebar-foot">UMT Money Transfer<br>Desktop Prototype</div></aside><button class="drawer-backdrop" data-action="drawer-close" aria-label="မီနူးပိတ်ရန်"></button><header class="topbar"><div class="topbar-brand"><button class="mobile-menu" data-action="drawer-open" aria-label="မီနူးဖွင့်ရန်">${icon("menu")}</button><span>ငွေလွှဲစီမံခန့်ခွဲမှု</span></div><div class="top-actions"><div class="role-switch" aria-label="Demo role"><button class="${owner ? "active" : ""}" data-role="owner">Owner</button><button class="${!owner ? "active" : ""}" data-role="staff">Staff</button></div><div class="profile"><span class="avatar">${owner ? "ဒ" : "အ"}</span><div><strong>${owner ? "ဒေါ်လှ" : "အောင်ကို"}</strong><small>${owner ? "ပိုင်ရှင်" : "ဝန်ထမ်း"}</small></div><button class="btn ghost" data-action="logout" title="ထွက်ရန်">${icon("logout")}</button></div></div></header><main class="main">${content}</main></div>${state.modal ? renderModal() : ""}`;
  }
  const pageHead = (title, subtitle, action = "", eyebrow = "စီမံခန့်ခွဲမှု") => `<header class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${action ? `<div class="head-actions">${action}</div>` : ""}</header>`;

  function renderDashboard() {
    const visibleAccounts = isOwner() ? state.accounts : state.accounts.filter((item) => assignedIds().includes(item.id));
    const sum = (kind, main) => visibleAccounts.filter((item) => item.kind === kind && Boolean(item.main) === main).reduce((total, item) => total + item.balance, 0);
    const total = visibleAccounts.reduce((value, item) => value + item.balance, 0);
    const bankMain = sum("bank", true), bankChildren = sum("bank", false), cashMain = sum("cash", true), cashChildren = sum("cash", false);
    const rows = visibleAccounts.map((item) => `<tr><td><strong>${esc(item.name)}</strong>${item.main ? '<span class="main-tag">MAIN</span>' : ""}</td><td>${item.kind === "bank" ? "ဘဏ်" : "ငွေသား"}</td><td>${esc(item.provider)}</td><td class="num"><strong>${money(item.balance)}</strong></td></tr>`).join("");
    const recent = [...state.cashIn.slice(0, 2).map((item) => ({ ...item, type: "ငွေပို့", glyph: "in" })), ...state.cashOut.slice(0, 2).map((item) => ({ ...item, type: "ငွေထုတ်", glyph: "out" }))].filter((item) => isOwner() || assignedIds().includes(item.accountId)).map((item) => `<div class="activity-item"><span class="activity-icon">${icon(item.glyph)}</span><div><strong>${esc(item.customer)}</strong><p>${item.type} · ${esc(item.id)} · ${esc(item.timestamp)}</p></div><strong class="num">${money(item.amount)}</strong></div>`).join("");
    return shell(`${pageHead("ဒက်ရှ်ဘုတ်", ownerText("လုပ်ငန်းတစ်ခုလုံး၏ ပင်မနှင့် ကလေးအကောင့် လက်ကျန်များ", "သင့်အတွက် သတ်မှတ်ထားသောအကောင့် လက်ကျန်များ"), '<span class="muted">သောကြာ၊ စက်တင်ဘာ 25၊ 2026</span>', "ယနေ့အခြေအနေ")}<section class="metrics dashboard-metrics"><article class="card metric total"><div class="metric-label">စုစုပေါင်းလက်ကျန်</div><div class="metric-value">${money(total)}</div><div class="metric-note">${isOwner() ? "အကောင့်အားလုံး" : "သတ်မှတ်ထားသောအကောင့်များသာ"}</div></article><article class="card metric"><div class="metric-label">ပင်မဘဏ်</div><div class="metric-value">${money(bankMain)}</div></article><article class="card metric"><div class="metric-label">ဘဏ်ခွဲများ</div><div class="metric-value">${money(bankChildren)}</div></article><article class="card metric"><div class="metric-label">စုစုပေါင်းဘဏ်</div><div class="metric-value">${money(bankMain + bankChildren)}</div></article><article class="card metric"><div class="metric-label">ပင်မငွေသား</div><div class="metric-value">${money(cashMain)}</div></article><article class="card metric"><div class="metric-label">ငွေသားခွဲများ</div><div class="metric-value">${money(cashChildren)}</div></article><article class="card metric"><div class="metric-label">စုစုပေါင်းငွေသား</div><div class="metric-value">${money(cashMain + cashChildren)}</div></article></section><section class="dashboard-grid clean"><article class="card"><div class="card-head"><h2>${isOwner() ? "အကောင့်လက်ကျန်များ" : "သတ်မှတ်ထားသောအကောင့်များ"}</h2>${isOwner() ? '<a class="btn ghost small" href="#accounts">စီမံရန်</a>' : ""}</div><div class="table-wrap"><table><thead><tr><th>အကောင့်</th><th>အမျိုးအစား</th><th>ဝန်ဆောင်မှု</th><th>လက်ကျန်</th></tr></thead><tbody>${rows}</tbody></table></div></article><article class="card"><div class="card-head"><h2>လတ်တလော လုပ်ငန်းစဉ်</h2></div><div class="card-body activity">${recent}</div></article></section>`, "dashboard");
  }
  const ownerText = (owner, staffText) => isOwner() ? owner : staffText;

  function visibleTransactions(kind) {
    return state[kind].filter((row) => !row.deleted && (isOwner() || assignedIds().includes(row.accountId)));
  }

  function renderTransactions(route) {
    const isIn = route === "cash-in";
    const key = isIn ? "cashIn" : "cashOut";
    const rows = visibleTransactions(key).map((row) => {
      const selected = account(row.accountId);
      const feeAccount = row.feeMode === "separate" ? account(row.feeAccountId) : null;
      const feePill = row.feeMode === "separate" ? (feeAccount ? (feeAccount.kind === "cash" ? "CASH" : "BANK") : "သီးသန့်") : "ဖျတ်";
      const feeDetail = row.feeMode === "separate" ? `သီးသန့် · ${esc(feeAccount?.name ?? "-")}` : "ပမာဏမှ ဖျတ်မည်";
      const searchText = `${row.id} ${row.systemReference} ${row.phone}`.toLowerCase();
      return `<tr data-search-text="${esc(searchText)}"><td><strong>${esc(row.id)}</strong></td><td>${esc(row.customer)}</td><td class="num">${esc(row.phone)}</td><td><strong>${esc(selected?.name)}</strong></td><td class="num"><strong>${money(row.amount)}</strong></td><td><div class="fee-location"><strong class="num">${money(row.fee)}</strong><span class="type-pill">${esc(feePill)}</span></div></td><td>${esc(row.creator)}<div class="tiny">${esc(row.timestamp)}</div></td><td><div class="actions">${isOwner() ? `<button class="btn ghost small" data-edit-transaction="${key}" data-id="${row.id}" title="ပြင်ဆင်">${icon("edit")}</button><button class="btn ghost small danger" data-delete-type="${key}" data-id="${row.id}" title="ဖျက်ရန်">${icon("trash")}</button>` : ""}<button class="btn ghost small" data-expand="${row.id}" aria-label="${state.expanded[row.id] ? "အသေးစိတ်ပိတ်ရန်" : "အသေးစိတ်ဖွင့်ရန်"}" aria-expanded="${Boolean(state.expanded[row.id])}">${icon(state.expanded[row.id] ? "chevronUp" : "chevronDown")}</button></div></td></tr>${state.expanded[row.id] ? `<tr class="detail-row"><td colspan="8"><div class="detail-grid"><div class="detail-item"><span class="detail-label">ကိုးကား</span><span class="detail-value">${esc(row.systemReference)}</span></div><div class="detail-item"><span class="detail-label">အချိန်</span><span class="detail-value">${esc(row.timestamp)}</span></div><div class="detail-item"><span class="detail-label">မှတ်ချက်</span><span class="detail-value">${esc(row.note || "မရှိ")}</span></div><div class="detail-item"><span class="detail-label">အခကြေးငွေ</span><span class="detail-value">${feeDetail}</span></div></div></td></tr>` : ""}`;
    }).join("");
    const title = isIn ? "ငွေပို့ လုပ်ငန်းစဉ်များ" : "ငွေထုတ် လုပ်ငန်းစဉ်များ";
    return shell(`${pageHead(title, isOwner() ? "ဖန်တီးပြီးသောစာရင်းများကို ချက်ချင်းပြသပြီး ပြင်ဆင်/ဖျက်နိုင်ပါသည်။" : "သင့်အတွက် သတ်မှတ်ထားသောအကောင့် စာရင်းများသာ ပြသထားပါသည်။", `<a class="btn primary" href="#${route}-new">${icon("plus")}${isIn ? "ငွေပို့" : "ငွေထုတ်"} အသစ်</a>`)}<section class="card"><div class="list-toolbar"><div class="search">${icon("search")}<input data-table-search placeholder="ဖောက်သည်၊ ကိုးကား၊ ဖုန်းနံပါတ် ရှာရန်..."></div><span class="muted">${rows ? visibleTransactions(key).length : 0} စာရင်း</span></div><div class="table-wrap"><table><thead><tr><th>စာရင်း</th><th>ဖောက်သည်</th><th>ဖုန်းနံပါတ်</th><th>ရွေးချယ်ထားသောအကောင့်</th><th>ပမာဏ</th><th>အခ/နေရာ</th><th>ဖန်တီးသူ/ရက်စွဲ</th><th></th></tr></thead><tbody data-search-body>${rows || '<tr><td colspan="8" class="empty">စာရင်းမရှိပါ။</td></tr>'}</tbody></table></div></section>`, route);
  }

  function transactionFormV2(route) {
    const isIn = route === "cash-in";
    const kind = isIn ? "cashIn" : "cashOut";
    const existing = state.editing?.kind === kind ? state[kind].find((item) => item.id === state.editing.id) : null;
    const selectedAccount = account(existing?.accountId);
    const accountType = selectedAccount?.kind || "bank";
    const initialAccount = existing?.accountId || (isOwner() ? state.accounts.find((item) => item.kind === accountType && item.active)?.id : assignedAccount(accountType)?.id);
    const feeMode = existing?.feeMode === "separate" ? "separate" : "deduct";
    const initialFeeAccount = feeMode === "separate" ? account(existing?.feeAccountId) : null;
    const feeAccountType = initialFeeAccount?.kind || "bank";
    const initialFeeAccountChoice = initialFeeAccount?.id || (isOwner() ? state.accounts.find((item) => item.kind === feeAccountType && item.active)?.id : assignedAccount(feeAccountType)?.id);
    const showFeeFields = feeMode === "separate" && (existing?.fee || 0) > 0;
    const section = (num, heading, body) => `<section class="form-section"><h2 class="section-title"><span class="section-num">${num}</span>${heading}</h2>${body}</section>`;
    const accountField = isOwner()
      ? `<select name="accountId" data-account-select required>${accountOptions(accountType, initialAccount)}</select>`
      : `<input data-account-readonly value="${esc(account(initialAccount)?.name)}" readonly><input type="hidden" name="accountId" value="${esc(initialAccount)}">`;
    const feeAccountField = isOwner()
      ? `<select name="feeAccountId" data-fee-account-select required>${accountOptions(feeAccountType, initialFeeAccountChoice)}</select>`
      : `<input data-fee-account-readonly value="${esc(account(initialFeeAccountChoice)?.name)}" readonly><input type="hidden" name="feeAccountId" value="${esc(initialFeeAccountChoice)}">`;
    const amountSection = `<div class="field-grid"><div class="field"><label>အကောင့်အမျိုးအစား</label><select name="accountType" data-account-type required><option value="bank"${accountType === "bank" ? " selected" : ""}>BANK</option><option value="cash"${accountType === "cash" ? " selected" : ""}>CASH</option></select></div><div class="field"><label>ရွေးချယ်ထားသောအကောင့်</label>${accountField}</div><div class="field"><label>ပမာဏ (ကျပ်)</label><input name="amount" data-calc inputmode="numeric" value="${existing?.amount || ""}" required></div><div class="field"><label>အခကြေးငွေ (ကျပ်)</label><input name="fee" data-calc inputmode="numeric" value="${existing?.fee ?? ""}" required></div><div class="field span-2"><span class="label">အခကြေးငွေ ပေးနည်း</span><input type="hidden" name="feeMode" value="${feeMode}"><div class="switch-row"><button type="button" data-fee-mode-select="deduct" class="${feeMode === "deduct" ? "active" : ""}">ပမာဏမှ ဖျတ်မည်</button><button type="button" data-fee-mode-select="separate" class="${feeMode === "separate" ? "active" : ""}">သီးသန့်ပေးမည်</button></div></div><div class="field-grid span-2${showFeeFields ? "" : " hide"}" data-fee-fields><div class="field"><label>အခကြေးငွေ အကောင့်အမျိုးအစား</label><select name="feeAccountType" data-fee-account-type required><option value="bank"${feeAccountType === "bank" ? " selected" : ""}>BANK</option><option value="cash"${feeAccountType === "cash" ? " selected" : ""}>CASH</option></select></div><div class="field"><label>အခကြေးငွေ အကောင့်</label>${feeAccountField}</div></div></div>`;
    const summaryRows = isIn
      ? `<div class="summary-row"><span>ရွေးချယ်ထားသောပမာဏ</span><strong data-amount-summary>${money(existing?.amount)}</strong></div><div class="summary-row"><span>အခကြေးငွေ</span><strong data-fee-summary>${money(existing?.fee)}</strong></div><div class="summary-row total-row"><span>ဖောက်သည် စုစုပေါင်း</span><strong data-total-summary>${money((existing?.amount || 0) + (existing?.fee || 0))}</strong></div>`
      : `<div class="summary-row"><span>ဖောက်သည် လက်ခံရရှိ</span><strong data-amount-summary>${money(existing?.amount)}</strong></div><div class="summary-row"><span>အခကြေးငွေ</span><strong data-fee-summary>${money(existing?.fee)}</strong></div><div class="summary-row total-row"><span>အခကြေးငွေ ပေးနည်း</span><strong data-fee-mode-summary>${feeMode === "separate" ? (showFeeFields ? `သီးသန့် · ${esc(account(initialFeeAccountChoice)?.name || "")}` : "သီးသန့်ပေးမည်") : "ပမာဏမှ ဖျတ်မည်"}</strong></div>`;
    return shell(`<a class="back" href="#${route}">${icon("arrow")}စာရင်းသို့</a>${pageHead(existing ? `${isIn ? "ငွေပို့" : "ငွေထုတ်"} ပြင်ဆင်ရန်` : `${isIn ? "ငွေပို့" : "ငွေထုတ်"} အသစ်`, "ဖောက်သည်၊ အကောင့်နှင့် ပမာဏကို ထည့်ပါ။ ကိုးကားနံပါတ်နှင့် အချိန်ကို စနစ်က အလိုအလျောက် သတ်မှတ်ပေးပါမည်။")}<form id="transaction-form" data-kind="${kind}" class="form-layout"><article class="card form-card">${section(1, "ဖောက်သည်အချက်အလက်", `<div class="field-grid"><div class="field"><label>ဖောက်သည်အမည်</label><input name="customer" value="${esc(existing?.customer || "")}" required></div><div class="field"><label>ဖုန်းနံပါတ်</label><input name="phone" type="tel" value="${esc(existing?.phone || "")}" required></div></div>`)}${section(2, "အကောင့်နှင့် ပမာဏ", amountSection)}${section(3, "မှတ်ချက်", `<textarea name="note" placeholder="ရွေးချယ်နိုင်သည်">${esc(existing?.note || "")}</textarea>`)}<section class="form-section form-submit"><button class="btn primary">${existing ? "သိမ်းမည်" : "ဖန်တီးမည်"}</button></section></article><aside class="card summary-card"><h2>${isIn ? "ငွေပို့" : "ငွေထုတ်"} အနှစ်ချုပ်</h2>${summaryRows}<p class="side-note" data-side-note>${showFeeFields ? "အခကြေးငွေကို အခကြေးငွေအကောင့်တွင် သီးသန့် တင်ပါမည်။" : "အခကြေးငွေကို သီးသန့်အကောင့်တွင် မတင်ပါ။"}</p><div class="validation ${existing?.amount > 0 ? "valid" : "invalid"}" data-validation>${existing?.amount > 0 ? "ဖန်တီးရန် အသင့်ဖြစ်ပါသည်။" : "လိုအပ်သောအချက်အလက်နှင့် ပမာဏကို ထည့်ပါ။"}</div></aside></form>`, route);
  }

  function renderAccounts() {
    const kind = state.tab.accounts;
    const rows = state.accounts.filter((item) => item.kind === kind).sort((a, b) => Number(b.main) - Number(a.main)).map((item) => `<tr><td><strong>${esc(item.name)}</strong>${item.main ? '<span class="main-tag">MAIN</span>' : ""}<div class="tiny">${esc(item.number)}</div></td><td>${esc(item.provider)}</td><td class="num"><strong>${money(item.balance)}</strong></td><td>${item.main ? '<span class="muted">ပိုင်ရှင်သာ</span>' : item.staff.length ? item.staff.map((id) => `<span class="person-tag">${esc(staff.find((person) => person.id === id)?.name)}</span>`).join("") : '<span class="muted">မသတ်မှတ်ရသေး</span>'}</td><td>${item.main ? "" : `<button class="btn small secondary" data-assign-account="${item.id}">ဝန်ထမ်းသတ်မှတ်ရန်</button>`}</td></tr>`).join("");
    return shell(`${pageHead("အကောင့်များ", "ပင်မအကောင့်ကို အရင်ပြပြီး ကလေးအကောင့်တစ်ခုလျှင် ဝန်ထမ်း ၂ ဦးအထိ သတ်မှတ်နိုင်ပါသည်။", tabs("accounts"))}<section class="card"><div class="card-head"><h2>${kind === "bank" ? "ဘဏ်အကောင့်" : "ငွေသားအကောင့်"} ၅ ခု</h2><span class="muted">Main ၁ · Child ၄</span></div><div class="table-wrap"><table><thead><tr><th>အကောင့်</th><th>ဝန်ဆောင်မှု</th><th>လက်ကျန်</th><th>တာဝန်ခံဝန်ထမ်း (အများဆုံး ၂)</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`, "accounts");
  }

  function renderTransfers() {
    const kind = state.tab.transfers;
    const main = account(`${kind === "bank" ? "b" : "c"}-main`);
    const rows = state.transfers.filter((row) => !row.deleted && row.kind === kind).map((row) => { const child = account(row.childId); const from = row.direction === "main-child" ? main : child; const to = row.direction === "main-child" ? child : main; return `<tr><td><strong>${row.id}</strong><div class="tiny">${esc(row.date)}</div></td><td>${esc(from.name)}</td><td>${esc(to.name)}</td><td class="num"><strong>${money(row.amount)}</strong></td><td><div class="actions"><button class="btn ghost small" data-edit-transfer="${row.id}">${icon("edit")}</button><button class="btn ghost small danger" data-delete-type="transfers" data-id="${row.id}">${icon("trash")}</button><button class="btn ghost small" data-expand="${row.id}" aria-label="${state.expanded[row.id] ? "မှတ်ချက်ပိတ်ရန်" : "မှတ်ချက်ဖွင့်ရန်"}" aria-expanded="${Boolean(state.expanded[row.id])}">${icon(state.expanded[row.id] ? "chevronUp" : "chevronDown")}</button></div></td></tr>${state.expanded[row.id] ? `<tr class="detail-row"><td colspan="5"><strong>မှတ်ချက်</strong><span>${esc(row.note || "မရှိ")}</span></td></tr>` : ""}`; }).join("");
    return shell(`${pageHead("အတွင်းပိုင်းငွေလွှဲ", "ပင်မနှင့် ကလေးအကောင့်ကြားသာ လွှဲနိုင်ပြီး စာရင်းကို ချက်ချင်းမှတ်တမ်းတင်ပါသည်။", `${tabs("transfers")}<button class="btn primary" data-open-modal="transfer">${icon("plus")}အသစ်</button>`)}<section class="card"><div class="table-wrap"><table><thead><tr><th>ကိုးကား/ရက်စွဲ</th><th>မှ</th><th>သို့</th><th>ပမာဏ</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="empty">စာရင်းမရှိပါ။</td></tr>'}</tbody></table></div></section>`, "transfers");
  }

  function renderCapital() {
    const kind = state.tab.capital;
    const main = account(`${kind === "bank" ? "b" : "c"}-main`);
    const rows = state.capital.filter((row) => row.kind === kind).map((row) => `<tr><td><strong>${row.id}</strong></td><td>${row.action === "deposit" ? "ငွေသွင်း" : "ငွေထုတ်"}</td><td><strong>${esc(main.name)}</strong><div class="tiny">ပုံသေ ပင်မအကောင့်</div></td><td class="num"><strong>${money(row.amount)}</strong></td><td>${esc(row.note || "-")}</td><td>${esc(row.date)}</td></tr>`).join("");
    return shell(`${pageHead("ရင်းနှီးငွေ", "ပိုင်ရှင်၏ ရင်းနှီးငွေကို သက်ဆိုင်ရာ Main အကောင့်တွင် ချက်ချင်း ထည့်/ထုတ်မှတ်တမ်းတင်ပါသည်။", `${tabs("capital")}<button class="btn primary" data-open-modal="capital">${icon("plus")}အသစ်</button>`)}<section class="card"><div class="table-wrap"><table><thead><tr><th>ကိုးကား</th><th>လုပ်ဆောင်ချက်</th><th>ပင်မအကောင့်</th><th>ပမာဏ</th><th>မှတ်ချက်</th><th>ရက်စွဲ</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty">စာရင်းမရှိပါ။</td></tr>'}</tbody></table></div></section>`, "capital");
  }

  function renderProviders() {
    const rows = state.providers.map((name) => `<tr><td><strong>${esc(name)}</strong></td><td>${state.accounts.filter((item) => item.provider === name).length} အကောင့်</td><td>ဘဏ်နှင့် ကလေးအကောင့်များတွင် အသုံးပြုသည်</td></tr>`).join("");
    return shell(`${pageHead("ဝန်ဆောင်မှုပေးသူများ", "အသုံးပြုနေသော ဘဏ်နှင့် wallet ဝန်ဆောင်မှုများ။")}<section class="card"><div class="table-wrap"><table><thead><tr><th>ဝန်ဆောင်မှုပေးသူ</th><th>အကောင့်</th><th>အသုံးပြုပုံ</th></tr></thead><tbody>${rows}</tbody></table></div></section>`, "providers");
  }

  function renderUsers() {
    const rows = state.users.map((user) => `<tr><td><strong>${esc(user.name)}</strong></td><td>${esc(user.email)}</td><td>${user.role}</td><td>${user.role === "ဝန်ထမ်း" ? state.accounts.filter((item) => item.staff.includes(staff.find((person) => person.name === user.name)?.id)).map((item) => item.name).join("၊ ") || "-" : "အကောင့်အားလုံး"}</td></tr>`).join("");
    return shell(`${pageHead("အသုံးပြုသူများ", "Email login အသုံးပြုသော ပိုင်ရှင်နှင့် ဝန်ထမ်းများ။")}<section class="card"><div class="table-wrap"><table><thead><tr><th>အမည်</th><th>အီးမေးလ်</th><th>ရာထူး</th><th>သတ်မှတ်ထားသောအကောင့်</th></tr></thead><tbody>${rows}</tbody></table></div></section>`, "users");
  }

  function renderSummary() {
    const all = state.accounts.reduce((sum, item) => sum + item.balance, 0);
    return shell(`${pageHead("အနှစ်ချုပ်", "လက်ကျန်နှင့် လုပ်ငန်းစဉ် အနှစ်ချုပ်။")}<section class="metrics four"><article class="card metric total"><div class="metric-label">စုစုပေါင်းလက်ကျန်</div><div class="metric-value">${money(all)}</div></article><article class="card metric"><div class="metric-label">ငွေပို့</div><div class="metric-value">${visibleTransactions("cashIn").length}</div><div class="metric-note">ချက်ချင်းစာရင်း</div></article><article class="card metric"><div class="metric-label">ငွေထုတ်</div><div class="metric-value">${visibleTransactions("cashOut").length}</div><div class="metric-note">ချက်ချင်းစာရင်း</div></article><article class="card metric"><div class="metric-label">စုစုပေါင်း အခကြေးငွေ</div><div class="metric-value">${money([...state.cashIn, ...state.cashOut].filter((item) => !item.deleted).reduce((sum, item) => sum + item.fee, 0))}</div></article></section>`, "summary");
  }

  function modalFrame(title, body, submitLabel) {
    return `<div class="modal-layer"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><form id="modal-form" data-modal="${state.modal}"><header class="modal-head"><h2 id="modal-title">${title}</h2><button type="button" class="btn ghost" data-action="modal-close" aria-label="ပိတ်ရန်">${icon("close")}</button></header><div class="modal-body">${body}</div><footer class="modal-actions"><button type="button" class="btn secondary" data-action="modal-close">ပယ်ဖျက်ရန်</button><button class="btn ${state.modal === "delete" ? "danger" : "primary"}">${submitLabel}</button></footer></form></section></div>`;
  }

  function renderModal() {
    if (state.modal === "assign") { const item = account(state.editing.id); return modalFrame(`${esc(item.name)} ဝန်ထမ်းသတ်မှတ်ရန်`, `<p class="muted">ဝန်ထမ်း ၂ ဦးအထိ ရွေးနိုင်ပါသည်။</p><div class="assignment-list">${staff.map((person) => `<label><input type="checkbox" name="staff" value="${person.id}" ${item.staff.includes(person.id) ? "checked" : ""}> <span>${esc(person.name)}</span></label>`).join("")}</div><div class="alert error hide" data-assignment-error>ဝန်ထမ်း ၂ ဦးထက် ပို၍ မရွေးနိုင်ပါ။</div>`, "သိမ်းမည်"); }
    if (state.modal === "delete") return modalFrame("စာရင်းဖျက်ရန်", `<div class="delete-copy">${icon("trash")}<p><strong>${esc(state.editing.id)}</strong> ကို မြင်ရသောစာရင်းမှ ဖယ်ရှားမည်။ Audit မှတ်တမ်းတွင် soft delete အဖြစ် ကျန်ရှိပါမည်။</p></div>`, "ဖျက်မည်");
    if (state.modal === "transfer") { const kind = state.tab.transfers; const row = state.editing?.type === "transfer" ? state.transfers.find((item) => item.id === state.editing.id) : null; return modalFrame(row ? "အတွင်းပိုင်းငွေလွှဲ ပြင်ဆင်ရန်" : "အတွင်းပိုင်းငွေလွှဲ အသစ်", `<div class="field-grid"><div class="field span-2"><label>ဦးတည်ချက်</label><select name="direction"><option value="main-child"${row?.direction === "main-child" ? " selected" : ""}>Main → Child</option><option value="child-main"${row?.direction === "child-main" ? " selected" : ""}>Child → Main</option></select></div><div class="field span-2"><label>ကလေးအကောင့်</label><select name="childId">${state.accounts.filter((item) => item.kind === kind && !item.main && item.active).map((item) => `<option value="${item.id}"${row?.childId === item.id ? " selected" : ""}>${esc(item.name)}</option>`).join("")}</select></div><div class="field span-2"><label>ပမာဏ (ကျပ်)</label><input name="amount" value="${row?.amount || ""}" inputmode="numeric" required></div><div class="field span-2"><label>မှတ်ချက်</label><textarea name="note">${esc(row?.note || "")}</textarea></div></div>`, row ? "ပြင်ဆင်မည်" : "ဖန်တီးမည်"); }
    if (state.modal === "capital") { const kind = state.tab.capital; return modalFrame("ရင်းနှီးငွေ စာရင်းအသစ်", `<div class="field-grid"><div class="field span-2"><label>လုပ်ဆောင်ချက်</label><select name="action"><option value="deposit">ငွေသွင်း</option><option value="withdraw">ငွေထုတ်</option></select></div><div class="field span-2"><label>ပုံသေ ပင်မအကောင့်</label><input value="${esc(account(`${kind === "bank" ? "b" : "c"}-main`).name)}" readonly></div><div class="field span-2"><label>ပမာဏ (ကျပ်)</label><input name="amount" inputmode="numeric" required></div><div class="field span-2"><label>မှတ်ချက်</label><textarea name="note"></textarea></div></div>`, "ဖန်တီးမည်"); }
    return "";
  }

  function render() {
    document.body.classList.remove("drawer-open");
    const route = currentRoute();
    if (!state.authenticated || route === "login") { renderLogin(); return; }
    if (!isOwner() && !["dashboard", "cash-in", "cash-out", "cash-in-new", "cash-out-new"].includes(route)) { routeTo("dashboard"); return; }
    if (route === "dashboard") app.innerHTML = renderDashboard();
    else if (["cash-in", "cash-out"].includes(route)) app.innerHTML = renderTransactions(route);
    else if (["cash-in-new", "cash-out-new"].includes(route)) app.innerHTML = transactionFormV2(route.replace("-new", ""));
    else if (route === "accounts") app.innerHTML = renderAccounts();
    else if (route === "transfers") app.innerHTML = renderTransfers();
    else if (route === "capital") app.innerHTML = renderCapital();
    else if (route === "providers") app.innerHTML = renderProviders();
    else if (route === "users") app.innerHTML = renderUsers();
    else if (route === "summary") app.innerHTML = renderSummary();
    else routeTo("dashboard");
  }

  function closeModal() { state.modal = null; state.editing = null; render(); }
  const formData = (form) => Object.fromEntries(new FormData(form).entries());
  function syncFeeFields(form) {
    const wrap = form.querySelector("[data-fee-fields]");
    if (!wrap) return;
    const mode = form.querySelector('[name="feeMode"]')?.value || "deduct";
    wrap.classList.toggle("hide", !(mode === "separate" && numberValue(form.fee.value) > 0));
  }

  function updateValidation(form) {
    const amount = numberValue(form.amount.value), fee = numberValue(form.fee.value);
    const mode = form.querySelector('[name="feeMode"]')?.value || "deduct";
    const valid = amount > 0 && fee >= 0;
    syncFeeFields(form);
    document.querySelector("[data-amount-summary]").textContent = money(amount);
    document.querySelector("[data-fee-summary]").textContent = money(fee);
    const total = document.querySelector("[data-total-summary]");
    if (total) total.textContent = money(amount + fee);
    const modeLine = document.querySelector("[data-fee-mode-summary]");
    if (modeLine) {
      const feeAccount = mode === "separate" && fee > 0 ? account(form.querySelector('[name="feeAccountId"]')?.value) : null;
      modeLine.textContent = mode === "separate" ? (feeAccount ? `သီးသန့် · ${feeAccount.name}` : "သီးသန့်ပေးမည်") : "ပမာဏမှ ဖျတ်မည်";
    }
    const note = document.querySelector("[data-side-note]");
    if (note) note.textContent = mode === "separate" && fee > 0 ? "အခကြေးငွေကို အခကြေးငွေအကောင့်တွင် သီးသန့် တင်ပါမည်။" : "အခကြေးငွေကို သီးသန့်အကောင့်တွင် မတင်ပါ။";
    const validation = document.querySelector("[data-validation]");
    validation.className = `validation ${valid ? "valid" : "invalid"}`;
    validation.textContent = valid ? "ဖန်တီးရန် အသင့်ဖြစ်ပါသည်။" : "ပမာဏသည် သုညထက်ကြီးပြီး အခကြေးငွေသည် အနုတ်မဖြစ်ရပါ။";
    form.dataset.valid = String(valid);
  }

  function applyTransactionBalance(kind, row, multiplier = 1) {
    const selected = account(row.accountId);
    const deducted = row.feeMode !== "separate" && row.fee > 0;
    const movement = kind === "cashIn" ? row.amount : row.amount + (deducted ? row.fee : 0);
    if (selected) selected.balance += (kind === "cashIn" ? -1 : 1) * movement * multiplier;
    const feeAccount = row.feeMode === "separate" && row.fee > 0 ? account(row.feeAccountId) : null;
    if (feeAccount) feeAccount.balance += row.fee * multiplier;
  }

  function applyTransferBalance(row, multiplier = 1) {
    const main = account(`${row.kind === "bank" ? "b" : "c"}-main`);
    const child = account(row.childId);
    if (!main || !child) return;
    const amount = row.amount * (row.direction === "main-child" ? 1 : -1) * multiplier;
    main.balance -= amount;
    child.balance += amount;
  }

  function nextTransactionId(kind) {
    const prefix = kind === "cashIn" ? "CI" : "CO";
    const sequence = Math.max(0, ...state[kind].map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
    return `${prefix}-${sequence}`;
  }

  function generatedReference(kind) {
    const prefix = kind === "cashIn" ? "CI" : "CO";
    return `UMT-${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }

  function currentTimestamp() {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date());
  }

  app.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-layer")) { closeModal(); return; }
    const target = event.target.closest("button, a"); if (!target) return;
    const action = target.dataset.action;
    if (action === "show-password") { state.showPassword = !state.showPassword; const input = document.querySelector("#password"); input.type = state.showPassword ? "text" : "password"; input.focus(); }
    if (action === "drawer-open") document.body.classList.add("drawer-open");
    if (action === "drawer-close") document.body.classList.remove("drawer-open");
    if (action === "logout") { state.authenticated = false; state.loginState = "default"; routeTo("login"); render(); }
    if (target.dataset.loginFixture) { state.loginState = target.dataset.loginFixture; render(); }
    if (target.matches('a[href$="-new"]')) state.editing = null;
    if (target.dataset.role) { state.role = target.dataset.role; state.editing = null; state.modal = null; if (!isOwner() && !["dashboard", "cash-in", "cash-out"].includes(currentRoute())) routeTo("dashboard"); else render(); }
    if (target.dataset.tabScreen) { state.tab[target.dataset.tabScreen] = target.dataset.tabValue; render(); }
    if (target.dataset.openModal) { state.modal = target.dataset.openModal; state.editing = null; render(); }
    if (action === "modal-close") closeModal();
    if (target.dataset.expand) { state.expanded[target.dataset.expand] = !state.expanded[target.dataset.expand]; render(); }
    if (target.dataset.feeModeSelect) {
      const form = target.closest("form");
      if (form) {
        form.querySelector('[name="feeMode"]').value = target.dataset.feeModeSelect;
        form.querySelectorAll("[data-fee-mode-select]").forEach((button) => button.classList.toggle("active", button === target));
        updateValidation(form);
      }
    }
    if (target.dataset.assignAccount) { state.editing = { id: target.dataset.assignAccount }; state.modal = "assign"; render(); }
    if (target.dataset.editTransaction) { state.editing = { kind: target.dataset.editTransaction, id: target.dataset.id }; routeTo(target.dataset.editTransaction === "cashIn" ? "cash-in-new" : "cash-out-new"); }
    if (target.dataset.editTransfer) { state.editing = { type: "transfer", id: target.dataset.editTransfer }; state.modal = "transfer"; render(); }
    if (target.dataset.deleteType) { state.editing = { type: target.dataset.deleteType, id: target.dataset.id }; state.modal = "delete"; render(); }
  });

  app.addEventListener("input", (event) => {
    if (event.target.dataset.calc !== undefined) updateValidation(event.target.form);
    if (event.target.dataset.tableSearch !== undefined) { const query = event.target.value.toLowerCase(); document.querySelectorAll("[data-search-body] > tr:not(.detail-row)").forEach((row) => { const hidden = !`${row.textContent} ${row.dataset.searchText || ""}`.toLowerCase().includes(query); row.hidden = hidden; if (row.nextElementSibling?.classList.contains("detail-row")) row.nextElementSibling.hidden = hidden; }); }
  });

  app.addEventListener("change", (event) => {
    if (event.target.name === "staff") { const checked = document.querySelectorAll('[name="staff"]:checked'); const error = document.querySelector("[data-assignment-error]"); if (checked.length > 2) { event.target.checked = false; error.classList.remove("hide"); } else error.classList.add("hide"); }
    if (event.target.dataset.accountType !== undefined) {
      const kind = event.target.value;
      const select = document.querySelector("[data-account-select]");
      if (select) select.innerHTML = accountOptions(kind, "");
      const fixed = assignedAccount(kind);
      const readonly = document.querySelector("[data-account-readonly]");
      if (readonly && fixed) { readonly.value = fixed.name; readonly.nextElementSibling.value = fixed.id; }
    }
    if (event.target.dataset.feeAccountType !== undefined) {
      const form = event.target.closest("form");
      const feeKind = event.target.value;
      const feeSelect = form?.querySelector("[data-fee-account-select]");
      if (feeSelect) feeSelect.innerHTML = accountOptions(feeKind, "");
      const feeFixed = assignedAccount(feeKind);
      const feeReadonly = form?.querySelector("[data-fee-account-readonly]");
      if (feeReadonly && feeFixed) { feeReadonly.value = feeFixed.name; feeReadonly.nextElementSibling.value = feeFixed.id; }
      if (form) updateValidation(form);
    }
    if (event.target.name === "feeAccountId") {
      const form = event.target.closest("form");
      if (form) updateValidation(form);
    }
  });

  app.addEventListener("submit", (event) => {
    event.preventDefault(); const form = event.target; const data = formData(form);
    if (form.id === "login-form") { if (data.email === "disabled@umt.mm") state.loginState = "disabled"; else if (data.password === "wrong") state.loginState = "error"; else { state.authenticated = true; state.loginState = "default"; routeTo("dashboard"); } render(); return; }
    if (form.id === "transaction-form") {
      updateValidation(form); if (form.dataset.valid !== "true") { toast("ပမာဏနှင့် အခကြေးငွေကို စစ်ဆေးပါ။"); return; }
      const kind = form.dataset.kind, existing = state.editing?.kind === kind ? state[kind].find((item) => item.id === state.editing.id) : null;
      const selected = account(data.accountId);
      const allowed = selected?.active && selected.kind === data.accountType && (isOwner() || assignedIds().includes(selected.id));
      if (!allowed) { toast("အသုံးပြုခွင့်ရှိသော အကောင့်တစ်ခုကို ရွေးပါ။"); return; }
      const fee = numberValue(data.fee);
      const feeMode = data.feeMode === "separate" ? "separate" : "deduct";
      let feeAccountId = null;
      if (feeMode === "separate" && fee > 0) {
        const feeAccount = account(data.feeAccountId);
        const feeAllowed = feeAccount?.active && feeAccount.kind === data.feeAccountType && (isOwner() || assignedIds().includes(feeAccount.id));
        if (!feeAllowed) { toast("အခကြေးငွေ အကောင့်ကို စစ်ဆေးပါ။"); return; }
        feeAccountId = feeAccount.id;
      }
      const values = { customer: data.customer, phone: data.phone, accountId: selected.id, amount: numberValue(data.amount), fee, feeMode, feeAccountId, note: data.note };
      if (existing) {
        applyTransactionBalance(kind, existing, -1);
        Object.assign(existing, values);
        applyTransactionBalance(kind, existing);
      } else {
        const row = { id: nextTransactionId(kind), systemReference: generatedReference(kind), timestamp: currentTimestamp(), creator: isOwner() ? "ဒေါ်လှ" : "အောင်ကို", ...values };
        state[kind].unshift(row);
        applyTransactionBalance(kind, row);
      }
      state.editing = null; toast(existing ? "စာရင်းပြင်ဆင်မှုကို audit မှတ်တမ်းနှင့် သိမ်းပြီးပါပြီ။" : "စာရင်းကို ချက်ချင်းဖန်တီးပြီးပါပြီ။"); routeTo(kind === "cashIn" ? "cash-in" : "cash-out"); return;
    }
    if (form.id === "modal-form") {
      if (state.modal === "assign") { account(state.editing.id).staff = new FormData(form).getAll("staff"); toast("ဝန်ထမ်းသတ်မှတ်မှု ပြင်ဆင်ပြီးပါပြီ။"); closeModal(); return; }
      if (state.modal === "delete") { const type = state.editing.type; const row = state[type].find((item) => item.id === state.editing.id); if (!row || row.deleted) { closeModal(); return; } if (type === "cashIn" || type === "cashOut") applyTransactionBalance(type, row, -1); else if (type === "transfers") applyTransferBalance(row, -1); row.deleted = true; row.deletedAt = new Date().toISOString(); toast(`${row.id} ကို soft delete လုပ်ပြီး audit မှတ်တမ်း သိမ်းထားပါသည်။`); closeModal(); return; }
      if (state.modal === "transfer") { const existing = state.editing?.type === "transfer" ? state.transfers.find((item) => item.id === state.editing.id) : null; const child = account(data.childId); const amount = numberValue(data.amount); if (amount <= 0 || !child?.active || child.main || child.kind !== state.tab.transfers) { toast("ပမာဏနှင့် ကလေးအကောင့်ကို စစ်ဆေးပါ။"); return; } const values = { kind: state.tab.transfers, direction: data.direction, childId: child.id, amount, note: data.note, date: "ယခု" }; if (existing) { applyTransferBalance(existing, -1); Object.assign(existing, values); applyTransferBalance(existing); } else { const row = { id: `TRF-${442 + state.transfers.length}`, ...values }; state.transfers.unshift(row); applyTransferBalance(row); } toast(existing ? "အတွင်းပိုင်းငွေလွှဲ ပြင်ဆင်ပြီးပါပြီ။" : "အတွင်းပိုင်းငွေလွှဲ ချက်ချင်းဖန်တီးပြီးပါပြီ။"); closeModal(); return; }
      if (state.modal === "capital") { state.capital.unshift({ id: `CAP-${116 + state.capital.length}`, kind: state.tab.capital, action: data.action, amount: numberValue(data.amount), note: data.note, date: "ယခု" }); toast("ရင်းနှီးငွေစာရင်း ချက်ချင်းဖန်တီးပြီးပါပြီ။"); closeModal(); }
    }
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && state.modal) closeModal(); });
  render();
})();
