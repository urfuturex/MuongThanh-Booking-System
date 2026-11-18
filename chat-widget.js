/* =====================================================
   chat-widget.js — AI Chatbot + Live Staff Chat
   Mường Thanh Luxury Hotel
   ===================================================== */

// ===== CONFIG =====
const N8N_WEBHOOK_URL = (typeof window !== 'undefined' && window.MT_CHAT_WEBHOOK)
  || 'https://muongthanh.app.n8n.cloud/webhook/353ff482-1a53-44fc-ab59-651c36fe5660/chat';

const LIVE_CHAT_API = (function () {
  const scripts = document.querySelectorAll('script[src*="chat-widget"]');
  if (scripts.length) {
    const src = scripts[scripts.length - 1].src;
    return src.substring(0, src.lastIndexOf('/') + 1) + 'api/live_chat.php';
  }
  return '/booking.mt/api/live_chat.php';
})();

// ===== STATE =====
let chatOpen       = false;
let sessionId      = 'sess_' + Math.random().toString(36).slice(2);
let isTyping       = false;
let messageHistory = [];
let chatMode       = null;   // null | 'ai' | 'staff'
let liveChatId     = null;
let liveChatStatus = null;
let liveChatLastId = 0;
let pollTimer      = null;
let liveStaffName  = '';

// ===== i18n HELPER (global — used inside & outside IIFE) =====
function wt(key) {
  if (typeof t === 'function') return t(key);
  // Fallback Vietnamese when i18n.js is not loaded on this page
  const fb = {
    'chat.title':'Trợ Lý Mường Thanh','chat.online':'Trực tuyến','chat.offline':'Ngoại tuyến',
    'chat.mode_title':'Bạn muốn nhận hỗ trợ theo hình thức nào?',
    'chat.mode_ai':'Chat với AI','chat.mode_ai_sub':'Phản hồi tự động 24/7 — nhanh chóng',
    'chat.mode_staff':'Chat với nhân viên','chat.mode_staff_sub':'Hỗ trợ trực tiếp từ lễ tân Mường Thanh',
    'chat.input_ph':'Nhập tin nhắn...','chat.send':'Gửi',
    'chat.back':'← Quay lại','chat.close':'✕',
    'chat.ai_header':'AI Mường Thanh','chat.ai_sub_header':'Trợ lý AI 24/7',
    'chat.staff_header':'Lễ Tân','chat.staff_sub_header':'Đang kết nối...',
    'chat.connecting':'Đang kết nối với nhân viên hỗ trợ...',
    'chat.queued':'Đã vào hàng đợi. Nhân viên sẽ tiếp nhận trong giây lát...',
    'chat.err_connect':'Không thể kết nối. Vui lòng thử lại sau.',
    'chat.closed_notice':'Cuộc trò chuyện đã kết thúc.',
    'chat.welcome_ai':'Xin chào! Tôi là Trợ lý AI của Mường Thanh. Tôi có thể giúp gì cho bạn hôm nay?',
  };
  return fb[key] !== undefined ? fb[key] : key;
}

