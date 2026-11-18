// admin/chat.js — Live Chat management for staff
// Polls chat list every 3s; polls active chat messages every 2s
// Fixed: use recursive setTimeout (no overlapping polls), no optimistic UI

const API = '../api/live_chat.php';

let currentTab      = 'waiting';
let currentChatId   = null;
let currentChatData = null;
let lastMsgId       = 0;
let listPollTimer   = null;
let msgPollActive   = false;   // flag to stop msg polling loop
let isSending       = false;   // debounce for sendReply

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('replyInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
  });
});

document.addEventListener('adminReady', () => {
  loadList();
  // List + badge refresh every 3s (sequential setTimeout to avoid overlaps)
  (function listLoop() {
    listPollTimer = setTimeout(async () => {
      await loadList(true);
      await updateBadges();
      listLoop();
    }, 3000);
  })();
  updateBadges();
});

// ===== TABS =====
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.chat-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  clearChatWindow();
  loadList();
}

// ===== LOAD LIST =====
async function loadList(silent = false) {
  try {
    const res   = await fetch(`${API}?action=list&status=${currentTab}&staff=1`, { credentials: 'include' });
    const data  = await res.json();
    const chats = data.chats || [];
    tabCounts[currentTab] = chats.length;
    document.getElementById('count' + cap(currentTab)).textContent = chats.length;
    renderList(chats, silent);
  } catch (_) {}
}
const tabCounts = { waiting: 0, active: 0, closed: 0 };

function renderList(chats, silent) {
  const list = document.getElementById('chatList');
  if (!chats.length) {
    if (!silent) list.innerHTML = `<div class="chat-list-empty">${tAdm('chat.no_chats')}</div>`;
    return;
  }
  const prevActive = currentChatId;
  list.innerHTML = chats.map(c => {
    const dot  = `<span class="cli-status-dot dot-${c.status}"></span>`;
    const unrd = c.unread > 0 ? `<span class="cli-unread">${c.unread}</span>` : '';
    const last = c.last_message ? c.last_message.slice(0, 55) + (c.last_message.length > 55 ? '…' : '') : '—';
    return `
      <div class="chat-list-item${c.id == prevActive ? ' active' : ''}"
           id="cli-${c.id}" onclick="selectChat(${c.id})">
        <div class="cli-name">${dot}${escHtml(c.customer_name || 'Khách')}${unrd}</div>
        <div class="cli-last">${escHtml(last)}</div>
        <div class="cli-time">${formatTime(c.updated_at)}</div>
      </div>`;
  }).join('');
}

// ===== SELECT CHAT =====
async function selectChat(chatId) {
  if (chatId === currentChatId) return; // already open

  stopMsgPoll();
  currentChatId = chatId;
  lastMsgId     = 0;

  document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
  const item = document.getElementById('cli-' + chatId);
  if (item) item.classList.add('active');

  // Load all existing messages + meta
  const res  = await fetch(`${API}?action=poll&chat_id=${chatId}&last_id=0&staff=1`, { credentials: 'include' });
  const data = await res.json();

  currentChatData = {
    id:             chatId,
    status:         data.status,
    staff_name:     data.staff_name,
    customer_name:  data.customer_name  || 'Khách',
    customer_email: data.customer_email || '',
  };
  showChatWindow(chatId, data);

  // Start sequential message polling
  startMsgPoll(chatId);
}

function showChatWindow(chatId, data) {
  document.getElementById('chatEmpty').style.display = 'none';
  const win = document.getElementById('chatWindow');
  win.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow:hidden;';

  // Use customer_name from API response directly (reliable)
  const customerName  = data.customer_name  || currentChatData?.customer_name  || 'Khách';
  const customerEmail = data.customer_email || currentChatData?.customer_email || '';

  document.getElementById('wCustName').textContent = customerName;
  document.getElementById('wCustMeta').textContent =
    customerEmail ? `${customerEmail} — ` + statusLabel(data.status, data.staff_name)
                  : statusLabel(data.status, data.staff_name);

  renderActions(data.status, chatId);

  // Render history
  const msgs = document.getElementById('chatWindowMsgs');
  msgs.innerHTML = '';
  (data.messages || []).forEach(m => appendWindowMsg(m));
  if (data.messages?.length) {
    lastMsgId = Math.max(...data.messages.map(m => +m.id));
  }

  const canReply = data.status === 'active';
  document.getElementById('replyInput').disabled   = !canReply;
  document.getElementById('replySendBtn').disabled = !canReply;
  if (canReply) document.getElementById('replyInput').focus();
}

function statusLabel(status, staffName) {
  if (status === 'waiting') return tAdm('chat.status_waiting');
  if (status === 'active')  return `${tAdm('chat.status_active')} ${staffName || ''}`;
  return tAdm('chat.status_closed');
}

function renderActions(status, chatId) {
  const wrap = document.getElementById('wActions');
  if (status === 'waiting') {
    wrap.innerHTML = `<button class="btn-accept" onclick="acceptChat(${chatId})">${tAdm('chat.btn_accept')}</button>`;
  } else if (status === 'active') {
    wrap.innerHTML = `<button class="btn-close-chat" onclick="closeChatSession(${chatId})">${tAdm('chat.btn_close')}</button>`;
  } else {
    wrap.innerHTML = '';
  }
}

