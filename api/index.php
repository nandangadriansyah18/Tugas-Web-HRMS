<?php
/* ============================================================
   REST API ENDPOINT — HRMS ENTERPRISE (XAMPP PHP + MySQL)
   Menangani sinkronisasi dan CRUD antara HTML/JS dengan MySQL
   ============================================================ */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? 'sync';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$allowedTables = [
    'departments',
    'employees',
    'attendance',
    'leave_requests',
    'payroll',
    'users'
];

function formatRowTypes($table, $row) {
    if (!$row) return $row;
    if ($table === 'employees') {
        $row['level'] = (int)($row['level'] ?? 1);
        $row['gaji'] = (int)($row['gaji'] ?? 0);
        $row['tunjangan'] = (int)($row['tunjangan'] ?? 0);
    } elseif ($table === 'attendance') {
        $row['lateMinutes'] = (int)($row['lateMinutes'] ?? 0);
    } elseif ($table === 'leave_requests') {
        $row['duration'] = (int)($row['duration'] ?? 1);
    } elseif ($table === 'payroll') {
        $row['gajiPokok'] = (int)($row['gajiPokok'] ?? 0);
        $row['tunjangan'] = (int)($row['tunjangan'] ?? 0);
        $row['totalPotongan'] = (int)($row['totalPotongan'] ?? 0);
        $row['gajiBersih'] = (int)($row['gajiBersih'] ?? 0);
    }
    return $row;
}

