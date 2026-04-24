<?php
require_once 'db.php';
$res = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM patients");
$row = mysqli_fetch_assoc($res);
echo "Patient Count: " . $row['cnt'] . "\n";

$res = mysqli_query($conn, "SELECT * FROM patients LIMIT 5");
while($row = mysqli_fetch_assoc($res)) {
    print_r($row);
}
?>