// ===== BUILD UI =====
(function buildWidget() {
  const style = document.createElement('style');
  style.textContent = `
    #mt-chat-btn {
      position:fixed;bottom:28px;right:28px;z-index:9999;
      width:56px;height:56px;border-radius:50%;
      background:linear-gradient(135deg,#c9a96e,#a8823e);
      border:none;cursor:pointer;box-shadow:0 4px 20px rgba(201,169,110,.4);
      display:flex;align-items:center;justify-content:center;
      transition:transform .3s,box-shadow .3s;font-size:1.5rem;
    }
    #mt-chat-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(201,169,110,.55);}
    #mt-chat-btn .badge{
      position:absolute;top:-4px;right:-4px;width:18px;height:18px;
      border-radius:50%;background:#e05555;color:#fff;font-size:.6rem;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;display:none;
    }
    #mt-chat-box{
      position:fixed;bottom:96px;right:28px;z-index:9998;
      width:360px;max-height:560px;
      background:#111;border:1px solid rgba(201,169,110,.2);
      border-radius:16px;display:flex;flex-direction:column;
      box-shadow:0 12px 48px rgba(0,0,0,.6);
      transform:translateY(20px) scale(.96);opacity:0;
      pointer-events:none;transition:all .28s cubic-bezier(.34,1.56,.64,1);
      font-family:'Inter',sans-serif;overflow:hidden;
    }
    #mt-chat-box.open{transform:translateY(0) scale(1);opacity:1;pointer-events:all;}

    /* Header */
    #mt-chat-header{
      padding:.9rem 1.1rem;border-bottom:1px solid rgba(201,169,110,.15);
      display:flex;align-items:center;gap:.75rem;flex-shrink:0;
    }
    .chat-avatar{
      width:34px;height:34px;border-radius:50%;
      background:rgba(201,169,110,.15);border:1px solid rgba(201,169,110,.35);
      display:flex;align-items:center;justify-content:center;
      font-size:.95rem;flex-shrink:0;
    }
    .chat-header-info{flex:1;min-width:0;}
    .chat-header-name{font-size:.8rem;font-weight:600;color:#f5f0ea;}
    .chat-header-status{
      font-size:.63rem;color:#6fcf97;
      display:flex;align-items:center;gap:.3rem;margin-top:.1rem;
    }
    .chat-header-status::before{
      content:'';width:6px;height:6px;border-radius:50%;
      background:#6fcf97;display:inline-block;flex-shrink:0;
    }
    .chat-header-status.waiting{color:#f0c040;}
    .chat-header-status.waiting::before{background:#f0c040;}
    .chat-header-status.offline{color:rgba(245,240,234,.4);}
    .chat-header-status.offline::before{background:rgba(245,240,234,.3);}
    #mt-chat-back{
      background:none;border:none;cursor:pointer;padding:.2rem .5rem;
      color:rgba(201,169,110,.7);font-size:.75rem;display:none;
      transition:color .2s;border:1px solid rgba(201,169,110,.2);border-radius:4px;
    }
    #mt-chat-back:hover{color:#c9a96e;border-color:rgba(201,169,110,.5);}
    #mt-chat-close{
      background:none;border:none;cursor:pointer;flex-shrink:0;
      color:rgba(245,240,234,.4);font-size:1rem;padding:.2rem;transition:color .2s;
    }
    #mt-chat-close:hover{color:#f5f0ea;}

    /* Mode Selector */
    #mt-mode-select{
      flex:1;display:flex;flex-direction:column;
      align-items:stretch;padding:1.2rem 1rem;gap:.75rem;
    }
    .mode-intro{
      font-size:.75rem;color:rgba(245,240,234,.55);
      text-align:center;line-height:1.6;margin-bottom:.25rem;
    }
    .mode-btn{
      padding:.85rem 1rem;
      background:rgba(255,255,255,.04);
      border:1px solid rgba(201,169,110,.2);border-radius:10px;
      color:#f5f0ea;cursor:pointer;
      display:flex;align-items:center;gap:.85rem;
      transition:all .2s;font-family:inherit;text-align:left;
    }
    .mode-btn:hover{
      background:rgba(201,169,110,.1);
      border-color:rgba(201,169,110,.5);
      transform:translateY(-1px);
    }
    .mode-btn-icon{font-size:1.5rem;flex-shrink:0;}
    .mode-btn-title{font-size:.82rem;font-weight:600;display:block;color:#f5f0ea;}
    .mode-btn-sub{font-size:.67rem;color:rgba(245,240,234,.45);display:block;margin-top:.15rem;}

    /* Messages */
    #mt-chat-messages{
      flex:1;overflow-y:auto;padding:.85rem;
      display:flex;flex-direction:column;gap:.65rem;
      scrollbar-width:thin;scrollbar-color:rgba(201,169,110,.2) transparent;
    }
    #mt-chat-messages::-webkit-scrollbar{width:4px;}
    #mt-chat-messages::-webkit-scrollbar-thumb{background:rgba(201,169,110,.2);border-radius:2px;}
    .chat-msg{
      max-width:85%;padding:.6rem .85rem;
      border-radius:12px;font-size:.79rem;line-height:1.5;
      animation:msgIn .2s ease;
    }
    @keyframes msgIn{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:none;}}
    .chat-msg.bot{
      background:rgba(255,255,255,.06);color:#e8e3db;
      border:1px solid rgba(255,255,255,.07);align-self:flex-start;
      border-bottom-left-radius:4px;
    }
    .chat-msg.bot p{margin:0 0 .35rem;}
    .chat-msg.bot p:last-child{margin-bottom:0;}
    .chat-msg.bot ul{margin:.25rem 0;padding-left:.9rem;list-style:none;}
    .chat-msg.bot li{margin-bottom:.18rem;}
    .chat-msg.bot strong{color:#c9a96e;font-weight:600;}
    .chat-msg.bot em{font-style:italic;color:rgba(245,240,234,.8);}
    .chat-msg.bot code{background:rgba(201,169,110,.12);padding:.1rem .3rem;border-radius:3px;font-size:.74rem;}
    .chat-msg.staff{
      background:rgba(201,169,110,.08);color:#e8e3db;
      border:1px solid rgba(201,169,110,.18);align-self:flex-start;
      border-bottom-left-radius:4px;
    }
    .chat-sender-label{font-size:.6rem;color:#c9a96e;margin-bottom:.2rem;display:block;}
    .chat-msg.user{
      background:rgba(201,169,110,.15);color:#f5f0ea;
      border:1px solid rgba(201,169,110,.22);align-self:flex-end;
      border-bottom-right-radius:4px;
    }
    .chat-status-notice{
      text-align:center;font-size:.67rem;
      color:rgba(245,240,234,.38);font-style:italic;
      align-self:center;padding:.15rem 0;
    }

    /* Typing */
    .chat-typing{
      display:flex;gap:4px;align-items:center;
      padding:.6rem .85rem;background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.07);
      border-radius:12px;border-bottom-left-radius:4px;align-self:flex-start;
    }
    .chat-typing span{
      width:6px;height:6px;border-radius:50%;
      background:rgba(201,169,110,.6);display:inline-block;
      animation:dot 1.2s infinite;
    }
    .chat-typing span:nth-child(2){animation-delay:.2s;}
    .chat-typing span:nth-child(3){animation-delay:.4s;}
    @keyframes dot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}

    /* Input row */
    #mt-chat-input-row{
      padding:.65rem .85rem;border-top:1px solid rgba(201,169,110,.12);
      display:flex;gap:.45rem;flex-shrink:0;
    }
    #mt-chat-input{
      flex:1;background:rgba(255,255,255,.05);
      border:1px solid rgba(201,169,110,.18);border-radius:8px;
      padding:.5rem .7rem;color:#f5f0ea;font-size:.77rem;
      font-family:inherit;outline:none;resize:none;transition:border-color .2s;
    }
    #mt-chat-input:focus{border-color:rgba(201,169,110,.5);}
    #mt-chat-input::placeholder{color:rgba(245,240,234,.25);}
    #mt-chat-input:disabled{opacity:.4;cursor:not-allowed;}
    #mt-chat-send{
      width:34px;height:34px;border-radius:8px;flex-shrink:0;
      background:rgba(201,169,110,.2);border:1px solid rgba(201,169,110,.3);
      color:#c9a96e;cursor:pointer;display:flex;align-items:center;
      justify-content:center;transition:all .2s;font-size:.88rem;
    }
    #mt-chat-send:hover{background:rgba(201,169,110,.35);}
    #mt-chat-send:disabled{opacity:.35;cursor:not-allowed;}

    /* Quick replies */
    .chat-quick-replies{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.35rem;}
    .chat-quick-btn{
      font-size:.67rem;padding:.28rem .6rem;
      border:1px solid rgba(201,169,110,.3);border-radius:20px;
      background:transparent;color:#c9a96e;cursor:pointer;
      transition:all .2s;white-space:nowrap;
    }
    .chat-quick-btn:hover{background:rgba(201,169,110,.12);}

    @media(max-width:480px){
      #mt-chat-box{width:calc(100vw - 20px);right:10px;bottom:76px;}
      #mt-chat-btn{right:14px;bottom:14px;}
    }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <button id="mt-chat-btn" aria-label="${wt('chat.title')}">
      💬<span class="badge" id="chatBadge">1</span>
    </button>

    <div id="mt-chat-box" role="dialog" aria-label="${wt('chat.title')}">

      <div id="mt-chat-header">
        <div class="chat-avatar" id="chatAvatar">🏨</div>
        <div class="chat-header-info">
          <div class="chat-header-name" id="chatHeaderName">${wt('chat.title')}</div>
          <div class="chat-header-status" id="chatHeaderStatus">${wt('chat.online')}</div>
        </div>
        <button id="mt-chat-back" title="${wt('chat.back')}">${wt('chat.back')}</button>
        <button id="mt-chat-close" aria-label="${wt('chat.close')}">${wt('chat.close')}</button>
      </div>

      <!-- SCREEN 1: Mode selector -->
      <div id="mt-mode-select">
        <p class="mode-intro">${wt('chat.mode_title')}</p>
        <button class="mode-btn" id="btnModeAI">
          <span class="mode-btn-icon">🤖</span>
          <span>
            <span class="mode-btn-title">${wt('chat.mode_ai')}</span>
            <span class="mode-btn-sub">${wt('chat.mode_ai_sub')}</span>
          </span>
        </button>
        <button class="mode-btn" id="btnModeStaff">
          <span class="mode-btn-icon">👨‍💼</span>
          <span>
            <span class="mode-btn-title">${wt('chat.mode_staff')}</span>
            <span class="mode-btn-sub">${wt('chat.mode_staff_sub')}</span>
          </span>
        </button>
      </div>

      <!-- SCREEN 2: Chat interface -->
      <div id="mt-chat-messages" style="display:none"></div>
      <div id="mt-chat-input-row" style="display:none">
        <textarea id="mt-chat-input" rows="1" placeholder="${wt('chat.input_ph')}"></textarea>
        <button id="mt-chat-send" aria-label="${wt('chat.send')}">➤</button>
      </div>

    </div>
  `);

  // Events
  document.getElementById('mt-chat-btn').addEventListener('click', toggleChat);
  document.getElementById('mt-chat-close').addEventListener('click', closeChat);
  document.getElementById('mt-chat-back').addEventListener('click', showModeSelect);
  document.getElementById('mt-chat-send').addEventListener('click', sendMessage);
  document.getElementById('mt-chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  document.getElementById('btnModeAI').addEventListener('click', () => selectMode('ai'));
  document.getElementById('btnModeStaff').addEventListener('click', () => selectMode('staff'));

  // Show badge after 1s
  setTimeout(() => {
    const b = document.getElementById('chatBadge');
    if (b) b.style.display = 'flex';
  }, 1000);
})();

