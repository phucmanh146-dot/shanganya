/* 上岸鸭「总结 / 复盘」安全增量模块
 * 不调用外部 API，不读取/保存 API Key，不连接 Obsidian，不使用麦克风/语音。
 * 接入方式：在原页面 </body> 前加入 <script src="./review-feature.js"></script>
 * 本版本在浏览器本地处理用户粘贴的文本；不伪装成大模型生成。
 */
(() => {
  if (window.__shanganyaReviewFeatureLoaded) return;
  window.__shanganyaReviewFeatureLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    #sy-review-launch{position:fixed;right:22px;bottom:24px;z-index:2147483000;border:0;border-radius:999px;padding:12px 18px;background:#d9467b;color:#fff;font:600 14px/1.2 system-ui,sans-serif;box-shadow:0 8px 26px #7d234333;cursor:pointer}
    #sy-review-launch:hover{filter:brightness(1.06);transform:translateY(-1px)}
    #sy-review-backdrop{position:fixed;inset:0;z-index:2147483001;background:#1d183455;display:none;align-items:center;justify-content:center;padding:16px}
    #sy-review-panel{box-sizing:border-box;width:min(760px,100%);max-height:min(90vh,900px);overflow:auto;background:#fff;border-radius:20px;padding:22px;color:#29232a;font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif;box-shadow:0 24px 90px #23132b40}
    #sy-review-panel *{box-sizing:border-box}
    .sy-r-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
    .sy-r-title{font-size:22px;font-weight:800;letter-spacing:.2px}
    .sy-r-close{border:0;background:#f5edf1;border-radius:10px;width:36px;height:36px;font-size:22px;cursor:pointer}
    .sy-r-note{color:#776b74;margin:0 0 14px}
    .sy-r-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
    .sy-r-tab{border:1px solid #f0cfdd;background:#fff6fa;color:#9c2859;border-radius:999px;padding:7px 13px;cursor:pointer}
    .sy-r-tab[aria-pressed="true"]{background:#d9467b;color:white;border-color:#d9467b}
    #sy-review-input{display:block;width:100%;min-height:190px;resize:vertical;border:1px solid #e8dce2;border-radius:12px;padding:12px;font:14px/1.7 inherit;outline-color:#d9467b}
    .sy-r-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
    .sy-r-primary,.sy-r-secondary{border:0;border-radius:10px;padding:10px 15px;cursor:pointer;font-weight:700}
    .sy-r-primary{background:#d9467b;color:white}.sy-r-secondary{background:#f6eef2;color:#563747}
    #sy-review-output{white-space:pre-wrap;border:1px solid #eee2e8;border-radius:12px;background:#fffafd;padding:14px;min-height:80px;overflow-wrap:anywhere}
    .sy-r-foot{font-size:12px;color:#887c84;margin-top:10px}
    @media(max-width:520px){#sy-review-launch{right:12px;bottom:14px}#sy-review-panel{padding:16px;border-radius:16px}.sy-r-title{font-size:19px}}
  `;
  document.head.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.id = 'sy-review-backdrop';
  backdrop.innerHTML = `
    <section id="sy-review-panel" role="dialog" aria-modal="true" aria-labelledby="sy-review-title">
      <div class="sy-r-head"><div class="sy-r-title" id="sy-review-title">总结 · 复盘</div><button class="sy-r-close" type="button" aria-label="关闭">×</button></div>
      <p class="sy-r-note">直接粘贴今天的学习记录、任务内容、会议纪要或聊天片段。无需先连接 Obsidian、填写 API Key 或开启语音。</p>
      <div class="sy-r-tabs" role="group" aria-label="复盘类型">
        <button class="sy-r-tab" type="button" data-mode="review" aria-pressed="true">任务复盘</button>
        <button class="sy-r-tab" type="button" data-mode="study" aria-pressed="false">学习总结</button>
        <button class="sy-r-tab" type="button" data-mode="meeting" aria-pressed="false">内容整理</button>
      </div>
      <textarea id="sy-review-input" placeholder="把需要总结或复盘的内容放在这里……"></textarea>
      <div class="sy-r-actions">
        <button class="sy-r-primary" id="sy-review-generate" type="button">生成结构化复盘</button>
        <button class="sy-r-secondary" id="sy-review-selection" type="button">填入当前选中文字</button>
        <button class="sy-r-secondary" id="sy-review-copy" type="button">复制结果</button>
      </div>
      <div id="sy-review-output" aria-live="polite">生成后会在这里显示：核心内容、收获/结论、问题与风险、下一步行动。</div>
      <div class="sy-r-foot">隐私说明：本模块只在当前页面本地处理你输入的文本，不上传内容、不保存历史；这是本地规则整理，不会冒充 AI 深度理解。</div>
    </section>`;
  document.body.appendChild(backdrop);

  const launch = document.createElement('button');
  launch.id = 'sy-review-launch';
  launch.type = 'button';
  launch.textContent = '总结 / 复盘';
  launch.setAttribute('aria-haspopup', 'dialog');
  document.body.appendChild(launch);

  const input = backdrop.querySelector('#sy-review-input');
  const output = backdrop.querySelector('#sy-review-output');
  let mode = 'review';

  function openPanel() {
    const selected = String(window.getSelection?.() || '').trim();
    if (selected && !input.value.trim()) input.value = selected;
    backdrop.style.display = 'flex';
    input.focus();
  }
  function closePanel() { backdrop.style.display = 'none'; }
  launch.addEventListener('click', openPanel);
  backdrop.querySelector('.sy-r-close').addEventListener('click', closePanel);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closePanel(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && backdrop.style.display === 'flex') closePanel(); });

  backdrop.querySelectorAll('.sy-r-tab').forEach(btn => btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    backdrop.querySelectorAll('.sy-r-tab').forEach(tab => tab.setAttribute('aria-pressed', String(tab === btn)));
  }));
  backdrop.querySelector('#sy-review-selection').addEventListener('click', () => {
    const selected = String(window.getSelection?.() || '').trim();
    if (!selected) { output.textContent = '当前没有选中文字。请先在页面中选中内容，或直接粘贴到输入框。'; return; }
    input.value = selected;
    input.focus();
  });

  function cleanLines(text) {
    return text.split(/\n+/).map(s => s.replace(/^\s*(?:[-*•]|\d+[.、)]|[一二三四五六七八九十]+[、.])\s*/, '').trim()).filter(Boolean);
  }
  function unique(items, limit=5) {
    const seen = new Set();
    return items.filter(x => { const k=x.replace(/\s/g,'').slice(0,70); if (!k || seen.has(k)) return false; seen.add(k); return true; }).slice(0,limit);
  }
  function generate() {
    const raw = input.value.trim();
    if (!raw) { output.textContent = '请先输入或粘贴需要总结的内容。'; return; }
    const lines = cleanLines(raw);
    const sentences = raw.replace(/([。！？!?；;])\s*/g, '$1\n').split(/\n+/).map(x=>x.trim()).filter(x=>x.length>5);
    const source = lines.length > 1 ? lines : sentences;
    const actions = unique(source.filter(x => /下一步|待办|需要|应该|计划|准备|完成|跟进|尝试|优化|检查|验证|提交|联系|安排|截止|明天|今天|行动|改进|目标|负责|时间/.test(x)), 5);
    const issues = unique(source.filter(x => /问题|困难|失败|风险|不足|原因|错误|卡住|不会|不懂|缺少|阻塞|延迟|待确认|未完成|没有|但是|然而|bug|报错/i.test(x)), 5);
    const learnings = unique(source.filter(x => /学到|理解|发现|结论|意味着|原因是|关键|重点|收获|掌握|区别|因此|结果|有效|无效|验证/.test(x)), 5);
    const core = unique(source.filter(x => x.length >= 8), 6);
    const heading = mode === 'study' ? '学习总结' : mode === 'meeting' ? '内容整理' : '任务复盘';
    const linesOut = [
      '【' + heading + '】',
      '',
      '一、核心内容',
      ...(core.length ? core.map((x,i)=>(i+1)+'. '+x) : ['• '+raw.slice(0,450)+(raw.length>450?'…':'')]),
      '',
      mode === 'study' ? '二、学到 / 需要巩固' : '二、收获 / 结论',
      ...(learnings.length ? learnings.map(x=>'• '+x) : ['• 原文没有明确标出结论；建议补充“我学到了什么 / 证据是什么”。']),
      '',
      '三、问题 / 风险',
      ...(issues.length ? issues.map(x=>'• '+x) : ['• 原文没有识别到明确问题；请检查是否有未完成事项、前置依赖或验证不足。']),
      '',
      '四、下一步行动',
      ...(actions.length ? actions.map((x,i)=>(i+1)+'. '+x) : ['1. 把最重要的下一步写成“动作 + 交付物 + 截止时间”。','2. 为关键结果补一个可验证的检查标准。']),
      '',
      '五、复盘提醒',
      '• 区分已完成、进行中、待验证，不要把计划写成已完成。',
      '• 重要结论尽量附证据；有不确定信息时标注“待确认”。'
    ];
    output.textContent = linesOut.join('\n');
  }
  backdrop.querySelector('#sy-review-generate').addEventListener('click', generate);
  backdrop.querySelector('#sy-review-copy').addEventListener('click', async () => {
    const text = output.textContent || '';
    try {
      await navigator.clipboard.writeText(text);
      backdrop.querySelector('#sy-review-copy').textContent = '已复制';
      setTimeout(() => backdrop.querySelector('#sy-review-copy').textContent = '复制结果', 1500);
    } catch (_) {
      const range = document.createRange(); range.selectNodeContents(output);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      output.focus?.();
    }
  });
})();
