<?php

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';


$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;


$input = [];
if (in_array($method, ['POST', 'PUT'])) {
    $raw   = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];
}

$conn = getConnection();

switch ($method) {

    // ════════════════════════════════════════════════════════
    //  READ
    // ════════════════════════════════════════════════════════
    case 'GET':
        if ($id) {
            // Single task
            $stmt = $conn->prepare("SELECT * FROM tasks WHERE id = ? LIMIT 1");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $task = $stmt->get_result()->fetch_assoc();

            if ($task) {
                echo json_encode(['success' => true, 'task' => $task]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Task not found']);
            }
        } else {
            // All tasks with optional filters
            $where  = [];
            $params = [];
            $types  = '';

            if (!empty($_GET['status']) && in_array($_GET['status'], ['pending','in_progress','completed'])) {
                $where[]  = 'status = ?';
                $params[] = $_GET['status'];
                $types   .= 's';
            }
            if (!empty($_GET['priority']) && in_array($_GET['priority'], ['low','medium','high'])) {
                $where[]  = 'priority = ?';
                $params[] = $_GET['priority'];
                $types   .= 's';
            }
            if (!empty($_GET['search'])) {
                $s        = '%' . $conn->real_escape_string(trim($_GET['search'])) . '%';
                $where[]  = '(title LIKE ? OR description LIKE ?)';
                $params[] = $s;
                $params[] = $s;
                $types   .= 'ss';
            }

            $sql = 'SELECT * FROM tasks';
            if ($where) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= " ORDER BY FIELD(priority,'high','medium','low'), created_at DESC";

            $stmt = $conn->prepare($sql);
            if ($params) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $tasks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            // Stats
            $statsRow = $conn->query(
                "SELECT
                    COUNT(*)                    AS total,
                    SUM(status='pending')       AS pending,
                    SUM(status='in_progress')   AS in_progress,
                    SUM(status='completed')     AS completed
                 FROM tasks"
            )->fetch_assoc();

            echo json_encode([
                'success' => true,
                'tasks'   => $tasks,
                'stats'   => $statsRow
            ]);
        }
        break;

    // ════════════════════════════════════════════════════════
    //  CREATE
    // ════════════════════════════════════════════════════════
    case 'POST':
        $title       = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $priority    = in_array($input['priority'] ?? '', ['low','medium','high']) ? $input['priority'] : 'medium';
        $status      = in_array($input['status']   ?? '', ['pending','in_progress','completed']) ? $input['status'] : 'pending';
        $due_date    = !empty($input['due_date']) ? $input['due_date'] : null;

        if ($title === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Task title is required']);
            break;
        }

        $stmt = $conn->prepare(
            "INSERT INTO tasks (title, description, priority, status, due_date)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param('sssss', $title, $description, $priority, $status, $due_date);

        if ($stmt->execute()) {
            $newId  = $conn->insert_id;
            $task   = $conn->query("SELECT * FROM tasks WHERE id = $newId")->fetch_assoc();
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Task created!', 'task' => $task]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create task']);
        }
        break;

    // ════════════════════════════════════════════════════════
    //  UPDATE
    // ════════════════════════════════════════════════════════
    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Task ID is required']);
            break;
        }

        // Quick status-only toggle (checkbox)
        if (count($input) === 1 && isset($input['status'])) {
            $status = in_array($input['status'], ['pending','in_progress','completed']) ? $input['status'] : 'pending';
            $stmt   = $conn->prepare("UPDATE tasks SET status = ? WHERE id = ?");
            $stmt->bind_param('si', $status, $id);
        } else {
            $title       = trim($input['title'] ?? '');
            $description = trim($input['description'] ?? '');
            $priority    = in_array($input['priority'] ?? '', ['low','medium','high']) ? $input['priority'] : 'medium';
            $status      = in_array($input['status']   ?? '', ['pending','in_progress','completed']) ? $input['status'] : 'pending';
            $due_date    = !empty($input['due_date']) ? $input['due_date'] : null;

            if ($title === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Task title is required']);
                break;
            }

            $stmt = $conn->prepare(
                "UPDATE tasks
                 SET title = ?, description = ?, priority = ?, status = ?, due_date = ?
                 WHERE id = ?"
            );
            $stmt->bind_param('sssssi', $title, $description, $priority, $status, $due_date, $id);
        }

        if ($stmt->execute()) {
            $task = $conn->query("SELECT * FROM tasks WHERE id = $id")->fetch_assoc();
            echo json_encode(['success' => true, 'message' => 'Task updated!', 'task' => $task]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update task']);
        }
        break;

    // ════════════════════════════════════════════════════════
    //  DELETE
    // ════════════════════════════════════════════════════════
    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Task ID is required']);
            break;
        }

        $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->bind_param('i', $id);

        if ($stmt->execute() && $stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => "Task #$id deleted successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => "Task #$id not found"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>
