<?php
ob_start();
$page_title = 'Patient Appointments Calendar';
require_once 'components/header.php';

// Handle deletion
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    mysqli_query($conn, "DELETE FROM followups WHERE id = $id AND clinic_id = $clinic_id");
    header("Location: followups.php?date=" . ($_GET['date'] ?? ''));
    exit;
}

$selected_date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$month = date('m', strtotime($selected_date));
$year = date('Y', strtotime($selected_date));

// Fetch followup counts for the month for calendar dots (isolated by clinic)
$counts_query = "SELECT followup_date, COUNT(*) as cnt FROM followups WHERE clinic_id = $clinic_id AND MONTH(followup_date) = '$month' AND YEAR(followup_date) = '$year' GROUP BY followup_date";
$counts_res = mysqli_query($conn, $counts_query);
$event_dates = [];
while($row = mysqli_fetch_assoc($counts_res)) {
    $event_dates[$row['followup_date']] = $row['cnt'];
}

// Fetch patients for the selected date (isolated by clinic)
$query = "SELECT f.*, p.name as patient_name, p.phone, p.gender FROM followups f JOIN patients p ON f.patient_id = p.id WHERE f.clinic_id = $clinic_id AND f.followup_date = '$selected_date' ORDER BY f.id ASC";
$followups = mysqli_query($conn, $query);

// Calendar Logic
$first_day_of_month = date('w', strtotime("$year-$month-01"));
$days_in_month = date('t', strtotime("$year-$month-01"));
$prev_month = date('Y-m-d', strtotime("$year-$month-01 -1 month"));
$next_month = date('Y-m-d', strtotime("$year-$month-01 +1 month"));
?>

<div class="calendar-layout">
    <!-- Left Pane: Calendar -->
    <div class="calendar-card">
        <div class="calendar-header">
            <a href="followups.php?date=<?= $prev_month ?>" class="btn btn-sm btn-secondary"><i class="fas fa-chevron-left"></i></a>
            <span class="calendar-month-title"><?= date('F Y', strtotime("$year-$month-01")) ?></span>
            <a href="followups.php?date=<?= $next_month ?>" class="btn btn-sm btn-secondary"><i class="fas fa-chevron-right"></i></a>
        </div>
        
        <div class="calendar-grid">
            <div class="calendar-day-label">Su</div>
            <div class="calendar-day-label">Mo</div>
            <div class="calendar-day-label">Tu</div>
            <div class="calendar-day-label">We</div>
            <div class="calendar-day-label">Th</div>
            <div class="calendar-day-label">Fr</div>
            <div class="calendar-day-label">Sa</div>
            
            <?php 
            // Empty slots for previous month
            for($i = 0; $i < $first_day_of_month; $i++) echo '<div class="calendar-date empty"></div>';
            
            // Days of the month
            for($day = 1; $day <= $days_in_month; $day++) {
                $current_loop_date = sprintf('%04d-%02d-%02d', $year, $month, $day);
                $is_active = ($current_loop_date == $selected_date);
                $has_event = isset($event_dates[$current_loop_date]);
                
                echo '<a href="followups.php?date='.$current_loop_date.'" class="calendar-date '.($is_active ? 'active' : '').' '.($has_event ? 'has-event' : '').'">';
                echo $day;
                echo '</a>';
            }
            ?>
        </div>
        
        <div style="margin-top: 30px;">
            <a href="followup_form.php?date=<?= $selected_date ?>" class="btn btn-primary" style="width: 100%; border-radius: 12px; padding: 12px;">
                <i class="fas fa-plus"></i> New Appointment
            </a>
        </div>
    </div>

    <!-- Right Pane: List -->
    <div>
        <div class="d-flex justify-between align-center mb-4">
            <div>
                <h2 class="mb-1">Appointments List</h2>
                <p class="text-muted" style="font-size: 12px;">Patients scheduled for <?= date('D, d M Y', strtotime($selected_date)) ?></p>
            </div>
            <?php if(mysqli_num_rows($followups) > 0): ?>
                <span class="badge badge-scheduled" style="padding: 6px 12px;"><?= mysqli_num_rows($followups) ?> Patients</span>
            <?php endif; ?>
        </div>

        <div class="card">
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Visit Type</th>
                            <th>Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = mysqli_fetch_assoc($followups)): 
                            $status_class = strtolower($row['status']);
                            $gender_color = ($row['gender'] == 'Female') ? '#DB2777' : '#0284C7';
                        ?>
                        <tr>
                            <td>
                                <strong><?= htmlspecialchars($row['patient_name']) ?></strong><br>
                                <span class="text-muted" style="font-size: 11px;"><i class="fas fa-phone-alt"></i> <?= htmlspecialchars($row['phone']) ?></span>
                            </td>
                            <td><span class="badge badge-scheduled" style="background: #F1F5F9; color: #475569; border: none;"><?= htmlspecialchars($row['followup_type']) ?></span></td>
                            <td><span class="badge badge-<?= $status_class ?>"><?= $row['status'] ?></span></td>
                            <td style="text-align: right;">
                                <a href="followup_form.php?id=<?= $row['id'] ?>&date=<?= $selected_date ?>" class="btn btn-sm btn-secondary" title="Edit"><i class="fas fa-edit"></i></a>
                                <a href="followups.php?delete=<?= $row['id'] ?>&date=<?= $selected_date ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this appointment?')" title="Delete"><i class="fas fa-trash"></i></a>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                        <?php if(mysqli_num_rows($followups) == 0): ?>
                        <tr><td colspan="4" style="text-align: center; padding: 60px;">
                            <div class="text-muted">
                                <i class="fas fa-calendar-xmark" style="font-size: 40px; margin-bottom: 15px; display: block;"></i>
                                No appointments scheduled for this date.
                            </div>
                        </td></tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php require_once 'components/footer.php'; 
ob_end_flush();
?>
