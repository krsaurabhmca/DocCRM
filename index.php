<?php
$page_title = 'Dashboard';
require_once 'components/header.php';

// Fetch stats
$patients_count = safe_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM patients WHERE clinic_id = $clinic_id"))['cnt'] ?? 0;
$pending_docs = safe_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM reminders WHERE status = 'Pending' AND clinic_id = $clinic_id"))['cnt'] ?? 0;
$scheduled_followups = safe_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM followups WHERE status = 'Scheduled' AND clinic_id = $clinic_id"))['cnt'] ?? 0;
$active_campaigns = safe_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM campaigns WHERE status IN ('Scheduled', 'Processing') AND clinic_id = $clinic_id"))['cnt'] ?? 0;

// Update overdue docs automatically
mysqli_query($conn, "UPDATE reminders SET status = 'Overdue' WHERE status = 'Pending' AND due_date < CURDATE() AND clinic_id = $clinic_id");

// Recent Patients
$recent_patients = mysqli_query($conn, "SELECT * FROM patients WHERE clinic_id = $clinic_id ORDER BY id DESC LIMIT 5");

// Delivery Report Stats
$delivery_stats = safe_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as total, SUM(CASE WHEN status='Sent' THEN 1 ELSE 0 END) as sent, SUM(CASE WHEN status='Failed' THEN 1 ELSE 0 END) as failed FROM message_logs WHERE clinic_id = $clinic_id"));
?>

<div class="d-flex justify-between align-center mb-4">
    <div>
        <h2 class="mb-1">Doctor's Control Center</h2>
        <p class="text-muted" style="font-size: 12px;">Welcome back! Here's your clinic overview for today.</p>
    </div>
    <a href="backup.php" class="btn btn-secondary"><i class="fas fa-database"></i> Backup Database</a>
</div>

<!-- Onboarding Hub -->
<div class="hub-grid">
    <div class="hub-card">
        <div class="hub-header">
            <i class="fas fa-hospital-user"></i>
            <span class="hub-title">Doctor's Counter Check-in</span>
        </div>
        <p class="hub-sub">Start a session for the next patient in line</p>
        <div class="hub-actions">
            <a href="patient_form.php" class="hub-btn hub-btn-primary">
                <div class="hub-btn-icon"><i class="fas fa-user-plus"></i></div>
                <div class="hub-btn-text">
                    <span class="hub-btn-label">New</span>
                    <span class="hub-btn-desc">Registration</span>
                </div>
            </a>
            <a href="followup_form.php" class="hub-btn hub-btn-success">
                <div class="hub-btn-icon"><i class="fas fa-sync"></i></div>
                <div class="hub-btn-text">
                    <span class="hub-btn-label">Old</span>
                    <span class="hub-btn-desc">Follow-up</span>
                </div>
            </a>
        </div>
    </div>

    <div class="hub-card">
        <div class="hub-header">
            <i class="fas fa-users-viewfinder"></i>
            <span class="hub-title">Today's Appointment Queue</span>
        </div>
        <p class="hub-sub">Manage live appointments and waiting list</p>
        <div class="hub-actions">
            <a href="queue.php" class="hub-btn hub-btn-purple">
                <div class="hub-btn-icon"><i class="fas fa-list-ol"></i></div>
                <div class="hub-btn-text">
                    <span class="hub-btn-label">Live Queue List</span>
                    <span class="hub-btn-desc">Token & Serial Tracking</span>
                </div>
            </a>
        </div>
    </div>
</div>

<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon icon-blue"><i class="fas fa-user-injured"></i></div>
        <div class="stat-info">
            <h3>Total Patients</h3>
            <p><?= number_format($patients_count) ?></p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon icon-sky"><i class="fas fa-bullhorn"></i></div>
        <div class="stat-info">
            <h3>Active Campaigns</h3>
            <p><?= number_format($active_campaigns) ?></p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon icon-green"><i class="fab fa-whatsapp"></i></div>
        <div class="stat-info">
            <h3>Messages Sent</h3>
            <p><?= number_format((int)$delivery_stats['sent']) ?></p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon icon-red"><i class="fas fa-calendar-check"></i></div>
        <div class="stat-info">
            <h3>Pending Follow-ups</h3>
            <p><?= number_format($scheduled_followups) ?></p>
            <a href="daily_reminders.php" style="font-size: 11px; color: var(--primary); text-decoration: none; font-weight: 600;">View Today's List <i class="fas fa-arrow-right"></i></a>
        </div>
    </div>
</div>

<div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Category-wise Patient Data</h3>
        </div>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Patients count</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $cat_stats = mysqli_query($conn, "SELECT c.name, COUNT(pc.patient_id) as total FROM categories c LEFT JOIN patient_categories pc ON c.id = pc.category_id WHERE c.clinic_id = $clinic_id GROUP BY c.id ORDER BY total DESC LIMIT 5");
                    while($row = mysqli_fetch_assoc($cat_stats)): 
                    ?>
                    <tr>
                        <td><?= htmlspecialchars($row['name']) ?></td>
                        <td><span class="badge badge-scheduled"><?= $row['total'] ?> Patients</span></td>
                    </tr>
                    <?php endwhile; ?>
                    <?php if(mysqli_num_rows($cat_stats) == 0): ?>
                    <tr><td colspan="2" style="text-align: center;">No category data available</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Recent Delivery Reports</h3>
            <a href="message_logs.php" class="btn btn-sm btn-secondary">Full Logs</a>
        </div>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Patient</th>
                        <th>Status</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $recent_logs = mysqli_query($conn, "SELECT l.*, p.name FROM message_logs l JOIN patients p ON l.patient_id = p.id WHERE l.clinic_id = $clinic_id ORDER BY l.sent_at DESC LIMIT 5");
                    while($row = mysqli_fetch_assoc($recent_logs)): 
                    ?>
                    <tr>
                        <td><?= htmlspecialchars($row['name']) ?></td>
                        <td>
                            <?php if($row['status'] == 'Sent'): ?>
                                <span class="badge badge-completed">Sent</span>
                            <?php else: ?>
                                <span class="badge badge-cancelled">Failed</span>
                            <?php endif; ?>
                        </td>
                        <td><span style="font-size: 11px; color: var(--text-muted);"><?= date('h:i A', strtotime($row['sent_at'])) ?></span></td>
                    </tr>
                    <?php endwhile; ?>
                    <?php if(mysqli_num_rows($recent_logs) == 0): ?>
                    <tr><td colspan="3" style="text-align: center;">No messages logged yet.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