// ===== TOGGLE / OPEN / CLOSE =====
function toggleChat() { chatOpen ? closeChat() : openChat(); }

function openChat() {
  chatOpen = true;
  document.getElementById('mt-chat-box').classList.add('open');
  document.getElementById('mt-chat-btn').innerHTML = '✕<span class="badge" id="chatBadge" style="display:none"></span>';
}

function closeChat() {
  chatOpen = false;
  document.getElementById('mt-chat-box').classList.remove('open');
  document.getElementById('mt-chat-btn').innerHTML = '💬<span class="badge" id="chatBadge" style="display:none"></span>';
}

// ===== MODE SELECT =====
function selectMode(mode) {
  chatMode = mode;

  // Hide mode select, show chat UI
  document.getElementById('mt-mode-select').style.display  = 'none';
  document.getElementById('mt-chat-messages').style.display = 'flex';
  document.getElementById('mt-chat-input-row').style.display = 'flex';
  document.getElementById('mt-chat-back').style.display = 'inline-flex';

  if (mode === 'ai') {
    setHeader('🤖', wt('chat.ai_header'), wt('chat.online'), '');
    document.getElementById('mt-chat-input').placeholder = wt('chat.input_ph');
    appendBotMessage(
      wt('chat.welcome_ai'),
      getLang && getLang() === 'en'
        ? ['Hotels in Da Nang', 'Cancellation policy', 'Current promotions', 'Contact support']
        : ['Xem khách sạn tại Đà Nẵng', 'Chính sách hủy phòng', 'Khuyến mãi hiện có', 'Liên hệ hỗ trợ']
    );
  } else {
    setHeader('👨‍💼', wt('chat.staff_header'), wt('chat.staff_sub_header'), 'waiting');
    document.getElementById('mt-chat-input').placeholder = wt('chat.input_ph');
    startLiveChat();
  }

  setTimeout(() => document.getElementById('mt-chat-input').focus(), 200);
}

