<?php
// Trang này CHỈ để hiển thị kết quả cho khách hàng
// KHÔNG cập nhật DB ở đây — đã có vnpay_ipn.php làm việc đó
require_once __DIR__ . '/api/config.php';

date_default_timezone_set('Asia/Ho_Chi_Minh');

// Xác minh chữ ký
$inputData = [];
foreach ($_GET as $key => $value) {
    if (strncmp($key, 'vnp_', 4) === 0) $inputData[$key] = $value;
}
$vnpSecureHash = $inputData['vnp_SecureHash'] ?? '';
unset($inputData['vnp_SecureHash']);
ksort($inputData);
$hashData = '';
$first    = true;
foreach ($inputData as $key => $value) {
    if (!$first) $hashData .= '&';
    $hashData .= urlencode($key) . '=' . urlencode($value);
    $first = false;
}
try {
    $db  = getDB();
    $st  = $db->query("SELECT `value` FROM settings WHERE `key` = 'vnpay_hash_secret' LIMIT 1");
    $hashSecret = ($st->fetch())['value'] ?? '';
} catch (Exception $e) { $hashSecret = ''; }

$sigOk    = $hashSecret && hash_hmac('sha512', $hashData, $hashSecret) === $vnpSecureHash;
$resCode  = $_GET['vnp_ResponseCode'] ?? '';
$refCode  = $_GET['vnp_TxnRef']       ?? '';
$amount   = isset($_GET['vnp_Amount']) ? number_format((float)$_GET['vnp_Amount'] / 100, 0, ',', '.') : '0';
$success  = $sigOk && $resCode === '00';

// Map response code
$msgMap = [
    '24' => 'Bạn đã hủy giao dịch.',
    '11' => 'Giao dịch hết hạn thanh toán.',
    '51' => 'Tài khoản không đủ số dư.',
    '65' => 'Vượt quá hạn mức giao dịch ngày.',
    '75' => 'Ngân hàng đang bảo trì.',
    '12' => 'Tài khoản đang bị khóa.',
    '10' => 'Xác thực sai quá nhiều lần.',
    '13' => 'Sai OTP.',
    '79' => 'Sai mật khẩu thanh toán quá nhiều lần.',
];
$errMsg = $success ? '' : ($msgMap[$resCode] ?? 'Giao dịch không thành công (mã ' . htmlspecialchars($resCode) . ').');
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title><?= $success ? 'Đặt phòng thành công' : 'Thanh toán thất bại' ?> — Mường Thanh</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    :root{
      --black:#080808;--dark:#0f0f0f;--card:#161616;
      --border:rgba(255,255,255,0.08);
      --gold:#c9a96e;--gold-l:#e8c98a;
      --white:#f5f0ea;--muted:rgba(245,240,234,0.5);
      --green:#4caf7d;--red:#e05555;
      --font-serif:'Cormorant Garamond',Georgia,serif;
      --font-sans:'Inter',system-ui,sans-serif;
    }
    body{background:var(--black);color:var(--white);font-family:var(--font-sans);
      min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem 1rem;}
    .box{background:var(--card);border:1px solid var(--border);padding:3rem 2.5rem;
      max-width:480px;width:100%;text-align:center;}
    .icon{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:2rem;margin:0 auto 1.5rem;
      background:<?= $success ? 'linear-gradient(135deg,#2d6a4f,#4caf7d)' : 'rgba(224,85,85,0.15)' ?>;
      color:<?= $success ? '#fff' : 'var(--red)' ?>;border:1px solid <?= $success ? 'rgba(76,175,125,0.3)' : 'rgba(224,85,85,0.3)' ?>;}
    h1{font-family:var(--font-serif);font-size:2rem;font-weight:300;color:var(--white);margin-bottom:.75rem;}
    .sub{font-size:.875rem;color:var(--muted);line-height:1.7;margin-bottom:2rem;}
    .ref-block{background:rgba(201,169,110,0.06);border:1px solid rgba(201,169,110,0.15);
      padding:1rem 1.25rem;margin-bottom:2rem;text-align:left;}
    .ref-row{display:flex;justify-content:space-between;align-items:center;
      font-size:.8rem;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,0.04);}
    .ref-row:last-child{border-bottom:none;}
    .ref-label{color:var(--muted);}
    .ref-val{color:var(--white);font-weight:500;letter-spacing:.04em;}
    .ref-val.gold{color:var(--gold);}
    .badge{display:inline-flex;align-items:center;gap:.4rem;font-size:.65rem;font-weight:600;
      letter-spacing:.12em;text-transform:uppercase;padding:.35rem .8rem;margin-bottom:2rem;
      border:1px solid;<?= $success
        ? 'color:var(--green);border-color:rgba(76,175,125,0.3);background:rgba(76,175,125,0.08);'
        : 'color:var(--red);border-color:rgba(224,85,85,0.3);background:rgba(224,85,85,0.08);' ?>}
    .err-msg{font-size:.8rem;color:rgba(224,85,85,.8);margin-bottom:1.5rem;line-height:1.6;}
    .actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;}
    .btn-gold{background:var(--gold);color:var(--black);font-size:.75rem;font-weight:600;
      letter-spacing:.15em;text-transform:uppercase;padding:.85rem 2rem;
      border:none;cursor:pointer;text-decoration:none;display:inline-block;transition:background .3s;}
    .btn-gold:hover{background:var(--gold-l);}
    .btn-ghost{background:none;color:var(--muted);font-size:.75rem;font-weight:500;
      letter-spacing:.1em;text-transform:uppercase;padding:.85rem 2rem;
      border:1px solid var(--border);cursor:pointer;text-decoration:none;display:inline-block;transition:all .3s;}
    .btn-ghost:hover{border-color:rgba(201,169,110,0.4);color:var(--gold);}
    .logo{font-family:var(--font-serif);font-size:1rem;letter-spacing:.3em;color:var(--gold);
      text-decoration:none;display:block;margin-bottom:2rem;}
    @media(max-width:480px){.box{padding:2rem 1.25rem;}}
  </style>
