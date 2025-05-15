<?php
session_start();
header('Content-Type: application/json');

// ...existing DB connection code from notes.php...
if (
    isset($_SERVER['SERVER_NAME']) &&
    (
        strpos($_SERVER['SERVER_NAME'], 'localhost') !== false ||
        $_SERVER['SERVER_NAME'] === '127.0.0.1'
    )
) {
    $db_server = 'db';
    $db_name = 'test_db';
    $db_user = 'admin';
    $db_password = 'admin';
} else {
    $db_server = 'database-5017698673.webspace-host.com';
    $db_name = 'dbs14148873';
    $db_user = 'dbu248351';
    $db_password = 'yABUFAv5DmK!74z';
}

try {
    $conn = new PDO("mysql:host=$db_server;dbname=$db_name", $db_user, $db_password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'details' => $e->getMessage()
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Ensure user is logged in
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$email = $_SESSION['user'];

// Get user_id
$stmt = $conn->prepare('SELECT id FROM users WHERE email = ? OR email = ?');
$stmt->execute([$email, $email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['tags' => []]);
    exit;
}

$user_id = $user['id'];

// GET: fetch all tags for user's notes
if ($method === 'GET') {
    $stmt = $conn->prepare(
        'SELECT t.id, t.name, t.parent_id, t.note_id, t.created_at, t.updated_at
         FROM tags t
         LEFT JOIN notes n ON t.note_id = n.id
         WHERE n.user_id = ?
         GROUP BY t.id
         ORDER BY t.name ASC'
    );
    $stmt->execute([$user_id]);
    $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['tags' => $tags]);
    exit;
}

// POST: create a new tag (optionally for a note)
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = $input['name'] ?? '';
    $note_id = $input['note_id'] ?? null;
    $parent_id = $input['parent_id'] ?? null;

    if (!$name) {
        echo json_encode(['success' => false, 'error' => 'Name required']);
        exit;
    }

    // If note_id is provided, check if note belongs to user
    if ($note_id) {
        $stmt = $conn->prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?');
        $stmt->execute([$note_id, $user_id]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode(['success' => false, 'error' => 'Note not found or not owned by user']);
            exit;
        }
    }

    $stmt = $conn->prepare(
        'INSERT INTO tags (name, parent_id, note_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())'
    );
    if ($stmt->execute([$name, $parent_id, $note_id])) {
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to create tag']);
    }
    exit;
}

// PUT: update an existing tag
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    $id = $input['id'] ?? null;
    $name = $input['name'] ?? '';
    $parent_id = $input['parent_id'] ?? null;
    $note_id = $input['note_id'] ?? null;

    if (!$id || !$name) {
        echo json_encode(['success' => false, 'error' => 'ID and name required']);
        exit;
    }

    // Check tag ownership via note
    if ($note_id) {
        $stmt = $conn->prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?');
        $stmt->execute([$note_id, $user_id]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode(['success' => false, 'error' => 'Note not found or not owned by user']);
            exit;
        }
    }

    $stmt = $conn->prepare(
        'UPDATE tags SET name = ?, parent_id = ?, note_id = ?, updated_at = NOW() WHERE id = ?'
    );
    if ($stmt->execute([$name, $parent_id, $note_id, $id])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update tag']);
    }
    exit;
}

// Unknown route/method
http_response_code(404);
echo json_encode(['error' => 'Not found']);
