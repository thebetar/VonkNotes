<?php
    include_once __DIR__ . '/config.php';

    $db_server = $DB_SERVER;
    $db_name = $DB_NAME;
    $db_user = $DB_USERNAME;
    $db_password = $DB_PASSWORD;

    // As per documentation of strato https://www.strato.nl/faq/hosting/het-inrichten-van-databases/
    try {
        $conn = new PDO("mysql:host=$db_server;dbname=$db_name", $db_user, $db_password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
        exit;
    }
?>