try {
    // 1. SYNC ALL DATA (Digunakan saat halaman dimuat)
    if ($action === 'sync') {
        $result = [];
        $orderByMap = [
            'departments'    => 'ORDER BY `id` ASC',
            'employees'      => 'ORDER BY `id` ASC',
            'attendance'     => 'ORDER BY `date` DESC, `createdAt` DESC, `id` DESC',
            'leave_requests' => 'ORDER BY `createdAt` DESC, `id` DESC',
            'payroll'        => 'ORDER BY `id` ASC',
        ];

        foreach ($orderByMap as $tbl => $orderSql) {
            $stmt = $pdo->query("SELECT * FROM `{$tbl}` {$orderSql}");
            $rows = $stmt->fetchAll();
            $result[$tbl] = array_map(fn($r) => formatRowTypes($tbl, $r), $rows);
        }

        // Ambil settings sebagai key-value object
        $stmtSet = $pdo->query("SELECT setting_key, setting_value FROM `settings`");
        $settingsObj = [];
        foreach ($stmtSet->fetchAll() as $s) {
            $val = $s['setting_value'];
            if ($val === 'true') $val = true;
            elseif ($val === 'false') $val = false;
            $settingsObj[$s['setting_key']] = $val;
        }
        $result['settings'] = $settingsObj;

        echo json_encode([
            "status" => "success",
            "source" => "MySQL (XAMPP)",
            "data" => $result
        ]);
        exit;
    }

    // 2. LOGIN AUTHENTICATION
    if ($action === 'login' && $method === 'POST') {
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        // Cek di tabel users (mendukung username 'admin' atau email 'admin@...')
        $cleanUser = str_starts_with(strtolower($username), 'admin@') ? 'admin' : (str_starts_with(strtolower($username), 'pegawai@') ? 'pegawai' : $username);
        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE LOWER(`username`) = LOWER(:u) AND `password` = :p LIMIT 1");
        $stmt->execute(['u' => $cleanUser, 'p' => $password]);
        $user = $stmt->fetch();

        if ($user) {
            echo json_encode([
                "status" => "success",
                "user" => [
                    "id" => $user['employee_id'] ?: $user['id'],
                    "role" => $user['role'],
                    "name" => $user['name']
                ]
            ]);
            exit;
        }

        // Fallback: cek apakah login menggunakan NIP atau Email karyawan (password default: pegawai123)
        $stmtEmp = $pdo->prepare("SELECT * FROM `employees` WHERE (LOWER(`nip`) = LOWER(:u) OR LOWER(`email`) = LOWER(:e)) LIMIT 1");
        $stmtEmp->execute(['u' => $username, 'e' => $username]);
        $emp = $stmtEmp->fetch();

        if ($emp && $password === 'pegawai123') {
            echo json_encode([
                "status" => "success",
                "user" => [
                    "id" => $emp['id'],
                    "role" => "pegawai",
                    "name" => $emp['nama']
                ]
            ]);
            exit;
        }

        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Email/NIP atau kata sandi salah"
        ]);
        exit;
    }

    // 3. INSERT RECORD
    if ($action === 'insert' && $method === 'POST') {
        $table = $input['table'] ?? '';
        $record = $input['record'] ?? [];

        if (!in_array($table, $allowedTables, true) || empty($record)) {
            throw new Exception("Tabel tidak valid atau data kosong.");
        }

        $colsStmt = $pdo->query("DESCRIBE `{$table}`");
        $validCols = array_column($colsStmt->fetchAll(), 'Field');

        $filteredRecord = [];
        foreach ($record as $k => $v) {
            if (in_array($k, $validCols, true)) {
                $filteredRecord[$k] = $v;
            }
        }

        $columns = array_keys($filteredRecord);
        $placeholders = array_map(fn($c) => ":{$c}", $columns);

        $sql = sprintf(
            "INSERT INTO `%s` (`%s`) VALUES (%s) ON DUPLICATE KEY UPDATE %s",
            $table,
            implode('`, `', $columns),
            implode(', ', $placeholders),
            implode(', ', array_map(fn($c) => "`{$c}` = VALUES(`{$c}`)", $columns))
        );

        $stmt = $pdo->prepare($sql);
        $stmt->execute($filteredRecord);

        // Jika insert karyawan baru, otomatis buatkan record payroll & akun login pegawai
        if ($table === 'employees' && !empty($filteredRecord['id'])) {
            $gaji = (int)($filteredRecord['gaji'] ?? 10000000);
            $tunj = (int)($filteredRecord['tunjangan'] ?? 2000000);
            $potongan = (int)round(($gaji + $tunj) * 0.05);
            $bersih = $gaji + $tunj - $potongan;
            $payId = 'PAY-' . strtoupper(substr(md5($filteredRecord['id']), 0, 6));

            $stmtPay = $pdo->prepare("INSERT IGNORE INTO `payroll` (`id`, `employeeId`, `periode`, `gajiPokok`, `tunjangan`, `tunjanganDetail`, `totalPotongan`, `gajiBersih`, `paymentMethod`, `status`) VALUES (?, ?, 'Oktober 2026', ?, ?, 'Tunj. Jabatan + Makan', ?, ?, 'Mandiri Payroll •• 8821', 'Terkalkulasi')");
            $stmtPay->execute([$payId, $filteredRecord['id'], $gaji, $tunj, $potongan, $bersih]);
        }

        echo json_encode(["status" => "success", "record" => $filteredRecord]);
        exit;
    }

    // 4. UPDATE RECORD
    if ($action === 'update' && $method === 'POST') {
        $table = $input['table'] ?? '';
        $id = $input['id'] ?? '';
        $changes = $input['changes'] ?? [];

        if (!in_array($table, $allowedTables, true) || !$id || empty($changes)) {
            throw new Exception("Parameter update tidak lengkap.");
        }

        $colsStmt = $pdo->query("DESCRIBE `{$table}`");
        $validCols = array_column($colsStmt->fetchAll(), 'Field');

        $setParts = [];
        $params = ['_id' => $id];
        foreach ($changes as $k => $v) {
            if (in_array($k, $validCols, true) && $k !== 'id') {
                $setParts[] = "`{$k}` = :{$k}";
                $params[$k] = $v;
            }
        }

        if (!empty($setParts)) {
            $sql = sprintf("UPDATE `%s` SET %s WHERE `id` = :_id", $table, implode(', ', $setParts));
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        // Jika pengajuan cuti disetujui/ditolak, sinkronkan status karyawan
        if ($table === 'leave_requests' && isset($changes['status'])) {
            $stmtLv = $pdo->prepare("SELECT `employeeId` FROM `leave_requests` WHERE `id` = ?");
            $stmtLv->execute([$id]);
            $lvRow = $stmtLv->fetch();
            if ($lvRow && !empty($lvRow['employeeId'])) {
                $newEmpStatus = ($changes['status'] === 'Approved') ? 'Cuti' : 'Aktif';
                $pdo->prepare("UPDATE `employees` SET `status` = ? WHERE `id` = ?")->execute([$newEmpStatus, $lvRow['employeeId']]);
            }
        }

        // Jika gaji/tunjangan karyawan diupdate, sinkronkan juga tabel payroll
        if ($table === 'employees' && (isset($changes['gaji']) || isset($changes['tunjangan']))) {
            $stmtEmp = $pdo->prepare("SELECT `gaji`, `tunjangan` FROM `employees` WHERE `id` = ?");
            $stmtEmp->execute([$id]);
            $empRow = $stmtEmp->fetch();
            if ($empRow) {
                $gp = (int)$empRow['gaji'];
                $tj = (int)$empRow['tunjangan'];
                $pt = (int)round(($gp + $tj) * 0.05);
                $gb = $gp + $tj - $pt;
                $pdo->prepare("UPDATE `payroll` SET `gajiPokok` = ?, `tunjangan` = ?, `totalPotongan` = ?, `gajiBersih` = ? WHERE `employeeId` = ?")
                    ->execute([$gp, $tj, $pt, $gb, $id]);
            }
        }

        echo json_encode(["status" => "success"]);
        exit;
    }

    // 5. DELETE RECORD
    if ($action === 'delete' && $method === 'POST') {
        $table = $input['table'] ?? '';
        $id = $input['id'] ?? '';

        if (!in_array($table, $allowedTables, true) || !$id) {
            throw new Exception("Parameter hapus tidak valid.");
        }

        $stmt = $pdo->prepare("DELETE FROM `{$table}` WHERE `id` = :id");
        $stmt->execute(['id' => $id]);

        if ($table === 'employees') {
            $pdo->prepare("DELETE FROM `attendance` WHERE `employeeId` = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM `leave_requests` WHERE `employeeId` = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM `payroll` WHERE `employeeId` = ?")->execute([$id]);
        }

        echo json_encode(["status" => "success"]);
        exit;
    }

    // 6. SAVE SETTINGS
    if ($action === 'setting' && $method === 'POST') {
        $key = $input['key'] ?? '';
        $val = $input['value'] ?? '';
        if (is_bool($val)) {
            $val = $val ? 'true' : 'false';
        }

        if ($key) {
            $stmt = $pdo->prepare("INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES (:k, :v) ON DUPLICATE KEY UPDATE `setting_value` = :v2");
            $stmt->execute(['k' => $key, 'v' => (string)$val, 'v2' => (string)$val]);
        }

        echo json_encode(["status" => "success"]);
        exit;
    }

    echo json_encode(["status" => "error", "message" => "Action tidak dikenali."]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
