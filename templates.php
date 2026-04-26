<?php
$page_title = 'Message Templates';
require_once 'components/header.php';

// Handle deletion
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    mysqli_query($conn, "DELETE FROM templates WHERE id = $id AND clinic_id = $clinic_id");
    header("Location: templates.php");
    exit;
}

$query = "SELECT * FROM templates WHERE clinic_id = $clinic_id ORDER BY name ASC";
$templates = mysqli_query($conn, $query);
?>

<div class="d-flex justify-between align-center mb-4">
    <div>
        <h2 class="mb-1">WhatsApp Templates</h2>
        <p class="text-muted" style="font-size: 12px;">Manage reusable message structures for your campaigns and automation.</p>
    </div>
    <a href="template_form.php" class="btn btn-primary" style="padding: 10px 20px; border-radius: 10px;"><i class="fas fa-plus-circle"></i> Create Template</a>
</div>

<div class="grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
    <?php while($row = mysqli_fetch_assoc($templates)): 
        $icon = ($row['content_type'] == 'Image') ? 'fa-image' : 'fa-align-left';
        $badge_class = $row['is_default'] ? 'badge-submitted' : 'badge-scheduled';
    ?>
    <div class="card" style="border-radius: 16px; transition: transform 0.2s; cursor: default; display: flex; flex-direction: column;">
        <div style="padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: start;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 12px; background: #EEF2FF; color: #4F46E5; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                    <i class="fas <?= $icon ?>"></i>
                </div>
                <div>
                    <h4 style="margin: 0; font-size: 15px; color: var(--secondary);"><?= htmlspecialchars($row['name']) ?></h4>
                    <span class="badge <?= $badge_class ?>" style="font-size: 10px; padding: 2px 8px;"><?= $row['is_default'] ? 'Default Template' : 'Custom' ?></span>
                </div>
            </div>
            <div class="dropdown">
                <button class="btn btn-sm btn-secondary" style="border-radius: 8px; width: 32px; height: 32px; padding: 0;"><i class="fas fa-ellipsis-v"></i></button>
                <div class="dropdown-content">
                    <a href="template_form.php?id=<?= $row['id'] ?>"><i class="fas fa-edit"></i> Edit</a>
                    <a href="templates.php?delete=<?= $row['id'] ?>" style="color: var(--danger);" onclick="return confirm('Delete this template?')"><i class="fas fa-trash"></i> Delete</a>
                </div>
            </div>
        </div>
        <div style="padding: 20px; flex-grow: 1;">
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px;">Content Preview</label>
            <div style="background: #F8FAFC; border-radius: 10px; padding: 12px; font-size: 13px; color: #475569; line-height: 1.5; border: 1px solid #E2E8F0;">
                <p style="margin-bottom: 5px; font-weight: 600; color: #1E293B;"><?= htmlspecialchars($row['content_part1']) ?></p>
                <p style="margin-bottom: 5px;"><?= htmlspecialchars($row['content_part2']) ?></p>
                <p style="font-size: 11px; color: #94A3B8;"><?= htmlspecialchars($row['content_part3']) ?></p>
            </div>
        </div>
        <div style="padding: 15px 20px; background: #F8FAFC; border-radius: 0 0 16px 16px; font-size: 12px; color: var(--text-muted);">
            <i class="fas fa-code"></i> AOC Slug: <span style="font-family: monospace; color: var(--primary); font-weight: 600;"><?= $row['aoc_template_name'] ?: 'N/A' ?></span>
        </div>
    </div>
    <?php endwhile; ?>

    <?php if(mysqli_num_rows($templates) == 0): ?>
    <div class="card" style="grid-column: 1 / -1; padding: 80px; text-align: center; border-radius: 16px;">
        <i class="fas fa-layer-group" style="font-size: 48px; color: #CBD5E1; margin-bottom: 20px; display: block;"></i>
        <h3>No Templates Found</h3>
        <p class="text-muted">Create your first WhatsApp template to start sending messages.</p>
        <a href="template_form.php" class="btn btn-primary mt-4">Create Template</a>
    </div>
    <?php endif; ?>
</div>

<style>
.dropdown { position: relative; display: inline-block; }
.dropdown-content {
    display: none;
    position: absolute;
    right: 0;
    background-color: white;
    min-width: 120px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    border-radius: 10px;
    z-index: 1;
    border: 1px solid var(--border);
    overflow: hidden;
}
.dropdown:hover .dropdown-content { display: block; }
.dropdown-content a {
    color: var(--secondary);
    padding: 10px 15px;
    text-decoration: none;
    display: block;
    font-size: 13px;
    transition: background 0.2s;
}
.dropdown-content a:hover { background-color: #F1F5F9; }
.dropdown-content i { margin-right: 8px; width: 14px; }
</style>

<?php require_once 'components/footer.php'; ?>
