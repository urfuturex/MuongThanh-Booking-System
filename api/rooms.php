<?php
session_name('mt_admin');
session_start();
require_once __DIR__ . '/config.php';

if (empty($_SESSION['staff_id'])) respond(['error' => 'Unauthorized'], 401);

$staffId   = (int)$_SESSION['staff_id'];
$isManager = ($_SESSION['staff_role'] ?? '') === 'manager';

// Lấy hotel_slug của nhân viên (dùng cho non-manager)
function getStaffHotelSlug(): ?string {
    $st = getDB()->prepare(
        "SELECT h.slug FROM staff s JOIN hotels h ON h.id = s.hotel_id WHERE s.id = ? LIMIT 1"
    );
    $st->execute([$GLOBALS['staffId']]);
    return $st->fetchColumn() ?: null;
}

$method = $_SERVER['REQUEST_METHOD'];

match(true) {
    $method === 'GET'    => handleGet(),
    $method === 'POST'   => handlePost(),
    $method === 'PUT'    => handlePut(),
    $method === 'DELETE' => handleDelete(),
    default              => respond(['error' => 'Not found'], 404),
};

// ===== GET =====
function handleGet(): void {
    $db     = getDB();
    $where  = [];
    $params = [];

    if (!$GLOBALS['isManager']) {
        // Non-manager: bắt buộc chỉ thấy phòng của chi nhánh mình
        $slug = getStaffHotelSlug();
        if (!$slug) respond(['error' => 'Nhân viên chưa được gán chi nhánh'], 403);
        $where[]  = 'r.hotel_slug = ?';
        $params[] = $slug;
    } elseif (!empty($_GET['hotel_slug'])) {
        // Manager: có thể lọc theo hotel tùy ý
        $where[]  = 'r.hotel_slug = ?';
        $params[] = $_GET['hotel_slug'];
    }

    if (!empty($_GET['status'])) {
        $where[]  = 'r.status = ?';
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['floor'])) {
        $where[]  = 'r.floor = ?';
        $params[] = (int)$_GET['floor'];
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $sql = "SELECT r.*,
                   b.last_name, b.first_name, b.check_in, b.check_out
            FROM rooms r
            LEFT JOIN bookings b
                   ON b.ref_code = r.current_booking_ref
                  AND b.status IN ('confirmed','checked_in')
            $whereClause
            ORDER BY r.hotel_slug, r.floor, r.room_number";

    $st = $db->prepare($sql);
    $st->execute($params);
    $rooms = $st->fetchAll();

    // Stats (scoped to hotel if filtered)
    $statWhere  = !empty($_GET['hotel_slug']) ? 'WHERE hotel_slug = ?' : '';
    $statParams = !empty($_GET['hotel_slug']) ? [$_GET['hotel_slug']] : [];
    $statSql    = "SELECT
                     COUNT(*)                      AS total,
                     SUM(status='available')        AS available,
                     SUM(status='occupied')         AS occupied,
                     SUM(status='maintenance')      AS maintenance,
                     SUM(status='blocked')          AS blocked
                   FROM rooms $statWhere";
    $st2 = $db->prepare($statSql);
    $st2->execute($statParams);
    $stats = $st2->fetch();

    respond(['rooms' => $rooms, 'stats' => $stats]);
}

// ===== POST — Thêm phòng mới (chỉ manager) =====
function handlePost(): void {
    if (!$GLOBALS['isManager']) respond(['error' => 'Không có quyền'], 403);
    $b  = body();
    $db = getDB();

    $db->prepare("
        INSERT INTO rooms (hotel_slug, hotel_name, room_number, room_type, floor, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ")->execute([
        $b['hotel_slug']   ?? '',
        $b['hotel_name']   ?? '',
        $b['room_number']  ?? '',
        $b['room_type']    ?? '',
        isset($b['floor']) ? (int)$b['floor'] : null,
        $b['status']       ?? 'available',
        $b['notes']        ?? null,
    ]);

    respond(['success' => true, 'id' => (int)$db->lastInsertId()], 201);
}

// ===== PUT — Cập nhật phòng / đổi trạng thái =====
function handlePut(): void {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) respond(['error' => 'Thiếu id'], 400);

    $b      = body();
    $db     = getDB();

    // Non-manager: chỉ được đổi status/notes, và chỉ phòng của chi nhánh mình
    if (!$GLOBALS['isManager']) {
        $ownSlug = getStaffHotelSlug();
        $st = $db->prepare("SELECT hotel_slug FROM rooms WHERE id = ?");
        $st->execute([$id]);
        $roomSlug = $st->fetchColumn();

        if ($roomSlug !== $ownSlug) respond(['error' => 'Không có quyền'], 403);

        $b = array_intersect_key($b, array_flip(['status', 'notes', 'current_booking_ref']));
    }
    $fields = ['status', 'room_number', 'room_type', 'floor', 'notes', 'current_booking_ref'];
    $sets   = [];
    $params = [];

    foreach ($fields as $f) {
        if (array_key_exists($f, $b)) {
            $sets[]   = "$f = ?";
            $params[] = $b[$f];
        }
    }
    if (!$sets) respond(['error' => 'Không có gì để cập nhật'], 400);

    $params[] = $id;
    $db->prepare("UPDATE rooms SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
    respond(['success' => true]);
}

// ===== DELETE — Xóa phòng (chỉ manager) =====
function handleDelete(): void {
    if (!$GLOBALS['isManager']) respond(['error' => 'Không có quyền'], 403);
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) respond(['error' => 'Thiếu id'], 400);
    getDB()->prepare("DELETE FROM rooms WHERE id = ?")->execute([$id]);
    respond(['success' => true]);
}
