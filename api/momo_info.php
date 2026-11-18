<?php
require_once __DIR__ . '/config.php';

try {
    $db = getDB();
    $st = $db->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('momo_phone','momo_account_name')");
    $rows = $st->fetchAll();
    $s = [];
    foreach ($rows as $r) $s[$r['key']] = $r['value'];
    respond([
        'phone'        => $s['momo_phone']        ?? '',
        'account_name' => $s['momo_account_name'] ?? '',
    ]);
} catch (Exception $e) {
    respond(['phone' => '', 'account_name' => '']);
}
