(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const content = $("#content");
  const PERM = { 0: "任何人", 1: "遊戲導演", 2: "管理員", 3: "主機", 4: "擁有者" };
  const sorted = [...COMMANDS].sort((a, b) => (a.n === "?" ? -1 : b.n === "?" ? 1 : a.n.localeCompare(b.n)));
  const byName = {};
  sorted.forEach(c => { byName[c.n] = c; (c.a || []).forEach(x => (byName[x] = c)); });

  $("#ver").textContent = VERSION;

  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const link = n => `#/cmd/${encodeURIComponent(n)}`;
  const flags = c => c.flags || [];

  function editionTags(c) {
    const f = flags(c);
    let h = "";
    if (f.includes("bds")) h += `<span class="tag bds">專用伺服器</span>`;
    else if (f.includes("edu")) h += `<span class="tag edu">教育版</span>`;
    else h += `<span class="tag be">基岩版</span><span class="tag edu">教育版</span>`;
    if (f.includes("exp")) h += `<span class="tag exp">實驗性</span>`;
    return h;
  }

  function highlight(syntax) {
    // 以字元掃描，將 <必填> 與 [選填] 上色
    let out = "", depth = [];
    for (const ch of syntax) {
      if (ch === "<") { depth.push("req"); out += `<span class="req">&lt;`; }
      else if (ch === "[") { depth.push("opt"); out += `<span class="opt">[`; }
      else if (ch === ">" && depth[depth.length - 1] === "req") { depth.pop(); out += `&gt;</span>`; }
      else if (ch === "]" && depth[depth.length - 1] === "opt") { depth.pop(); out += `]</span>`; }
      else out += esc(ch);
    }
    return out + "</span>".repeat(depth.length);
  }

  function copyBtn(text) {
    return `<button class="copy" data-copy="${esc(text)}">複製</button>`;
  }

  /* ---------- 側欄 ---------- */
  $("#sideList").innerHTML = sorted.map(c => `<a href="${link(c.n)}" data-n="${esc(c.n)}">/${esc(c.n)}</a>`).join("");

  /* ---------- 首頁 ---------- */
  const state = { q: "", cat: "", be: true, edu: true, bds: true, exp: true, sortKey: "n", sortDir: 1 };

  function matches(c, q) {
    if (!q) return true;
    q = q.toLowerCase().replace(/^\//, "");
    return c.n.toLowerCase().includes(q) || (c.a || []).some(a => a.toLowerCase().includes(q)) ||
      c.d.toLowerCase().includes(q) || CATEGORIES[c.cat].includes(q);
  }

  function visible(c) {
    const f = flags(c);
    if (state.cat && c.cat !== state.cat) return false;
    if (!state.exp && f.includes("exp")) return false;
    if (f.includes("bds")) { if (!state.bds) return false; }
    else if (f.includes("edu")) { if (!state.edu) return false; }
    else if (!state.be && !state.edu) return false;
    return matches(c, state.q);
  }

  function renderHome() {
    const cats = Object.entries(CATEGORIES);
    content.innerHTML = `
      <h1 class="firstHeading">指令</h1>
      <div class="subtitle">基岩版與教育版 ${VERSION} 的指令總覽</div>
      <div class="msgbox">本頁列出 <b>基岩版</b>與<b>教育版 ${VERSION}</b> 的所有有效指令。使用前需在世界設定中<b>開啟作弊（允許指令）</b>，部分指令還需要管理員權限。點選指令名稱查看完整語法、參數說明與範例。</div>
      <p><b>指令</b>是在聊天欄輸入、以斜線 <code>/</code> 開頭的進階功能，也可以在<a href="#/cmd/function">函數</a>、指令方塊或 Script API 中執行。
      在語法中，<span class="mono" style="color:#c33">&lt;尖括號&gt;</span> 代表必填參數，<span class="mono" style="color:#2a7ab0">[方括號]</span> 代表選填參數。</p>

      <div class="toc"><b>目錄</b><ol><li><a href="#list">指令列表</a></li><li><a href="#cats">依分類瀏覽</a></li><li><a href="#legend">圖例</a></li></ol></div>

      <h2 id="list">指令列表</h2>
      <div class="filters">
        <input type="text" id="fq" placeholder="篩選…" value="${esc(state.q)}">
        <select id="fcat"><option value="">全部分類</option>${cats.map(([k, v]) => `<option value="${k}" ${state.cat === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        <label><input type="checkbox" id="fbe" ${state.be ? "checked" : ""}>基岩版／教育版通用</label>
        <label><input type="checkbox" id="fedu" ${state.edu ? "checked" : ""}>教育版專用</label>
        <label><input type="checkbox" id="fbds" ${state.bds ? "checked" : ""}>專用伺服器</label>
        <label><input type="checkbox" id="fexp" ${state.exp ? "checked" : ""}>實驗性</label>
        <span class="count" id="count"></span>
      </div>
      <table class="wikitable full sortable" id="cmdTable">
        <thead><tr><th data-k="n">指令</th><th data-k="a">別名</th><th data-k="d">說明</th><th data-k="cat">分類</th><th data-k="p">權限等級</th><th data-k="ed">版本</th></tr></thead>
        <tbody></tbody>
      </table>

      <h2 id="cats">依分類瀏覽</h2>
      <div class="cat-grid">${cats.map(([k, v]) => {
        const list = sorted.filter(c => c.cat === k);
        return list.length ? `<div class="cat-card"><h4>${v}（${list.length}）</h4>${list.map(c => `<a href="${link(c.n)}">/${esc(c.n)}</a>`).join(" ")}</div>` : "";
      }).join("")}</div>

      <h2 id="legend">圖例</h2>
      <table class="wikitable">
        <tr><td><span class="tag be">基岩版</span><span class="tag edu">教育版</span></td><td>基岩版與教育版皆可使用。</td></tr>
        <tr><td><span class="tag edu">教育版</span></td><td>教育版專用指令；基岩版需在世界設定中開啟「教育版」選項才能使用。</td></tr>
        <tr><td><span class="tag bds">專用伺服器</span></td><td>僅能在 Bedrock Dedicated Server 的主控台或具相應權限時使用。</td></tr>
        <tr><td><span class="tag exp">實驗性</span></td><td>需開啟實驗性玩法（如 Beta API）或僅限開發／編輯器版本。</td></tr>
      </table>`;

    const bind = (id, key, prop = "checked") => $("#" + id).addEventListener(prop === "value" ? "input" : "change", e => { state[key] = e.target[prop]; fillTable(); });
    bind("fq", "q", "value"); bind("fbe", "be"); bind("fedu", "edu"); bind("fbds", "bds"); bind("fexp", "exp");
    $("#fcat").addEventListener("change", e => { state.cat = e.target.value; fillTable(); });
    $("#cmdTable thead").addEventListener("click", e => {
      const k = e.target.dataset.k; if (!k) return;
      state.sortDir = state.sortKey === k ? -state.sortDir : 1; state.sortKey = k; fillTable();
    });
    fillTable();
  }

  function sortVal(c, k) {
    if (k === "a") return (c.a || []).join(",");
    if (k === "cat") return CATEGORIES[c.cat];
    if (k === "ed") return flags(c).join(",");
    return c[k];
  }

  function fillTable() {
    const rows = sorted.filter(visible).sort((a, b) => {
      const x = sortVal(a, state.sortKey), y = sortVal(b, state.sortKey);
      return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "zh-Hant")) * state.sortDir;
    });
    $("#cmdTable tbody").innerHTML = rows.map(c => `
      <tr>
        <td class="cmd"><a href="${link(c.n)}">/${esc(c.n)}</a></td>
        <td class="nw">${(c.a || []).map(a => `<code>/${esc(a)}</code>`).join("<br>")}</td>
        <td>${c.d}</td>
        <td class="nw">${CATEGORIES[c.cat]}</td>
        <td style="text-align:center">${c.p}<br><small>${PERM[c.p]}</small></td>
        <td>${editionTags(c)}</td>
      </tr>`).join("") || `<tr><td colspan="6" style="text-align:center">沒有符合條件的指令。</td></tr>`;
    $("#count").textContent = `共 ${rows.length} / ${sorted.length} 個指令`;
  }

  /* ---------- 指令頁 ---------- */
  function renderCmd(name) {
    const c = byName[name];
    if (!c) return renderNotFound(name);
    const f = flags(c);
    const blockCls = f.includes("bds") ? "bds" : f.includes("exp") ? "exp" : f.includes("edu") ? "edu" : "";
    const idx = sorted.indexOf(c);
    const prev = sorted[idx - 1], next = sorted[idx + 1];

    let notices = "";
    if (f.includes("edu")) notices += `<div class="msgbox edu">此指令為<b>教育版</b>專用功能。在基岩版中需於世界設定開啟「教育版」選項才能使用。</div>`;
    if (f.includes("bds")) notices += `<div class="msgbox bds">此指令僅適用於<b>基岩版專用伺服器（BDS）</b>。</div>`;
    if (f.includes("exp")) notices += `<div class="msgbox exp">此指令需開啟<b>實驗性玩法</b>或僅存在於開發／編輯器版本。</div>`;

    content.innerHTML = `
      <h1 class="firstHeading">指令/${esc(c.n)}</h1>
      <div class="subtitle">來自麥塊基岩版指令wiki （Ｖ26.32版）</div>
      <div class="clearfix">
      <aside class="infobox">
        <div class="ib-title">/${esc(c.n)}</div>
        <div class="ib-img"><span class="cmdblock ${blockCls}"></span></div>
        <table>
          <tr><th>權限等級</th><td>${c.p}（${PERM[c.p]}）</td></tr>
          <tr><th>需開啟作弊</th><td>${c.p === 0 && ["help", "?", "me", "msg", "list", "classroommode", "code", "connect"].includes(c.n) ? "否" : "是"}</td></tr>
          ${c.a ? `<tr><th>別名</th><td>${c.a.map(a => `<code>/${esc(a)}</code>`).join("<br>")}</td></tr>` : ""}
          <tr><th>分類</th><td>${CATEGORIES[c.cat]}</td></tr>
          <tr><th>版本</th><td>${editionTags(c)}</td></tr>
        </table>
      </aside>
      ${notices}
      <p><b><code>/${esc(c.n)}</code></b>：${c.d}</p>
      ${c.notes ? `<div class="msgbox warn">${c.notes}</div>` : ""}

      <h2>語法</h2>
      ${c.s.map(([syn, desc]) => `<div class="syntax"><div class="code">${highlight(syn)}${desc ? `<span class="desc">${desc}</span>` : ""}</div>${copyBtn(syn)}</div>`).join("")}

      ${c.args && c.args.length ? `<h2>參數</h2>
      <div class="bfc"><table class="wikitable full"><thead><tr><th>參數</th><th>類型</th><th>說明</th></tr></thead><tbody>
      ${c.args.map(([a, t, d]) => `<tr><td><code>${esc(a)}</code></td><td>${t ? `<code>${esc(t)}</code>` : "—"}</td><td>${d}</td></tr>`).join("")}
      </tbody></table></div>` : ""}

      ${c.ex && c.ex.length ? `<h2>範例</h2>
      ${c.ex.map(([cmd, d]) => `<div class="syntax"><div class="code">${esc(cmd)}<span class="desc">${d}</span></div>${copyBtn(cmd)}</div>`).join("")}` : ""}

      ${c.seeAlso ? `<h2>參見</h2><ul><li><a href="#/${c.seeAlso}">${c.seeAlso === "gamerules" ? "遊戲規則" : "原始 JSON 文字"}</a></li></ul>` : ""}
      </div>
      <h2>導覽</h2>
      <table class="wikitable full"><tr>
        <td style="width:50%">${prev ? `← <a href="${link(prev.n)}">/${esc(prev.n)}</a>` : ""}</td>
        <td style="text-align:right">${next ? `<a href="${link(next.n)}">/${esc(next.n)}</a> →` : ""}</td>
      </tr></table>`;
  }

  /* ---------- 其他頁面 ---------- */
  function renderSelectors() {
    content.innerHTML = `
      <h1 class="firstHeading">目標選擇器</h1>
      <div class="subtitle">基岩版・教育版 ${VERSION}</div>
      <p>目標選擇器用於在指令中選取玩家或實體，而不需輸入確切名稱。</p>
      <h2>選擇器變數</h2>
      <table class="wikitable"><thead><tr><th>變數</th><th>選取對象</th></tr></thead><tbody>
      ${SELECTORS.map(([s, d]) => `<tr><td><code>${s}</code></td><td>${d}</td></tr>`).join("")}</tbody></table>
      <h2>選擇器參數</h2>
      <p>參數寫在方括號中、以逗號分隔，例如 <code>@e[type=zombie,r=10,c=3]</code>。</p>
      <div class="bfc"><table class="wikitable full"><thead><tr><th>參數</th><th>範例</th><th>說明</th></tr></thead><tbody>
      ${SELECTOR_ARGS.map(([a, e, d]) => `<tr><td><code>${a}</code></td><td><code>${esc(e)}</code></td><td>${d}</td></tr>`).join("")}</tbody></table></div>
      <h2>範例</h2>
      ${[["@a[r=10,m=survival]", "10 格內所有生存模式玩家"], ["@e[type=!player,family=monster]", "所有敵對生物"], ["@p[scores={points=10..20}]", "分數在 10–20 間的最近玩家"], ["@a[hasitem={item=diamond_sword,location=slot.weapon.mainhand}]", "主手拿著鑽石劍的玩家"], ["@e[type=item,c=-1]", "最遠的一個掉落物"]]
        .map(([s, d]) => `<div class="syntax"><div class="code">${esc(s)}<span class="desc">${d}</span></div>${copyBtn(s)}</div>`).join("")}`;
  }

  function renderCoordinates() {
    content.innerHTML = `
      <h1 class="firstHeading">座標表示法</h1>
      <div class="subtitle">基岩版・教育版 ${VERSION}</div>
      <table class="wikitable full"><thead><tr><th>表示法</th><th>名稱</th><th>說明</th><th>範例</th></tr></thead><tbody>
        <tr><td><code>x y z</code></td><td>絕對座標</td><td>世界中的固定位置。</td><td><code>/tp @s 0 64 0</code></td></tr>
        <tr><td><code>~ ~ ~</code></td><td>相對座標</td><td>相對於執行位置的偏移（以世界軸計）。</td><td><code>/tp @s ~ ~10 ~</code></td></tr>
        <tr><td><code>^ ^ ^</code></td><td>局部座標</td><td>相對於執行者朝向：<code>^左 ^上 ^前</code>。</td><td><code>/tp @s ^ ^ ^5</code></td></tr>
      </tbody></table>
      <div class="msgbox warn"><code>~</code> 與 <code>^</code> 不能混用於同一組座標中。</div>
      <h2>旋轉</h2>
      <p>y 旋轉（水平）：-180 = 北、-90 = 東、0 = 南、90 = 西。x 旋轉（垂直）：-90 = 正上方、0 = 水平、90 = 正下方。</p>`;
  }

  function renderGamerules() {
    content.innerHTML = `
      <h1 class="firstHeading">遊戲規則</h1>
      <div class="subtitle">搭配 <a href="${link("gamerule")}">/gamerule</a> 使用</div>
      <table class="wikitable full sortable" id="grTable"><thead><tr><th>規則名稱</th><th>類型</th><th>預設值</th><th>說明</th><th></th></tr></thead><tbody>
      ${GAMERULES.map(([n, t, v, d]) => `<tr><td><code>${n}</code></td><td>${t === "bool" ? "布林" : "整數"}</td><td><code>${v}</code></td><td>${d}</td><td>${copyBtn(`/gamerule ${n} ${v}`)}</td></tr>`).join("")}
      </tbody></table>`;
  }

  function renderRawtext() {
    const ex = [
      ['{"rawtext":[{"text":"Hello World"}]}', "純文字"],
      ['{"rawtext":[{"selector":"@p"}]}', "顯示選擇器選中的實體名稱"],
      ['{"rawtext":[{"score":{"name":"@s","objective":"kills"}}]}', "顯示分數"],
      ['{"rawtext":[{"translate":"chat.type.text","with":["Steve","Hi"]}]}', "翻譯鍵與參數"],
      ['{"rawtext":[{"translate":"%%2 和 %%1","with":{"rawtext":[{"text":"A"},{"selector":"@p"}]}}]}', "巢狀 rawtext 作為參數"],
    ];
    content.innerHTML = `
      <h1 class="firstHeading">原始 JSON 文字</h1>
      <div class="subtitle">用於 <a href="${link("tellraw")}">/tellraw</a>、<a href="${link("titleraw")}">/titleraw</a></div>
      <p>基岩版使用 <code>rawtext</code> 陣列組成訊息，每個元素可以是以下其中一種：</p>
      <table class="wikitable full"><thead><tr><th>鍵</th><th>說明</th></tr></thead><tbody>
        <tr><td><code>text</code></td><td>純文字字串。</td></tr>
        <tr><td><code>selector</code></td><td>目標選擇器，顯示實體名稱。</td></tr>
        <tr><td><code>score</code></td><td><code>{"name": 選擇器或名稱, "objective": 記分項}</code></td></tr>
        <tr><td><code>translate</code></td><td>翻譯鍵或含 <code>%%s</code>/<code>%%1</code> 的字串，搭配 <code>with</code>（字串陣列或 rawtext 物件）。</td></tr>
      </tbody></table>
      <h2>範例</h2>
      ${ex.map(([j, d]) => `<div class="syntax"><div class="code">/tellraw @a ${esc(j)}<span class="desc">${d}</span></div>${copyBtn("/tellraw @a " + j)}</div>`).join("")}
      <h2>格式代碼</h2>
      <p>使用 <code>§</code> 加上代碼：<code>§0</code>–<code>§9</code>、<code>§a</code>–<code>§f</code> 為顏色；<code>§g</code> 金幣色、<code>§h</code>–<code>§v</code> 礦物色；<code>§k</code> 亂碼、<code>§l</code> 粗體、<code>§o</code> 斜體、<code>§r</code> 重設。</p>`;
  }

  function renderPermissions() {
    content.innerHTML = `
      <h1 class="firstHeading">權限等級</h1>
      <div class="subtitle">基岩版・教育版 ${VERSION}</div>
      <table class="wikitable full"><thead><tr><th>等級</th><th>名稱</th><th>說明</th><th>指令數</th></tr></thead><tbody>
        ${[[0, "任何人 (Any)", "所有玩家皆可使用，無需作弊。"], [1, "遊戲導演 (GameDirectors)", "管理員與指令方塊可使用。"], [2, "管理員 (Admin)", "管理員可使用，指令方塊不可。"], [3, "主機 (Host)", "僅世界主機或伺服器可使用。"], [4, "擁有者 (Owner)", "僅專用伺服器主控台可使用。"]]
          .map(([l, n, d]) => `<tr><td style="text-align:center">${l}</td><td>${n}</td><td>${d}</td><td style="text-align:center">${sorted.filter(c => c.p === l).length}</td></tr>`).join("")}
      </tbody></table>`;
  }

  function renderNotFound(n) {
    content.innerHTML = `<h1 class="firstHeading">找不到頁面</h1><p>沒有名為 <code>/${esc(n)}</code> 的指令。<a href="#/">返回指令總覽</a>。</p>`;
  }

  /* ---------- 路由 ---------- */
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const [page, arg] = [h.split("/")[0], h.split("/").slice(1).join("/")];
    const pages = { selectors: renderSelectors, coordinates: renderCoordinates, gamerules: renderGamerules, rawtext: renderRawtext, permissions: renderPermissions };
    if (page === "cmd") renderCmd(arg);
    else if (pages[page]) pages[page]();
    else if (!page || page === "") renderHome();
    else if (["list", "cats", "legend"].includes(page)) { return; }
    else renderNotFound(page);
    document.querySelectorAll(".side-list a").forEach(a => a.classList.toggle("cur", page === "cmd" && byName[arg] && a.dataset.n === byName[arg].n));
    $("#sidebar").classList.remove("open");
    window.scrollTo(0, 0);
    document.title = (page === "cmd" ? `/${arg} – ` : "") + "麥塊基岩版指令wiki （Ｖ26.32版）";
  }
  // 頁內錨點（目錄）不觸發路由
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href^='#']");
    if (a && !a.getAttribute("href").startsWith("#/")) {
      e.preventDefault();
      const t = document.getElementById(a.getAttribute("href").slice(1));
      if (t) t.scrollIntoView({ behavior: "smooth" });
    }
    const b = e.target.closest(".copy");
    if (b) {
      const done = () => { const t = $("#toast"); t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 1200); };
      const fallback = () => {
        const ta = document.createElement("textarea"); ta.value = b.dataset.copy; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy"); ta.remove(); done();
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(b.dataset.copy).then(done, fallback);
      else fallback();
    }
  });
  window.addEventListener("hashchange", route);

  /* ---------- 搜尋建議 ---------- */
  const search = $("#search"), sug = $("#suggest");
  let active = -1, results = [];
  function showSug() {
    const q = search.value.trim();
    if (!q) { sug.style.display = "none"; return; }
    results = sorted.filter(c => matches(c, q)).slice(0, 12);
    active = -1;
    sug.innerHTML = results.map((c, i) => `<li data-i="${i}"><b>/${esc(c.n)}</b><small>${esc(c.d.slice(0, 32))}</small></li>`).join("") || `<li>無結果</li>`;
    sug.style.display = "block";
  }
  search.addEventListener("input", showSug);
  search.addEventListener("keydown", e => {
    const items = sug.querySelectorAll("li[data-i]");
    if (e.key === "ArrowDown") active = Math.min(active + 1, items.length - 1);
    else if (e.key === "ArrowUp") active = Math.max(active - 1, 0);
    else if (e.key === "Enter") {
      const c = results[active >= 0 ? active : 0];
      if (c) { location.hash = link(c.n); search.value = ""; sug.style.display = "none"; search.blur(); }
      return;
    } else if (e.key === "Escape") { sug.style.display = "none"; return; }
    else return;
    e.preventDefault();
    items.forEach((li, i) => li.classList.toggle("active", i === active));
  });
  sug.addEventListener("mousedown", e => {
    const li = e.target.closest("li[data-i]"); if (!li) return;
    location.hash = link(results[li.dataset.i].n); search.value = ""; sug.style.display = "none";
  });
  search.addEventListener("blur", () => setTimeout(() => (sug.style.display = "none"), 150));
  document.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); search.focus(); }
  });

  /* ---------- 主題與選單 ---------- */
  const setTheme = t => { document.documentElement.dataset.theme = t; localStorage.setItem("theme", t); };
  setTheme(localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  $("#themeBtn").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  $("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

  route();
})();
