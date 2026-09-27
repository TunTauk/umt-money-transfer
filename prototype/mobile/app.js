(() => {
  "use strict";

  const app = document.querySelector("#app");
  const toastNode = document.querySelector("#toast");
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const numberValue = (value) => Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0;
  const money = (value) => `K ${Number(value || 0).toLocaleString("en-US")}`;
  const now = () => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date());

  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    in: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 21h14"/>',
    out: '<path d="M12 21V9m0 0 4 4m-4-4-4 4"/><path d="M5 3h14"/>',
    wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M16 15h.01"/>',
    bank: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrowRight: '<path d="m9 18 6-6-6-6"/>',
    arrowLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronUp: '<path d="m18 15-6-6-6 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    transfer: '<path d="m17 3 4 4-4 4"/><path d="M3 7h18"/><path d="m7 21-4-4 4-4"/><path d="M21 17H3"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 11v6m4-6v6"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
  };
  const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.wallet}</svg>`;

  const accounts = {
    bank: [
      { id: "bank-main", name: "Main Bank", balance: 38200000, main: true, active: true, staff: [] },
      { id: "bank-kbz", name: "KBZ ကောင်တာ", balance: 14900000, active: true, staff: ["Aung Ko", "Mya Mya"] },
      { id: "bank-aya", name: "AYA Counter", balance: 8700000, active: true, staff: ["Nilar Aye"] },
      { id: "bank-cb", name: "CB Counter", balance: 6200000, active: true, staff: ["Ko Htet"] },
      { id: "bank-wave", name: "Wave Counter", balance: 18670000, active: true, staff: [] }
    ],
    cash: [
      { id: "cash-main", name: "Main Cash", balance: 12480000, main: true, active: true, staff: [] },
      { id: "cash-front", name: "ရှေ့ကောင်တာ", balance: 4870000, active: true, staff: ["Aung Ko"] },
      { id: "cash-east", name: "East Counter", balance: 3150000, active: true, staff: ["Mya Mya"] },
      { id: "cash-west", name: "West Counter", balance: 2780000, active: true, staff: ["Nilar Aye"] },
      { id: "cash-mobile", name: "Mobile Counter", balance: 1940000, active: true, staff: ["Ko Htet"] }
    ]
  };
  const findAccount = (id) => [...accounts.bank, ...accounts.cash].find((account) => account.id === id);
  const accountTypeOf = (id) => (accounts.bank.some((account) => account.id === id) ? "bank" : "cash");
  const accountTypeLabel = (type) => (type === "bank" ? "ဘဏ်" : "ငွေသား");
  const feeModeLabel = (mode) => (mode === "separate" ? "သီးသန့်ပေးမည်" : "ပမာဏမှ ဖျက်မည်");
  const assigned = { bank: "bank-kbz", cash: "cash-front" };
  const currentStaff = { name: "Aung Ko", email: "aung.ko@umt.example", initials: "AK" };

  const state = {
    showPassword: false,
    loginError: "",
    query: { "cash-in": "", "cash-out": "" },
    feeAccountType: "bank",
    expandedTransaction: null,
    cashIn: [
      { id: "CI-10231", systemReference: "UMT-CI-240828-10231", customer: "Mya Thida", phone: "09 421 908 771", timestamp: "28 Aug, 9:14 AM", accountType: "bank", account: "bank-kbz", amount: 200000, fee: 2000, feeMode: "separate", feeAccount: "cash-front", note: "Morning counter deposit", creator: "Aung Ko" },
      { id: "CI-10230", systemReference: "UMT-CI-240828-10230", customer: "U Kyaw Zin", phone: "09 799 240 118", timestamp: "28 Aug, 8:50 AM", accountType: "cash", account: "cash-east", amount: 150000, fee: 1500, feeMode: "deduct", feeAccount: "", note: "", creator: "Mya Mya" }
    ],
    cashOut: [
      { id: "CO-8821", systemReference: "UMT-CO-240828-8821", customer: "Ko Zaw Min", phone: "09 450 220 814", timestamp: "28 Aug, 8:05 AM", accountType: "bank", account: "bank-kbz", amount: 2150000, fee: 50000, feeMode: "deduct", feeAccount: "", note: "Customer pickup", creator: "Aung Ko" },
      { id: "CO-8820", systemReference: "UMT-CO-240828-8820", customer: "Mi Mi San", phone: "09 777 863 401", timestamp: "28 Aug, 7:40 AM", accountType: "cash", account: "cash-mobile", amount: 640000, fee: 15000, feeMode: "separate", feeAccount: "bank-main", note: "", creator: "Ko Htet" }
    ]
  };

  function route() {
    try { return decodeURIComponent(location.hash.replace(/^#\/?/, "") || "login").split("?")[0]; }
    catch { return "login"; }
  }
  const go = (path) => { location.hash = `#${path}`; };
  function toast(message) {
    toastNode.textContent = message;
    toastNode.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toastNode.classList.remove("show"), 2200);
  }
  const nextReference = (prefix, records) => `${prefix}-${Math.max(0, ...records.map((record) => Number(record.id.split("-").at(-1)) || 0)) + 1}`;
  const accountName = (id) => findAccount(id)?.name || "ငွေစာရင်းမသိရှိပါ";
  function feeAccountFieldHTML(type, selected) {
    return `<input data-fee-account-display value="${esc(accountName(assigned[type]))}" readonly><input type="hidden" name="feeAccount" value="${esc(assigned[type])}">`;
  }
  function applyPosting(record, kind, multiplier = 1) {
    const account = findAccount(record.account);
    const deducted = record.feeMode !== "separate" && record.fee > 0;
    const movement = kind === "cash-in" ? record.amount : record.amount + (deducted ? record.fee : 0);
    if (account) account.balance += (kind === "cash-in" ? -1 : 1) * movement * multiplier;
    if (record.feeMode === "separate" && record.fee > 0 && record.feeAccount) {
      const feeAccount = findAccount(record.feeAccount);
      if (feeAccount) feeAccount.balance += record.fee * multiplier;
    }
  }
  function navActive(path) {
    if (path.startsWith("cash-in")) return "cash-in";
    if (path.startsWith("cash-out")) return "cash-out";
    if (path === "profile") return "profile";
    return "dashboard";
  }

  function shell(content, active = navActive(route())) {
    const nav = [["dashboard", "ပင်မ", "dashboard"], ["cash-in", "ငွေပို့", "in"], ["cash-out", "ငွေထုတ်", "out"], ["profile", "ကိုယ်ရေး", "user"]];
    return `<div class="app-shell">
      <header class="topbar"><div class="brand"><span class="brand-mark">U</span><span>UMT ဝန်ထမ်း</span></div><span class="staff-context">${esc(currentStaff.name)}</span><a class="profile" href="#profile" aria-label="ကိုယ်ရေးအချက်အလက်ဖွင့်ရန်">${esc(currentStaff.initials)}</a></header>
      <main class="main">${content}</main>
      <nav class="bottom-nav cols-${nav.length}" aria-label="အဓိက မီနူး">${nav.map(([path, label, glyph]) => `<a href="#${path}" class="${active === path ? "active" : ""}">${icon(glyph)}<span>${label}</span></a>`).join("")}</nav>
    </div>`;
  }

  const pageHead = (title, subtitle, action = "", eyebrow = "လုပ်ငန်းများ") => `<header class="page-head"><div class="page-head-row"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1></div>${action}</div>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</header>`;

  function renderLogin() {
    const error = state.loginError ? `<div class="alert error"><span>${esc(state.loginError)}</span></div>` : "";
    app.innerHTML = `<main class="login-page"><div class="login-wrap"><div class="login-brand"><span class="brand-mark">U</span><h1>UMT ဝန်ထမ်း</h1><p>မိုဘိုင်းကောင်တာ လုပ်ငန်းများ</p></div>
      <form id="login-form" class="card login-card"><h2>ဝန်ထမ်း အကောင့်ဝင်ရန်</h2><p>မိမိဝန်ထမ်းအီးမေးလ်နှင့် စကားဝှက်ကို အသုံးပြုပါ။</p>${error}
        <div class="field"><label for="email">အီးမေးလ်</label><input id="email" name="email" type="email" autocomplete="username" placeholder="name@umt.example" required></div>
        <div class="field"><label for="password">စကားဝှက်</label><div class="password-wrap"><input id="password" name="password" type="${state.showPassword ? "text" : "password"}" autocomplete="current-password" placeholder="စကားဝှက်" required><button type="button" data-action="show-password" aria-label="စကားဝှက်ပြရန်">${icon("eye")}</button></div></div>
        <button class="btn primary block">အကောင့်ဝင်မည်</button>
      </form></div></main>`;
  }

  function renderDashboard() {
    const staffBank = findAccount(assigned.bank);
    const staffCash = findAccount(assigned.cash);
    const metrics = [[staffBank.name, staffBank.balance, "bank"], [staffCash.name, staffCash.balance, "wallet"]].map(([label, amount, glyph]) => `<article class="card dashboard-metric"><span class="row-icon">${icon(glyph)}</span><small>${esc(label)}</small><strong class="num">${money(amount)}</strong></article>`).join("");
    const grandTotal = staffBank.balance + staffCash.balance;
    app.innerHTML = shell(`${pageHead("ပင်မ", "မိမိတာဝန်ပေးထားသော ငွေစာရင်းလက်ကျန်နှင့် ကောင်တာလုပ်ငန်းများကိုသာ ပြသထားသည်။", "", "ယနေ့")}
      <section class="card balance-card dashboard-total"><span>တာဝန်ပေးထားသော စုစုပေါင်းလက်ကျန်</span><strong class="num">${money(grandTotal)}</strong><small>${esc(staffBank.name)} + ${esc(staffCash.name)}</small></section>
      <section class="dashboard-grid">${metrics}</section>
      <div class="section-heading"><h2>အမြန်လုပ်ဆောင်ရန်</h2></div><section class="quick-grid"><a class="card quick-link" href="#cash-in-new">${icon("in")}<strong>ငွေပို့ အသစ်</strong></a><a class="card quick-link" href="#cash-out-new">${icon("out")}<strong>ငွေထုတ် အသစ်</strong></a></section>`, "dashboard");
  }

  const visibleRecords = (kind) => state[kind === "cash-out" ? "cashOut" : "cashIn"].filter((row) => row.account === assigned[row.accountType]);
  function transactionActions(kind, row) {
    const expanded = state.expandedTransaction === `${kind}:${row.id}`;
    return `<button class="icon-btn expand-btn" data-action="toggle-transaction" data-kind="${kind}" data-id="${esc(row.id)}" aria-expanded="${expanded}" aria-label="${expanded ? "အချက်အလက်ပိတ်ရန်" : "အချက်အလက်ဖွင့်ရန်"} ${esc(row.id)}">${icon(expanded ? "chevronUp" : "chevronDown")}</button>`;
  }

  function renderTransactionList(kind) {
    const query = state.query[kind].toLowerCase();
    const rows = visibleRecords(kind).filter((row) => Object.values(row).join(" ").toLowerCase().includes(query));
    const cards = rows.map((row) => {
      const expanded = state.expandedTransaction === `${kind}:${row.id}`;
      const separate = row.feeMode === "separate" && row.feeAccount;
      const feePill = separate ? `<span class="type-pill ${accountTypeOf(row.feeAccount)}">${accountTypeLabel(accountTypeOf(row.feeAccount))}</span>` : '<span class="type-pill fee">ဖျက်</span>';
      return `<article class="card transaction-card"><div class="transaction-top"><div><div class="transaction-ref">${esc(row.id)}</div><h2>${esc(row.customer)}</h2></div><strong class="num transaction-amount">${money(row.amount)}</strong></div>
      <div class="transaction-summary"><div><span class="data-label">ငွေစာရင်း</span><span class="data-value">${esc(accountName(row.account))}</span></div><div><span class="data-label">ဖန်တီးသူ</span><span class="data-value">${esc(row.creator)}</span></div><div class="summary-phone"><span class="data-label">ဖုန်းနံပါတ်</span><span class="data-value">${esc(row.phone)}</span></div><div class="fee-summary">${feePill}<span><span class="data-label">အခကြေးငွေ</span><strong class="num">${money(row.fee)}</strong></span></div></div>
      ${expanded ? `<div class="transaction-expanded"><div><span class="data-label">ကိုးကား</span><span class="data-value reference-value">${esc(row.systemReference)}</span></div><div><span class="data-label">နေ့ရက်နှင့်အချိန်</span><span class="data-value">${esc(row.timestamp)}</span></div>${separate ? `<div><span class="data-label">အခကြေးငွေစာရင်း</span><span class="data-value">${esc(accountName(row.feeAccount))}</span></div>` : ""}<div class="expanded-note"><span class="data-label">မှတ်ချက်</span><span class="data-value">${esc(row.note || "မှတ်ချက်မရှိပါ")}</span></div></div>` : ""}<div class="transaction-actions">${transactionActions(kind, row)}</div></article>`;
    }).join("");
    const title = kind === "cash-out" ? "ငွေထုတ်" : "ငွေပို့";
    app.innerHTML = shell(`${pageHead(title, "မိမိတာဝန်ပေးထားသော ဘဏ်နှင့် ငွေသားစာရင်းများ၏ မှတ်တမ်းများ။", `<a class="icon-btn" href="#${kind}-new" aria-label="${title} အသစ်">${icon("plus")}</a>`)}
      <div class="search list-search">${icon("search")}<input value="${esc(state.query[kind])}" data-search="${kind}" placeholder="အမည်၊ ကိုးကား သို့မဟုတ် ဖုန်းနံပါတ် ရှာရန်"></div><section class="transaction-list">${cards || '<div class="card empty">ကိုက်ညီသော မှတ်တမ်းမရှိပါ။</div>'}</section>`, kind);
  }

  function getRecord(kind, id) { return state[kind === "cash-out" ? "cashOut" : "cashIn"].find((row) => row.id === id); }
  function detailRows(rows) { return rows.map(([label, value]) => `<div class="detail-row"><dt>${esc(label)}</dt><dd>${value}</dd></div>`).join(""); }
  function renderDetail(kind, id) {
    const row = getRecord(kind, id);
    if (!row || row.account !== assigned[row.accountType]) { go(kind); return; }
    app.innerHTML = shell(`<a class="back" href="#${kind}">${icon("arrowLeft")}${kind === "cash-out" ? "ငွေထုတ်" : "ငွေပို့"} စာရင်းသို့</a><section class="card detail-hero"><div><small>ကိုးကား</small><h1>${esc(row.id)}</h1></div><div class="amount num">${money(row.amount)}</div></section>
      <section class="card detail-group"><h2>ဖောက်သည်</h2><dl class="detail-data">${detailRows([["အမည်", esc(row.customer)], ["ဖုန်းနံပါတ်", esc(row.phone)], ["ကိုးကား", esc(row.systemReference)], ["နေ့ရက်နှင့်အချိန်", esc(row.timestamp)], ["မှတ်ချက်", esc(row.note || "မှတ်ချက်မရှိပါ")]])}</dl></section>
      <section class="card detail-group"><h2>စာရင်းသွင်းမှု</h2><dl class="detail-data">${detailRows([["အမျိုးအစား", accountTypeLabel(row.accountType)], ["ငွေစာရင်း", esc(accountName(row.account))], ["ပမာဏ", money(row.amount)], ["အခကြေးငွေ", money(row.fee)], ["အခကြေးငွေပေးနည်း", esc(feeModeLabel(row.feeMode))], ...(row.feeMode === "separate" && row.feeAccount ? [["အခကြေးငွေစာရင်း", esc(accountName(row.feeAccount))]] : []), ["ဖန်တီးသူ", esc(row.creator)]])}</dl></section>`, kind);
  }

  function transactionForm(kind) {
    const isOut = kind === "cash-out";
    const values = { customer: "", phone: "", accountType: "bank", account: assigned.bank, amount: 0, fee: 0, feeMode: "deduct", feeAccount: "", note: "" };
    const selectedAccount = assigned[values.accountType];
    const accountField = `<input data-account-display value="${esc(accountName(selectedAccount))}" readonly><input data-account-value type="hidden" name="account" value="${esc(selectedAccount)}">`;
    const feeType = values.feeAccount ? accountTypeOf(values.feeAccount) : state.feeAccountType;
    const feeFields = `<div class="fee-fields" data-fee-fields hidden><div class="field"><label>အခကြေးငွေစာရင်း အမျိုးအစား</label><select name="feeAccountType" data-fee-account-type><option value="bank"${feeType === "bank" ? " selected" : ""}>ဘဏ်</option><option value="cash"${feeType === "cash" ? " selected" : ""}>ငွေသား</option></select></div><div class="field"><label>အခကြေးငွေစာရင်း</label><div data-fee-account-field>${feeAccountFieldHTML(feeType, values.feeAccount)}</div></div></div>`;
    app.innerHTML = shell(`<a class="back" href="#${kind}">${icon("arrowLeft")}စာရင်းသို့</a>${pageHead(`${isOut ? "ငွေထုတ်" : "ငွေပို့"} အသစ်`, `မိမိတာဝန်ပေးထားသော ငွေစာရင်းသို့သာ စာရင်းသွင်းနိုင်သည်။ အခကြေးငွေပေးနည်းကို ရွေးပါ။`)}
      <form id="transaction-form" data-kind="${kind}"><article class="card form-card">
        <section class="form-section"><h2 class="form-title"><span class="step">1</span>ဖောက်သည်</h2><div class="field"><label>ဖောက်သည်အမည်</label><input name="customer" value="${esc(values.customer)}" required></div><div class="field"><label>ဖုန်းနံပါတ်</label><input name="phone" type="tel" inputmode="tel" value="${esc(values.phone)}" placeholder="09 xxx xxx xxx" required></div></section>
        <section class="form-section"><h2 class="form-title"><span class="step">2</span>စာရင်းသွင်းမှု</h2><div class="field"><label>ငွေစာရင်း အမျိုးအစား</label><select name="accountType" data-account-type><option value="bank"${values.accountType === "bank" ? " selected" : ""}>ဘဏ်</option><option value="cash"${values.accountType === "cash" ? " selected" : ""}>ငွေသား</option></select></div><div class="field"><label>ငွေစာရင်း</label><div data-account-field>${accountField}</div></div><div class="form-fields"><div class="field"><label>ပမာဏ (K)</label><input name="amount" data-posting-input value="${values.amount || ""}" inputmode="numeric" required></div><div class="field"><label>အခကြေးငွေ (K)</label><input name="fee" data-posting-input value="${values.fee || ""}" inputmode="numeric" required></div></div><div class="field"><label>အခကြေးငွေ ပေးနည်း</label><select name="feeMode" data-fee-mode><option value="deduct"${values.feeMode !== "separate" ? " selected" : ""}>ပမာဏမှ ဖျက်မည်</option><option value="separate"${values.feeMode === "separate" ? " selected" : ""}>သီးသန့်ပေးမည်</option></select></div>${feeFields}<div class="field"><label>မှတ်ချက်</label><textarea name="note" placeholder="မှတ်ချက် (မဖြည့်လည်းရသည်)">${esc(values.note)}</textarea></div><div class="validation-line" data-validation></div></section>
      </article><div class="single-action"><button class="btn primary block">ဖန်တီးမည်</button></div></form>`, kind);
    syncFeeFields();
    updateValidation();
  }

  function syncFeeFields() {
    const form = app.querySelector("#transaction-form");
    if (!form) return;
    const fee = numberValue(form.elements.fee.value);
    form.querySelector("[data-fee-fields]").hidden = !(form.elements.feeMode.value === "separate" && fee > 0);
  }

  function updateValidation() {
    const form = app.querySelector("#transaction-form");
    if (!form) return;
    const amount = numberValue(form.elements.amount.value);
    const feeEntered = form.elements.fee.value.trim() !== "";
    const fee = numberValue(form.elements.fee.value);
    const separate = form.elements.feeMode.value === "separate" && fee > 0;
    const feeAccount = separate ? form.querySelector('[name="feeAccount"]')?.value || "" : "";
    const feeType = form.elements.feeAccountType?.value || "bank";
    const feeAccountReady = !separate || (Boolean(findAccount(feeAccount)?.active) && findAccount(feeAccount) === accounts[feeType]?.find((account) => account.id === feeAccount));
    const valid = amount > 0 && feeEntered && fee >= 0 && feeAccountReady;
    const line = form.querySelector("[data-validation]");
    line.className = `validation-line ${valid ? "valid" : "invalid"}`;
    const direction = form.dataset.kind === "cash-in" ? "လျော့မည်" : "တိုးမည်";
    const displayAmount = form.dataset.kind === "cash-in" || separate ? amount : amount + fee;
    line.textContent = valid
      ? separate
        ? `ငွေစာရင်းလက်ကျန် ${money(amount)} ${direction}။ ${accountName(feeAccount)} တွင် ${money(fee)} တိုးမည်။`
        : `ငွေစာရင်းလက်ကျန် ${money(displayAmount)} ${direction}။ အခကြေးငွေ ${money(fee)} ကို စာရင်းသွင်းမှုတွင် ထည့်သွင်းထားသည်။`
      : amount > 0 && feeEntered && fee >= 0
        ? "သီးသန့်ပေးမည့် အခကြေးငွေစာရင်းကို ရွေးပါ။"
        : "ပမာဏကို သုညထက်ပို၍ အခကြေးငွေကို သုည သို့မဟုတ် ထို့ထက်ပို၍ ထည့်ပါ။";
    form.querySelector("button.btn.primary").disabled = !valid;
  }

  function renderProfile() {
    const cashIn = visibleRecords("cash-in");
    const cashOut = visibleRecords("cash-out");
    const fees = [...cashIn, ...cashOut].reduce((total, row) => total + row.fee, 0);
    const bank = findAccount(assigned.bank);
    const cash = findAccount(assigned.cash);
    app.innerHTML = shell(`${pageHead("ကိုယ်ရေးအချက်အလက်", "မိမိဝန်ထမ်းအချက်အလက်၊ တာဝန်ပေးထားသော ငွေစာရင်းများနှင့် လုပ်ငန်းအနှစ်ချုပ်။", "", "ဝန်ထမ်းအကောင့်")}
      <section class="card profile-card"><span class="profile-avatar">${esc(currentStaff.initials)}</span><div><h2>${esc(currentStaff.name)}</h2><p>${esc(currentStaff.email)}</p><span class="status-pill">အသုံးပြုနေသော ဝန်ထမ်း</span></div></section>
      <div class="section-heading"><h2>ကျွန်ုပ်၏ အနှစ်ချုပ်</h2></div>
      <section class="summary-strip"><div><small>ငွေပို့</small><strong>${cashIn.length}</strong></div><div><small>ငွေထုတ်</small><strong>${cashOut.length}</strong></div><div><small>အခကြေးငွေ</small><strong class="summary-money">${money(fees)}</strong></div></section>
      <section class="card detail-group"><h2>တာဝန်ပေးထားသော ငွေစာရင်းများ</h2><dl class="detail-data">${detailRows([["ဘဏ်", `${esc(bank.name)}<br><span class="muted num">${money(bank.balance)}</span>`], ["ငွေသား", `${esc(cash.name)}<br><span class="muted num">${money(cash.balance)}</span>`]])}</dl></section>
      <button class="btn secondary block profile-logout" data-action="logout">အကောင့်မှထွက်မည်</button>`, "profile");
  }

  function render() {
    const current = route();
    if (current === "login") return renderLogin();
    if (current === "dashboard") return renderDashboard();
    if (current === "cash-in" || current === "cash-out") return renderTransactionList(current);
    if (current === "cash-in-new" || current === "cash-out-new") return transactionForm(current.replace("-new", ""));
    if (/^(cash-in|cash-out)\//.test(current)) { const [kind, id] = current.split("/"); return renderDetail(kind, id); }
    if (current === "profile") return renderProfile();
    go("dashboard");
  }

  app.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "show-password") { state.showPassword = !state.showPassword; renderLogin(); }
    if (action === "logout") { state.loginError = ""; go("login"); }
    if (action === "toggle-transaction") { const key = `${target.dataset.kind}:${target.dataset.id}`; state.expandedTransaction = state.expandedTransaction === key ? null : key; render(); }
  });

  app.addEventListener("input", (event) => {
    if (event.target.dataset.search) {
      const kind = event.target.dataset.search;
      state.query[kind] = event.target.value;
      renderTransactionList(kind);
      const input = app.querySelector(`[data-search="${kind}"]`);
      input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    }
    if (event.target.dataset.postingInput !== undefined) { syncFeeFields(); updateValidation(); }
  });

  app.addEventListener("change", (event) => {
    if (event.target.dataset.feeMode !== undefined) { syncFeeFields(); updateValidation(); }
    if (event.target.dataset.feeAccountType !== undefined) {
      state.feeAccountType = event.target.value;
      event.target.closest("form").querySelector("[data-fee-account-field]").innerHTML = feeAccountFieldHTML(state.feeAccountType, "");
      updateValidation();
    }
    if (event.target.dataset.accountType !== undefined) {
      const form = event.target.form;
      const type = event.target.value;
      const field = form.querySelector("[data-account-field]");
      field.innerHTML = `<input data-account-display value="${esc(accountName(assigned[type]))}" readonly><input data-account-value type="hidden" name="account" value="${esc(assigned[type])}">`;
    }
  });

  app.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form).entries());
    if (form.id === "login-form") {
      if (data.password === "wrong") { state.loginError = "အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ပါ။"; renderLogin(); return; }
      state.loginError = ""; go("dashboard"); return;
    }
    if (form.id === "transaction-form") {
      const kind = form.dataset.kind;
      const amount = numberValue(data.amount), fee = numberValue(data.fee);
      const feeMode = data.feeMode === "separate" ? "separate" : "deduct";
      const feeAccount = feeMode === "separate" && fee > 0 ? data.feeAccount || "" : "";
      const feeType = data.feeAccountType || "bank";
      const valid = data.customer.trim() && data.phone.trim() && data.fee.trim() !== "" && amount > 0 && fee >= 0 && findAccount(data.account)?.active && findAccount(data.account) === accounts[data.accountType]?.find((account) => account.id === data.account) && (!feeAccount || (findAccount(feeAccount)?.active && findAccount(feeAccount) === accounts[feeType]?.find((account) => account.id === feeAccount)));
      if (!valid) { updateValidation(); return; }
      const list = state[kind === "cash-out" ? "cashOut" : "cashIn"];
      const id = nextReference(kind === "cash-out" ? "CO" : "CI", list);
      const record = { id, systemReference: `UMT-${id}-${Date.now().toString(36).toUpperCase()}`, customer: data.customer.trim(), phone: data.phone.trim(), timestamp: now(), accountType: data.accountType, account: data.account, amount, fee, feeMode, feeAccount, note: data.note.trim(), creator: currentStaff.name };
      list.unshift(record); applyPosting(record, kind);
      go(kind); setTimeout(() => toast("ဖန်တီးပြီး ချက်ချင်းစာရင်းသွင်းပြီးပါပြီ။"), 0); return;
    }
  });

  window.addEventListener("hashchange", render);
  render();
})();
