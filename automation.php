<?php
$page_title = "Campaign Automation Hub";
require_once 'components/header.php';

// Fetch Queue Stats
$stats = mysqli_fetch_assoc(mysqli_query($conn, "SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as sent,
    SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed
FROM message_queue WHERE clinic_id = $clinic_id"));

// Fetch Latest 20 Queue items (isolated by clinic)
$queue_items = mysqli_query($conn, "SELECT * FROM message_queue WHERE clinic_id = $clinic_id ORDER BY created_at DESC LIMIT 20");

// Get absolute path for cron command
$cron_path = realpath(__DIR__ . '/cron.php');
$php_path = PHP_BINARY ?: '/usr/bin/php';
$cron_command = "* * * * * $php_path $cron_path >> " . __DIR__ . "/cron_log.txt 2>&1";
?>

<div class="d-flex justify-between align-center mb-4">
    <div>
        <h2 class="mb-1">Campaign Automation Hub</h2>
        <p class="text-muted" style="font-size: 12px;">Monitor background message delivery and configure server tasks.</p>
    </div>
    <div class="d-flex gap-2">
        <div class="badge badge-scheduled" style="padding: 8px 12px;"><i class="fas fa-clock"></i> Server Time: <?= date('h:i A') ?> (IST)</div>
    </div>
</div>

<div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
    <div class="stat-card" style="border-bottom: 4px solid #6366F1;">
        <div class="stat-info">
            <h3 style="color: #6366F1;">Total Queued</h3>
            <p><?= $stats['total'] ?></p>
        </div>
    </div>
    <div class="stat-card" style="border-bottom: 4px solid #F59E0B;">
        <div class="stat-info">
            <h3 style="color: #F59E0B;">Pending</h3>
            <p><?= $stats['pending'] ?></p>
        </div>
    </div>
    <div class="stat-card" style="border-bottom: 4px solid #10B981;">
        <div class="stat-info">
            <h3 style="color: #10B981;">Sent</h3>
            <p><?= $stats['sent'] ?></p>
        </div>
    </div>
    <div class="stat-card" style="border-bottom: 4px solid #EF4444;">
        <div class="stat-info">
            <h3 style="color: #EF4444;">Failed</h3>
            <p><?= $stats['failed'] ?></p>
        </div>
    </div>
</div>

<div class="stats-grid" style="grid-template-columns: 2fr 1fr; gap: 24px; align-items: start;">
    <!-- Queue Table -->
    <div class="card" style="border-radius: 16px;">
        <div class="card-header d-flex justify-between align-center">
            <h3 class="card-title"><i class="fas fa-list-ul"></i> Delivery Status (Recent)</h3>
            <button onclick="window.location.reload()" class="btn btn-sm btn-secondary"><i class="fas fa-sync"></i> Refresh</button>
        </div>
        <div class="table-responsive">
            <table style="font-size: 13px;">
                <thead>
                    <tr>
                        <th>Recipient</th>
                        <th>Status</th>
                        <th>Scheduled</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while($item = mysqli_fetch_assoc($queue_items)): 
                        $status_color = [
                            'Pending' => '#F59E0B',
                            'Processing' => '#6366F1',
                            'Sent' => '#10B981',
                            'Failed' => '#EF4444'
                        ][$item['status']];
                    ?>
                    <tr>
                        <td>
                            <strong><?= $item['to_number'] ?></strong><br>
                            <span class="text-muted" style="font-size: 11px;"><?= $item['template_name'] ?></span>
                        </td>
                        <td>
                            <span style="color: <?= $status_color ?>; font-weight: 700; font-size: 11px;">
                                <i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i> <?= $item['status'] ?>
                            </span>
                        </td>
                        <td class="text-muted"><?= date('h:i A', strtotime($item['scheduled_at'])) ?></td>
                        <td>
                            <?php if($item['status'] == 'Sent'): ?>
                                <span class="text-success"><?= date('h:i A', strtotime($item['processed_at'])) ?></span>
                            <?php elseif($item['status'] == 'Failed'): ?>
                                <span class="text-danger" title="<?= htmlspecialchars($item['error_message']) ?>">Error <i class="fas fa-info-circle"></i></span>
                            <?php else: ?>
                                <span class="text-muted">Waiting...</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Cron Setup Docs -->
    <div style="display: flex; flex-direction: column; gap: 24px;">
        <div class="card" style="border-radius: 16px; border: 1px solid #E2E8F0; background: #F8FAFC;">
            <div class="card-header" style="background: #EEF2FF;">
                <h3 class="card-title" style="color: #4338CA;"><i class="fas fa-terminal"></i> Cron Job Setup</h3>
            </div>
            <div style="padding: 20px;">
                <p style="font-size: 13px; line-height: 1.6; color: #475569;">To ensure bulk campaigns send automatically in the background, you must add a Cron Job to your server.</p>
                
                <div style="margin-top: 20px;">
                    <label style="font-size: 11px; font-weight: 800; color: #6366F1; display: block; margin-bottom: 8px;">1. COPY THIS COMMAND</label>
                    <div style="background: #1E293B; color: #38BDF8; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; position: relative;">
                        <code><?= $cron_command ?></code>
                        <button onclick="navigator.clipboard.writeText('<?= addslashes($cron_command) ?>')" style="position: absolute; right: 10px; top: 10px; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 4px; padding: 4px 8px; cursor: pointer;">Copy</button>
                    </div>
                </div>

                <div style="margin-top: 20px;">
                    <label style="font-size: 11px; font-weight: 800; color: #6366F1; display: block; margin-bottom: 8px;">2. IN YOUR CPANEL/HOSTING</label>
                    <ul style="font-size: 12px; color: #475569; padding-left: 18px; line-height: 1.8;">
                        <li>Go to <strong>Cron Jobs</strong> or <strong>Task Scheduler</strong>.</li>
                        <li>Set timing to <strong>Every Minute</strong> (<code>* * * * *</code>).</li>
                        <li>Paste the command copied above in the "Command" field.</li>
                        <li>Click "Add New Cron Job".</li>
                    </ul>
                </div>

                <div style="margin-top: 20px; background: #FFF7ED; padding: 12px; border-radius: 8px; border: 1px solid #FFEDD5;">
                    <p style="font-size: 11px; color: #9A3412;"><strong><i class="fas fa-info-circle"></i> Why Cron?</strong> This script sends messages in small batches (5 per minute) to keep your WhatsApp account safe from spam filters and prevent server timeouts.</p>
                </div>
            </div>
        </div>

        <!-- Manual Process (Backup) -->
        <div class="card" style="border-radius: 16px;">
            <div style="padding: 20px;">
                <h4 style="font-size: 14px; margin-bottom: 10px;">Manual Processor</h4>
                <p style="font-size: 12px; color: #64748B; margin-bottom: 15px;">If you cannot set a Cron Job, click below to manually process the next 5 messages.</p>
                <a href="cron.php" target="_blank" class="btn btn-secondary" style="width: 100%; border-radius: 10px; font-weight: 700;">
                    <i class="fas fa-play"></i> Run Manual Batch
                </a>
            </div>
        </div>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
