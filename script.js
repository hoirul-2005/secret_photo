// ==========================================
// 🔔 ENGINE NOTIFIKASI MODERN (iOS STYLE)
// ==========================================

function showToast(message, icon = "✨") {
    const toast = document.getElementById('iosToast');
    document.getElementById('toastIcon').innerText = icon;
    document.getElementById('toastMessage').innerText = message;
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showCustomConfirm(title, message, isDanger, onConfirm) {
    const overlay = document.getElementById('iosModalOverlay');
    document.getElementById('iosModalTitle').innerText = title;
    document.getElementById('iosModalMessage').innerHTML = message.replace(/\n/g, '<br>');
    
    const btnContainer = document.getElementById('iosModalButtons');
    btnContainer.innerHTML = ''; 
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'ios-modal-btn';
    cancelBtn.innerText = onConfirm ? 'Batalkan' : 'Tutup';
    cancelBtn.onclick = () => { overlay.classList.remove('active'); };
    
    btnContainer.appendChild(cancelBtn);

    if (onConfirm) {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = `ios-modal-btn ${isDanger ? 'confirm-danger' : 'confirm-primary'}`;
        confirmBtn.innerText = 'OKE';
        confirmBtn.onclick = () => {
            overlay.classList.remove('active');
            onConfirm();
        };
        btnContainer.appendChild(confirmBtn);
    }
    
    overlay.classList.add('active');
}

// ==========================================
// ⚙️ VARIABEL UTAMA & OPERASIONAL APLIKASI
// ==========================================

const API_URL = 'api.php'; 

let photos = [];
let selectedPhotoIds = [];
let isSelectionMode = false;
let currentViewingPhotoId = null;

let currentAlbumType = null;
let currentAlbumTitle = null;
let currentUserRole = null; 

let currentPhotosListArray = []; 
let currentLightboxIndex = -1;
let viewerSessionName = ""; 

function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('themeToggleBtn');
    body.classList.toggle('light-theme');
    if (body.classList.contains('light-theme')) {
        themeBtn.innerText = "☀️"; 
        localStorage.setItem('appTheme', 'light');
    } else {
        themeBtn.innerText = "🌙"; 
        localStorage.setItem('appTheme', 'dark');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) themeBtn.innerText = "☀️";
    }
});

// Menentukan nama pelacak data suka secara background
function getViewerName() {
    if (currentUserRole === 'admin') {
        return "Admin Ruang Kenangan";
    }
    if (!viewerSessionName) {
        viewerSessionName = "Pengunjung Momen";
    }
    return viewerSessionName;
}

// 🔒 ANTI-COPY & CONTROLS PROTECTION
document.addEventListener('contextmenu', e => e.preventDefault()); 
document.addEventListener('keydown', function(e) {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && e.keyCode == 73) || (e.ctrlKey && e.keyCode == 85) || (e.ctrlKey && e.keyCode == 80) || (e.metaKey && e.keyCode == 80)) {
        e.preventDefault();
        showToast("Akses Dilindungi: Halaman terkunci aman.", "🔒");
        return false;
    }
});

