// --- START OF FILE script.js ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen-elemen ---
    const welcomePopup = document.getElementById('welcomePopup');
    const enterButton = document.getElementById('enterButton');
    const bgMusic = document.getElementById('bgMusic');
    const mainContent = document.getElementById('mainContent');
    const scene = document.getElementById('scene');
    const instructions = document.getElementById('instructions');
    const carousel = document.querySelector('.carousel');
    const cells = carousel ? Array.from(carousel.querySelectorAll('.carousel__cell')) : []; // Handle jika carousel tidak ada

    // --- PWA Service Worker Registration ---
    // Lakukan registrasi saat window sudah selesai load, bukan hanya DOM ready
    // Ini mencegah perebutan resource saat halaman awal loading
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js') // Path ke file SW Anda
                .then(registration => {
                    console.log('PWA Service Worker registered successfully with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('PWA Service Worker registration failed:', error);
                });
        });
    } else {
        console.log('Service Worker is not supported by this browser.');
    }
    // --- Akhir PWA Service Worker Registration ---


    // Parallax Elements
    const spaceBackground = document.getElementById('spaceBackground');
    const spaceLayers = Array.from(spaceBackground?.querySelectorAll('.space-layer') || []);
    const starsLayer = spaceBackground?.querySelector('.stars-layer');

    // --- Variabel Carousel ---
    const numCells = cells.length;
    let radius = 0; // Akan dihitung setelah konten visible
    const theta = numCells > 0 ? 360 / numCells : 0;
    let currentAngle = 0;
    let selectedIndex = 0;
    let isDragging = false; // Pindahkan deklarasi ke scope yang lebih luas
    let startX = 0;       // Pindahkan deklarasi
    let currentX = 0;     // Pindahkan deklarasi
    let dragAngle = 0;      // Pindahkan deklarasi


    if (numCells === 0 && carousel) { // Hanya log error jika carousel ada tapi cell tidak ada
        console.error("Tidak ada cell (.carousel__cell) ditemukan di dalam .carousel!");
        // Tidak perlu return, aplikasi mungkin punya fungsi lain
    }

    // --- Fungsi Carousel ---
    function calculateRadius() {
        if (!scene || numCells === 0) return 0;
        const sceneWidth = scene.offsetWidth;
        // Pastikan tidak membagi dengan nol jika numCells = 1 atau tan(PI/numCells) mendekati 0
        if (numCells <= 1 || Math.tan(Math.PI / numCells) === 0) {
             // Fallback atau nilai default jika hanya 1 cell atau perhitungan tidak valid
             return sceneWidth / 2;
        }
        return Math.round((sceneWidth / 2) / Math.tan(Math.PI / numCells));
    }

    function positionCells() {
        if (!carousel || numCells === 0) return;
        radius = calculateRadius(); // Hitung ulang radius saat memposisikan
        if (radius === 0) {
             console.warn("Radius carousel tidak dapat dihitung.");
             return;
        }

        cells.forEach((cell, index) => {
            const cellAngle = theta * index;
            cell.style.transform = `rotateY(${cellAngle}deg) translateZ(${radius}px)`;
            cell.dataset.angle = cellAngle;
        });
        updateActiveCell();
    }

    function rotateCarousel(angle) {
        if (!carousel || radius === 0) return;
        carousel.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
        currentAngle = angle;
        updateActiveCell();
    }

    function updateActiveCell() {
        if (numCells === 0) return;

        // Hitung index cell yang paling dekat ke depan (-currentAngle)
        // Normalisasi sudut ke rentang 0-360 sebelum dibagi
        const normalizedAngle = ((-currentAngle % 360) + 360) % 360;
        const closestIndexRaw = Math.round(normalizedAngle / theta);
         // Handle pembulatan ke index 'numCells' yang seharusnya jadi 0
        selectedIndex = closestIndexRaw % numCells;

        cells.forEach((cell, index) => {
            const isPositioned = cell.style.transform.includes('rotateY');
            const isActive = index === selectedIndex && isPositioned;
            const baseTransform = cell.style.transform.replace(/ scale\(.*\)/, '');

            if (isActive) {
                cell.classList.add('active');
                cell.style.zIndex = 2;
                cell.style.transform = `${baseTransform} scale(1.08)`;
            } else {
                cell.classList.remove('active');
                if (isPositioned) {
                    cell.style.zIndex = 1;
                    cell.style.transform = baseTransform;
                }
            }
        });
    }

    // --- Fungsi Parallax ---
    function handleParallax(event) {
        if (!spaceBackground || !window.visualViewport) return; // Gunakan visualViewport jika tersedia

        // Gunakan clientX/Y relatif terhadap viewport untuk konsistensi
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        // Gunakan innerWidth/Height sebagai referensi viewport
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const moveX = (mouseX - centerX) / centerX;
        const moveY = (mouseY - centerY) / centerY;

        spaceLayers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth) || 0;
            const sensitivity = 25;
            const offsetX = -moveX * sensitivity * depth;
            const offsetY = -moveY * sensitivity * depth;
            layer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        });

        if (starsLayer) {
            const starsDepth = 0.05;
            const starsSensitivity = 15;
            const starsOffsetX = -moveX * starsSensitivity * starsDepth;
            const starsOffsetY = -moveY * starsSensitivity * starsDepth;
            starsLayer.style.transform = `translate(calc(-25% + ${starsOffsetX}px), calc(-25% + ${starsOffsetY}px))`;
        }
    }

    // --- Logika Aplikasi Utama ---
    function initApp() {
        // 1. Tampilkan Popup (jika ada)
        if (welcomePopup) {
            welcomePopup.classList.add('visible');
        } else {
            // Jika tidak ada popup, langsung tampilkan konten & inisialisasi
            console.log("Welcome popup not found, initializing directly.");
            showMainContentAndInit();
            return; // Keluar dari initApp jika popup tidak ada
        }

        // 2. Listener Tombol Masuk (jika ada)
        if (enterButton) {
            enterButton.addEventListener('click', () => {
                if (welcomePopup) welcomePopup.classList.remove('visible');
                showMainContentAndInit();
            }, { once: true });
        } else {
             console.warn("Enter button not found.");
             // Jika tombol tidak ada tapi popup ada, mungkin perlu cara lain untuk menutupnya
             // atau anggap saja langsung lanjut setelah delay?
             setTimeout(() => {
                 if (welcomePopup) welcomePopup.classList.remove('visible');
                 showMainContentAndInit();
             }, 500); // Contoh delay
        }
    }

    function showMainContentAndInit() {
        // b. Putar Musik (jika ada dan bisa)
        if (bgMusic) {
             // Cek apakah konteks audio sudah dimulai (biasanya perlu interaksi user)
             const context = new (window.AudioContext || window.webkitAudioContext)();
             if (context.state === 'suspended') {
                 context.resume().then(() => console.log("AudioContext resumed!"));
             }

            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay music failed, user interaction might be needed first:", error);
                    // Mungkin tambahkan tombol play/pause manual sebagai fallback
                });
            }
        } else {
            console.log("Background music element not found.");
        }

        // c. Tampilkan Konten Utama
        if (mainContent) {
            mainContent.classList.add('visible');
        } else {
             console.error("Main content element not found!");
             return; // Tidak bisa lanjut jika konten utama tidak ada
        }


        // d. Inisialisasi Carousel setelah konten terlihat (beri delay agar ukuran benar)
        setTimeout(() => {
            if (cells.length > 0 && scene && carousel) {
                 // Recalculate radius after main content is visible & sized
                 radius = calculateRadius(); // Hitung radius sekarang
                 if (radius > 0) {
                     positionCells(); // Posisikan kartu
                     rotateCarousel(0); // Putar ke posisi awal
                     setupCarouselInteraction(); // Aktifkan interaksi SETELAH diposisikan
                 } else {
                      console.error("Failed to initialize carousel: Radius is zero.");
                 }

            } else if (cells.length === 0 && carousel) {
                 console.warn("Carousel initialized but no cells found.");
            } else if (!scene || !carousel) {
                console.warn("Scene or Carousel element not found, cannot initialize carousel.");
            }
        }, 250); // Sedikit delay agar layout stabil

        // e. Aktifkan Parallax Background
        window.addEventListener('mousemove', handleParallax);
    }


    // --- Fungsi Interaksi Carousel ---
    function setupCarouselInteraction() {
        if (!scene || !carousel || numCells === 0) return;

        // 1. Klik pada Kartu -> Putar ke depan
        cells.forEach((cell, index) => {
            cell.addEventListener('click', (e) => {
                // Hanya rotasi jika BUKAN hasil dari drag (geser)
                 if (isDragging) {
                     // Reset flag jika ini adalah akhir dari 'tap' setelah 'drag' kecil
                     // isDragging = false; // Mungkin tidak perlu, touchend sudah handle
                     return;
                 }
                const targetAngle = -theta * index;
                rotateCarousel(targetAngle);
            });
        });

        // 2. Mouse Wheel Scroll
        let scrollTimeout;
        scene.addEventListener('wheel', (event) => {
            if (Math.abs(event.deltaY) < 10) return; // Abaikan scroll kecil/horizontal

            event.preventDefault();
            const delta = Math.sign(event.deltaY);
            // Opsi 2: Snap ke kartu berikutnya/sebelumnya
            const targetIndex = selectedIndex + delta;
            const targetAngle = -theta * targetIndex;
            rotateCarousel(targetAngle);

            /* // Opsi 1: Putar sedikit demi sedikit (mungkin kurang smooth)
             const rotationAmount = delta * (theta / 3); // Sesuaikan sensitivitas
             rotateCarousel(currentAngle + rotationAmount);
            */

        }, { passive: false });

        // 3. Touch Events (Geser/Swipe)
        // Variabel isDragging, startX, currentX, dragAngle sudah di atas

        scene.addEventListener('touchstart', (event) => {
             if (!event.target.closest('.scene') || event.touches.length > 1) return; // Hanya 1 jari & di area scene

             isDragging = false; // Reset status drag di awal sentuhan
             startX = event.touches[0].clientX;
             currentX = startX;
             dragAngle = currentAngle;
             carousel.style.transition = 'none'; // Matikan transisi saat drag
             scene.style.cursor = 'grabbing';

        }, { passive: true }); // Buat touchstart pasif agar tidak delay

        scene.addEventListener('touchmove', (event) => {
             // Cek jika startX belum di set (mungkin event aneh)
             if (startX === 0 || event.touches.length > 1) return;

             currentX = event.touches[0].clientX;
             const deltaX = currentX - startX;

             // Anggap drag jika geseran signifikan (misal > 5px)
             // isDragging di set true HANYA jika gerakan cukup besar
             if (!isDragging && Math.abs(deltaX) > 5) {
                 isDragging = true;
             }

             // Hanya proses jika memang sedang drag
             if (isDragging) {
                  // Cegah scroll halaman HANYA jika sedang drag carousel
                  event.preventDefault();
                 const rotationChange = (deltaX) / 4; // Sesuaikan sensitivitas
                 const newAngle = dragAngle + rotationChange;

                 carousel.style.transform = `translateZ(${-radius}px) rotateY(${newAngle}deg)`;
                 // Jangan update currentAngle di sini, biarkan touchend yang finalisasi
                 // currentAngle = newAngle; // Hapus baris ini
                 updateActiveCellBasedOnAngle(newAngle); // Update highlight sementara
             }
        }, { passive: false }); // Perlu false untuk preventDefault saat drag

        scene.addEventListener('touchend', (event) => {
            if (startX === 0) return; // Abaikan jika tidak ada touchstart valid

            carousel.style.transition = 'transform 1s cubic-bezier(0.77, 0, 0.175, 1)';
            scene.style.cursor = 'grab';

            const deltaX = currentX - startX; // Hitung total geseran

            if (isDragging) { // Hanya snap jika benar-benar terjadi drag
                // Snap ke kartu terdekat setelah drag selesai
                // Gunakan sudut terakhir dari transform, bukan currentAngle global yg mungkin belum update
                const finalAngle = extractYRotation(carousel.style.transform);
                const targetIndex = Math.round(-finalAngle / theta);
                rotateCarousel(-targetIndex * theta); // currentAngle akan diupdate oleh rotateCarousel
            } else {
                // Jika tidak drag (hanya tap), biarkan event 'click' di cell yang handle
                // Tidak perlu lakukan apa-apa di sini untuk tap
            }

            // Reset state setelah touch berakhir
            startX = 0;
            currentX = 0;
            // Reset isDragging di akhir, penting!
            setTimeout(() => { isDragging = false; }, 50); // Beri jeda sedikit


        });

         // Fungsi helper untuk update highlight saat drag tanpa mengubah currentAngle global
        function updateActiveCellBasedOnAngle(angle) {
            if (numCells === 0) return;
            const normalizedAngle = ((-angle % 360) + 360) % 360;
            const closestIndexRaw = Math.round(normalizedAngle / theta);
            const tempSelectedIndex = closestIndexRaw % numCells;

            cells.forEach((cell, index) => {
                const isActive = index === tempSelectedIndex;
                const baseTransform = cell.style.transform.replace(/ scale\(.*\)/, '');
                if (isActive) {
                    if (!cell.classList.contains('active')) {
                         cell.classList.add('active');
                         cell.style.zIndex = 2;
                         cell.style.transform = `${baseTransform} scale(1.08)`;
                    }
                } else {
                    if (cell.classList.contains('active')) {
                         cell.classList.remove('active');
                         cell.style.zIndex = 1;
                         cell.style.transform = baseTransform;
                    }
                }
            });
        }

         // Fungsi helper untuk mengekstrak sudut rotasi Y dari string transform
         function extractYRotation(transformString) {
             if (!transformString) return 0;
             const match = transformString.match(/rotateY\(([^)]+)deg\)/);
             return match ? parseFloat(match[1]) : 0;
         }


        // Set cursor awal
        scene.style.cursor = 'grab';
    }

    // --- Mulai Aplikasi ---
    initApp();

}); // Akhir DOMContentLoaded
// --- END OF FILE script.js ---