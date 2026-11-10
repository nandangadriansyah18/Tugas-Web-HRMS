-- ============================================================
-- DATABASE HRMS ENTERPRISE (XAMPP / MySQL / MariaDB)
-- Sistem Informasi Kepegawaian & SDM — PT Sawit Abadi Tbk
-- Cara Import    :
-- 1. Buka phpMyAdmin (http://localhost/phpmyadmin)
-- 2. Klik tab "Import" di menu atas (atau klik database 'db_hrms' lalu "Import")
-- 3. Pilih file database_hrms.sql ini lalu klik "Import" / "Go"
-- ============================================================

CREATE DATABASE IF NOT EXISTS `db_hrms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_hrms`;

-- ------------------------------------------------------------
-- 1. Tabel: users (Akun Login Admin & Seluruh Pegawai)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(150) NOT NULL,
  `role` enum('admin','pegawai') NOT NULL DEFAULT 'pegawai',
  `employee_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `employee_id`) VALUES
('ADMIN-1', 'admin', 'admin123', 'Sarah Wijaya (Admin HRD)', 'admin', NULL),
('USR-001', 'pegawai', 'pegawai123', 'Budi Santoso, S.Kom', 'pegawai', 'EMP-001'),
('USR-002', 'siti.nurhaliza@company.co.id', 'pegawai123', 'Siti Nurhaliza, S.I.Kom', 'pegawai', 'EMP-002'),
('USR-003', 'dimas.pratama@company.co.id', 'pegawai123', 'Dimas Pratama, S.E.', 'pegawai', 'EMP-003'),
('USR-004', 'amanda.putri@company.co.id', 'pegawai123', 'Amanda Putri, S.Psi', 'pegawai', 'EMP-004'),
('USR-005', 'rizky.ramadhan@company.co.id', 'pegawai123', 'Rizky Ramadhan, S.T.', 'pegawai', 'EMP-005'),
('USR-006', 'nadia.vega@company.co.id', 'pegawai123', 'Nadia Vega, S.Ds', 'pegawai', 'EMP-006'),
('USR-007', 'hendra.wijaya@company.co.id', 'pegawai123', 'Hendra Wijaya, S.Kom', 'pegawai', 'EMP-007'),
('USR-008', 'clara.shinta@company.co.id', 'pegawai123', 'Clara Shinta, S.Ak', 'pegawai', 'EMP-008');

-- ------------------------------------------------------------
-- 2. Tabel: departments (Data Divisi / Departemen)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `color` varchar(30) NOT NULL DEFAULT 'cyan',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `departments` (`id`, `name`, `color`) VALUES
('dept-it', 'IT & Engineering', 'cyan'),
('dept-mkt', 'Marketing & Creative', 'purple'),
('dept-fin', 'Finance & Operations', 'green'),
('dept-hr', 'Human Resources', 'yellow');

-- ------------------------------------------------------------
-- 3. Tabel: employees (Data Master Karyawan)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` varchar(50) NOT NULL,
  `nip` varchar(30) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT '-',
  `gender` enum('L','P') NOT NULL DEFAULT 'L',
  `departmentId` varchar(50) NOT NULL,
  `jabatan` varchar(100) NOT NULL,
  `status` enum('Aktif','Cuti','Non-Aktif') NOT NULL DEFAULT 'Aktif',
  `joinDate` date NOT NULL,
  `kontrak` varchar(30) NOT NULL DEFAULT 'PKWTT',
  `level` int(11) NOT NULL DEFAULT 1,
  `gaji` bigint(20) NOT NULL DEFAULT 0,
  `tunjangan` bigint(20) NOT NULL DEFAULT 0,
  `workModel` varchar(50) NOT NULL DEFAULT 'WFO Jakarta',
  `photo` longtext DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nip` (`nip`),
  KEY `idx_dept` (`departmentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `employees` (`id`, `nip`, `nama`, `email`, `phone`, `gender`, `departmentId`, `jabatan`, `status`, `joinDate`, `kontrak`, `level`, `gaji`, `tunjangan`, `workModel`, `photo`) VALUES
('EMP-001', 'EMP-0012', 'Budi Santoso, S.Kom', 'budi.santoso@company.co.id', '+62 812-3456-7890', 'L', 'dept-it', 'Senior Software Engineer', 'Aktif', '2023-01-15', 'PKWTT', 4, 18500000, 3500000, 'Hybrid Flex', NULL),
('EMP-002', 'EMP-0104', 'Siti Nurhaliza, S.I.Kom', 'siti.nurhaliza@company.co.id', '+62 813-9876-5432', 'P', 'dept-mkt', 'Digital Marketing Lead', 'Aktif', '2023-03-10', 'PKWTT', 3, 14000000, 2500000, 'WFO Jakarta', NULL),
('EMP-003', 'EMP-0042', 'Dimas Pratama, S.E.', 'dimas.pratama@company.co.id', '+62 811-2233-4455', 'L', 'dept-fin', 'Financial Analyst', 'Aktif', '2022-11-01', 'PKWTT', 3, 13500000, 2200000, 'WFO Jakarta', NULL),
('EMP-004', 'EMP-0123', 'Amanda Putri, S.Psi', 'amanda.putri@company.co.id', '+62 857-1122-3344', 'P', 'dept-hr', 'HR Recruitment Specialist', 'Cuti', '2024-02-20', 'PKWT', 2, 10500000, 1800000, 'WFO Jakarta', NULL),
('EMP-005', 'EMP-0077', 'Rizky Ramadhan, S.T.', 'rizky.ramadhan@company.co.id', '+62 821-5566-7788', 'L', 'dept-it', 'DevOps & Cloud Architect', 'Aktif', '2022-06-12', 'PKWTT', 4, 19500000, 4000000, 'Full Remote', NULL),
('EMP-006', 'EMP-0089', 'Nadia Vega, S.Ds', 'nadia.vega@company.co.id', '+62 819-4433-2211', 'P', 'dept-mkt', 'UI/UX Product Designer', 'Aktif', '2024-05-02', 'PKWT', 2, 11500000, 2000000, 'Hybrid Flex', NULL),
('EMP-007', 'EMP-0095', 'Hendra Wijaya, S.Kom', 'hendra.wijaya@company.co.id', '+62 812-9988-7766', 'L', 'dept-it', 'Backend Developer', 'Aktif', '2023-08-14', 'PKWTT', 3, 15000000, 2800000, 'Hybrid Flex', NULL),
('EMP-008', 'EMP-0110', 'Clara Shinta, S.Ak', 'clara.shinta@company.co.id', '+62 813-6655-4433', 'P', 'dept-fin', 'Tax & Accounting Officer', 'Non-Aktif', '2023-04-01', 'PKWT', 2, 10000000, 1500000, 'WFO Jakarta', NULL);

-- ------------------------------------------------------------
-- 4. Tabel: attendance (Data Presensi Harian)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` varchar(50) NOT NULL,
  `employeeId` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `clockIn` varchar(20) NOT NULL,
  `clockOut` varchar(20) DEFAULT NULL,
  `scheduledIn` varchar(20) DEFAULT '08:00',
  `status` varchar(50) NOT NULL DEFAULT 'Tepat Waktu',
  `location` varchar(150) NOT NULL DEFAULT 'WFO Sudirman (Gate A)',
  `lateMinutes` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_emp_att` (`employeeId`),
  KEY `idx_date_att` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `attendance` (`id`, `employeeId`, `date`, `clockIn`, `clockOut`, `scheduledIn`, `status`, `location`, `lateMinutes`, `createdAt`) VALUES
('ATT-001', 'EMP-001', '2026-10-06', '07:52', '17:05', '08:00', 'Tepat Waktu', 'WFO Sudirman (Gate A)', 0, '2026-10-06 07:52:00'),
('ATT-002', 'EMP-002', '2026-10-06', '08:14', '17:15', '08:00', 'Terlambat', 'WFO Sudirman (Gate B)', 14, '2026-10-06 08:14:00'),
('ATT-003', 'EMP-003', '2026-10-06', '07:48', '17:00', '08:00', 'Tepat Waktu', 'WFO Sudirman (Gate A)', 0, '2026-10-06 07:48:00'),
('ATT-004', 'EMP-005', '2026-10-06', '08:00', '17:30', '08:00', 'WFH / Remote', 'Remote Location (Bandung)', 0, '2026-10-06 08:00:00'),
('ATT-005', 'EMP-006', '2026-10-06', '07:55', '17:10', '08:00', 'Tepat Waktu', 'WFO Sudirman (Gate A)', 0, '2026-10-06 07:55:00'),
('ATT-006', 'EMP-007', '2026-10-06', '08:25', NULL, '08:00', 'Terlambat', 'WFO Sudirman (Gate A)', 25, '2026-10-06 08:25:00'),
('ATT-007', 'EMP-001', '2026-10-05', '07:50', '17:02', '08:00', 'Tepat Waktu', 'WFO Sudirman (Gate A)', 0, '2026-10-05 07:50:00'),
('ATT-008', 'EMP-002', '2026-10-05', '07:58', '17:00', '08:00', 'Tepat Waktu', 'WFO Sudirman (Gate A)', 0, '2026-10-05 07:58:00');

-- ------------------------------------------------------------
-- 5. Tabel: leave_requests (Pengajuan Cuti & Izin)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `leave_requests`;
CREATE TABLE `leave_requests` (
  `id` varchar(50) NOT NULL,
  `employeeId` varchar(50) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `duration` int(11) NOT NULL DEFAULT 1,
  `type` varchar(100) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_emp_leave` (`employeeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `leave_requests` (`id`, `employeeId`, `startDate`, `endDate`, `duration`, `type`, `reason`, `status`, `createdAt`) VALUES
('LVE-001', 'EMP-001', '2026-10-26', '2026-10-28', 3, 'Cuti Tahunan', 'Liburan keluarga ke Yogyakarta', 'Pending', '2026-10-06 09:00:00'),
('LVE-002', 'EMP-002', '2026-10-25', '2026-10-25', 1, 'Izin Urusan Keluarga', 'Menghadiri acara wisuda adik', 'Pending', '2026-10-06 08:30:00'),
('LVE-003', 'EMP-003', '2026-10-20', '2026-10-21', 2, 'Cuti Sakit', 'Istirahat medis sesuai surat dokter', 'Approved', '2026-10-05 14:00:00'),
('LVE-004', 'EMP-004', '2026-10-18', '2026-10-19', 2, 'Cuti Tahunan', 'Keperluan pribadi di luar kota', 'Approved', '2026-10-04 11:00:00'),
('LVE-005', 'EMP-005', '2026-10-15', '2026-10-15', 1, 'Cuti Pribadi', 'Mengurus perpanjangan dokumen negara', 'Approved', '2026-10-03 10:00:00'),
('LVE-006', 'EMP-006', '2026-10-10', '2026-10-12', 3, 'Cuti Tahunan', 'Acara pernikahan keluarga', 'Rejected', '2026-10-02 16:00:00');

-- ------------------------------------------------------------
-- 6. Tabel: payroll (Data Penggajian Bulanan)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payroll`;
CREATE TABLE `payroll` (
  `id` varchar(50) NOT NULL,
  `employeeId` varchar(50) NOT NULL,
  `periode` varchar(30) NOT NULL DEFAULT 'Oktober 2026',
  `gajiPokok` bigint(20) NOT NULL DEFAULT 0,
  `tunjangan` bigint(20) NOT NULL DEFAULT 0,
  `tunjanganDetail` varchar(150) DEFAULT 'Transport + Makan + Jabatan',
  `totalPotongan` bigint(20) NOT NULL DEFAULT 0,
  `gajiBersih` bigint(20) NOT NULL DEFAULT 0,
  `paymentMethod` varchar(100) NOT NULL DEFAULT 'Mandiri Payroll •• 8821',
  `status` varchar(50) NOT NULL DEFAULT 'Terkalkulasi',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_emp_pay` (`employeeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `payroll` (`id`, `employeeId`, `periode`, `gajiPokok`, `tunjangan`, `tunjanganDetail`, `totalPotongan`, `gajiBersih`, `paymentMethod`, `status`) VALUES
('PAY-001', 'EMP-001', 'Oktober 2026', 18500000, 3500000, 'Tunj. Jabatan + Transport', 1100000, 20900000, 'Mandiri Payroll •• 4412', 'Terkalkulasi'),
('PAY-002', 'EMP-002', 'Oktober 2026', 14000000, 2500000, 'Tunj. Kinerja + Makan', 825000, 15675000, 'BCA Corporate •• 8819', 'Terkalkulasi'),
('PAY-003', 'EMP-003', 'Oktober 2026', 13500000, 2200000, 'Tunj. Jabatan + Makan', 785000, 14915000, 'Mandiri Payroll •• 9012', 'Terkalkulasi'),
('PAY-004', 'EMP-004', 'Oktober 2026', 10500000, 1800000, 'Tunj. Transport + Makan', 615000, 11685000, 'BNI Payroll •• 3310', 'Perlu Penyesuaian'),
('PAY-005', 'EMP-005', 'Oktober 2026', 19500000, 4000000, 'Tunj. Cloud + Jabatan', 1175000, 22325000, 'BCA Corporate •• 1120', 'Terkalkulasi'),
('PAY-006', 'EMP-006', 'Oktober 2026', 11500000, 2000000, 'Tunj. Kreatif + Makan', 675000, 12825000, 'Mandiri Payroll •• 7741', 'Terkalkulasi'),
('PAY-007', 'EMP-007', 'Oktober 2026', 15000000, 2800000, 'Tunj. Engineering + Makan', 890000, 16910000, 'Mandiri Payroll •• 5532', 'Perlu Penyesuaian'),
('PAY-008', 'EMP-008', 'Oktober 2026', 10000000, 1500000, 'Tunj. Operasional + Makan', 575000, 10925000, 'BCA Corporate •• 6610', 'Terkalkulasi');

-- ------------------------------------------------------------
-- 7. Tabel: settings (Pengaturan Profil Perusahaan & Sistem)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('companyName', 'PT Nebula Solusi Digital Indonesia Tbk'),
('companyLegalName', 'PT Nebula Solusi Digital Indonesia Tbk'),
('companyNIB', '81203912039123'),
('companyEmail', 'hrd@company.co.id'),
('companyPhone', '+62 (21) 5088-9100'),
('companyWebsite', 'https://nebula.co.id'),
('companyAddress', 'Menara Sudirman Lt. 28, Jl. Jend. Sudirman Kav. 60, Senayan, Kebayoran Baru, Jakarta Selatan 12190'),
('allowESS', 'true'),
('autoEmailSlipGaji', 'true'),
('gpsVerificationWFH', 'true'),
('companyLogo', ''),
('announcementText', 'Pencairan payroll dilakukan setiap tanggal 28. Pengajuan cuti tahunan wajib diajukan minimal H-3 sebelum tanggal mulai cuti.');
