<aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="logo-icon"><i class="fas fa-heartbeat"></i></div>
        <span class="logo-text">DocCRM</span>
        <button class="collapse-toggle" id="collapse-toggle">
            <i class="fas fa-chevron-left"></i>
        </button>
    </div>
    <div class="sidebar-scroll">
        <nav class="sidebar-nav">
            <?php $current_page = basename($_SERVER['PHP_SELF']); ?>
            
            <div class="nav-section">Main Menu</div>
            <a href="index.php" class="nav-item <?= $current_page == 'index.php' ? 'active' : '' ?>">
                <i class="fas fa-chart-pie"></i> <span>Dashboard</span>
            </a>
            
            <div class="nav-section mt-4">CRM Management</div>
            <a href="patients.php" class="nav-item <?= ($current_page == 'patients.php' || $current_page == 'patient_form.php') ? 'active' : '' ?>">
                <i class="fas fa-user-injured"></i> <span>Patients</span>
            </a>
            <a href="reminders.php" class="nav-item <?= ($current_page == 'reminders.php' || $current_page == 'reminder_form.php') ? 'active' : '' ?>">
                <i class="fas fa-file-signature"></i> <span>Documents</span>
            </a>
            <a href="followups.php" class="nav-item <?= ($current_page == 'followups.php' || $current_page == 'followup_form.php') ? 'active' : '' ?>">
                <i class="fas fa-calendar-check"></i> <span>Follow-ups</span>
            </a>
            <a href="daily_reminders.php" class="nav-item <?= ($current_page == 'daily_reminders.php') ? 'active' : '' ?>">
                <i class="fas fa-bell"></i> <span>Daily Reminders</span>
            </a>

            <div class="nav-section mt-4">Settings & Config</div>
            <a href="categories.php" class="nav-item <?= ($current_page == 'categories.php' || $current_page == 'category_form.php') ? 'active' : '' ?>">
                <i class="fas fa-tags"></i> <span>Categories</span>
            </a>
            <a href="diseases.php" class="nav-item <?= ($current_page == 'diseases.php' || $current_page == 'disease_form.php') ? 'active' : '' ?>">
                <i class="fas fa-virus"></i> <span>Diseases</span>
            </a>
            <a href="campaigns.php" class="nav-item <?= ($current_page == 'campaigns.php' || $current_page == 'campaign_form.php') ? 'active' : '' ?>">
                <i class="fas fa-bullhorn"></i> <span>Campaigns</span>
            </a>
            <a href="single_message.php" class="nav-item <?= ($current_page == 'single_message.php') ? 'active' : '' ?>">
                <i class="fab fa-whatsapp"></i> <span>Direct Message</span>
            </a>
            <a href="message_logs.php" class="nav-item <?= ($current_page == 'message_logs.php') ? 'active' : '' ?>">
                <i class="fas fa-history"></i> <span>Message Logs</span>
            </a>
        </nav>
    </div>
    <div class="sidebar-footer">
        <a href="logout.php" class="nav-item" style="color: var(--danger);">
            <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
        </a>
    </div>
</aside>
