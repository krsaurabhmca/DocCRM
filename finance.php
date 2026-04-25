<?php
$page_title = "Finance & Revenue Dashboard";
require_once 'components/header.php';

// Revenue Stats
$total_revenue = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE status = 'Completed'"))['total'] ?? 0;
$today_revenue = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE status = 'Completed' AND followup_date = CURDATE()"))['total'] ?? 0;
$month_revenue = mysqli_fetch_assoc(mysqli_query($conn, "SELECT SUM(fee) as total FROM followups WHERE status = 'Completed' AND MONTH(followup_date) = MONTH(CURDATE()) AND YEAR(followup_date) = YEAR(CURDATE())"))['total'] ?? 0;

// Transactions
$transactions = mysqli_query($conn, "SELECT f.*, p.name as patient_name FROM followups f 
                                    JOIN patients p ON f.patient_id = p.id 
                                    WHERE f.status = 'Completed' AND f.fee > 0
                                    ORDER BY f.followup_date DESC, f.id DESC LIMIT 50");
?>

<div class="d-flex justify-between align-center mb-4">
    <div>
        <h2 class="mb-1">Financial Overview</h2>
        <p class="text-muted" style="font-size: 12px;">Track your clinic's revenue and transaction history</p>
    </div>
    <button onclick="window.print()" class="btn btn-secondary"><i class="fas fa-print"></i> Export Report</button>
</div>

<div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
    <div class="stat-card" style="border-left: 4px solid var(--primary);">
        <div class="stat-icon icon-blue"><i class="fas fa-wallet"></i></div>
        <div class="stat-info">
            <h3>Today's Earnings</h3>
            <p>₹<?= number_format($today_revenue, 2) ?></p>
        </div>
    </div>
    <div class="stat-card" style="border-left: 4px solid var(--success);">
        <div class="stat-icon icon-green"><i class="fas fa-calendar-alt"></i></div>
        <div class="stat-info">
            <h3>This Month</h3>
            <p>₹<?= number_format($month_revenue, 2) ?></p>
        </div>
    </div>
    <div class="stat-card" style="border-left: 4px solid var(--purple);">
        <div class="stat-icon icon-purple" style="background: #F5F3FF; color: #7C3AED;"><i class="fas fa-vault"></i></div>
        <div class="stat-info">
            <h3>Lifetime Revenue</h3>
            <p>₹<?= number_format($total_revenue, 2) ?></p>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Recent Transactions</h3>
    </div>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Patient Name</th>
                    <th>Visit Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($transactions)): ?>
                <tr>
                    <td><?= date('d M Y', strtotime($row['followup_date'])) ?></td>
                    <td>
                        <strong><?= htmlspecialchars($row['patient_name']) ?></strong>
                    </td>
                    <td><span class="badge badge-scheduled" style="background: #F1F5F9; color: #475569; border: none;"><?= htmlspecialchars($row['followup_type']) ?></span></td>
                    <td><strong style="color: var(--success);">₹<?= number_format($row['fee'], 2) ?></strong></td>
                    <td><span class="badge badge-submitted">Paid</span></td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($transactions) == 0): ?>
                <tr><td colspan="5" style="text-align: center; padding: 40px;">No transactions recorded yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
