<?php 
require_once 'db.php'; 
session_start();

if (!isset($_SESSION['admin_id'])) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocCRM - Patient Reminder & Follow-up</title>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<?php include 'components/sidebar.php'; ?>

<main class="main-wrapper">
    <header class="topbar">
        <button class="mobile-toggle" id="mobile-toggle">
            <i class="fas fa-bars"></i>
        </button>
        <div class="topbar-title">
            <?php echo isset($page_title) ? $page_title : 'Dashboard'; ?>
        </div>
        <div class="user-profile">
            <span>Admin User</span>
            <div class="avatar">A</div>
        </div>
    </header>
    
    <div class="content animate-fade-in">