</head>
<body>
<div class="box">
  <a href="index.html" class="logo">MƯỜNG THANH</a>

  <div class="icon"><?= $success ? '✓' : '✕' ?></div>

  <h1><?= $success ? 'Đặt phòng thành công!' : 'Thanh toán thất bại' ?></h1>
  <p class="sub">
    <?php if ($success): ?>
      Thanh toán của bạn đã được xác nhận. Chúng tôi sẽ gửi email xác nhận đặt phòng trong vài phút.
    <?php else: ?>
      <?= htmlspecialchars($errMsg) ?><br/>Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.
    <?php endif; ?>
  </p>

  <?php if ($refCode): ?>
  <div class="ref-block">
    <div class="ref-row">
      <span class="ref-label">Mã đặt phòng</span>
      <span class="ref-val gold"><?= htmlspecialchars($refCode) ?></span>
    </div>
    <?php if ($success): ?>
    <div class="ref-row">
      <span class="ref-label">Số tiền</span>
      <span class="ref-val"><?= $amount ?> ₫</span>
    </div>
    <div class="ref-row">
      <span class="ref-label">Thanh toán qua</span>
      <span class="ref-val">VNPay</span>
    </div>
    <?php endif; ?>
  </div>
  <?php endif; ?>

  <span class="badge">
    <?= $success ? '● Đã xác nhận' : '● Chưa thanh toán' ?>
  </span>

  <?php if (!$success && $errMsg): ?>
  <p class="err-msg"><?= htmlspecialchars($errMsg) ?></p>
  <?php endif; ?>

  <div class="actions">
    <?php if ($success): ?>
      <a href="profile.html" class="btn-gold">Xem đặt phòng</a>
      <a href="index.html" class="btn-ghost">Về trang chủ</a>
    <?php else: ?>
      <a href="javascript:history.back()" class="btn-gold">Thử lại</a>
      <a href="index.html" class="btn-ghost">Về trang chủ</a>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
