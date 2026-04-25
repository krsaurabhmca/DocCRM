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
            
            <div class="nav-section">Main Dashboard</div>
            <a href="index.php" class="nav-item <?= $current_page == 'index.php' ? 'active' : '' ?>">
                <i class="fas fa-chart-pie"></i> <span>Overview</span>
            </a>
            <a href="queue.php" class="nav-item <?= $current_page == 'queue.php' ? 'active' : '' ?>">
                <i class="fas fa-list-ol"></i> <span>Today's Queue</span>
            </a>
            <a href="finance.php" class="nav-item <?= $current_page == 'finance.php' ? 'active' : '' ?>">
                <i class="fas fa-wallet"></i> <span>Finance Hub</span>
            </a>
            
            <div class="nav-section mt-4">Clinic Operations</div>
            <a href="patients.php" class="nav-item <?= ($current_page == 'patients.php' || $current_page == 'patient_form.php') ? 'active' : '' ?>">
                <i class="fas fa-user-injured"></i> <span>Patient Directory</span>
            </a>
            <a href="doctors.php" class="nav-item <?= ($current_page == 'doctors.php' || $current_page == 'doctor_form.php') ? 'active' : '' ?>">
                <i class="fas fa-user-md"></i> <span>Doctors Team</span>
            </a>
            <a href="followups.php" class="nav-item <?= ($current_page == 'followups.php' || $current_page == 'followup_form.php') ? 'active' : '' ?>">
                <i class="fas fa-calendar-alt"></i> <span>Appointments</span>
            </a>
            <a href="reminders.php" class="nav-item <?= ($current_page == 'reminders.php' || $current_page == 'reminder_form.php') ? 'active' : '' ?>">
                <i class="fas fa-file-medical"></i> <span>Patient Docs</span>
            </a>

            <div class="nav-section mt-4">Outreach & CRM</div>
            <a href="campaigns.php" class="nav-item <?= ($current_page == 'campaigns.php' || $current_page == 'campaign_form.php') ? 'active' : '' ?>">
                <i class="fas fa-bullhorn"></i> <span>Campaigns</span>
            </a>
            <a href="message_logs.php" class="nav-item <?= $current_page == 'message_logs.php' ? 'active' : '' ?>">
                <i class="fas fa-history"></i> <span>Message Logs</span>
            </a>

            <div class="nav-section mt-4">System Config</div>
            <a href="automation.php" class="nav-item <?= $current_page == 'automation.php' ? 'active' : '' ?>">
                <i class="fas fa-robot"></i> <span>Automation Hub</span>
            </a>
            <a href="branding.php" class="nav-item <?= $current_page == 'branding.php' ? 'active' : '' ?>">
                <i class="fas fa-hospital"></i> <span>Clinic Branding</span>
            </a>
            <a href="categories.php" class="nav-item <?= ($current_page == 'categories.php' || $current_page == 'category_form.php') ? 'active' : '' ?>">
                <i class="fas fa-tags"></i> <span>Medical Categories</span>
            </a>
            <a href="diseases.php" class="nav-item <?= ($current_page == 'diseases.php' || $current_page == 'disease_form.php') ? 'active' : '' ?>">
                <i class="fas fa-virus"></i> <span>Disease Mapping</span>
            </a>
        </nav>
    </div>
    <div class="sidebar-footer">
        <a href="logout.php" class="nav-item" style="color: var(--danger);">
            <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
        </a>
    </div>
</aside>
