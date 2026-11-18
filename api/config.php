<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$isLocal = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1']);
$env = static function (string $name, string $default = ''): string {
    $value = getenv($name);
    return $value !== false && $value !== '' ? $value : $default;
};

define('DB_HOST',    $env('DB_HOST', 'localhost'));
define('DB_NAME',    $env('DB_NAME', $isLocal ? 'booking_mt' : ''));
define('DB_USER',    $env('DB_USER', $isLocal ? 'root' : ''));
define('DB_PASS',    $env('DB_PASS', ''));
define('DB_CHARSET', 'utf8mb4');

// ===== CẤU HÌNH THANH TOÁN CHUYỂN KHOẢN (SePay) =====
// Điền thông tin tài khoản ngân hàng của khách sạn vào đây
define('BANK_ACCOUNT_NUMBER', $env('BANK_ACCOUNT_NUMBER'));
define('BANK_ACCOUNT_NAME',   $env('BANK_ACCOUNT_NAME'));
define('BANK_NAME',           $env('BANK_NAME'));
define('BANK_BIN',            $env('BANK_BIN'));
define('SEPAY_API_TOKEN',     $env('SEPAY_API_TOKEN'));

function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    } catch (PDOException $e) {
        respond(['error' => 'Không kết nối được database. Kiểm tra XAMPP MySQL và chạy setup.sql.'], 500);
    }
    return $pdo;
}

function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function generateRef(string $prefix = 'MT'): string {
    return $prefix . '-' . strtoupper(base_convert(time(), 10, 36))
         . strtoupper(substr(md5(uniqid('', true)), 0, 4));
}

function body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? $_POST;
}

/**
 * Tìm phòng trống cùng loại, gán cho booking khi xác nhận / check-in.
 * Trả về room_number nếu thành công, null nếu không tìm được.
 */
function autoAssignRoom(PDO $db, string $hotelSlug, string $roomType, string $refCode): ?string {
    // Rooms table may not exist yet on older installs — silently skip
    try {
        $st = $db->prepare("
            SELECT id, room_number FROM rooms
            WHERE hotel_slug = ? AND room_type = ? AND status = 'available'
            LIMIT 1
        ");
        $st->execute([$hotelSlug, $roomType]);
        $room = $st->fetch();
        if (!$room) return null;

        $db->prepare("
            UPDATE rooms SET status = 'occupied', current_booking_ref = ?
            WHERE id = ?
        ")->execute([$refCode, $room['id']]);

        return $room['room_number'];
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Giải phóng phòng về available khi checkout / huỷ.
 */
function autoReleaseRoom(PDO $db, string $refCode): void {
    try {
        $db->prepare("
            UPDATE rooms SET status = 'available', current_booking_ref = NULL
            WHERE current_booking_ref = ?
        ")->execute([$refCode]);
    } catch (Exception $e) {
        // silently skip if rooms table doesn't exist
    }
}