function showModeSelect() {
  stopPolling();
  chatMode       = null;
  liveChatId     = null;
  liveChatStatus = null;
  liveChatLastId = 0;
  liveStaffName  = '';
  messageHistory = [];

  // Reset UI
  document.getElementById('mt-mode-select').style.display   = 'flex';
  document.getElementById('mt-chat-messages').style.display = 'none';
  document.getElementById('mt-chat-input-row').style.display = 'none';
  document.getElementById('mt-chat-back').style.display     = 'none';
  document.getElementById('mt-chat-messages').innerHTML      = '';
  document.getElementById('mt-chat-input').disabled          = false;
  document.getElementById('mt-chat-send').disabled           = false;
  document.getElementById('mt-chat-input').placeholder = wt('chat.input_ph');
  setHeader('🏨', wt('chat.title'), wt('chat.online'), '');
}

function setHeader(avatar, name, status, statusClass) {
  document.getElementById('chatAvatar').textContent = avatar;
  document.getElementById('chatHeaderName').textContent = name;
  const s = document.getElementById('chatHeaderStatus');
  s.textContent = status;
  s.className   = 'chat-header-status' + (statusClass ? ' ' + statusClass : '');
}

// ===== LIVE CHAT =====
async function getCustomerInfo() {
  // Derive auth API URL from same base as LIVE_CHAT_API
  const base = LIVE_CHAT_API.substring(0, LIVE_CHAT_API.lastIndexOf('/') + 1);
  try {
    const r = await fetch(base + 'auth.php?action=me', { credentials: 'include' });
    const d = await r.json();
    if (d.authenticated && d.customer) {
      const c = d.customer;
      const fullName = [c.last_name, c.first_name].filter(Boolean).join(' ') || c.email || 'Khách';
      return { name: fullName, email: c.email || '' };
    }
  } catch (_) {}
  return { name: 'Khách', email: '' };
}

