<?php
// 1. Tentukan PIN baru yang Anda inginkan di sini
$pin_baru = "pppppppp11111111"; 

// 2. Jalankan fungsi password_hash bawaan PHP dengan algoritma BCRYPT
$hash_aman = password_hash($pin_baru, PASSWORD_BCRYPT);

// 3. Tampilkan hasilnya ke layar browser
echo "<h3>Sistem Generator Password Hash</h3>";
echo "PIN Asli: <b>" . $pin_baru . "</b><br><br>";
echo "Kode Hash Aman (Salin kode di bawah ini):<br>";
echo "<textarea rows='3' cols='70' readonly style='font-family:monospace; padding:10px;'>" . $hash_aman . "</textarea>";
?>