// Autentikasi Login
async function handleLogin(role) {
    if (role === 'admin') {
        const passwordInput = document.getElementById('loginPassword').value;
        try {
            const response = await fetch(`${API_URL}?action=verifyAdmin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordInput })
            });
            const result = await response.json();
            if (result.status === 'success') {
                currentUserRole = 'admin';
            } else {
                showToast("PIN Admin salah!", "❌");
                return;
            }
        } catch (e) { return showToast("Gagal terhubung dengan server api.php.", "❌"); }
    } else {
        currentUserRole = 'guest';
    }

    document.getElementById('view-login').classList.remove('active');
    document.getElementById('mainTabBar').style.display = 'flex';
    
    applyRolePermissions();
    await fetchPhotosFromBackend();
    await fetchStoriesFromBackend(); 
    switchView('dashboard');
    showToast("Berhasil masuk ke aplikasi", "🔓");
}

function applyRolePermissions() {
    const selectBtn = document.getElementById('selectBtn');
    const navUploadBtn = document.getElementById('nav-upl');
    const adminStoryForm = document.getElementById('admin-story-form');
    const lightboxDeleteBtn = document.getElementById('lightbox-delete-btn');
    const btnToAdmin = document.getElementById('btn-switch-to-admin');
    const btnToGuest = document.getElementById('btn-switch-to-guest');
    const profileTitleText = document.getElementById('profileTitleText');

    if (currentUserRole === 'guest') {
        if (selectBtn) selectBtn.style.display = 'none';         
        if (navUploadBtn) navUploadBtn.style.display = 'none';   
        if (adminStoryForm) adminStoryForm.style.display = 'none'; 
        if (lightboxDeleteBtn) lightboxDeleteBtn.style.display = 'none'; 
        if (btnToAdmin) btnToAdmin.style.display = 'block'; 
        if (btnToGuest) btnToGuest.style.display = 'none';
        if (profileTitleText) profileTitleText.innerText = "Ruang Pengunjung 👀";
    } else {
        if (selectBtn) selectBtn.style.display = 'inline';
        if (navUploadBtn) navUploadBtn.style.display = 'flex';
        if (adminStoryForm) adminStoryForm.style.display = 'block';
        if (lightboxDeleteBtn) lightboxDeleteBtn.style.display = 'inline';
        if (btnToAdmin) btnToAdmin.style.display = 'none';
        if (btnToGuest) btnToGuest.style.display = 'block'; 
        if (profileTitleText) profileTitleText.innerText = "Ruang Admin 🛠️";
    }
}

function toggleLiveInput() {
    const type = document.getElementById('mediaTypeSelect').value;
    const liveGroup = document.getElementById('live-photo-input-group');
    const labelMain = document.getElementById('labelMainInput');

    if (type === 'live') {
        liveGroup.style.display = 'block';
        labelMain.innerText = "Link URL Foto Sampul (Cover Jpg/Png):";
    } else if (type === 'video') {
        liveGroup.style.display = 'none';
        labelMain.innerText = "Link URL Video Konten (.mp4):";
    } else {
        liveGroup.style.display = 'none';
        labelMain.innerText = "Link URL File Utama:";
    }
}

async function promptSwitchToAdmin() {
    const passwordInput = prompt("Masukkan PIN Admin:");
    if (!passwordInput) return;
    try {
        const response = await fetch(`${API_URL}?action=verifyAdmin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: passwordInput })
        });
        const result = await response.json();
        if (result.status === 'success') {
            currentUserRole = 'admin';
            applyRolePermissions(); 
            showToast("Sukses Berganti Akses ke Admin!", "🔓");
            switchView('dashboard');
        } else { showToast("PIN salah!", "❌"); }
    } catch (e) { showToast("Sistem verifikasi error.", "❌"); }
}

function switchToGuestDirectly() {
    showCustomConfirm("Ganti Akses", "Ubah akses menjadi Pengunjung?", false, () => {
        currentUserRole = 'guest';
        applyRolePermissions(); 
        showToast("Akses Berubah Menjadi Pengunjung.", "👀");
        switchView('dashboard');
    });
}

function handleLogout() {
    showCustomConfirm("Keluar Aplikasi", "Apakah Anda yakin ingin keluar dari aplikasi?", true, () => {
        currentUserRole = null;
        viewerSessionName = "";
        document.getElementById('loginPassword').value = '';
        document.getElementById('mainTabBar').style.display = 'none';
        document.querySelectorAll('.main-view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-login').classList.add('active');
        showToast("Berhasil keluar dari aplikasi", "🚪");
    });
}

async function fetchPhotosFromBackend() {
    try {
        const response = await fetch(API_URL);
        photos = await response.json();
        renderDashboard();
        if (currentAlbumType) openKoleksiAlbum(currentAlbumType, currentAlbumTitle);
    } catch (error) { console.error("Gagal sinkronisasi data:", error); }
}