async function startLiveChat() {
  appendStatusNotice(wt('chat.connecting'));
  try {
    const customerInfo = await getCustomerInfo();
    const res  = await fetch(LIVE_CHAT_API + '?action=start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id:     sessionId,
        customer_name:  customerInfo.name,
        customer_email: customerInfo.email,
      }),
    });
    const data = await res.json();
    if (data.chat_id) {
      liveChatId     = data.chat_id;
      liveChatStatus = data.status;
      if (liveChatStatus === 'waiting') {
        appendStatusNotice(wt('chat.queued'));
      } else if (liveChatStatus === 'active') {
        setHeader('👨‍💼', liveStaffName || wt('chat.staff_header'), wt('chat.online'), '');
      }
      startPolling();
    }
  } catch (_) {
    appendStatusNotice(wt('chat.err_connect'));
  }
}

function startPolling() {
  stopPolling();
  let active = true;
  async function loop() {
    if (!active) return;
    await pollMessages();
    if (active && liveChatStatus !== 'closed') {
      pollTimer = setTimeout(loop, 2500);
    }
  }
  // Store a cancel flag via closure
  pollTimer = { cancel: () => { active = false; } };
  loop();
}

function stopPolling() {
  if (pollTimer) {
    if (typeof pollTimer.cancel === 'function') pollTimer.cancel();
    else clearTimeout(pollTimer);
    pollTimer = null;
  }
}

async function pollMessages() {
  if (!liveChatId) return;
  try {
    const res  = await fetch(
      `${LIVE_CHAT_API}?action=poll&chat_id=${liveChatId}&last_id=${liveChatLastId}`
    );
    const data = await res.json();

    // Status change
    if (data.status !== liveChatStatus) {
      const prev = liveChatStatus;
      liveChatStatus = data.status;

      if (liveChatStatus === 'active') {
        liveStaffName = data.staff_name || wt('chat.staff_header');
        setHeader('👨‍💼', liveStaffName, wt('chat.online'), '');
        appendStatusNotice(`${liveStaffName} đã tham gia cuộc trò chuyện`);
      } else if (liveChatStatus === 'closed') {
        setHeader('👨‍💼', wt('chat.staff_header'), wt('chat.offline'), 'offline');
        appendStatusNotice(wt('chat.closed_notice'));
        stopPolling();
        document.getElementById('mt-chat-input').disabled  = true;
        document.getElementById('mt-chat-send').disabled   = true;
      }
    }

    // New messages
    if (data.messages && data.messages.length) {
      data.messages.forEach(m => {
        if (m.sender === 'staff') {
          appendStaffMessage(m.message, liveStaffName || data.staff_name || wt('chat.staff_header'));
        }
        liveChatLastId = Math.max(liveChatLastId, parseInt(m.id));
      });
    }
  } catch (_) {}
}

