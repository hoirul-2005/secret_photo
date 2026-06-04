DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS stories;

-- Tabel Media (Mendukung Foto, Video, Live Photo, Like, & List Penyuka)
CREATE TABLE photos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    src LONGTEXT NOT NULL,                     -- URL atau Teks Base64 Gambar Utama
    live_src LONGTEXT DEFAULT NULL,            -- URL atau Teks Base64 Video Pendek (Khusus Live Photo)
    type VARCHAR(20) DEFAULT 'image',          -- 'image', 'video', atau 'live'
    tags VARCHAR(255) DEFAULT 'umum',
    fav BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,                 -- Total jumlah suka
    liked_by TEXT DEFAULT NULL,                -- Daftar nama penyuka dipisah tanda koma
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Tabel Catatan Kisah Tertulis (Timeline Momen)
CREATE TABLE stories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    story_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);