<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method not allowed'], 405);

$b       = body();
$refCode = trim($b['ref_code'] ?? '');
$amount  = (float)($b['amount'] ?? 0);
$locale  = ($b['locale'] ?? 'vi') === 'en' ? 'en' : 'vn';

if (!$refCode || $amount <= 0) respond(['error' => 'Thiếu thông tin'], 400);

// Đọc credentials từ settings
$db  = getDB();
$st  = $db->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('vnpay_tmn_code','vnpay_hash_secret','vnpay_sandbox')");
$cfg = [];
foreach ($st->fetchAll() as $r) $cfg[$r['key']] = $r['value'];

$tmnCode    = $cfg['vnpay_tmn_code']    ?? '';
$hashSecret = $cfg['vnpay_hash_secret'] ?? '';
$isSandbox  = ($cfg['vnpay_sandbox']    ?? '1') !== '0';

if (!$tmnCode || !$hashSecret) respond(['error' => 'VNPay chưa được cấu hình trong Cài đặt'], 500);

$gatewayUrl = $isSandbox
    ? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
    : 'https://vnpayment.vn/paymentv2/vpcpay.html';

// Auto-build return URL (gốc site + /vnpay_return.php)
$scheme     = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host       = $_SERVER['HTTP_HOST'] ?? 'localhost';
$base       = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/');
$returnUrl  = $scheme . '://' . $host . $base . '/vnpay_return.php';

// IP khách
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$ip = trim(explode(',', $ip)[0]);

// vnp_OrderInfo phải là ASCII không dấu
$orderInfo = 'Dat phong Muong Thanh ' . preg_replace('/[^a-zA-Z0-9 \-]/', '', $refCode);

$inputData = [
    'vnp_Version'    => '2.1.0',
    'vnp_Command'    => 'pay',
    'vnp_TmnCode'    => $tmnCode,
    'vnp_Amount'     => (string)(int)round($amount * 100),
    'vnp_CreateDate' => date('YmdHis'),
    'vnp_CurrCode'   => 'VND',
    'vnp_IpAddr'     => $ip,
    'vnp_Locale'     => $locale,
    'vnp_OrderInfo'  => $orderInfo,
    'vnp_OrderType'  => 'other',
    'vnp_ReturnUrl'  => $returnUrl,
    'vnp_TxnRef'     => $refCode,
    'vnp_ExpireDate' => date('YmdHis', time() + 15 * 60),
];

ksort($inputData);

$hashData = '';
$query    = '';
$first    = true;
foreach ($inputData as $key => $value) {
    if (!$first) { $hashData .= '&'; }
    $hashData .= urlencode($key) . '=' . urlencode($value);
    $query    .= urlencode($key) . '=' . urlencode($value) . '&';
    $first = false;
}

$secureHash  = hash_hmac('sha512', $hashData, $hashSecret);
$paymentUrl  = $gatewayUrl . '?' . $query . 'vnp_SecureHash=' . $secureHash;

respond(['payment_url' => $paymentUrl]);