function renderDashboard() {
    const koleksiMemoriCarousel = document.getElementById('koleksiMemoriCarousel');
    if (koleksiMemoriCarousel && Array.isArray(photos)) {
        koleksiMemoriCarousel.innerHTML = '';
        const memoriPhotos = [...photos].reverse().slice(0, 6); 
        if (memoriPhotos.length === 0) {
            koleksiMemoriCarousel.innerHTML = `<p style="color:#8e8e93; font-size:13px; padding-left:20px;">Belum ada momen.</p>`;
        } else {
            memoriPhotos.forEach((photo, idx) => {
                const card = document.createElement('div');
                card.className = 'memori-card';
                card.style.backgroundImage = `url('${photo.src}')`;
                card.onclick = () => {
                    currentAlbumType = null; 
                    openLightbox(parseInt(photo.id));
                };
                card.innerHTML = `<div class="memori-text">Momen #${memoriPhotos.length - idx}</div>`;
                koleksiMemoriCarousel.appendChild(card);
            });
        }
    }

    const grid = document.getElementById('library-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!Array.isArray(photos) || photos.length === 0) {
        grid.innerHTML = `<div class="empty-state">✨<p style="font-size:13px;color:#8e8e93;margin-top:10px;">Belum ada media.</p></div>`;
        return;
    }

    photos.forEach(photo => {
        const isSelected = selectedPhotoIds.includes(parseInt(photo.id));
        const item = document.createElement('div');
        item.className = `photo-item ${isSelected ? 'selected' : ''}`;
        
        item.onclick = function() {
            if (isSelectionMode && currentUserRole === 'admin') {
                toggleSelectPhoto(parseInt(photo.id), item);
            } else {
                currentAlbumType = null; 
                openLightbox(parseInt(photo.id));
            }
        };

        let badgeHtml = '';
        if (photo.type === 'video') {
            badgeHtml = `<div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:white; padding:2px 6px; border-radius:6px; font-size:10px;">📹 VIDEO</div>`;
        } else if (photo.type === 'live') {
            badgeHtml = `<div style="position:absolute; top:8px; left:8px; background:rgba(10,132,255,0.9); color:white; padding:2px 6px; border-radius:6px; font-size:9px; font-weight:bold;">🔘 LIVE</div>`;
        }

        if (photo.type === 'video') {
            item.innerHTML = `
                <video src="${photo.src}" muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>
                ${badgeHtml}<div class="select-circle">✓</div>
            `;
        } else {
            item.innerHTML = `
                <img src="${photo.src}">
                ${badgeHtml}<div class="select-circle">✓</div>
            `;
        }
        grid.appendChild(item);
    });

    updateSectionCovers();
}

function updateSectionCovers() {
    if (!Array.isArray(photos)) return;
    setAlbumCover('makan', 'album-makan', '🍔');
    setAlbumCover('lucu', 'album-lucu', '🥰');
    setAlbumCover('jalan', 'album-jalan', '✈️');
}

function setAlbumCover(keyword, elementId, fallbackEmoji) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const found = photos.find(p => p.tags && p.tags.toLowerCase().includes(keyword));
    if (found) {
        el.style.backgroundImage = `url('${found.src}')`;
        el.innerText = '';
    } else {
        el.style.backgroundImage = 'none';
        el.innerText = fallbackEmoji;
    }
}

function openLightbox(id) {
    if (currentAlbumType) {
        currentPhotosListArray = (currentAlbumType === 'fav') 
            ? photos.filter(p => p.fav == 1) 
            : photos.filter(p => p.tags.toLowerCase().includes(currentAlbumType.toLowerCase()));
    } else {
        currentPhotosListArray = [...photos];
    }

    currentLightboxIndex = currentPhotosListArray.findIndex(p => parseInt(p.id) === id);
    if (currentLightboxIndex === -1) return;

    renderLightboxContent();
    document.getElementById('lightbox').style.display = "flex";
}

