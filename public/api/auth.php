<?php
session_start();
header('Content-Type: application/json');

include_once __DIR__ . '/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'register') {
	$data = json_decode(file_get_contents('php://input'), true);
	$email = trim($data['email'] ?? '');
	$password = $data['password'] ?? '';

	// Validate email and password
	if (!$email || !$password) {
		http_response_code(400);
		echo json_encode(['error' => 'Email and password required']);
		exit;
	}

	// Check if user already exists
	$stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
	$stmt->execute([$email]);
	
	if ($stmt->fetch()) {
		http_response_code(409);
		echo json_encode(['error' => 'Email already exists']);
		exit;
	}

	// Generate a password hash
	$hash = password_hash($password, PASSWORD_DEFAULT);
	$stmt = $conn->prepare('INSERT INTO users (email, password) VALUES (?, ?)');

	try {
		$stmt->execute([$email, $hash]);
		$_SESSION['user'] = $email;
		echo json_encode(['success' => true, 'user' => $email]);
	} catch (PDOException $e) {
		http_response_code(500);
		echo json_encode(['error' => 'Registration failed']);
	}
	exit;
}

if ($method === 'POST' && $action === 'login') {
	$data = json_decode(file_get_contents('php://input'), true);
	$email = trim($data['email'] ?? '');
	$password = $data['password'] ?? '';

	// Get password for the given email
	$stmt = $conn->prepare('SELECT password FROM users WHERE email = ?');
	$stmt->execute([$email]);
	$row = $stmt->fetch(PDO::FETCH_ASSOC);

	// Validate the password using the password_hash function
	if ($row && password_verify($password, $row['password'])) {
		$_SESSION['user'] = $email;
		echo json_encode(['success' => true, 'user' => $email]);
	} else {
		http_response_code(401);
		echo json_encode(['error' => 'Invalid credentials']);
	}
	exit;
}

if ($method === 'POST' && $action === 'logout') {
	session_destroy();
	echo json_encode(['success' => true]);
	exit;
}

if ($method === 'POST' && $action === 'changepw') {
	$user = $_SESSION['user'] ?? null;
	if (!$user) {
		http_response_code(401);
		echo json_encode(['error' => 'Unauthorized']);
		exit;
	}
	$data = json_decode(file_get_contents('php://input'), true);
	$oldPassword = $data['oldPassword'] ?? '';
	$newPassword = $data['newPassword'] ?? '';

	if (!$oldPassword || !$newPassword) {
		http_response_code(400);
		echo json_encode(['error' => 'Both old and new password required']);
		exit;
	}

	$stmt = $conn->prepare('SELECT password FROM users WHERE email = ?');
	$stmt->execute([$user]);
	$row = $stmt->fetch(PDO::FETCH_ASSOC);

	if (!$row || !password_verify($oldPassword, $row['password'])) {
		http_response_code(401);
		echo json_encode(['error' => 'Current password is incorrect']);
		exit;
	}

	$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
	$stmt = $conn->prepare('UPDATE users SET password = ? WHERE email = ?');
	$stmt->execute([$newHash, $user]);

	echo json_encode(['success' => true]);
	exit;
}

if($method === 'DELETE') {
	$user = $_SESSION['user'] ?? null;

	// Check if user is logged in
	if(!$user) {
		http_response_code(401);
		echo json_encode(['error' => 'Unauthorized']);
		exit;
	}

	// Get user ID
	$stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
	$stmt->execute([$user]);
	$row = $stmt->fetch(PDO::FETCH_ASSOC);

	if(!$row) {
		http_response_code(404);
		echo json_encode(['error' => 'User not found']);
		exit;
	}

	$userId = $row['id'];

	// Delete models and datasets of user
	$stmt = $conn->prepare('DELETE FROM models WHERE user_id = ?');
	$stmt->execute([$userId]);
	$stmt = $conn->prepare('DELETE FROM datasets WHERE user_id = ?');
	$stmt->execute([$userId]);

	// Delete user
	$stmt = $conn->prepare('DELETE FROM users WHERE id = ?');
	$stmt->execute([$userId]);

	if($stmt->rowCount() > 0) {
		session_destroy();
		echo json_encode(['success' => true]);
	} else {
		http_response_code(500);
		echo json_encode(['error' => 'Failed to delete user']);
	}
	exit;
}

if ($method === 'GET' && $action === 'me') {
	if (isset($_SESSION['user'])) {
		echo json_encode(['user' => $_SESSION['user']]);
	} else {
		http_response_code(401);
		echo json_encode(['user' => null]);
	}
	exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid request']);
