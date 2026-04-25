<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$res = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM patients");
if ($res) {
    $row = mysqli_fetch_assoc($res);
    echo json_encode(['success' => true, 'count' => $row['cnt']]);
} else {
    echo json_encode(['success' => false, 'error' => mysqli_error($conn)]);
}