// 🛠️ FIX: Rendering Informasi Label Jumlah Suka
function renderLightboxContent() {
    const photo = currentPhotosListArray[currentLightboxIndex];
    if (!photo) return;

    currentViewingPhotoId = parseInt(photo.id);
    const container = document.querySelector('.lightbox-content');
    container.innerHTML = ''; 

    const favBtn = document.getElementById('lightbox-fav-btn');
    favBtn.innerText = (photo.fav == 1) ? '❤️' : '🤍';
    favBtn.onclick = function() {
        if (currentUserRole === 'admin') toggleFav(photo.id);
        else showToast("Hanya Admin yang bisa merubah folder favorit.", "⚠️");
    };

    const downloadBtn = document.getElementById('btn-download-interaction');
    downloadBtn.style.display = (currentUserRole === 'admin') ? 'flex' : 'none';

    // Label Penulisan Jumlah Like
    const likeTextContainer = document.getElementById('text-likes-list');
    const likesCount = photo.likes_count ? parseInt(photo.likes_count) : 0;
    
    likeTextContainer.onclick = showWhoLikedThis;

    if (currentUserRole === 'admin') {
        likeTextContainer.innerText = `${likesCount} Orang Menyukai Ini (Klik untuk lihat)`;
        likeTextContainer.style.textDecoration = "underline";
    } else {
        likeTextContainer.innerText = `${likesCount} Orang Menyukai Momen Ini (Klik untuk detail)`;
        likeTextContainer.style.textDecoration = "none";
    }

    const nameForCheck = getViewerName();
    const likedByArray = photo.liked_by ? photo.liked_by.split(',').map(n => n.trim()) : [];
    const likeButtonElement = document.getElementById('btn-like-interaction');
    
    if (likedByArray.includes(nameForCheck)) {
        likeButtonElement.classList.add('liked');
        document.getElementById('like-icon').innerText = "❤️";
    } else {
        likeButtonElement.classList.remove('liked');
        document.getElementById('like-icon').innerText = "🤍";
    }

    if (photo.type === 'video') {
        const videoEl = document.createElement('video');
        videoEl.src = photo.src;
        videoEl.controls = true;
        videoEl.autoplay = true;
        videoEl.style.maxWidth = '100%';
        videoEl.style.maxHeight = '65vh';
        videoEl.setAttribute('controlsList', 'nodownload');
        container.appendChild(videoEl);
    } else if (photo.type === 'live') {
        container.style.position = 'relative';
        const imgEl = document.createElement('img');
        imgEl.src = photo.src;
        imgEl.style.maxWidth = '100%';
        imgEl.style.maxHeight = '65vh';
        imgEl.setAttribute('draggable', 'false');

        const liveVideoEl = document.createElement('video');
        liveVideoEl.src = photo.live_src;
        liveVideoEl.muted = true;
        liveVideoEl.loop = true;
        liveVideoEl.playsInline = true;
        liveVideoEl.style.maxWidth = '100%';
        liveVideoEl.style.maxHeight = '65vh';
        liveVideoEl.style.display = 'none';
        liveVideoEl.setAttribute('controlsList', 'nodownload');

        const hintEl = document.createElement('div');
        hintEl.innerText = "Tekan & Tahan Layar untuk Efek Live 🔘";
        hintEl.style.position = 'absolute';
        hintEl.style.bottom = '-25px';
        hintEl.style.color = '#8e8e93';
        hintEl.style.fontSize = '12px';

        container.appendChild(imgEl);
        container.appendChild(liveVideoEl);
        container.appendChild(hintEl);

        const startLive = () => {
            imgEl.style.display = 'none';
            liveVideoEl.style.display = 'block';
            liveVideoEl.play().catch(e => {});
        };
        const stopLive = () => {
            liveVideoEl.pause();
            liveVideoEl.currentTime = 0;
            liveVideoEl.style.display = 'none';
            imgEl.style.display = 'block';
        };

        container.onmousedown = startLive;
        container.onmouseup = stopLive;
        container.onmouseleave = stopLive;
        container.ontouchstart = (e) => { e.preventDefault(); startLive(); };
        container.ontouchend = stopLive;
    } else {
        const imgEl = document.createElement('img');
        imgEl.src = photo.src;
        imgEl.style.maxWidth = '100%';
        imgEl.style.maxHeight = '65vh';
        imgEl.setAttribute('draggable', 'false');
        container.appendChild(imgEl);
    }
}

