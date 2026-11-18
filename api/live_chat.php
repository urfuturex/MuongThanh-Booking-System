<?php
// live_chat.php — polling-based live chat (customer ↔ staff)
// Customer calls (no ?staff):  start, send, poll
// Staff calls   (?staff=1):    list, accept, close, send, poll, unread_count

$action = $_GET['action'] ?? '';
$adminOnlyActions = ['list', 'accept', 'close', 'unread_count'];
$isStaff = in_array($action, $adminOnlyActions) || !empty($_GET['staff']);

if ($isStaff) {
    session_name('mt_admin');
}
session_start();
require_once __DIR__ . '/config.php';

$staffId   = 0;
$staffName = '';

if ($isStaff) {
    $staffId = (int)($_SESSION['staff_id'] ?? 0);
    if (!$staffId) respond(['error' => 'Unauthorized'], 401);
    $sn = getDB()->prepare("SELECT full_name FROM staff WHERE id = ? LIMIT 1");
    $sn->execute([$staffId]);
    $staffName = $sn->fetchColumn() ?: 'Nhân viên';
}

match ($action) {
    'start'        => handleStart(),
    'send'         => handleSend(),
    'poll'         => handlePoll(),
    'list'         => handleList(),
    'accept'       => handleAccept(),
    'close'        => handleClose(),
    'unread_count' => handleUnreadCount(),
    default        => respond(['error' => 'Unknown action'], 400),
};

// ── Customer starts a new chat session ──────────────────────────────
function handleStart(): void {
    $b  = body();
    $db = getDB();
    $sessionId     = trim($b['session_id']     ?? '');
    $customerName  = trim($b['customer_name']  ?? 'Khách');
    $customerEmail = trim($b['customer_email'] ?? '');

    if (!$sessionId) respond(['error' => 'Missing session_id'], 400);

    // Return existing open chat for this session
    $st = $db->prepare(
        "SELECT id, status FROM live_chats
         WHERE session_id = ? AND status != 'closed'
         ORDER BY id DESC LIMIT 1"
    );
    $st->execute([$sessionId]);
    if ($row = $st->fetch()) {
        respond(['chat_id' => (int)$row['id'], 'status' => $row['status']]);
    }

    $db->prepare(
        "INSERT INTO live_chats (session_id, customer_name, customer_email, status)
         VALUES (?,?,?,'waiting')"
    )->execute([$sessionId, $customerName, $customerEmail]);

    respond(['chat_id' => (int)$db->lastInsertId(), 'status' => 'waiting'], 201);
}

// ── Send a message (customer or staff) ──────────────────────────────
function handleSend(): void {
    global $isStaff;
    $b  = body();
    $db = getDB();

    $chatId  = (int)($b['chat_id'] ?? 0);
    $message = trim($b['message'] ?? '');
    if (!$chatId || !$message) respond(['error' => 'Missing fields'], 400);

    $st = $db->prepare("SELECT status FROM live_chats WHERE id = ? LIMIT 1");
    $st->execute([$chatId]);
    $chat = $st->fetch();
    if (!$chat) respond(['error' => 'Chat not found'], 404);
    if ($chat['status'] === 'closed') respond(['error' => 'Chat is closed'], 400);

    $sender = $isStaff ? 'staff' : 'customer';
    $db->prepare(
        "INSERT INTO live_chat_messages (chat_id, sender, message) VALUES (?,?,?)"
    )->execute([$chatId, $sender, $message]);

    $newId = (int)$db->lastInsertId();
    $db->prepare("UPDATE live_chats SET updated_at = NOW() WHERE id = ?")->execute([$chatId]);
    respond(['success' => true, 'id' => $newId]);
}