// ===== SEQUENTIAL MESSAGE POLL (no overlapping) =====
function startMsgPoll(chatId) {
  msgPollActive = true;
  (async function loop() {
    if (!msgPollActive || currentChatId !== chatId) return;
    await pollMsgs(chatId);
    if (msgPollActive && currentChatId === chatId) {
      setTimeout(loop, 2000);
    }
  })();
}

function stopMsgPoll() {
  msgPollActive = false;
}

async function pollMsgs(chatId) {
  try {
    const res  = await fetch(`${API}?action=poll&chat_id=${chatId}&last_id=${lastMsgId}&staff=1`, { credentials: 'include' });
    const data = await res.json();

    // Status change → update header meta
    if (currentChatData && data.status !== currentChatData.status) {
      currentChatData.status = data.status;
      if (data.customer_name) currentChatData.customer_name = data.customer_name;
      document.getElementById('wCustMeta').textContent =
        statusLabel(data.status, data.staff_name || currentChatData.staff_name);
      renderActions(data.status, chatId);
      const canReply = data.status === 'active';
      document.getElementById('replyInput').disabled   = !canReply;
      document.getElementById('replySendBtn').disabled = !canReply;
      if (data.status === 'closed') stopMsgPoll();
    }

    // Append new messages — only those with id > lastMsgId
    if (data.messages?.length) {
      data.messages.forEach(m => {
        if (+m.id > lastMsgId) {
          appendWindowMsg(m);
          lastMsgId = Math.max(lastMsgId, +m.id);
        }
      });
    }
  } catch (_) {}
}

// ===== APPEND MESSAGES =====
function appendWindowMsg(m) {
  const msgs = document.getElementById('chatWindowMsgs');
  const div  = document.createElement('div');
  div.className = 'wm-bubble ' + m.sender;
  div.innerHTML = escHtml(m.message) + `<div class="wm-time">${formatTime(m.created_at)}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendStatusMsg(text) {
  const msgs = document.getElementById('chatWindowMsgs');
  const div  = document.createElement('div');
  div.className   = 'wm-status-notice';
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ===== ACCEPT / CLOSE =====
async function acceptChat(chatId) {
  try {
    const res  = await fetch(`${API}?action=accept&staff=1`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('wCustMeta').textContent = statusLabel('active', currentChatData?.staff_name || '');
      renderActions('active', chatId);
      document.getElementById('replyInput').disabled   = false;
      document.getElementById('replySendBtn').disabled = false;
      document.getElementById('replyInput').focus();
      if (currentChatData) currentChatData.status = 'active';
      // Let poll pick up the welcome message naturally
    } else {
      alert(data.error || tAdm('chat.err_accept'));
    }
  } catch (_) { alert(tAdm('chat.err_connect')); }
}

async function closeChatSession(chatId) {
  if (!confirm(tAdm('chat.confirm_close'))) return;
  try {
    await fetch(`${API}?action=close&staff=1`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId }),
    });
    document.getElementById('replyInput').disabled   = true;
    document.getElementById('replySendBtn').disabled = true;
    renderActions('closed', chatId);
    if (currentChatData) currentChatData.status = 'closed';
    stopMsgPoll();
  } catch (_) {}
}

// ===== SEND REPLY (no optimistic UI — let poll fetch from server) =====
async function sendReply() {
  if (isSending) return;
  const input = document.getElementById('replyInput');
  const text  = input.value.trim();
  if (!text || !currentChatId) return;

  isSending = true;
  input.value = '';
  document.getElementById('replySendBtn').disabled = true;

  try {
    const res  = await fetch(`${API}?action=send&staff=1`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: currentChatId, message: text }),
    });
    const data = await res.json();
    // Append the sent message manually using the real ID from server
    if (data.success && data.id) {
      appendWindowMsg({ sender: 'staff', message: text, created_at: new Date().toISOString(), id: data.id });
      lastMsgId = Math.max(lastMsgId, +data.id);
    }
  } catch (_) {}

  isSending = false;
  document.getElementById('replySendBtn').disabled = false;
  input.focus();
}

// ===== BADGES =====
async function updateBadges() {
  try {
    const res  = await fetch(`${API}?action=unread_count&staff=1`, { credentials: 'include' });
    const data = await res.json();
    const bw = document.getElementById('badgeWaiting');
    const bu = document.getElementById('badgeUnread');
    if (data.waiting > 0) {
      bw.innerHTML = `${data.waiting} <span data-adm-i18n="chat.badge_waiting">${tAdm('chat.badge_waiting')}</span>`;
      bw.classList.add('show');
    } else bw.classList.remove('show');
    if (data.unread > 0) {
      bu.innerHTML = `${data.unread} <span data-adm-i18n="chat.badge_new">${tAdm('chat.badge_new')}</span>`;
      bu.classList.add('show');
    } else bu.classList.remove('show');
  } catch (_) {}
}

// ===== HELPERS =====
function clearChatWindow() {
  stopMsgPoll();
  currentChatId = null;
  document.getElementById('chatEmpty').style.display  = 'flex';
  document.getElementById('chatWindow').style.display = 'none';
}

function escHtml(t) {
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function formatTime(str) {
  if (!str) return '';
  const d    = new Date(str);
  const diff = Date.now() - d;
  if (diff < 60000)    return 'Vừa xong';
  if (diff < 3600000)  return Math.floor(diff / 60000) + ' phút trước';
  if (diff < 86400000) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