function navigateLightbox(direction) {
    if (currentPhotosListArray.length <= 1) return;
    if (direction === 'next') {
        currentLightboxIndex++;
        if (currentLightboxIndex >= currentPhotosListArray.length) currentLightboxIndex = 0;
    } else if (direction === 'prev') {
        currentLightboxIndex--;
        if (currentLightboxIndex < 0) currentLightboxIndex = currentPhotosListArray.length - 1;
    }
    renderLightboxContent();
}

// 🛠️ PERBAIKAN FATAL: Memaksa update hitungan lokal secara tepat waktu agar langsung tampil angkanya
async function triggerLikePhoto() {
    const photo = currentPhotosListArray[currentLightboxIndex];
    if (!photo) return;

    const currentName = getViewerName();

    try {
        const response = await fetch(`${API_URL}?action=likePhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: photo.id, user_name: currentName })
        });
        const result = await response.json();
        
        if (result && result.status === 'success') {
            // Update data di array temporary lightbox yang sedang aktif terbuka
            photo.likes_count = parseInt(result.likes_count);
            photo.liked_by = result.liked_by;
            
            // Cari dan update data di array database utama halaman dashboard utama
            const globalPhotoIdx = photos.findIndex(p => parseInt(p.id) === parseInt(photo.id));
            if (globalPhotoIdx !== -1) {
                photos[globalPhotoIdx].likes_count = parseInt(result.likes_count);
                photos[globalPhotoIdx].liked_by = result.liked_by;
            }
            
            // Jalankan fungsi gambar ulang konten agar angka terbaru ter-render instan di layar
            renderLightboxContent();
            showToast("Momen berhasil disukai", "❤️");
        }
    } catch (e) { showToast("Gagal memberi suka.", "❌"); }
}

// 🔐 MEMISAHKAN INFORMASI BOX MODAL UTK ADMIN VS PENGUNJUNG
function showWhoLikedThis() {
    const photo = currentPhotosListArray[currentLightboxIndex];
    if (!photo) return;

    const likesCount = photo.likes_count ? parseInt(photo.likes_count) : 0;

    // HAK AKSES GUEST: Hanya diperbolehkan memantau rekap jumlah total suka
    if (currentUserRole !== 'admin') {
        showCustomConfirm(
            "Informasi Penyuka Momen", 
            `Momen memori ini disukai oleh sebanyak ${likesCount} orang.`, 
            false, 
            null
        );
        return;
    }

    // HAK AKSES ADMIN: Boleh melihat susunan daftar nama-nama penyuka
    if (!photo.liked_by || photo.liked_by.trim() === "") {
        showCustomConfirm("Daftar Penyuka (Admin)", "Belum ada pengunjung atau pengguna yang menyukai media memori ini.", false, null);
        return;
    }

    const arrayNama = photo.liked_by.split(',').map(nama => nama.trim()).filter(nama => nama !== "");
    const daftarNamaBerderet = arrayNama.map(nama => `• ${nama}`).join('\n');

    showCustomConfirm(
        "❤️ Daftar Nama Penyuka Momen", 
        `Total: ${likesCount} Suka\n\nBerikut daftar namanya:\n${daftarNamaBerderet}`, 
        false, 
        null
    );
}

function triggerDownloadMedia() {
    if (currentUserRole !== 'admin') return showToast("Akses Ditolak!", "🔒");
    const photo = currentPhotosListArray[currentLightboxIndex];
    if (!photo) return;

    const linkDownload = document.createElement('a');
    linkDownload.href = photo.src;
    linkDownload.download = `Memori_${photo.id}.jpg`;
    document.body.appendChild(linkDownload);
    linkDownload.click();
    document.body.removeChild(linkDownload);
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = "none";
    document.querySelector('.lightbox-content').innerHTML = ''; 
    currentViewingPhotoId = null;
}

function handleLocalGalleryUpload(event) {
    if (currentUserRole !== 'admin') return showToast("Hanya Admin yang bisa menambah foto.", "🔒");
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width; let height = img.height;
            const MAX_WIDTH = 1200; const MAX_HEIGHT = 1200;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }

            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
            const tags = document.getElementById('tagInput').value.trim() || 'galeri';
            executeDirectUpload(compressedBase64, tags);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function executeDirectUpload(base64String, tagsString) {
    const boxText = document.querySelector('.upload-box p');
    if (boxText) boxText.innerText = "⏳ Mengunggah...";
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ src: base64String, live_src: '', type: 'image', tags: tagsString }) 
        });
        const result = await response.json();
        if (result && result.status === 'success') {
            document.getElementById('fileInput').value = '';
            showToast("Foto berhasil diunggah!", "🎉");
            await fetchPhotosFromBackend(); 
            switchView('dashboard'); 
        }
    } catch (error) { showToast("Gagal unggah foto.", "❌"); }
    finally { if (boxText) boxText.innerText = "Pilih Langsung dari Galeri HP"; }
}

async function addNewPhoto() {
    if (currentUserRole !== 'admin') return;
    const type = document.getElementById('mediaTypeSelect').value;
    const src = document.getElementById('urlInput').value.trim();
    const live_src = document.getElementById('liveUrlInput') ? document.getElementById('liveUrlInput').value.trim() : '';
    let tags = document.getElementById('tagInput').value.trim() || 'umum';

    if (!src) return showToast("Silakan masukkan link medianya!", "⚠️");
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ src, live_src, type, tags }) 
        });
        const result = await response.json();
        if (result && result.status === 'success') {
            document.getElementById('urlInput').value = '';
            showToast("Berhasil menyimpan media!", "🎉");
            await fetchPhotosFromBackend(); 
            switchView('dashboard'); 
        }
    } catch (error) { showToast("Gagal menyimpan.", "❌"); }
}

function switchView(viewName) {
    if (isSelectionMode) toggleSelectionMode();
    document.querySelectorAll('.main-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-pill-item').forEach(pill => pill.classList.remove('active'));
    closeKoleksiAlbum(); 

    if (viewName === 'dashboard') {
        document.getElementById('view-dashboard').classList.add('active');
        document.getElementById('nav-dash').classList.add('active');
        renderDashboard(); 
    } else if (viewName === 'koleksi') {
        document.getElementById('view-koleksi').classList.add('active');
        document.getElementById('nav-col').classList.add('active');
        renderDashboard();
    } else if (viewName === 'upload') {
        if (currentUserRole !== 'admin') return switchView('dashboard');
        document.getElementById('view-upload').classList.add('active');
        document.getElementById('nav-upl').classList.add('active');
    } else if (viewName === 'profile') {
        document.getElementById('view-profile').classList.add('active');
        fetchStoriesFromBackend(); 
    }
}

function openKoleksiAlbum(type, title) {
    const menuContent = document.getElementById('koleksi-menu-content');
    const detailContent = document.getElementById('koleksi-detail-content');
    const albumTitle = document.getElementById('koleksi-album-title');
    const grid = document.getElementById('koleksi-library-grid');

    currentAlbumType = type; currentAlbumTitle = title;
    menuContent.style.display = 'none'; detailContent.style.display = 'block';
    if (albumTitle) albumTitle.innerText = title;

    let filtered = (type === 'fav') ? photos.filter(p => p.fav == 1) : photos.filter(p => p.tags.toLowerCase().includes(type.toLowerCase()));
    grid.innerHTML = '';
    filtered.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.onclick = () => openLightbox(parseInt(photo.id));
        item.innerHTML = photo.type === 'video' ? `<video src="${photo.src}" muted></video>` : `<img src="${photo.src}">`;
        grid.appendChild(item);
    });
}

function closeKoleksiAlbum() {
    const menuContent = document.getElementById('koleksi-menu-content');
    const detailContent = document.getElementById('koleksi-detail-content');
    if (menuContent && detailContent) { menuContent.style.display = 'block'; detailContent.style.display = 'none'; }
    currentAlbumType = null; currentAlbumTitle = null;
}

async function toggleFav(id) {
    await fetch(`${API_URL}?action=toggleFav`, { method: 'POST', body: JSON.stringify({ id }) });
    await fetchPhotosFromBackend();
    closeLightbox();
    showToast("Folder favorit diperbarui", "❤️");
}

function deleteCurrentSinglePhoto() {
    if (currentViewingPhotoId) {
        showCustomConfirm("Hapus Media", "Hapus permanen media ini dari ruang penyimpanan?", true, async () => {
            await fetch(`${API_URL}?action=delete`, { method: 'POST', body: JSON.stringify({ id: currentViewingPhotoId }) });
            closeLightbox();
            await fetchPhotosFromBackend();
            showToast("Media berhasil dihapus", "🗑️");
        });
    }
}

function triggerSearchPrompt() {
    const q = prompt("Masukkan kata kunci tag:");
    if (q) { switchView('koleksi'); openKoleksiAlbum(q, `Hasil: "${q}"`); }
}

function toggleSelectionMode() {
    if (currentUserRole !== 'admin') return;
    isSelectionMode = !isSelectionMode;
    document.getElementById('iphoneContainer').classList.toggle('select-mode', isSelectionMode);
    document.getElementById('selectBtn').innerText = isSelectionMode ? "Batal" : "•••";
    if (!isSelectionMode) { selectedPhotoIds = []; renderDashboard(); }
}

function toggleSelectPhoto(id, element) {
    const idx = selectedPhotoIds.indexOf(id);
    if (idx > -1) { selectedPhotoIds.splice(idx, 1); element.classList.remove('selected'); }
    else { selectedPhotoIds.push(id); element.classList.add('selected'); }
    document.getElementById('selectCountText').innerText = `${selectedPhotoIds.length} Terpilih`;
}

function deleteSelectedPhotos() {
    if (selectedPhotoIds.length === 0) return;
    showCustomConfirm("Hapus Massal", `Hapus permanen ${selectedPhotoIds.length} item terpilih?`, true, () => {
        selectedPhotoIds.forEach(id => { fetch(`${API_URL}?action=delete`, { method: 'POST', body: JSON.stringify({ id }) }); });
        setTimeout(() => { toggleSelectionMode(); fetchPhotosFromBackend(); showToast("Item terpilih berhasil dihapus", "🗑️"); }, 500);
    });
}

async function fetchStoriesFromBackend() {
    const res = await fetch(`${API_URL}?action=getStories`);
    const stories = await res.json();
    const container = document.getElementById('story-timeline-container');
    if (!container) return; container.innerHTML = '';
    
    stories.forEach(s => {
        const item = document.createElement('div');
        item.style.background = '#1c1c1e'; item.style.padding = '12px'; item.style.borderRadius = '10px'; item.style.marginBottom = '10px';
        const delBtn = currentUserRole === 'admin' ? `<span onclick="deleteStory(${s.id})" style="color:red; float:right; cursor:pointer;">🗑️</span>` : '';
        item.innerHTML = `<h4>${s.title} ${delBtn}</h4><small style="color:#0a84ff;">📅 ${s.story_date}</small><p style="margin-top:5px; white-space:pre-wrap;">${s.content}</p>`;
        container.appendChild(item);
    });
}

async function addNewStory() {
    const title = document.getElementById('storyTitleInput').value;
    const story_date = document.getElementById('storyDateInput').value;
    const content = document.getElementById('storyContentInput').value;
    if (!title || !story_date || !content) return showToast("Mohon isi seluruh form cerita!", "⚠️");

    await fetch(`${API_URL}?action=addStory`, { method: 'POST', body: JSON.stringify({ title, story_date, content }) });
    document.getElementById('storyTitleInput').value = ''; document.getElementById('storyContentInput').value = '';
    fetchStoriesFromBackend();
    showToast("Cerita kenangan berhasil disimpan", "✍️");
}

function deleteStory(id) {
    showCustomConfirm("Hapus Kisah", "Hapus catatan kisah kenangan ini?", true, async () => {
        await fetch(`${API_URL}?action=deleteStory`, { method: 'POST', body: JSON.stringify({ id }) }); 
        fetchStoriesFromBackend();
        showToast("Catatan kisah dihapus", "🗑️");
    });
}