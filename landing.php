<?php
require_once 'api/config.php';
$conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Fetch Clinic Info
$settings_res = mysqli_query($conn, "SELECT * FROM app_settings");
$settings = [];
while ($row = mysqli_fetch_assoc($settings_res)) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

// Fetch Services (Categories)
$services = mysqli_query($conn, "SELECT * FROM categories LIMIT 6");

// Fetch Doctors
$doctors = mysqli_query($conn, "SELECT * FROM doctors WHERE is_active = 1 LIMIT 4");

// Live Token Status
$now_calling = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM followups WHERE status = 'Completed' AND followup_date = CURDATE()"))['cnt'] + 1;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($settings['clinic_name'] ?? 'DocCRM Clinic') ?> - Quality Healthcare</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0284C7;
            --secondary: #0F172A;
            --accent: #059669;
            --text-main: #334155;
            --bg-light: #F8FAFC;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { color: var(--text-main); line-height: 1.6; overflow-x: hidden; }

        /* Hero Section */
        .hero {
            height: 90vh;
            background: linear-gradient(135deg, rgba(2, 132, 199, 0.9), rgba(15, 23, 42, 0.9)), 
                        url('<?= $settings['clinic_cover'] ?? 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000' ?>');
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
            padding: 20px;
        }

        .hero-content h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 20px; letter-spacing: -1px; line-height: 1.1; }
        .hero-content p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 40px; max-width: 700px; margin-left: auto; margin-right: auto; }

        /* Floating Token Display */
        .token-tracker {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: inline-flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
        }

        .token-number { font-size: 4rem; font-weight: 800; color: #38BDF8; line-height: 1; }
        .token-label { text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; font-weight: 600; opacity: 0.8; }

        /* Section Styling */
        section { padding: 100px 10%; }
        .section-header { text-align: center; margin-bottom: 60px; }
        .section-header h2 { font-size: 2.5rem; color: var(--secondary); margin-bottom: 15px; }
        .section-header p { color: #64748B; max-width: 600px; margin: 0 auto; }

        /* Grid Styling */
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }

        /* Service Cards */
        .card {
            background: white;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
            border: 1px solid #F1F5F9;
            transition: all 0.3s ease;
            text-align: center;
        }

        .card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        .card i { font-size: 2.5rem; color: var(--primary); margin-bottom: 20px; }
        .card h3 { font-size: 1.3rem; margin-bottom: 10px; color: var(--secondary); }

        /* Doctor Profiles */
        .doctor-card {
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
            text-align: center;
        }

        .doctor-img { height: 250px; background: #E2E8F0; display: flex; align-items: flex-end; justify-content: center; }
        .doctor-img img { width: 100%; height: 100%; object-fit: cover; }
        .doctor-info { padding: 25px; }
        .doctor-info h3 { margin-bottom: 5px; }
        .doctor-info span { font-size: 0.9rem; color: var(--primary); font-weight: 600; }

        /* Contact & Footer */
        .footer { background: var(--secondary); color: white; padding: 100px 10% 40px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 50px; margin-bottom: 60px; }
        .footer-brand h2 { font-size: 2rem; margin-bottom: 20px; color: white; }
        .footer-brand p { opacity: 0.6; }
        .footer-links h4 { margin-bottom: 25px; font-size: 1.1rem; }
        .footer-links ul { list-style: none; }
        .footer-links ul li { margin-bottom: 12px; opacity: 0.7; }

        .btn {
            padding: 15px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
            transition: all 0.3s;
        }

        .btn-primary { background: white; color: var(--primary); }
        .btn-primary:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .hero-content h1 { font-size: 2.5rem; }
            .footer-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

    <!-- Hero Section -->
    <div class="hero">
        <div class="hero-content">
            <div style="display: inline-block; padding: 10px 20px; background: rgba(255,255,255,0.1); border-radius: 50px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 600;">
                <i class="fas fa-certificate" style="color: #38BDF8;"></i> Certified Healthcare Professionals
            </div>
            <h1>Compassionate Care <br> For a Better Life</h1>
            <p><?= htmlspecialchars($settings['clinic_address'] ?? 'Providing advanced medical solutions with a human touch.') ?></p>
            
            <div class="token-tracker">
                <span class="token-label">Currently Calling</span>
                <span class="token-number">#<?= $now_calling ?></span>
                <span style="font-size: 0.9rem; opacity: 0.7;">Live Patient Queue</span>
            </div>
            
            <div style="margin-top: 50px;">
                <a href="login.php" class="btn btn-primary">Clinic Portal Access</a>
            </div>
        </div>
    </div>

    <!-- Services Section -->
    <section id="services">
        <div class="section-header">
            <h2>Specialized Services</h2>
            <p>Our clinic offers a wide range of medical specialties to cater to your family's health needs.</p>
        </div>
        <div class="grid">
            <?php while($row = mysqli_fetch_assoc($services)): ?>
            <div class="card">
                <i class="fas fa-stethoscope"></i>
                <h3><?= htmlspecialchars($row['name']) ?></h3>
                <p style="font-size: 0.9rem; color: #64748B;">Comprehensive care and advanced treatment for <?= strtolower($row['name']) ?> related conditions.</p>
            </div>
            <?php endwhile; ?>
            <?php if(mysqli_num_rows($services) == 0): ?>
            <div class="card"><h3>General Consultation</h3></div>
            <div class="card"><h3>Pediatric Care</h3></div>
            <div class="card"><h3>Cardiac Health</h3></div>
            <?php endif; ?>
        </div>
    </section>

    <!-- Doctors Section -->
    <section id="doctors" style="background: var(--bg-light);">
        <div class="section-header">
            <h2>Meet Our Experts</h2>
            <p>A team of highly qualified and experienced doctors dedicated to your wellness.</p>
        </div>
        <div class="grid">
            <?php while($row = mysqli_fetch_assoc($doctors)): ?>
            <div class="doctor-card">
                <div class="doctor-img">
                    <i class="fas fa-user-md" style="font-size: 120px; color: #CBD5E1; margin-bottom: 30px;"></i>
                </div>
                <div class="doctor-info">
                    <h3><?= htmlspecialchars($row['name']) ?></h3>
                    <span><?= htmlspecialchars($row['specialization']) ?></span>
                    <p style="font-size: 0.8rem; color: #94A3B8; margin-top: 10px;"><?= htmlspecialchars($row['qualification']) ?> • <?= $row['experience'] ?> Years Exp.</p>
                </div>
            </div>
            <?php endwhile; ?>
            <?php if(mysqli_num_rows($doctors) == 0): ?>
            <div class="doctor-card"><div class="doctor-info"><h3>Medical Team</h3><span>Available 24/7</span></div></div>
            <?php endif; ?>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-grid">
            <div class="footer-brand">
                <h2><?= htmlspecialchars($settings['clinic_name'] ?? 'DocCRM') ?></h2>
                <p>Leading the way in medical excellence with advanced technology and patient-centric care models. Your health is our priority.</p>
                <div style="margin-top: 30px; display: flex; gap: 15px;">
                    <i class="fab fa-facebook" style="font-size: 1.5rem;"></i>
                    <i class="fab fa-twitter" style="font-size: 1.5rem;"></i>
                    <i class="fab fa-instagram" style="font-size: 1.5rem;"></i>
                </div>
            </div>
            <div class="footer-links">
                <h4>Quick Links</h4>
                <ul>
                    <li>Home</li>
                    <li>Services</li>
                    <li>Doctors</li>
                    <li>Contact Us</li>
                </ul>
            </div>
            <div class="footer-links">
                <h4>Contact Info</h4>
                <ul>
                    <li><i class="fas fa-phone"></i> <?= htmlspecialchars($settings['clinic_phone'] ?? 'Contact Not Set') ?></li>
                    <li><i class="fas fa-envelope"></i> <?= htmlspecialchars($settings['clinic_email'] ?? 'info@doccrm.com') ?></li>
                    <li><i class="fas fa-map-marker-alt"></i> <?= htmlspecialchars($settings['clinic_address'] ?? 'Clinic Address Not Set') ?></li>
                    <li><i class="fas fa-clock"></i> <?= htmlspecialchars($settings['clinic_timings'] ?? '10:00 AM - 08:00 PM') ?></li>
                </ul>
            </div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; text-align: center; font-size: 0.8rem; opacity: 0.5;">
            &copy; <?= date('Y') ?> <?= htmlspecialchars($settings['clinic_name'] ?? 'DocCRM') ?>. All rights reserved.
        </div>
    </footer>

</body>
</html>
