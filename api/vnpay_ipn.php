<?php
// VNPay IPN — gọi server-to-server, không có session/cookie
// Phải trả về JSON, không redirect, không output khác
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

function ipnRespond(string $code, string $msg): void {
    echo json_encode(['RspCode' => $code, 'Message' => $msg]);
    exit;
}

// Đọc hash secret
try {
    $db  = getDB();
    $st  = $db->query("SELECT `value` FROM settings WHERE `key` = 'vnpay_hash_secret' LIMIT 1");
    $row = $st->fetch();
    $hashSecret = $row['value'] ?? '';
} catch (Exception $e) {
    ipnRespond('99', 'DB error');
}

if (!$hashSecret) ipnRespond('99', 'Hash secret not configured');

// Thu thập tham số vnp_*
$inputData     = [];
$vnpSecureHash = '';
foreach ($_GET as $key => $value) {
    if (strncmp($key, 'vnp_', 4) === 0) {
        $inputData[$key] = $value;
    }
}
$vnpSecureHash = $inputData['vnp_SecureHash'] ?? '';
unset($inputData['vnp_SecureHash']);
ksort($inputData);

// Xây hashData
$hashData = '';
$first    = true;
foreach ($inputData as $key => $value) {
    if (!$first) $hashData .= '&';
    $hashData .= urlencode($key) . '=' . urlencode($value);
    $first = false;
}

// Xác minh chữ ký
if (hash_hmac('sha512', $hashData, $hashSecret) !== $vnpSecureHash) {
    ipnRespond('97', 'Invalid signature');
}

$refCode      = $inputData['vnp_TxnRef']           ?? '';
$vnpAmount    = (float)($inputData['vnp_Amount']   ?? 0) / 100;
$responseCode = $inputData['vnp_ResponseCode']      ?? '';
$txnStatus    = $inputData['vnp_TransactionStatus'] ?? '';

// Tìm booking
$st = $db->prepare("SELECT id, grand_total, status, hotel_slug, room_type FROM bookings WHERE ref_code = ? LIMIT 1");
$st->execute([$refCode]);
$booking = $st->fetch();

if (!$booking) ipnRespond('01', 'Order not found');

// Kiểm tra số tiền
if ((int)round($booking['grand_total']) !== (int)round($vnpAmount)) {
    ipnRespond('04', 'Invalid amount');
}

// Idempotent: nếu đã xác nhận rồi thì trả 02
if ($booking['status'] !== 'pending') {
    ipnRespond('02', 'Order already confirmed');
}

// Cập nhật trạng thái
if ($responseCode === '00' || $txnStatus === '00') {
    $db->prepare("UPDATE bookings SET status = 'confirmed', payment_method = 'vnpay' WHERE ref_code = ?")
       ->execute([$refCode]);
    autoAssignRoom($db, $booking['hotel_slug'], $booking['room_type'], $refCode);
} else {
    // Thanh toán thất bại / bị huỷ
    $db->prepare("UPDATE bookings SET status = 'cancelled' WHERE ref_code = ?")
       ->execute([$refCode]);
}

ipnRespond('00', 'Confirm Success');
