/* 上岸鸭 · API 厂商接入目录（独立增量模块）
 * 仅展示官方文档/控制台跳转与接入状态；不收集密钥、不声称已接通 API。
 * 集成：在页面 </body> 前加入 <script src="./api-vendor-center.js"></script>
 */
(() => {
  if (window.__syApiVendorCenterLoaded) return;
  window.__syApiVendorCenterLoaded = true;

  const providers = [
    {name:"OpenRouter",kind:"大模型统一网关",cost:"免费模型与付费模型；依模型而定",docs:"https://openrouter.ai/docs",console:"https://openrouter.ai/settings/keys",models:"https://openrouter.ai/models",note:"统一调用多家模型；需要自己的 API Key。"},
    {name:"Google Gemini",kind:"大模型",cost:"部分模型/额度可能免费；以官方额度为准",docs:"https://ai.google.dev/gemini-api/docs",console:"https://aistudio.google.com/app/apikey",models:"https://ai.google.dev/gemini-api/docs/models",note:"官方 Gemini API；检查地区、配额和模型可用性。"},
    {name:"DeepSeek",kind:"大模型",cost:"按官方价格计费；以控制台为准",docs:"https://api-docs.deepseek.com/",console:"https://platform.deepseek.com/",models:"https://api-docs.deepseek.com/quick_start/pricing",note:"API 兼容形式需按官方文档配置；不等于网页会员权益。"},
    {name:"阿里云百炼 / Qwen",kind:"大模型",cost:"按模型、地域和活动额度而定",docs:"https://help.aliyun.com/zh/model-studio/",console:"https://bailian.console.aliyun.com/",models:"https://help.aliyun.com/zh/model-studio/getting-started/models",note:"需要阿里云账号、对应权限与 API Key。"},
    {name:"Groq",kind:"大模型推理 API",cost:"可能提供免费开发额度；受限流约束",docs:"https://console.groq.com/docs/overview",console:"https://console.groq.com/keys",models:"https://console.groq.com/docs/models",note:"具体模型、速率和免费额度以控制台实时信息为准。"},
    {name:"Ollama",kind:"本地模型",cost:"本地运行通常无需按 token 付费；有硬件成本",docs:"https://docs.ollama.com/",console:"https://ollama.com/download",models:"https://ollama.com/library",note:"本机服务必须运行且可从当前部署环境访问；公网网页不能直接访问访客电脑的 localhost。"},
    {name:"Tavily",kind:"全网搜索 / 网页提取",cost:"可能有免费额度；超额按计划计费",docs:"https://docs.tavily.com/",console:"https://app.tavily.com/home",models:"https://docs.tavily.com/documentation/api-reference/endpoint/search",note:"搜索与正文提取需由服务端代理调用，不能把密钥写在前端。"},
    {name:"Brave Search",kind:"全网搜索",cost:"按官方计划/额度而定",docs:"https://api-dashboard.search.brave.com/documentation",console:"https://api-dashboard.search.brave.com/app/keys",models:"https://api-dashboard.search.brave.com/documentation",note:"搜索结果 API；需要创建密钥并遵守额度与使用条款。"},
    {name:"Firecrawl",kind:"网页爬取 / 内容提取",cost:"免费额度与付费计划以官方为准",docs:"https://docs.firecrawl.dev/",console:"https://www.firecrawl.dev/app",models:"https://docs.firecrawl.dev/api-reference/endpoint/scrape",note:"适用于可公开访问网页；登录态/付费墙内容不会自动获得权限。"},
    {name:"飞书开放平台",kind:"知识库 / 文档 API",cost:"平台能力按应用与权限开放",docs:"https://open.feishu.cn/document/",console:"https://open.feishu.cn/app",models:"https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/get",note:"需应用凭证、相应 API 权限及文档授权；Wiki 链接可读不代表已有授权。"},
    {name:"GitHub",kind:"代码 / 仓库 API",cost:"按账号计划、API 限额和资源权限而定",docs:"https://docs.github.com/en/rest",console:"https://github.com/settings/tokens",models:"https://docs.github.com/en/rest/repos/contents",note:"私有仓库必须授权；令牌只放在服务端安全存储。"},
    {name:"MCP 官方规范",kind:"工具接入协议",cost:"协议本身不代表某个服务免费或已接通",docs:"https://modelcontextprotocol.io/docs/getting-started/intro",console:"https://modelcontextprotocol.io/",models:"https://modelcontextprotocol.io/specification/2025-06-18",note:"每个 MCP Server 仍需单独安装、授权并验证工具权限。"},
    {name:"OpenAI API",kind:"大模型 / 多模态 API",cost:"API 通常独立计费；以官方价格页为准",docs:"https://platform.openai.com/docs/overview",console:"https://platform.openai.com/api-keys",models:"https://platform.openai.com/docs/models",note:"ChatGPT 订阅不等同于 API 余额；需单独检查账单和权限。"},
    {name:"Anthropic API",kind:"大模型 API",cost:"按官方价格与账户额度计费",docs:"https://docs.anthropic.com/",console:"https://console.anthropic.com/settings/keys",models:"https://docs.anthropic.com/en/docs/about-claude/models/overview",note:"需 Anthropic Console 账户、API Key 和可用地区/付款设置。"}
  ];

  const style = document.createElement("style");
  style.textContent = `
    #sy-api-center-launch{position:fixed;right:22px;bottom:82px;z-index:2147482990;border:1px solid #dfc5d2;border-radius:999px;padding:11px 16px;background:#fff7fb;color:#8c2856;font:650 14px/1.2 system-ui,sans-serif;box-shadow:0 6px 22px #51213b20;cursor:pointer}
    #sy-api-center-backdrop{position:fixed;inset:0;z-index:2147482991;display:none;align-items:center;justify-content:center;padding:14px;background:#17131c88}
    #sy-api-center-panel{width:min(1020px,100%);max-height:92vh;overflow:auto;background:#fff;color:#251f25;border-radius:18px;padding:20px;font:14px/1.5 system-ui,"Microsoft YaHei",sans-serif;box-shadow:0 20px 80px #0004}
    #sy-api-center-panel *{box-sizing:border-box}
    .sy-api-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.sy-api-title{font-size:22px;font-weight:800}.sy-api-close{border:0;border-radius:10px;padding:8px 12px;cursor:pointer}
    .sy-api-note{background:#fff5d9;border:1px solid #f1df9e;border-radius:10px;padding:10px 12px;color:#59481c;margin:12px 0}
    .sy-api-tools{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.sy-api-search{flex:1;min-width:180px;border:1px solid #ded4dc;border-radius:9px;padding:10px}
    .sy-api-filter{border:1px solid #e4d4de;border-radius:9px;padding:9px;background:#fff;cursor:pointer}.sy-api-filter[aria-pressed=true]{background:#8e2c5c;color:white}
    .sy-api-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .sy-api-card{border:1px solid #e9e0e7;border-radius:12px;padding:13px;min-width:0}.sy-api-card h3{margin:0 0 5px;font-size:16px}.sy-api-kind{color:#8e2c5c;font-size:12px;font-weight:700}.sy-api-cost{font-size:12px;color:#675d65;margin:6px 0}.sy-api-card p{margin:6px 0 10px;color:#524852}.sy-api-links{display:flex;flex-wrap:wrap;gap:7px}.sy-api-links a{display:inline-block;border-radius:8px;background:#f7edf3;color:#8e2c5c;text-decoration:none;padding:7px 9px;font-size:12px;font-weight:650}.sy-api-links a:hover{text-decoration:underline}.sy-api-state{font-size:11px;color:#6d5c29;background:#fff5d9;border-radius:6px;padding:3px 6px;display:inline-block;margin-left:6px}
    @media(max-width:640px){#sy-api-center-launch{right:12px;bottom:72px}.sy-api-grid{grid-template-columns:1fr}#sy-api-center-panel{padding:14px}.sy-api-title{font-size:19px}}
  `;
  document.head.appendChild(style);
  const backdrop = document.createElement("div");
  backdrop.id = "sy-api-center-backdrop";
  backdrop.innerHTML = `
    <section id="sy-api-center-panel" role="dialog" aria-modal="true" aria-labelledby="sy-api-center-title">
      <div class="sy-api-head"><div class="sy-api-title" id="sy-api-center-title">API 厂商接入中心</div><button class="sy-api-close" type="button">关闭 ×</button></div>
      <div class="sy-api-note"><strong>真实状态说明：</strong>下方链接可跳转到厂商官方文档、控制台和模型列表。显示在目录中不代表已接入上岸鸭；只有完成密钥/授权并通过实际调用测试后，才能标记为“已连接”。请勿把 API Key 粘贴到网页前端或聊天中。</div>
      <div class="sy-api-tools"><input class="sy-api-search" id="sy-api-search" placeholder="搜索厂商、模型、搜索 API、飞书……" aria-label="搜索 API 厂商"><button class="sy-api-filter" data-filter="all" aria-pressed="true">全部</button><button class="sy-api-filter" data-filter="model" aria-pressed="false">大模型</button><button class="sy-api-filter" data-filter="search" aria-pressed="false">全网搜索</button><button class="sy-api-filter" data-filter="tools" aria-pressed="false">软件 / 工具</button></div>
      <div class="sy-api-grid" id="sy-api-grid"></div>
      <p style="font-size:12px;color:#766b73;margin-top:14px">免费额度、价格、支持地区和模型列表可能变化；点击厂商官方链接核实。浏览器端仅提供跳转，不会保存你的密钥。</p>
    </section>`;
  document.body.appendChild(backdrop);
  const launch = document.createElement("button");
  launch.id = "sy-api-center-launch";
  launch.type = "button";
  launch.textContent = "API 厂商接入";
  launch.setAttribute("aria-haspopup","dialog");
  document.body.appendChild(launch);

  let filter = "all";
  const grid = backdrop.querySelector("#sy-api-grid");
  const search = backdrop.querySelector("#sy-api-search");
  function group(p) {
    if (/搜索|网页提取|爬取/.test(p.kind)) return "search";
    if (/软件|知识库|代码|工具|协议/.test(p.kind)) return "tools";
    return "model";
  }
  function render() {
    const q = search.value.trim().toLowerCase();
    const found = providers.filter(p => (filter === "all" || group(p) === filter) &&
      (p.name + " " + p.kind + " " + p.cost + " " + p.note).toLowerCase().includes(q));
    grid.replaceChildren();
    found.forEach(p => {
      const card = document.createElement("article");
      card.className = "sy-api-card";
      const title = document.createElement("h3"); title.textContent = p.name;
      const state = document.createElement("span"); state.className = "sy-api-state"; state.textContent = "待配置 / 待验收"; title.appendChild(state);
      const kind = document.createElement("div"); kind.className = "sy-api-kind"; kind.textContent = p.kind;
      const cost = document.createElement("div"); cost.className = "sy-api-cost"; cost.textContent = p.cost;
      const note = document.createElement("p"); note.textContent = p.note;
      const links = document.createElement("div"); links.className = "sy-api-links";
      [["官方文档",p.docs],["厂商控制台",p.console],["模型 / API 列表",p.models]].forEach(([label,url])=>{
        const a=document.createElement("a"); a.href=url; a.target="_blank"; a.rel="noopener noreferrer"; a.textContent=label; links.appendChild(a);
      });
      card.append(title,kind,cost,note,links); grid.appendChild(card);
    });
    if (!found.length) { const empty=document.createElement("p"); empty.textContent="没有找到匹配的厂商。"; grid.appendChild(empty); }
  }
  launch.addEventListener("click",()=>{backdrop.style.display="flex";render();search.focus();});
  backdrop.querySelector(".sy-api-close").addEventListener("click",()=>backdrop.style.display="none");
  backdrop.addEventListener("click",e=>{if(e.target===backdrop)backdrop.style.display="none";});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&backdrop.style.display==="flex")backdrop.style.display="none";});
  search.addEventListener("input",render);
  backdrop.querySelectorAll(".sy-api-filter").forEach(b=>b.addEventListener("click",()=>{
    filter=b.dataset.filter;backdrop.querySelectorAll(".sy-api-filter").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));render();
  }));
})();
