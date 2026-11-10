<?php
/* ============================================================
   KONEKSI DATABASE MYSQL (XAMPP) — HRMS ENTERPRISE
   ============================================================ */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = ""; // Default XAMPP kosong
$DB_NAME = "db_hrms";

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Koneksi database gagal. Pastikan MySQL di XAMPP menyala dan database 'db_hrms' sudah di-import.",
        "detail" => $e->getMessage()
    ]);
    exit;
}

