<?php
$page_title = 'Campaigns';
require_once 'components/header.php';

if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    mysqli_query($conn, "DELETE FROM campaigns WHERE id = $id");
    header("Location: campaigns.php");
    exit;
}

$query = "SELECT * FROM campaigns ORDER BY created_at DESC";
$campaigns = mysqli_query($conn, $query);
?>

<div class="d-flex justify-between align-center mb-4">
    <h2>Campaigns & Messaging</h2>
    <a href="campaign_form.php" class="btn btn-primary"><i class="fas fa-plus"></i> Create Campaign</a>
</div>

<div class="card">
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Categories Targeted</th>
                    <th>Type</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($campaigns)): 
                    $camp_id = $row['id'];
                    $c_res = mysqli_query($conn, "SELECT c.name FROM categories c JOIN campaign_categories cc ON c.id = cc.category_id WHERE cc.campaign_id = $camp_id");
                    $cats = [];
                    while($c = mysqli_fetch_assoc($c_res)){ $cats[] = $c['name']; }

                    // Count queued/sent
                    $q_res = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as total, SUM(CASE WHEN status='Sent' THEN 1 ELSE 0 END) as sent FROM message_queue WHERE campaign_id = $camp_id"));
                ?>
                <tr>
                    <td>
                        <strong><?= htmlspecialchars($row['title']) ?></strong>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                            Sent: <?= (int)$q_res['sent'] ?> / <?= (int)$q_res['total'] ?>
                        </div>
                    </td>
                    <td>
                        <?php foreach($cats as $cat_name): ?>
                            <span class="badge badge-scheduled" style="margin-bottom:2px;"><?= htmlspecialchars($cat_name) ?></span>
                        <?php endforeach; ?>
                        <?= empty($cats) ? '<span class="text-muted">None</span>' : '' ?>
                    </td>
                    <td>
                        <i class="fas <?= $row['content_type'] == 'Text' ? 'fa-align-left' : ($row['content_type'] == 'Image' ? 'fa-image' : 'fa-video') ?>"></i>
                        <?= htmlspecialchars($row['content_type']) ?>
                    </td>
                    <td><?= date('M d, Y h:i A', strtotime($row['scheduled_at'])) ?></td>
                    <td><span class="badge badge-<?= strtolower($row['status']) == 'completed' ? 'completed' : (strtolower($row['status']) == 'scheduled' ? 'pending' : 'scheduled') ?>"><?= $row['status'] ?></span></td>
                    <td>
                        <a href="campaigns.php?delete=<?= $row['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this campaign? All pending messages will be removed.')" title="Delete"><i class="fas fa-trash"></i></a>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php if(mysqli_num_rows($campaigns) == 0): ?>
                <tr><td colspan="6" style="text-align: center;">No campaigns created yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'components/footer.php'; ?>
