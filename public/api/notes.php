<?php
// Show errors
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');

include_once __DIR__ . '/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

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
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
}

$user_id = $user['id'];


// GET: fetch all notes for user, including tags
if ($method === 'GET') {
    // Fetch notes with tags using LEFT JOIN
    $stmt = $conn->prepare(
        'SELECT 
            n.id, n.title, n.content, n.created_at, n.updated_at,
            t.id AS tag_id, t.name AS tag_name
        FROM notes n
        LEFT JOIN note_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC'
    );
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group tags by note
    $notes = [];
    foreach ($rows as $row) {
        $note_id = $row['id'];
        if (!isset($notes[$note_id])) {
            $notes[$note_id] = [
                'id' => $note_id,
                'title' => $row['title'],
                'content' => $row['content'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'tags' => []
            ];
        }
        if ($row['tag_id']) {
            $notes[$note_id]['tags'][] = [
                'id' => $row['tag_id'],
                'name' => $row['tag_name']
            ];
        }
    }

    // Re-index notes numerically
    $notes = array_values($notes);

    echo json_encode(['notes' => $notes]);
    exit;
}

// POST: create a new note
if ($method === 'POST') {
    if($action === 'upload') {
        // Handle file upload as note content, do not save file to disk
        $file = $_FILES['file'] ?? null;

        if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'error' => 'No file uploaded or upload error']);
            exit;
        }

        // Read file content
        $content = file_get_contents($file['tmp_name']);

        // Remove file extension from title
        $originalName = $file['name'];
        $title = pathinfo($originalName, PATHINFO_FILENAME);

        // Insert note with file content
        $stmt = $conn->prepare(
            'INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())'
        );

        try {
            if ($stmt->execute([$user_id, $title, $content])) {
                $note_id = $conn->lastInsertId();
                echo json_encode(['success' => true, 'id' => $note_id]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to create note from file']);
            }
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                echo json_encode(['success' => false, 'error' => 'Note title already exists', 'title' => $title]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Database error', 'details' => $e->getMessage()]);
            }
        }
        exit;
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
    
        $title = $input['title'] ?? '';
        $content = $input['content'] ?? '';
        $tags = $input['tags'] ?? [];
    
        if (!$title) {
            echo json_encode(['success' => false, 'error' => 'Title required']);
            exit;
        }
    
        // Insert note
        $stmt = $conn->prepare(
            'INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())'
        );
    
        if ($stmt->execute([$user_id, $title, $content])) {
            $note_id = $conn->lastInsertId();
    
            echo json_encode(['success' => true, 'id' => $note_id]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to create note']);
        }
    }
    exit;
}

// PUT: update an existing note
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Get ID from query paramter
    $id = $_GET['id'] ?? null;

    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'ID required']);
        exit;
    }

    $title = $input['title'] ?? '';
    $content = $input['content'] ?? '';

    if (!$title) {
        echo json_encode(['success' => false, 'error' => 'ID and title required']);
        exit;
    }

    // Get user_id
    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ? OR email = ?');
    $stmt->execute([$email, $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    $user_id = $user['id'];

    // Update note
    $stmt = $conn->prepare(
        'UPDATE notes SET title = ?, content = ?, updated_at = NOW() WHERE id = ? AND user_id = ?'
    );

    if ($stmt->execute([$title, $content, $id, $user_id])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update note']);
    }
    exit;
}

// DELETE: delete an existing note
if ($method === 'DELETE') {
    // Get ID from query parameter
    $id = $_GET['id'] ?? null;

    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'ID required']);
        exit;
    }

    // Delete note
    $stmt = $conn->prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');

    if ($stmt->execute([$id, $user_id])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to delete note']);
    }
    exit;
}

// Unknown route/method
http_response_code(404);
echo json_encode(['error' => 'Not found']);