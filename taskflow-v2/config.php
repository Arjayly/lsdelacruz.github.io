<?php
define('DB_HOST', 'fdb1033.awardspace.net');
define('DB_NAME', '4692278_kurt12');
define('DB_USER', '4692278_kurt12');
define('DB_PASS', 'Kurt12345');

function getConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'DB connection failed: ' . $conn->connect_error]);
        exit();
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}
?>
