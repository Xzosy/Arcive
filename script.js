document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen-elemen ---
    const welcomePopup = document.getElementById('welcomePopup');
    const enterButton = document.getElementById('enterButton');
    const bgMusic = document.getElementById('bgMusic');
    const mainContent = document.getElementById('mainContent');
    const scene = document.getElementById('scene');
    const instructions = document.getElementById('instructions'); // Jika perlu dimanipulasi
    const carousel = document.querySelector('.carousel');
    const cells = Array.from(carousel.querySelectorAll('.carousel__cell'));

    // Parallax Elements
    const spaceBackground = document.getElementById('spaceBackground');
    const spaceLayers = Array.from(spaceBackground?.querySelectorAll('.space-layer') || []); // Handle jika tidak ada
    const starsLayer = spaceBackground?.querySelector('.stars-layer'); // Handle jika tidak ada

    // --- Variabel Carousel ---
    const numCells = cells.length;
    if (numCells === 0) {
        console.error("Tidak ada cell (.carousel__cell) ditemukan!");
        return; // Hentikan jika tidak ada foto
    }
    // Hitung radius berdasarkan ukuran scene (bukan cell) agar lebih pas
    const sceneWidth = scene.offsetWidth;
    const radius = Math.round((sceneWidth / 2) / Math.tan(Math.PI / numCells));
    const theta = 360 / numCells;
    let currentAngle = 0;
    let selectedIndex = 0;

    // --- Fungsi Carousel ---
    function positionCells() {
        cells.forEach((cell, index) => {
            const cellAngle = theta * index;
            // Posisikan cell dalam lingkaran 3D
            cell.style.transform = `rotateY(${cellAngle}deg) translateZ(${radius}px)`;
            cell.dataset.angle = cellAngle; // Simpan sudut untuk referensi
        });
        updateActiveCell(); // Update active cell awal
    }

    function rotateCarousel(angle) {
        if (!carousel) return;
        // Putar seluruh carousel dan geser ke belakang sejauh radius
        carousel.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
        currentAngle = angle;
        updateActiveCell(); // Update cell mana yang aktif
    }

    function updateActiveCell() {
        // Hitung index cell yang paling dekat ke depan (-currentAngle)
        const closestIndex = Math.round(-currentAngle / theta) % numCells;
        selectedIndex = (closestIndex < 0) ? numCells + closestIndex : closestIndex;

        cells.forEach((cell, index) => {
            const isPositioned = cell.style.transform.includes('rotateY'); // Cek jika sudah diposisikan
            const isActive = index === selectedIndex && isPositioned;

            // Ambil transform dasar (rotasi & translateZ) tanpa scale
            const baseTransform = cell.style.transform.replace(/ scale\(.*\)/, '');

            if (isActive) {
                cell.classList.add('active');
                cell.style.zIndex = 2; // Z-index dari CSS
                // Terapkan scale ke transform yang sudah ada (Solusi JS)
                cell.style.transform = `${baseTransform} scale(1.08)`;
            } else {
                cell.classList.remove('active');
                 // Hanya reset zIndex dan transform jika sudah pernah diposisikan
                if (isPositioned) {
                    cell.style.zIndex = 1;
                     // Kembalikan transform ke dasar (tanpa scale)
                     cell.style.transform = baseTransform;
                }
            }
        });
    }

    // --- Fungsi Parallax ---
    function handleParallax(event) {
        if (!spaceBackground) return;

        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const moveX = (mouseX - centerX) / centerX; // -1 to 1
        const moveY = (mouseY - centerY) / centerY; // -1 to 1

        // Gerakkan layer planet
        spaceLayers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth) || 0;
            const sensitivity = 25; // Sensitivitas gerakan planet
            const offsetX = -moveX * sensitivity * depth;
            const offsetY = -moveY * sensitivity * depth;
            layer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        });

        // Gerakkan layer bintang (lebih lambat)
        if (starsLayer) {
            const starsDepth = 0.05;
            const starsSensitivity = 15; // Sensitivitas gerakan bintang
            const starsOffsetX = -moveX * starsSensitivity * starsDepth;
            const starsOffsetY = -moveY * starsSensitivity * starsDepth;
            // Gabungkan dengan transform awal dari CSS
            starsLayer.style.transform = `translate(calc(-25% + ${starsOffsetX}px), calc(-25% + ${starsOffsetY}px))`;
        }
    }

    // --- Logika Aplikasi Utama ---
    function initApp() {
        // 1. Tampilkan Popup
        welcomePopup.classList.add('visible');

        // 2. Listener Tombol Masuk
        enterButton.addEventListener('click', () => {
            // a. Sembunyikan Popup
            welcomePopup.classList.remove('visible');

            // b. Putar Musik (dengan error handling)
            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay musik gagal, perlu interaksi manual:", error);
                    // Mungkin perlu tombol play/pause manual jika autoplay diblokir
                });
            }

            // c. Tampilkan Konten Utama
            mainContent.classList.add('visible');

            // d. Inisialisasi Carousel setelah konten terlihat (beri delay)
            setTimeout(() => {
                if (cells.length > 0 && scene) { // Cek elemen scene juga
                    // Recalculate radius after main content is visible & sized
                    const visibleSceneWidth = scene.offsetWidth;
                     // Update radius based on actual visible width
                     // Gunakan konstanta atau kalkulasi ulang jika perlu
                    // radius = Math.round((visibleSceneWidth / 2) / Math.tan(Math.PI / numCells));

                    positionCells(); // Posisikan kartu
                    rotateCarousel(0); // Putar ke posisi awal
                }
            }, 150); // Delay sedikit lebih lama

            // e. Aktifkan Interaksi Carousel
            setupCarouselInteraction();

            // f. Aktifkan Parallax Background
            window.addEventListener('mousemove', handleParallax);

        }, { once: true }); // Listener hanya sekali jalan
    }

    // --- Fungsi Interaksi Carousel ---
    function setupCarouselInteraction() {
        if (!scene) return; // Jangan setup jika scene tidak ada

        // 1. Klik pada Kartu -> Putar ke depan
        cells.forEach((cell, index) => {
            cell.addEventListener('click', () => {
                // Cek agar tidak berputar jika sedang drag (lihat logika touch)
                 if (isDragging) return;
                const targetAngle = -theta * index;
                rotateCarousel(targetAngle);
            });
        });

        // 2. Mouse Wheel Scroll
        let scrollTimeout;
        scene.addEventListener('wheel', (event) => {
            event.preventDefault(); // Cegah scroll halaman
            const delta = Math.sign(event.deltaY); // Arah scroll (1 = bawah, -1 = atas)
            const rotationAmount = delta * (theta / 2); // Putar setengah kartu

            // Opsi 1: Putar langsung (mungkin sedikit jerky)
            rotateCarousel(currentAngle + rotationAmount);

            // Opsi 2: Snap setelah delay (lebih smooth)
            /*
            clearTimeout(scrollTimeout);
            currentAngle += rotationAmount; // Update sudut sementara
            carousel.style.transform = `translateZ(${-radius}px) rotateY(${currentAngle}deg)`;
            updateActiveCell(); // Update highlight sementara
            scrollTimeout = setTimeout(() => {
                const targetIndex = Math.round(-currentAngle / theta);
                rotateCarousel(-targetIndex * theta); // Snap ke kartu terdekat
            }, 150); // Waktu tunggu sebelum snap
            */
        }, { passive: false }); // Perlu false karena preventDefault

        // 3. Touch Events (Geser/Swipe)
        let isDragging = false;
        let startX = 0;
        let currentX = 0; // Lacak posisi X saat ini selama drag
        let dragAngle = 0; // Sudut saat drag dimulai

        scene.addEventListener('touchstart', (event) => {
            // Hanya mulai jika sentuhan di area scene/carousel/cell
             if (!event.target.closest('.scene')) return;

             isDragging = false; // Reset status drag
             startX = event.touches[0].clientX;
             currentX = startX; // Inisialisasi currentX
             dragAngle = currentAngle; // Simpan sudut saat drag mulai
             carousel.style.transition = 'none'; // Matikan transisi saat drag
             scene.style.cursor = 'grabbing';

        }, { passive: true });

        scene.addEventListener('touchmove', (event) => {
             if (startX === 0) return; // Jika touchstart tidak valid

             currentX = event.touches[0].clientX;
             const deltaX = currentX - startX;

             // Anggap drag jika geseran lebih dari threshold kecil
             if (!isDragging && Math.abs(deltaX) > 5) {
                 isDragging = true;
             }

             if (isDragging) {
                 event.preventDefault(); // Cegah scroll HANYA saat drag aktif
                 // Hitung perubahan sudut berdasarkan geseran
                 // Sesuaikan pembagi (misal: 4 atau 5) untuk sensitivitas
                 const rotationChange = (deltaX) / 4;
                 const newAngle = dragAngle + rotationChange;

                 // Terapkan rotasi secara langsung tanpa transisi
                 carousel.style.transform = `translateZ(${-radius}px) rotateY(${newAngle}deg)`;
                 currentAngle = newAngle; // Update sudut global secara realtime
                 updateActiveCell(); // Update highlight saat drag
             }
        }, { passive: false }); // Perlu false karena preventDefault

        scene.addEventListener('touchend', () => {
            if (startX === 0) return; // Abaikan jika tidak ada touchstart valid

            carousel.style.transition = 'transform 1s cubic-bezier(0.77, 0, 0.175, 1)'; // Aktifkan lagi transisi
            scene.style.cursor = 'grab';

            if (isDragging) {
                // Snap ke kartu terdekat setelah drag selesai
                const targetIndex = Math.round(-currentAngle / theta);
                rotateCarousel(-targetIndex * theta);
            }
            // else { // Jika bukan drag (hanya tap), biarkan event click di cell yang handle
            // }

            // Reset state
            isDragging = false;
            startX = 0;
            currentX = 0;
        });

        // Set cursor awal
        scene.style.cursor = 'grab';
    }

    // --- Mulai Aplikasi ---
    initApp();

}); // Akhir DOMContentLoaded