<?php
include_once '../config.php';

$db_server = $DB_SERVER;
$db_name = $DB_NAME;
$db_user = $DB_USERNAME;
$db_password = $DB_PASSWORD;

session_start();
header('Content-Type: application/json');

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
        'SELECT t.id, t.name, t.parent_id, t.created_at, t.updated_at, COUNT(nt.note_id) as note_count
         FROM tags t
         LEFT JOIN note_tags nt ON nt.tag_id = t.id
         LEFT JOIN notes n ON nt.note_id = n.id
         WHERE n.user_id = ? OR n.user_id IS NULL
         GROUP BY t.id
         ORDER BY t.name ASC'
    );
    $stmt->execute([$user_id]);
    $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['tags' => $tags]);
    exit;
}

// POST: add a tag to a note (or create tag if not exists)
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = $input['name'] ?? '';
    $note_id = $input['noteId'] ?? null;

    if (!$name || !$note_id) {
        echo json_encode(['success' => false, 'error' => 'Name and noteId required']);
        exit;
    }

    // Check note ownership
    $stmt = $conn->prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?');
    $stmt->execute([$note_id, $user_id]);

    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode(['success' => false, 'error' => 'Note not found or not owned by user']);
        exit;
    }

    // Insert tag if not exists
    $tagStmt = $conn->prepare('SELECT id FROM tags WHERE name = ?');
    $tagStmt->execute([$name]);
    $tag = $tagStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tag) {
        $insertTagStmt = $conn->prepare('INSERT INTO tags (name, created_at, updated_at) VALUES (?, NOW(), NOW())');
        $insertTagStmt->execute([$name]);
        $tag_id = $conn->lastInsertId();
    } else {
        $tag_id = $tag['id'];
    }

    // Link note and tag
    $noteTagStmt = $conn->prepare('INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)');
    $noteTagStmt->execute([$note_id, $tag_id]);

    echo json_encode(['success' => true, 'id' => $tag_id]);
    exit;
}

// PATCH: update a tag name by changing parent ID or name
if ($method === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true);

    $tag_id = $input['tagId'] ?? null;
    $name = $input['name'] ?? '';
    $parent_id = $input['parentId'] ?? null;

    if (!$tag_id || !$name) {
        echo json_encode(['success' => false, 'error' => 'tagId and name required']);
        exit;
    }

    // Update tag name
    $stmt = $conn->prepare('UPDATE tags SET name = ?, parent_id = ?, updated_at = NOW() WHERE id = ?');
    if ($stmt->execute([$name, $parent_id, $tag_id])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update tag']);
    }
    exit;
}


// DELETE: remove a tag from a note (not delete tag itself)
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);

    $tag_id = $input['tagId'] ?? null;
    $note_id = $input['noteId'] ?? null;

    if (!$tag_id || !$note_id) {
        echo json_encode(['success' => false, 'error' => 'tagId and noteId required']);
        exit;
    }

    // Check note ownership
    $stmt = $conn->prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?');
    $stmt->execute([$note_id, $user_id]);

    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode(['success' => false, 'error' => 'Note not found or not owned by user']);
        exit;
    }

    // Remove tag from note
    $stmt = $conn->prepare('DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?');

    if ($stmt->execute([$note_id, $tag_id])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to remove tag from note']);
    }

    // If the tag is not linked to any other notes, delete it
    $stmt = $conn->prepare('SELECT COUNT(*) FROM note_tags WHERE tag_id = ?');
    $stmt->execute([$tag_id]);
    $count = $stmt->fetchColumn();

    if ($count == 0) {
        $deleteTagStmt = $conn->prepare('DELETE FROM tags WHERE id = ?');
        $deleteTagStmt->execute([$tag_id]);
    }

    exit;
}

// Unknown route/method
http_response_code(404);
echo json_encode(['error' => 'Not found']);