// ── Poll for new messages + chat status ─────────────────────────────
function handlePoll(): void {
    global $isStaff;
    $db     = getDB();
    $chatId = (int)($_GET['chat_id'] ?? 0);
    $lastId = (int)($_GET['last_id'] ?? 0);
    if (!$chatId) respond(['error' => 'Missing chat_id'], 400);

    $st = $db->prepare(
        "SELECT status, staff_name, customer_name, customer_email FROM live_chats WHERE id = ? LIMIT 1"
    );
    $st->execute([$chatId]);
    $chat = $st->fetch();
    if (!$chat) respond(['error' => 'Chat not found'], 404);

    $st = $db->prepare(
        "SELECT id, sender, message, created_at
         FROM live_chat_messages
         WHERE chat_id = ? AND id > ?
         ORDER BY id ASC LIMIT 50"
    );
    $st->execute([$chatId, $lastId]);
    $messages = $st->fetchAll();

    // Mark incoming messages as read
    if (!empty($messages)) {
        $markSender = $isStaff ? 'customer' : 'staff';
        $db->prepare(
            "UPDATE live_chat_messages SET is_read = 1
             WHERE chat_id = ? AND sender = ? AND is_read = 0"
        )->execute([$chatId, $markSender]);
    }

    respond([
        'status'         => $chat['status'],
        'staff_name'     => $chat['staff_name']     ?? '',
        'customer_name'  => $chat['customer_name']  ?? 'Khách',
        'customer_email' => $chat['customer_email'] ?? '',
        'messages'       => $messages,
    ]);
}

// ── Admin: list chats by status ──────────────────────────────────────
function handleList(): void {
    $db     = getDB();
    $status = in_array($_GET['status'] ?? '', ['waiting', 'active', 'closed'])
              ? $_GET['status'] : 'waiting';

    $st = $db->prepare(
        "SELECT lc.id, lc.customer_name, lc.customer_email,
                lc.status, lc.staff_name, lc.created_at, lc.updated_at,
                (SELECT COUNT(*) FROM live_chat_messages m
                 WHERE m.chat_id = lc.id AND m.sender = 'customer' AND m.is_read = 0) AS unread,
                (SELECT message FROM live_chat_messages m
                 WHERE m.chat_id = lc.id ORDER BY m.id DESC LIMIT 1) AS last_message
         FROM live_chats lc
         WHERE lc.status = ?
         ORDER BY lc.updated_at DESC
         LIMIT 60"
    );
    $st->execute([$status]);
    respond(['chats' => $st->fetchAll()]);
}

// ── Admin: accept a waiting chat ─────────────────────────────────────
function handleAccept(): void {
    global $staffId, $staffName;
    $b      = body();
    $db     = getDB();
    $chatId = (int)($b['chat_id'] ?? 0);
    if (!$chatId) respond(['error' => 'Missing chat_id'], 400);

    $st = $db->prepare(
        "UPDATE live_chats
         SET status = 'active', staff_id = ?, staff_name = ?, updated_at = NOW()
         WHERE id = ? AND status = 'waiting'"
    );
    $st->execute([$staffId, $staffName, $chatId]);

    if ($st->rowCount() === 0) respond(['error' => 'Chat no longer available'], 409);

    // Auto welcome message
    $db->prepare(
        "INSERT INTO live_chat_messages (chat_id, sender, message) VALUES (?, 'staff', ?)"
    )->execute([$chatId, "Xin chào! Tôi là {$staffName}, rất vui được hỗ trợ bạn."]);

    respond(['success' => true]);
}

// ── Admin: close a chat ───────────────────────────────────────────────
function handleClose(): void {
    $b      = body();
    $db     = getDB();
    $chatId = (int)($b['chat_id'] ?? 0);
    if (!$chatId) respond(['error' => 'Missing chat_id'], 400);

    $db->prepare(
        "INSERT INTO live_chat_messages (chat_id, sender, message)
         VALUES (?, 'staff', 'Cuộc trò chuyện đã kết thúc. Cảm ơn bạn đã liên hệ Mường Thanh!')"
    )->execute([$chatId]);

    $db->prepare(
        "UPDATE live_chats SET status = 'closed', updated_at = NOW() WHERE id = ?"
    )->execute([$chatId]);

    respond(['success' => true]);
}

// ── Admin: badge count (waiting chats + unread messages) ─────────────
function handleUnreadCount(): void {
    $db = getDB();
    $st = $db->query(
        "SELECT
           (SELECT COUNT(*) FROM live_chats WHERE status = 'waiting') AS waiting,
           (SELECT COUNT(*) FROM live_chat_messages
            WHERE is_read = 0 AND sender = 'customer') AS unread"
    );
    respond($st->fetch() ?: ['waiting' => 0, 'unread' => 0]);
}
