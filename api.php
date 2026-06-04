<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$servername = "localhost";
$username = "root";
$password = ""; 
$dbname = "database_album"; 

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Koneksi database gagal"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

/**
 * 🔒 KEAMANAN HOSTING: PASSWORD HASHING (BCRYPT)
 * Kode di bawah ini adalah hasil hash dari PIN "11".
 * Jangan ganti teks acak ini jika PIN Anda tetap ingin "11".
 * Jika ingin mengganti PIN di kemudian hari, baca panduan di bawah kode ini.
 */
$PASSWORD_HASH_OTORITAS = '$2y$10$ItlWHSZwleiN6AI1.vZD9O76DQ2v4C/9zyVdb66LTjs6/yOKtYI.m'; 

// --- METHOD GET (AMBIL DATA) ---
if ($method === 'GET') {
    if ($action === 'getStories') {
        $result = $conn->query("SELECT * FROM stories ORDER BY story_date DESC");
        $stories = [];
        while($row = $result->fetch_assoc()) { $stories[] = $row; }
        echo json_encode($stories);
    } else {
        $result = $conn->query("SELECT * FROM photos ORDER BY id DESC");
        $photos = [];
        while($row = $result->fetch_assoc()) { $photos[] = $row; }
        echo json_encode($photos);
    }
    exit;
}

// --- METHOD POST (SIMPAN / HAPUS / PROSES DATA) ---
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // 🛡️ VERIFIKASI ADMIN YANG AMAN
    if ($action === 'verifyAdmin') {
        $inputPassword = isset($data['password']) ? $data['password'] : '';

        // Menggunakan password_verify() untuk mencocokkan inputan dengan Bcrypt hash
        if (password_verify($inputPassword, $PASSWORD_HASH_OTORITAS)) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => "PIN Salah"]);
        }
        exit;
    }

    if ($action === 'toggleFav') {
        $id = (int)$data['id'];
        $conn->query("UPDATE photos SET fav = 1 - fav WHERE id = $id");
        echo json_encode(["status" => "success"]);
        exit;
    }

    if ($action === 'delete') {
        $id = (int)$data['id'];
        $conn->query("DELETE FROM photos WHERE id = $id");
        echo json_encode(["status" => "success"]);
        exit;
    }

    if ($action === 'deleteStory') {
        $id = (int)$data['id'];
        $conn->query("DELETE FROM stories WHERE id = $id");
        echo json_encode(["status" => "success"]);
        exit;
    }

    if ($action === 'addStory') {
        $title = $conn->real_escape_string($data['title']);
        $story_date = $conn->real_escape_string($data['story_date']);
        $content = $conn->real_escape_string($data['content']);
        $conn->query("INSERT INTO stories (title, story_date, content) VALUES ('$title', '$story_date', '$content')");
        echo json_encode(["status" => "success"]);
        exit;
    }

    // Default: Fitur Simpan Media Baru
    $src = $conn->real_escape_string($data['src']);
    $tags = isset($data['tags']) ? $conn->real_escape_string($data['tags']) : 'umum';
    $type = isset($data['type']) ? $conn->real_escape_string($data['type']) : 'image';
    $live_src = isset($data['live_src']) ? $conn->real_escape_string($data['live_src']) : '';

    $conn->query("INSERT INTO photos (src, live_src, type, tags, fav) VALUES ('$src', '$live_src', '$type', '$tags', 0)");
    echo json_encode(["status" => "success"]);
    exit;
}
?>