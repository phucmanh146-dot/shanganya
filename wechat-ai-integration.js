(function () {
  'use strict';
  if (window.__SHANGANYA_WECHAT_SUMMARY_AI__) return;
  window.__SHANGANYA_WECHAT_SUMMARY_AI__ = true;

  var LOCAL = 'http://127.0.0.1:8898';
  var TOKEN_KEY = 'sy_wechat_local_bridge_token';
  var lastRaw = '', lastAnswer = '', lastGroup = '', lastLinks = [];
  var providers = [];
  var $ = function (id) { return document.getElementById(id); };
  function node(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'className') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); });
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function setStatus(s, bad) {
    var e = $('wsai-status');
    if (!e) return;
    e.textContent = s;
    e.style.color = bad ? '#b42318' : '#176b4d';
  }
  function token() { return $('wsai-token').value.trim(); }
  async function localApi(path, method, body, auth) {
    var headers = { 'Content-Type': 'application/json' };
    if (auth !== false) headers['X-Bridge-Token'] = token();
    var response = await fetch(LOCAL + path, {
      method: method || 'GET', headers: headers, body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store', mode: 'cors'
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok || data.ok === false) throw new Error(data.error || ('本机工具请求失败 HTTP ' + response.status));
    return data;
  }
  async function siteApi(path, body) {
    var r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body || {}) });
    var d = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(d.error || ('网页接口失败 HTTP ' + r.status));
    return d;
  }
  function mount() {
    var style = node('style', { id: 'wsai-style' });
    style.textContent = '#wsai-launch{position:fixed;right:18px;bottom:20px;z-index:2147482000;border:0;border-radius:999px;background:#176b4d;color:#fff;padding:13px 17px;font:700 14px system-ui;box-shadow:0 8px 30px #0003;cursor:pointer}#wsai-panel{position:fixed;z-index:2147482001;right:16px;bottom:78px;width:min(560px,calc(100vw - 24px));max-height:84vh;overflow:auto;background:#fff;color:#172b22;border:1px solid #cfe1d5;border-radius:18px;box-shadow:0 18px 60px #0003;padding:16px;font:14px/1.55 system-ui,-apple-system,'Microsoft YaHei',sans-serif;display:none}#wsai-panel *{box-sizing:border-box}#wsai-panel h2{font-size:18px;margin:0 0 4px}#wsai-panel h3{font-size:14px;margin:14px 0 6px}#wsai-panel label{display:block;font-size:12px;font-weight:700;margin:7px 0 3px;color:#44574c}#wsai-panel input,#wsai-panel select,#wsai-panel textarea{width:100%;padding:9px;border:1px solid #cbd8cf;border-radius:9px;background:#fff;color:#172b22;font:13px system-ui}#wsai-panel textarea{min-height:92px;resize:vertical}#wsai-panel .wsai-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}#wsai-panel .wsai-actions{display:flex;flex-wrap:wrap;gap:7px;margin:9px 0}#wsai-panel button{border:0;border-radius:9px;background:#e6f4eb;color:#176b4d;padding:9px 11px;font-weight:750;cursor:pointer}#wsai-panel button.primary{background:#176b4d;color:#fff}#wsai-panel button:disabled{opacity:.5;cursor:not-allowed}#wsai-panel .wsai-muted{font-size:11px;color:#687a70}#wsai-panel .wsai-box{background:#f6faf7;border:1px solid #dce9df;border-radius:10px;padding:10px;margin:8px 0}#wsai-panel #wsai-answer{white-space:pre-wrap;overflow-wrap:anywhere;max-height:32vh;overflow:auto;background:#f8faf9;border:1px solid #e0e7e2;border-radius:10px;padding:10px}#wsai-panel #wsai-video{display:none;width:100%;aspect-ratio:16/9;background:#0b1722;border-radius:10px;margin-top:8px}#wsai-panel a{color:#176b4d;overflow-wrap:anywhere}#wsai-panel .wsai-hidden{display:none}@media(max-width:500px){#wsai-panel .wsai-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
    var launch = node('button', { id: 'wsai-launch', type: 'button' }, '微信原始数据 AI');
    launch.onclick = function () { $('wsai-panel').style.display = $('wsai-panel').style.display === 'block' ? 'none' : 'block'; };
    var panel = node('section', { id: 'wsai-panel', role: 'dialog', 'aria-label': '微信原始数据 AI 工具' });
    panel.innerHTML = [
      '<div style="display:flex;align-items:start;justify-content:space-between;gap:10px"><div><h2>微信原始数据 AI 工具</h2><div class="wsai-muted">复用本机 wechat_summary · 多模型配置 · 原始消息 → 链接正文 → AI 分析 → 任务建议</div></div><button id="wsai-close" type="button">收起</button></div>',
      '<div class="wsai-box"><b>第一步：连接你电脑里的原始数据 AI 工具</b><div class="wsai-muted">本机桥接地址固定为 127.0.0.1:8898。首次使用需启动 web_bridge.py，并输入本机令牌；API Key 只保存在本机。</div>',
      '<label>本机桥接令牌</label><input id="wsai-token" type="password" autocomplete="off" placeholder="从 wechat_summary/config/web_bridge_token.txt 复制令牌">',
      '<div class="wsai-actions"><button id="wsai-check">检测本机工具</button><button id="wsai-load-config">读取 AI 配置</button></div><div id="wsai-status" class="wsai-muted">尚未检测本机工具。</div></div>',
      '<h3>第二步：配置这个 AI 工具使用的模型 API</h3><div class="wsai-grid"><div><label>服务商</label><select id="wsai-provider"></select></div><div><label>配置名称</label><input id="wsai-provider-name" value="DeepSeek"></div></div>',
      '<div class="wsai-grid"><div><label>API Base URL</label><input id="wsai-base" placeholder="https://api.deepseek.com"></div><div><label>模型 ID</label><input id="wsai-model" placeholder="deepseek-chat"></div></div>',
      '<div class="wsai-grid"><div><label>协议</label><select id="wsai-protocol"><option value="chat">OpenAI Chat Completions 兼容</option><option value="anthropic">Anthropic Messages</option></select></div><div><label>API Key（仅保存在本机）</label><input id="wsai-key" type="password" autocomplete="new-password" placeholder="留空则保留已保存的 Key"></div></div>',
      '<label>本机工具提示词</label><textarea id="wsai-prompt" placeholder="按群聊内容生成摘要、分类、待办、来源与下一步"></textarea>',
      '<div class="wsai-actions"><button id="wsai-save-config" class="primary">保存本机模型配置</button><button id="wsai-test-model">测试 API</button></div>',
      '<h3>第三步：取得真实微信消息或导入原始数据</h3><div class="wsai-grid"><div><label>群聊名称</label><input id="wsai-group" placeholder="输入准确的微信群名称"></div><div><label>时间范围（小时）</label><input id="wsai-hours" type="number" min="0.1" max="720" value="24"></div></div>',
      '<div class="wsai-actions"><button id="wsai-read-live">从本机微信读取消息</button><label style="margin:0;flex:1"><input id="wsai-file" type="file" accept=".txt,.md,.json,.csv,.html,.xml,.log" style="padding:7px">导入微信原始数据文件</label></div>',
      '<label>原始消息（可检查、可编辑；不会自动发送到群里）</label><textarea id="wsai-raw" placeholder="读取器取得的真实消息或你主动导入的原始数据会显示在这里。也可以粘贴已导出的聊天记录。"></textarea>',
      '<label>关联的上岸鸭任务 / 当前卡点（可选）</label><textarea id="wsai-task" placeholder="例如：我正在整理 AI 学习资料，卡在如何把群消息变成可执行任务。"></textarea>',
      '<div class="wsai-actions"><button id="wsai-analyze" class="primary">调用本机 AI 分析原始数据</button><button id="wsai-read-links">只读取消息中的链接</button></div>',
      '<div id="wsai-links" class="wsai-box wsai-muted">链接读取结果会逐条列出；登录墙、私有飞书或受限页面会明确显示失败。</div>',
      '<h3>AI 分析结果</h3><div id="wsai-answer">还没有运行分析。</div>',
      '<div class="wsai-actions"><button id="wsai-map">生成 / 下载思维导图 SVG</button><button id="wsai-video">生成讲解视频</button><button id="wsai-site-ai">交给上岸鸭网页 AI 继续拆任务</button><button id="wsai-save">保存到本机</button></div>',
      '<video id="wsai-video-player" controls playsinline></video><a id="wsai-video-download" class="wsai-hidden" download="微信原始数据-AI讲解.webm">下载讲解视频</a>',
      '<div class="wsai-muted" style="margin-top:10px">隐私与真实性：网页无法凭空读取个人微信。实时读取需要本机读取器兼容当前微信版本；未读取到消息时请使用原始数据导入。任何链接只会标注实际读取结果；不会自动发送微信消息或覆盖上岸鸭任务。</div>'
    ].join('');
    document.body.append(launch, panel);
    $('wsai-close').onclick = function () { panel.style.display = 'none'; };
    $('wsai-token').value = sessionStorage.getItem(TOKEN_KEY) || '';
    $('wsai-token').addEventListener('change', function () { sessionStorage.setItem(TOKEN_KEY, token()); });
    $('wsai-provider').addEventListener('change', selectProvider);
    $('wsai-check').onclick = checkLocal;
    $('wsai-load-config').onclick = loadConfig;
    $('wsai-save-config').onclick = saveConfig;
    $('wsai-test-model').onclick = testModel;
    $('wsai-read-live').onclick = readLive;
    $('wsai-file').addEventListener('change', importFile);
    $('wsai-analyze').onclick = analyze;
    $('wsai-read-links').onclick = readLinksOnly;
    $('wsai-map').onclick = makeMap;
    $('wsai-video').onclick = makeVideo;
    $('wsai-site-ai').onclick = askSiteAI;
    $('wsai-save').onclick = saveLocal;
    loadProviders();
  }
  async function loadProviders() {
    try {
      var d = await localApi('/api/providers', 'GET', null, false);
      providers = d.providers || [];
      if (!providers.length) throw new Error('本机工具没有返回服务商配置');
      var select = $('wsai-provider'); select.replaceChildren();
      providers.forEach(function (p) { select.appendChild(node('option', { value: p.name }, p.name + (p.hasKey ? ' · 已配置 Key' : ' · 待配置'))); });
      selectProvider();
      setStatus('已找到本机工具的服务商列表。下一步检测本机桥接和读取配置。', false);
    } catch (e) {
      setStatus('未连接本机工具：' + e.message + '。请先在电脑上启动 web_bridge.py。', true);
    }
  }
  function selectProvider() {
    var p = providers.find(function (x) { return x.name === $('wsai-provider').value; });
    if (!p) return;
    $('wsai-provider-name').value = p.name;
    $('wsai-base').value = p.base_url || '';
    $('wsai-model').value = p.model || '';
    $('wsai-protocol').value = p.protocol || 'chat';
    $('wsai-key').value = '';
  }
  async function checkLocal() {
    try {
      var h = await localApi('/api/health', 'GET', null, false);
      if (h.tokenRequired && !token()) { setStatus('本机桥接在线，但需要令牌。请从 config/web_bridge_token.txt 复制令牌。', true); return; }
      var c = await localApi('/api/config', 'GET');
      setStatus('本机工具在线：' + h.name + '。wxauto 已安装：' + (h.wxautoInstalled ? '是' : '否') + '。API 配置已读取。' + (!h.wxautoInstalled ? ' 实时读取暂不可用，可先导入原始数据文件并调用 AI。' : ''), !h.wxautoInstalled);
      fillConfig(c);
    } catch (e) { setStatus('本机工具连接失败：' + e.message + '。若浏览器询问本地网络访问权限，请允许本网页访问本机服务。', true); }
  }
  function fillConfig(c) {
    $('wsai-prompt').value = c.prompt || '';
    var svc = c.services || {}, name = c.last_service || 'DeepSeek';
    var p = svc[name];
    if (!p) { name = Object.keys(svc)[0]; p = svc[name]; }
    if (!p) return;
    if (!$('wsai-provider').querySelector('option[value="' + CSS.escape(name) + '"]')) {
      $('wsai-provider').appendChild(node('option', { value: name }, name + (p.hasKey ? ' · 已配置 Key' : ' · 待配置')));
    }
    $('wsai-provider').value = name;
    $('wsai-provider-name').value = name;
    $('wsai-base').value = p.base_url || '';
    $('wsai-model').value = p.model || '';
    $('wsai-protocol').value = p.protocol || 'chat';
    $('wsai-key').value = '';
  }
  async function loadConfig() {
    try { var c = await localApi('/api/config', 'GET'); fillConfig(c); setStatus('已读取本机原始数据 AI 的配置（API Key 不会回传网页）。', false); }
    catch (e) { setStatus('读取配置失败：' + e.message, true); }
  }
  async function saveConfig() {
    try {
      var name = $('wsai-provider-name').value.trim();
      if (!name) throw new Error('请填写配置名称');
      var d = await localApi('/api/config', 'POST', {
        service_name: name, base_url: $('wsai-base').value.trim(), model: $('wsai-model').value.trim(),
        protocol: $('wsai-protocol').value, api_key: $('wsai-key').value, prompt: $('wsai-prompt').value
      });
      $('wsai-key').value = '';
      providers = (await localApi('/api/providers', 'GET', null, false)).providers || providers;
      var sel = $('wsai-provider');
      if (!Array.from(sel.options).some(function (o) { return o.value === name; })) sel.appendChild(node('option', { value: name }, name + ' · 已保存'));
      sel.value = name; sessionStorage.setItem(TOKEN_KEY, token());
      setStatus('已保存 ' + name + ' 配置到本机；API Key 不会上传到上岸鸭服务器。', false);
    } catch (e) { setStatus('保存配置失败：' + e.message, true); }
  }
  async function testModel() {
    try {
      if ($('wsai-key').value.trim() || !$('wsai-provider').value) await saveConfig();
      var d = await localApi('/api/test', 'POST', { service_name: $('wsai-provider-name').value.trim() });
      setStatus('API 连接成功：' + d.provider + ' / ' + d.model + '；返回：' + d.reply, false);
    } catch (e) { setStatus('API 测试失败：' + e.message, true); }
  }
  async function readLive() {
    try {
      var group = $('wsai-group').value.trim();
      if (!group) throw new Error('请先输入准确的微信群名称。');
      setStatus('正在通过本机读取器读取真实消息……', false);
      var d = await localApi('/api/wechat/read', 'POST', { group: group, limit: 300 });
      lastGroup = group;
      lastRaw = (d.messages || []).map(function (m) { return (m.sender ? m.sender + '：' : '') + m.content; }).join('\n');
      $('wsai-raw').value = lastRaw;
      setStatus('已从读取器取得 ' + d.count + ' 条消息。尚未发送或修改任何微信内容。', false);
    } catch (e) { setStatus('实时读取失败：' + e.message + '。可导入已导出的原始聊天记录，继续使用本机 AI。', true); }
  }
  async function importFile() {
    var f = $('wsai-file').files && $('wsai-file').files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { setStatus('文件超过 8 MB，请先拆分文件再导入。', true); return; }
    try {
      var text = await f.text();
      if (/\.json$/i.test(f.name)) { try { text = JSON.stringify(JSON.parse(text), null, 2); } catch (_) {} }
      lastRaw = text.slice(0, 160000); $('wsai-raw').value = lastRaw;
      lastGroup = $('wsai-group').value.trim() || f.name.replace(/\.[^.]+$/, '');
      setStatus('已导入 ' + f.name + '（' + lastRaw.length + ' 字符）。点击 AI 分析会调用你配置的本机模型。', false);
    } catch (e) { setStatus('导入失败：' + e.message, true); }
  }
  function extractUrls(text) {
    var m = String(text || '').match(/https?:\/\/[^\s<>"'，。；;）)】\]]+/g) || [];
    var seen = {};
    return m.map(function (u) { return u.replace(/[.,!?]+$/, ''); }).filter(function (u) { if (seen[u]) return false; seen[u] = true; return true; }).slice(0, 20);
  }
  async function readOneLink(url) {
    var route = /feishu\.cn|larksuite\.com/i.test(url) ? '/api/feishu' :
      /bilibili\.com|b23\.tv|douyin\.com|iesdouyin\.com|xiaohongshu\.com|youtube\.com|youtu\.be/i.test(url) ? '/api/video' : '/api/extract';
    try {
      var d = await siteApi(route, { url: url });
      return { url: url, status: '读取成功', title: d.title || url, text: String(d.text || d.description || d.note || '').slice(0, 5000), source: d.source || route, thin: !!d.thin, note: d.note || '' };
    } catch (e) { return { url: url, status: '读取失败', title: url, text: '', source: route, note: e.message }; }
  }
  function showLinks(items) {
    lastLinks = items || [];
    var box = $('wsai-links'); box.replaceChildren();
    if (!items.length) { box.textContent = '没有发现可识别的链接。'; return; }
    items.forEach(function (it) {
      var row = node('div', { className: 'wsai-box' });
      var title = node('b', {}, (it.status === '读取成功' ? '✓ ' : '× ') + it.status + '：' + (it.title || it.url));
      var a = node('a', { href: it.url, target: '_blank', rel: 'noopener noreferrer' }, it.url);
      var detail = node('div', { className: 'wsai-muted' }, it.text ? it.text.slice(0, 650) : (it.note || '未取得正文'));
      row.append(title, node('div'), a, detail); box.appendChild(row);
    });
  }
  async function readLinksOnly() {
    var raw = $('wsai-raw').value.trim();
    if (!raw) { setStatus('请先读取或导入微信原始数据。', true); return; }
    var urls = extractUrls(raw);
    if (!urls.length) { showLinks([]); setStatus('原始消息中没有发现 HTTP/HTTPS 链接。', false); return; }
    setStatus('正在逐条读取 ' + urls.length + ' 个链接；受登录权限或平台限制的链接会显示失败。', false);
    var results = [];
    for (var i = 0; i < urls.length; i++) { results.push(await readOneLink(urls[i])); showLinks(results); }
    setStatus('链接读取结束：成功 ' + results.filter(function (x) { return x.status === '读取成功' && !x.thin; }).length + ' / ' + results.length + '；登录墙和私有链接需授权。', false);
  }
  async function analyze() {
    var raw = $('wsai-raw').value.trim();
    if (!raw) { setStatus('请先读取或导入微信原始数据。', true); return; }
    lastRaw = raw.slice(0, 160000);
    var urls = extractUrls(raw), links = [];
    setStatus('先读取消息中的链接，再调用你配置的原始数据 AI……', false);
    for (var i = 0; i < urls.length; i++) { links.push(await readOneLink(urls[i])); showLinks(links); }
    try {
      var d = await localApi('/api/analyze', 'POST', {
        service_name: $('wsai-provider-name').value.trim() || $('wsai-provider').value,
        messages: lastRaw, current_task: $('wsai-task').value.trim(),
        prompt: $('wsai-prompt').value.trim(), links: links
      });
      lastAnswer = d.answer || '';
      $('wsai-answer').textContent = lastAnswer || '模型没有返回正文。';
      setStatus('分析完成：模型 ' + d.provider + ' / ' + d.model + '；原始数据 ' + d.rawChars + ' 字符；链接 ' + (d.linkCount || 0) + ' 个。', false);
    } catch (e) { setStatus('AI 分析失败：' + e.message + '。检查本机 API 配置与测试结果。', true); }
  }
  async function askSiteAI() {
    if (!lastAnswer) { setStatus('请先完成一次本机 AI 分析。', true); return; }
    try {
      setStatus('正在调用上岸鸭网页已配置的模型，继续关联任务……', false);
      var d = await siteApi('/api/ask-ai', {
        question: '请将微信原始数据 AI 工具的分析转化为上岸鸭可执行任务建议。先列出已有证据、再列候选任务、验收标准、明确截止日期（不明确则待确认）、来源链接和一个可马上做的下一步。不要自动写入或覆盖原任务。',
        context: '用户当前任务/卡点：\n' + ($('wsai-task').value || '未填写') + '\n\n微信原始数据 AI 分析结果：\n' + lastAnswer + '\n\n本轮原始消息（节选）：\n' + lastRaw.slice(0, 9000) + '\n\n链接读取结果：\n' + lastLinks.map(function (x) { return x.status + ' ' + x.url + ' ' + x.title + '\n' + (x.text || x.note); }).join('\n\n').slice(0, 8000)
      });
      var reply = d.reply || '网页 AI 没有返回正文。';
      $('wsai-answer').textContent = '【微信原始数据 AI】\n' + lastAnswer + '\n\n【上岸鸭网页 AI 任务建议】\n' + reply;
      lastAnswer = $('wsai-answer').textContent;
      setStatus('已完成两段 AI 流程：本机原始数据 AI → 上岸鸭网页 AI。结果尚未写入原任务，请核对后保存。', false);
    } catch (e) { setStatus('上岸鸭网页 AI 调用失败：' + e.message + '。请先在网页的 AI 连接设置中配置模型。', true); }
  }
  async function saveLocal() {
    if (!lastAnswer) { setStatus('没有可保存的 AI 分析结果。', true); return; }
    try {
      var d = await localApi('/api/save', 'POST', { group: lastGroup || $('wsai-group').value || 'wechat', content: lastAnswer });
      setStatus('已保存到本机：' + d.path, false);
    } catch (e) { setStatus('本机保存失败：' + e.message, true); }
  }
  function answerSections(text) {
    var lines = String(text || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    var sections = [], cur = { title: 'AI 分析结果', items: [] };
    lines.forEach(function (line) {
      var h = line.match(/^(?:#{1,4}\s+|[一二三四五六七八九十\d]+[、.)．]\s*)(.{2,70})$/);
      if (h) { if (cur.items.length) sections.push(cur); cur = { title: h[1].replace(/[*#]/g, ''), items: [] }; }
      else cur.items.push(line.replace(/^[-*•]\s+/, ''));
    });
    if (cur.items.length) sections.push(cur);
    return sections.slice(0, 12);
  }
  function makeMap() {
    if (!lastAnswer) { setStatus('请先完成 AI 分析。', true); return; }
    var sections = answerSections(lastAnswer), esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var y = 30, body = '';
    sections.forEach(function (s) {
      body += '<rect x="250" y="' + y + '" width="260" height="32" rx="8" fill="#dff1e5" stroke="#b8d9c4"/><text x="260" y="' + (y + 21) + '" font-size="14" font-weight="700" fill="#176b4d">' + esc(s.title.slice(0, 36)) + '</text>';
      s.items.slice(0, 5).forEach(function (item, i) {
        var yy = y + 39 + i * 31;
        body += '<path d="M510 ' + (y + 16) + ' H530 V' + (yy + 12) + ' H545" stroke="#9bc9ad" fill="none"/><rect x="545" y="' + yy + '" width="540" height="25" rx="6" fill="white" stroke="#dce8e0"/><text x="555" y="' + (yy + 17) + '" font-size="12" fill="#18342b">' + esc(item.slice(0, 76)) + '</text>';
      });
      y += 52 + Math.min(s.items.length, 5) * 31;
    });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="' + Math.max(220, y) + '"><rect width="100%" height="100%" fill="#f6faf7"/><rect x="20" y="20" width="200" height="42" rx="10" fill="#176b4d"/><text x="120" y="46" text-anchor="middle" font-size="16" fill="white">微信原始数据 AI</text>' + body + '</svg>';
    var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    var a = node('a', { href: url, download: '微信原始数据-AI思维导图.svg' }); document.body.appendChild(a); a.click(); a.remove();
    setStatus('思维导图已生成并下载。', false);
  }
  async function makeVideo() {
    if (!lastAnswer) { setStatus('请先完成 AI 分析。', true); return; }
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { setStatus('当前浏览器不支持录制，请使用新版 Chrome / Edge。', true); return; }
    var sections = answerSections(lastAnswer), scenes = [{ title: '微信原始数据 AI 分析', body: lastAnswer.slice(0, 240) }].concat(sections.slice(0, 7).map(function (s) { return { title: s.title, body: s.items.slice(0, 4).join('；').slice(0, 220) }; }));
    var c = document.createElement('canvas'); c.width = 1280; c.height = 720;
    var ctx = c.getContext('2d'), stream = c.captureStream(24);
    var mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(function (x) { return MediaRecorder.isTypeSupported(x); }) || '';
    var rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 1800000 } : {}), chunks = [];
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    var done = new Promise(function (resolve) { rec.onstop = resolve; }); rec.start(200);
    function draw(s, i, progress) {
      var g = ctx.createLinearGradient(0, 0, 1280, 720); g.addColorStop(0, '#0b2119'); g.addColorStop(1, '#1a6a4a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = '#8de1b3'; ctx.fillRect(70, 70, 8, 65); ctx.fillStyle = '#b8d9c8'; ctx.font = '600 22px sans-serif'; ctx.fillText('SHANGANYA / WECHAT RAW DATA AI', 96, 92);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 42px sans-serif'; ctx.fillText(s.title.slice(0, 34), 96, 170);
      ctx.fillStyle = '#e5f2eb'; ctx.font = '28px Microsoft YaHei, sans-serif'; var line = '', yy = 255;
      Array.from(s.body).forEach(function (ch) { if (ctx.measureText(line + ch).width > 1050 && line) { ctx.fillText(line, 100, yy); yy += 44; line = ch; } else line += ch; });
      if (line && yy < 590) ctx.fillText(line, 100, yy);
      ctx.fillStyle = '#ffffff2a'; ctx.fillRect(96, 630, 1088, 5); ctx.fillStyle = '#8de1b3'; ctx.fillRect(96, 630, 1088 * progress, 5);
      ctx.fillStyle = '#c6e0d2'; ctx.font = '18px sans-serif'; ctx.fillText('第 ' + (i + 1) + ' / ' + scenes.length + ' 页 · 依据本轮读取内容', 96, 670);
    }
    try {
      setStatus('正在录制无声字幕视频……', false);
      for (var i = 0; i < scenes.length; i++) {
        await new Promise(function (resolve) { var start = performance.now(); function frame(now) { var p = Math.min(1, (now - start) / 1200); draw(scenes[i], i, p); if (p < 1) requestAnimationFrame(frame); else resolve(); } requestAnimationFrame(frame); });
      }
      rec.stop(); await done; stream.getTracks().forEach(function (t) { t.stop(); });
      var blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' });
      if (!blob.size) throw new Error('生成的视频为空');
      var url = URL.createObjectURL(blob), v = $('wsai-video-player'), a = $('wsai-video-download');
      v.src = url; v.style.display = 'block'; a.href = url; a.classList.remove('wsai-hidden');
      setStatus('讲解视频已生成，可预览和下载（WebM，无声字幕版）。', false);
    } catch (e) { setStatus('视频生成失败：' + e.message, true); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();