<?php
require_once 'db.php';
session_start();

if (isset($_SESSION['admin_id'])) {
    header("Location: index.php");
    exit;
}

$success = "";
$error = "";

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $clinic_name = mysqli_real_escape_string($conn, $_POST['clinic_name']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $phone = mysqli_real_escape_string($conn, $_POST['phone']);
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $address = mysqli_real_escape_string($conn, $_POST['address']);

    // Check if email or phone already exists
    $check_email = mysqli_query($conn, "SELECT id FROM clinics WHERE email = '$email'");
    $check_phone = mysqli_query($conn, "SELECT id FROM clinics WHERE phone = '$phone'");
    
    if (mysqli_num_rows($check_email) > 0) {
        $error = "The email address <b>$email</b> is already registered. Please use another email or login.";
    } elseif (mysqli_num_rows($check_phone) > 0) {
        $error = "The mobile number <b>$phone</b> is already registered. Please use another number.";
    } else {
        // Start transaction
        mysqli_begin_transaction($conn);
        try {
            // Insert into clinics
            mysqli_query($conn, "INSERT INTO clinics (name, email, phone, password, address) VALUES ('$clinic_name', '$email', '$phone', '$password', '$address')");
            $clinic_id = mysqli_insert_id($conn);

            // Insert into admins (Using email as username)
            mysqli_query($conn, "INSERT INTO admins (clinic_id, username, password) VALUES ($clinic_id, '$email', '$password')");

            // Seed app_settings for this clinic
            mysqli_query($conn, "INSERT INTO app_settings (clinic_id, setting_key, setting_value) VALUES 
                ($clinic_id, 'clinic_name', '$clinic_name'),
                ($clinic_id, 'whatsapp_enabled', '0'),
                ($clinic_id, 'whatsapp_api_key', ''),
                ($clinic_id, 'whatsapp_from_number', ''),
                ($clinic_id, 'clinic_address', '$address'),
                ($clinic_id, 'clinic_phone', '$phone'),
                ($clinic_id, 'clinic_email', '$email'),
                ($clinic_id, 'clinic_timings', '10:00 AM - 08:00 PM'),
                ($clinic_id, 'working_hours', '{}'),
                ($clinic_id, 'clinic_logo', ''),
                ($clinic_id, 'clinic_cover', 'http://192.168.1.15/doccrm/uploads/clinic_banner_default.png'),
                ($clinic_id, 'whatsapp_header_image', 'http://192.168.1.15/doccrm/uploads/clinic_banner_default.png'),
                ($clinic_id, 'working_days', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'),
                ($clinic_id, 'max_new_patients', '0'),
                ($clinic_id, 'max_old_patients', '0'),
                ($clinic_id, 'welcome_template', 'welcome_msg'),
                ($clinic_id, 'reminder_template', 'appointment_reminder')");

            mysqli_commit($conn);
            $success = "Registration successful! You can now login.";
        } catch (Exception $e) {
            mysqli_rollback($conn);
            $error = "Error: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clinic Registration - DocCRM</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0284C7;
            --primary-dark: #0369A1;
            --secondary: #0F172A;
            --bg-light: #F8FAFC;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        
        body { 
            background: var(--bg-light); 
            display: flex; 
            min-height: 100vh; 
            overflow-x: hidden;
        }

        .login-brand {
            flex: 1;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 80px;
            color: white;
            position: relative;
        }

        .login-brand::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');
            opacity: 0.1;
        }

        .brand-logo { font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; }
        .brand-logo i { background: white; color: var(--primary); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        
        .brand-text h1 { font-size: 2.5rem; line-height: 1.2; margin-bottom: 15px; }
        .brand-text p { opacity: 0.8; font-size: 1.1rem; max-width: 450px; }

        .login-form-side {
            flex: 1.5;
            background: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            position: relative;
        }

        .form-card { width: 100%; max-width: 500px; }
        .form-header { margin-bottom: 30px; }
        .form-header h2 { font-size: 1.8rem; color: var(--secondary); margin-bottom: 5px; }
        .form-header p { color: #64748B; font-size: 0.9rem; }

        .grid-form {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .form-group { margin-bottom: 15px; }
        .form-group.full-width { grid-column: span 2; }
        .form-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--secondary); margin-bottom: 8px; }
        
        .input-group { position: relative; }
        .input-group i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .input-control { 
            width: 100%; 
            padding: 12px 15px 12px 45px; 
            border: 1.5px solid #E2E8F0; 
            border-radius: 10px; 
            font-size: 0.9rem; 
            transition: all 0.3s;
        }
        .input-control:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.1); }

        .btn-register {
            width: 100%;
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        .btn-register:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.3); }

        .error-box { background: #FFF1F2; color: #E11D48; padding: 12px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 20px; text-align: center; border: 1px solid #FECDD3; }
        .success-box { background: #F0FDF4; color: #16A34A; padding: 12px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 20px; text-align: center; border: 1px solid #BBF7D0; }

        @media (max-width: 992px) {
            body { flex-direction: column; height: auto; overflow-y: auto; }
            .login-brand { padding: 40px 24px; text-align: center; justify-content: center; min-height: 250px; }
            .brand-logo { justify-content: center; font-size: 2rem; }
            .brand-logo i { width: 50px; height: 50px; font-size: 1.8rem; }
            .brand-text h1 { font-size: 1.8rem; }
            .brand-text p { margin: 0 auto; font-size: 1rem; }
            .login-form-side { padding: 40px 24px; }
            .grid-form { grid-template-columns: 1fr; gap: 15px; }
            .form-group.full-width { grid-column: span 1; }
        }
    </style>
</head>
<body>
    <div class="login-brand">
        <div class="brand-logo">
            <i class="fas fa-hospital"></i> DocCRM
        </div>
        <div class="brand-text">
            <h1>Start Your Clinic's <br> Digital Journey.</h1>
            <p>Join hundreds of clinics using DocCRM to streamline operations and enhance patient care.</p>
        </div>
    </div>

    <div class="login-form-side">
        <div class="form-card">
            <div class="form-header">
                <h2>Register Your Clinic</h2>
                <p>Fill in the details to create your clinic account</p>
            </div>

            <?php if($error): ?>
                <div class="error-box"><i class="fas fa-exclamation-circle"></i> <?= $error ?></div>
            <?php endif; ?>

            <?php if($success): ?>
                <div class="success-box"><i class="fas fa-check-circle"></i> <?= $success ?></div>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="login.php" class="btn-register" style="display: block; text-decoration: none;">Go to Login</a>
                </div>
            <?php else: ?>
                <form method="POST">
                    <div class="grid-form">
                        <div class="form-group full-width">
                            <label class="form-label">Clinic Name</label>
                            <div class="input-group">
                                <i class="fas fa-clinic-medical"></i>
                                <input type="text" name="clinic_name" class="input-control" placeholder="e.g. City Dental Care" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email Address</label>
                            <div class="input-group">
                                <i class="fas fa-envelope"></i>
                                <input type="email" name="email" class="input-control" placeholder="clinic@example.com" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Phone Number</label>
                            <div class="input-group">
                                <i class="fas fa-phone"></i>
                                <input type="text" name="phone" class="input-control" placeholder="10-digit number" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <div class="input-group">
                                <i class="fas fa-lock"></i>
                                <input type="password" name="password" class="input-control" placeholder="••••••••" required>
                            </div>
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">Clinic Address</label>
                            <div class="input-group">
                                <i class="fas fa-map-marker-alt"></i>
                                <input type="text" name="address" class="input-control" placeholder="Full address of the clinic" required>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="btn-register">Register Clinic & Create Account</button>
                </form>
                
                <div style="text-align: center; margin-top: 20px;">
                    <p style="font-size: 0.9rem; color: #64748B;">Already have an account? <a href="login.php" style="color: var(--primary); font-weight: 600; text-decoration: none;">Sign In</a></p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
