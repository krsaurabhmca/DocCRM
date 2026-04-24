<?php
$page_title = 'Message Logs';
require_once 'db.php';

// Handle Export
if (isset($_GET['export'])) {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="message_logs_' . date('Y-m-d') . '.csv"');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['Time', 'Patient Name', 'Phone', 'Source', 'Message', 'Status', 'Error']);
    
    $export_query = "SELECT l.*, p.name as patient_name, p.phone, c.title as campaign_title 
                     FROM message_logs l 
                     JOIN patients p ON l.patient_id = p.id 
                     LEFT JOIN campaigns c ON l.campaign_id = c.id 
                     ORDER BY l.sent_at DESC";
    $export_result = mysqli_query($conn, $export_query);
    while ($row = mysqli_fetch_assoc($export_result)) {
        fputcsv($output, [
            $row['sent_at'],
            $row['patient_name'],
            $row['phone'],
            $row['campaign_title'] ?: 'Direct',
            $row['message'],
            $row['status'],
            $row['error_msg']
        ]);
    }
    fclose($output);
    exit;
}

require_once 'components/header.php';

// Handle Filter
$status_filter = isset($_GET['status']) ? mysqli_real_escape_string($conn, $_GET['status']) : '';
$where = "WHERE 1=1";
if ($status_filter) {
    $where .= " AND l.status = '$status_filter'";
}

$query = "SELECT l.*, p.name as patient_name, p.phone, c.title as campaign_title 
          FROM message_logs l 
          JOIN patients p ON l.patient_id = p.id 
          LEFT JOIN campaigns c ON l.campaign_id = c.id 
          $where
          ORDER BY l.sent_at DESC LIMIT 100";
$logs = mysqli_query($conn, $query);

// Stats
$stats = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as total, SUM(CASE WHEN status='Sent' THEN 1 ELSE 0 END) as sent, SUM(CASE WHEN status='Failed' THEN 1 ELSE 0 END) as failed FROM message_logs"));
?>

<div class="d-flex justify-between align-center mb-4">
    <h2>WhatsApp Message Logs</h2>
    <div class="d-flex align-center" style="gap: 10px;">
        <a href="message_logs.php?export=1" class="btn btn-secondary"><i class="fas fa-download"></i> Export CSV</a>
        <div style="margin-left: 10px;">
            <span class="badge badge-completed">Sent: <?= (int)$stats['sent'] ?></span>
            <span class="badge badge-cancelled">Failed: <?= (int)$stats['failed'] ?></span>
        </div>
    </div>
</div>

<div class="card mb-4" style="padding: 16px;">
    <form method="GET" class="d-flex align-center" style="gap: 10px;">
        <select name="status" class="form-control" style="max-width: 200px;">
            <option value="">All Status</option>
            <option value="Sent" <?= $status_filter == 'Sent' ? 'selected' : '' ?>>Sent</option>
            <option value="Failed" <?= $status_filter == 'Failed' ? 'selected' : '' ?>>Failed</option>
        </select>
        <button type="submit" class="btn btn-primary">Filter</button>
        <?php if($status_filter): ?>
            <a href="message_logs.php" class="btn btn-secondary">Clear</a>
        <?php endif; ?>
    </form>
</div>

<div class="card">
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Source</th>
                    <th>Message Preview</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($logs)): ?>
                <tr>
                    <td style="white-space: nowrap;"><?= date('M d, Y h:i A', strtotime($row['sent_at'])) ?></td>
                    <td>
                        <strong><?= htmlspecialchars($row['patient_name']) ?></strong><br>
                        <span style="font-size: 11px; color: var(--text-muted);"><?= htmlspecialchars($row['phone']) ?></span>
                    </td>
                    <td><?= $row['campaign_title'] ? htmlspecialchars($row['campaign_title']) : '<span class="badge" style="background:#E2E8F0; color:#475569;">Direct</span>' ?></td>
                    <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="<?= htmlspecialchars($row['message']) ?>">
                        <?= htmlspecialchars(substr($row['message'], 0, 50)) ?>...
                    </td>
                    <td>
                        <?php if($row['status'] == 'Sent'): ?>
                            <span class="badge badge-completed"><i class="fas fa-check"></i> Sent</span>
                        <?php else: ?>
                            <span class="badge badge-cancelled" title="<?= htmlspecialchars($row['error_msg']) ?>"><i class="fas fa-times"></i> Failed</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($logs) == 0): ?>
                <tr><td colspan="5" style="text-align: center;">No message logs found.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