async function sendLiveMessage(text) {
  if (!liveChatId) return;
  try {
    await fetch(LIVE_CHAT_API + '?action=send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: liveChatId, message: text }),
    });
  } catch (_) {}
}

// ===== MARKDOWN =====
function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^(\d+)\.\s(.+)$/gm, '<li>$1. $2</li>')
    .replace(/^[\*\-]\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

// ===== APPEND MESSAGES =====
function appendBotMessage(text, quickReplies = []) {
  const msgs = document.getElementById('mt-chat-messages');
  const div  = document.createElement('div');
  div.className = 'chat-msg bot';
  div.innerHTML = '<p>' + renderMarkdown(text) + '</p>';
  if (quickReplies.length) {
    const qr = document.createElement('div');
    qr.className = 'chat-quick-replies';
    quickReplies.forEach(label => {
      const btn = document.createElement('button');
      btn.className   = 'chat-quick-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => { qr.remove(); submitMessage(label); });
      qr.appendChild(btn);
    });
    div.appendChild(qr);
  }
  msgs.appendChild(div);
  scrollBottom();
  messageHistory.push({ role: 'assistant', content: text });
}

function appendStaffMessage(text, name) {
  const msgs = document.getElementById('mt-chat-messages');
  const div  = document.createElement('div');
  div.className = 'chat-msg staff';
  div.innerHTML = `<span class="chat-sender-label">${name}</span>${escapeHtml(text)}`;
  msgs.appendChild(div);
  scrollBottom();
}

function appendUserMessage(text) {
  const msgs = document.getElementById('mt-chat-messages');
  const div  = document.createElement('div');
  div.className   = 'chat-msg user';
  div.textContent = text;
  msgs.appendChild(div);
  scrollBottom();
  messageHistory.push({ role: 'user', content: text });
}

function appendStatusNotice(text) {
  const msgs = document.getElementById('mt-chat-messages');
  const div  = document.createElement('div');
  div.className   = 'chat-status-notice';
  div.textContent = text;
  msgs.appendChild(div);
  scrollBottom();
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'chat-typing'; el.id = 'typingIndicator';
  el.innerHTML = '<span></span><span></span><span></span>';
  document.getElementById('mt-chat-messages').appendChild(el);
  scrollBottom();
}
function hideTyping() { const el = document.getElementById('typingIndicator'); if (el) el.remove(); }
function scrollBottom() { const m = document.getElementById('mt-chat-messages'); m.scrollTop = m.scrollHeight; }
function escapeHtml(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ===== SEND =====
let isSending = false;
function sendMessage() {
  const input = document.getElementById('mt-chat-input');
  const text  = input.value.trim();
  if (!text) return;
  if (chatMode === 'ai'    && isTyping)  return;
  if (chatMode === 'staff' && isSending) return;
  input.value = '';
  submitMessage(text);
}

async function submitMessage(text) {
  appendUserMessage(text);

  // Staff mode → send to live chat API
  if (chatMode === 'staff') {
    isSending = true;
    document.getElementById('mt-chat-send').disabled = true;
    await sendLiveMessage(text);
    isSending = false;
    document.getElementById('mt-chat-send').disabled = false;
    return;
  }

  // AI mode → call n8n
  isTyping = true;
  document.getElementById('mt-chat-send').disabled = true;
  showTyping();

  try {
    const res  = await fetch(N8N_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chatInput: text, sessionId }),
    });
    const data = await res.json();
    hideTyping();
    appendBotMessage(data.reply || data.output || 'Xin lỗi, không nhận được phản hồi. Vui lòng thử lại.');
  } catch (_) {
    hideTyping();
    appendBotMessage('Đã xảy ra lỗi kết nối. Vui lòng thử lại hoặc gọi hotline của chúng tôi.');
  }

  isTyping = false;
  document.getElementById('mt-chat-send').disabled = false;
}
