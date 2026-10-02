'use strict';
/* =========================================================
   AYO KELILING TATA SURYA - script.js
   Struktur:
   1. Utilitas         5. Panel info & pilihan planet
   2. Data & aset      6. Adu planet, Perjalanan, Timbangan
   3. Suara            7. Kuis
   4. Simulasi canvas  8. Game urutan planet + efek visual
   ========================================================= */

/* ================= 1. UTILITAS ================= */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const nf = (n, d = 0) => Number(n).toLocaleString('id-ID', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => Math.random() * (b - a) + a;
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const shade = (hex, amt) => { const n = parseInt(hex.slice(1), 16); const c = v => clamp(v, 0, 255); return `rgb(${c((n >> 16) + amt)},${c(((n >> 8) & 255) + amt)},${c((n & 255) + amt)})`; };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(hover: none)').matches;

/* ================= 2. DATA & ASET ================= */
/* ---- Nama file suara (letakkan di folder assets/audio/) ----
   Jika file tidak ada, suara otomatis dibuat sintetis oleh browser.
   Audio sengaja tetap lokal: file musik/efek berhak cipta tidak aman untuk
   di-hotlink dari internet, jadi kalau file ini tidak kamu sediakan,
   situs otomatis memakai suara sintetis bawaan (tanpa perlu file apa pun). */
const AUDIO_FILES = {
  musik:  'assets/audio/musik-latar.mp3',
  klik:   'assets/audio/klik.mp3',
  hover:  'assets/audio/hover.mp3',
  benar:  'assets/audio/benar.mp3',
  salah:  'assets/audio/salah.mp3',
  whoosh: 'assets/audio/whoosh.mp3',
  bintang:'assets/audio/bintang.mp3',
  selesai:'assets/audio/selesai.mp3'
};

/* ---- Data benda langit. ----
   Properti "img" untuk Merkurius s.d. Neptunus memakai gambar PNG transparan
   dari NASA / Southwest Research Institute (situs resmi misi Juno) yang
   boleh diakses langsung lewat internet, jadi tidak perlu disimpan lokal:
   https://www.missionjuno.swri.edu/pub/n/images/planets/
   Kalau suatu saat gambar itu tidak bisa diakses (mis. tidak ada internet),
   kode ini otomatis kembali memakai bola gradien warna seperti sebelumnya
   (lihat onerror di HTML dan fungsi drawBody di bagian 4). Untuk Matahari
   dan Bulan sengaja dibiarkan tanpa gambar karena belum ada sumber gambar
   transparan dari internet yang benar-benar stabil untuk dipastikan --
   gradien bawaannya sudah terlihat bagus sebagai gantinya. */
const BODIES = [
  {
    id: 'matahari', nama: 'Matahari', tipe: 'Bintang', color: '#ffb32b', img: 'assets/img/matahari.png',
    orbit: 0, size: 44, imgFit: 1.18, clip: false, focusZoom: 1.6, tahun: 1, gravity: 27.9, jarakBumi: 149600000,
    desk: 'Matahari adalah bintang di pusat tata surya. Bola gas raksasa yang sangat panas ini menjadi sumber cahaya dan panas bagi semua planet, termasuk kehidupan di Bumi.',
    stats: [['Diameter', '1.392.700 km'], ['Massa', '333.000 × Bumi'], ['Suhu permukaan', '± 5.500 °C'], ['Suhu inti', '± 15 juta °C'], ['Umur', '± 4,6 miliar tahun'], ['Isi utama', 'Hidrogen & helium']],
    fakta: ['Sekitar 1,3 juta Bumi bisa dimasukkan ke dalam Matahari.', 'Cahaya Matahari butuh sekitar 8 menit 20 detik untuk sampai ke Bumi.', 'Matahari menyimpan sekitar 99,8% dari seluruh massa tata surya.']
  },
  {
    id: 'merkurius', nama: 'Merkurius', tipe: 'Planet terestrial', color: '#b1a79d', img: 'https://www.missionjuno.swri.edu/pub/n/images/planets/mercury.png',
    orbit: 72, size: 7, imgFit: 1, focusZoom: 4.2, tahun: 0.241, gravity: 0.38,
    desk: 'Merkurius adalah planet terkecil dan paling dekat dengan Matahari. Permukaannya penuh kawah seperti Bulan dan hampir tidak punya atmosfer.',
    stats: [['Diameter', '4.879 km'], ['Jarak dari Matahari', '57,9 juta km'], ['Revolusi (1 tahun)', '88 hari'], ['Rotasi (1 hari)', '58,6 hari Bumi'], ['Suhu', '−180 s.d. 430 °C'], ['Satelit', '0'], ['Gravitasi', '0,38 × Bumi'], ['Atmosfer', 'Sangat tipis']],
    fakta: ['Satu tahun di Merkurius hanya 88 hari, tetapi satu hari siang-malamnya berlangsung sekitar 176 hari Bumi.', 'Walau paling dekat Matahari, Merkurius bukan planet terpanas. Malam harinya bisa mencapai −180 °C.', 'Merkurius adalah planet yang bergerak paling cepat mengelilingi Matahari.'],
    num: { diameter: 4879, jarak: 57.9, suhu: 167, tahun: 88, satelit: 0 }, jarakBumi: 77300000, memo: 'Planet terkecil & paling cepat mengitari Matahari'
  },
  {
    id: 'venus', nama: 'Venus', tipe: 'Planet terestrial', color: '#e8c07a', img: 'https://www.missionjuno.swri.edu/pub/n/images/planets/venus.png',
    orbit: 108, size: 12, imgFit: 1, focusZoom: 3.6, tahun: 0.615, gravity: 0.91,
    desk: 'Venus tampak sangat terang di langit pagi dan senja, sehingga dijuluki Bintang Kejora. Atmosfernya tebal penuh karbon dioksida, membuatnya menjadi planet terpanas.',
    stats: [['Diameter', '12.104 km'], ['Jarak dari Matahari', '108,2 juta km'], ['Revolusi (1 tahun)', '225 hari'], ['Rotasi (1 hari)', '243 hari (terbalik)'], ['Suhu', '± 465 °C'], ['Satelit', '0'], ['Gravitasi', '0,91 × Bumi'], ['Atmosfer', 'Karbon dioksida tebal']],
    fakta: ['Venus berotasi berlawanan arah dengan kebanyakan planet, jadi Matahari terbit dari barat.', 'Satu hari di Venus lebih lama daripada satu tahunnya.', 'Tekanan udara di permukaan Venus sekitar 90 kali tekanan udara di Bumi.'],
    num: { diameter: 12104, jarak: 108.2, suhu: 464, tahun: 225, satelit: 0 }, jarakBumi: 38200000, memo: 'Planet terpanas, rotasinya terbalik'
  },
  {
    id: 'bumi', nama: 'Bumi', tipe: 'Planet terestrial', color: '#3b82f6', img: 'https://www.missionjuno.swri.edu/pub/n/images/planets/earth.png',
    orbit: 150, size: 13, imgFit: 1, focusZoom: 3.6, tahun: 1, gravity: 1,
    desk: 'Bumi adalah satu-satunya planet yang diketahui memiliki kehidupan. Sekitar 71% permukaannya tertutup air, dan atmosfernya melindungi kita dari radiasi berbahaya.',
    stats: [['Diameter', '12.742 km'], ['Jarak dari Matahari', '149,6 juta km'], ['Revolusi (1 tahun)', '365,25 hari'], ['Rotasi (1 hari)', '23 jam 56 menit'], ['Suhu rata-rata', '15 °C'], ['Satelit', '1 (Bulan)'], ['Gravitasi', '1 × Bumi'], ['Atmosfer', 'Nitrogen & oksigen']],
    fakta: ['Sumbu Bumi miring sekitar 23,5°, inilah penyebab pergantian musim.', 'Bumi mengelilingi Matahari dengan kecepatan sekitar 107.000 km/jam.', 'Bumi tidak bulat sempurna, melainkan sedikit pepat di kutub.'],
    num: { diameter: 12742, jarak: 149.6, suhu: 15, tahun: 365, satelit: 1 }, memo: 'Satu-satunya planet yang diketahui berkehidupan'
  },
  {
    id: 'bulan', nama: 'Bulan', tipe: 'Satelit alami Bumi', color: '#c9c9d1', img: 'assets/img/bulan.png',
    orbit: 0, moonR: 27, size: 4.6, imgFit: 1, focusZoom: 7, tahun: 1, gravity: 0.166, jarakBumi: 384400, parent: 'bumi',
    desk: 'Bulan adalah satu-satunya satelit alami Bumi. Permukaannya berdebu dan penuh kawah bekas tabrakan meteorit. Tarikan gravitasinya menyebabkan pasang surut air laut.',
    stats: [['Diameter', '3.474 km'], ['Jarak dari Bumi', '384.400 km'], ['Revolusi', '27,3 hari'], ['Rotasi', '27,3 hari'], ['Suhu', '−173 s.d. 127 °C'], ['Gravitasi', '0,166 × Bumi']],
    fakta: ['Kita selalu melihat sisi Bulan yang sama dari Bumi karena rotasi dan revolusinya sama lama.', 'Bulan menjauh dari Bumi sekitar 3,8 cm setiap tahun.', 'Astronaut pertama menginjakkan kaki di Bulan pada tahun 1969.']
  },
  {
    id: 'mars', nama: 'Mars', tipe: 'Planet terestrial', color: '#e0603a', img: 'https://www.missionjuno.swri.edu/pub/n/images/planets/mars.png',
    orbit: 194, size: 9, imgFit: 1, focusZoom: 4, tahun: 1.881, gravity: 0.38,
    desk: 'Mars dijuluki Planet Merah karena permukaannya kaya besi oksida (karat). Di sini terdapat gunung berapi tertinggi di tata surya, Olympus Mons.',
    stats: [['Diameter', '6.779 km'], ['Jarak dari Matahari', '227,9 juta km'], ['Revolusi (1 tahun)', '687 hari'], ['Rotasi (1 hari)', '24 jam 37 menit'], ['Suhu rata-rata', '−63 °C'], ['Satelit', '2 (Phobos, Deimos)'], ['Gravitasi', '0,38 × Bumi'], ['Atmosfer', 'CO₂ tipis']],
    fakta: ['Olympus Mons setinggi sekitar 22 km, hampir 2,5 kali Gunung Everest.', 'Mars punya dua bulan kecil bernama Phobos dan Deimos.', 'Para ilmuwan menemukan bukti bahwa dahulu air pernah mengalir di permukaan Mars.'],
    num: { diameter: 6779, jarak: 227.9, suhu: -65, tahun: 687, satelit: 2 }, jarakBumi: 54600000, memo: 'Dijuluki Planet Merah'
  },
  {
    id: 'ceres', nama: 'Ceres', tipe: 'Planet katai (terbesar di sabuk asteroid)', color: '#8f8a7c', img: 'assets/img/ceres.png',
    orbit: 250, size: 3.2, imgFit: 1, focusZoom: 6, tahun: 4.6, gravity: 0.029, jarakBumi: 239000000,
    desk: 'Ceres adalah benda terbesar di sabuk asteroid antara Mars dan Jupiter. Ditemukan tahun 1801, awalnya disebut planet, lalu asteroid, dan sejak 2006 resmi menjadi planet katai.',
    stats: [['Diameter', '940 km'], ['Jarak dari Matahari', '414 juta km'], ['Revolusi (1 tahun)', '4,6 tahun'], ['Rotasi (1 hari)', '9 jam'], ['Gravitasi', '0,029 × Bumi'], ['Ditemukan', 'Tahun 1801']],
    fakta: ['Ceres adalah objek pertama di sabuk asteroid yang ditemukan manusia.', 'Ceres menyimpan cukup banyak air es, bahkan diduga punya lautan bawah permukaan.', 'Pesawat luar angkasa Dawn milik NASA pernah mengorbit Ceres pada 2015–2018.']
  },
  {
    id: 'jupiter', nama: 'Jupiter', tipe: 'Raksasa gas', color: '#d9a066', img: 'https://www.missionjuno.swri.edu/pub/n/images/planets/jupiter.png',
    orbit: 325, size: 31, imgFit: 1, focusZoom: 2.3, tahun: 11.86, gravity: 2.34,
    desk: 'Jupiter adalah planet terbesar di tata surya. Bintik Merah Besar di atmosfernya adalah badai raksasa yang sudah berlangsung ratusan tahun.',
    stats: [['Diameter', '139.820 km'], ['Jarak dari Matahari', '778,5 juta km'], ['Revolusi (1 tahun)', '11,9 tahun'], ['Rotasi (1 hari)', '9 jam 56 menit'], ['Suhu awan', '± −110 °C'], ['Satelit', '95+'], ['Gravitasi', '2,34 × Bumi'], ['Isi utama', 'Hidrogen & helium']],
    fakta: ['Massa Jupiter lebih dari dua kali massa seluruh planet lain digabung.', 'Bintik Merah Besar lebih lebar daripada Bumi.', 'Satu hari di Jupiter hanya sekitar 10 jam, tercepat di antara semua planet.'],
    num: { diameter: 139820, jarak: 778.5, suhu: -110, tahun: 4333, satelit: 95 }, jarakBumi: 588000000, memo: 'Planet terbesar, punya Bintik Merah Besar'
  },
  {
    id: 'io', nama: 'Io', tipe: 'Satelit alami Jupiter', color: '#e8d27a', img: 'assets/img/io.png',
    orbit: 0, parent: 'jupiter', moonR: 42, moonSpeed: 3.2, size: 2.6, focusZoom: 9,
    desk: 'Io adalah bulan Jupiter yang paling aktif secara vulkanik di tata surya, dengan ratusan gunung berapi yang terus meletus akibat tarikan gravitasi Jupiter yang sangat kuat.',
    stats: [['Diameter', '3.643 km'], ['Jarak dari Jupiter', '± 422.000 km'], ['Revolusi', '1,8 hari'], ['Keunikan', 'Paling aktif vulkanik']],
    fakta: ['Gunung berapi di Io bisa menyemburkan material hingga ratusan km ke angkasa.', 'Permukaan Io berwarna kuning-oranye karena belerang dari letusan vulkaniknya.', 'Io adalah salah satu dari 4 bulan Galileo yang ditemukan Galileo Galilei tahun 1610.']
  },
  {
    id: 'europa', nama: 'Europa', tipe: 'Satelit alami Jupiter', color: '#d9c9b0', img: 'assets/img/europa.png',
    orbit: 0, parent: 'jupiter', moonR: 52, moonSpeed: 2.5, size: 2.5, focusZoom: 9,
    desk: 'Europa memiliki permukaan es yang halus dengan banyak retakan. Di bawah lapisan esnya diduga tersembunyi lautan air cair, menjadikannya salah satu tempat terbaik untuk mencari kehidupan di luar Bumi.',
    stats: [['Diameter', '3.122 km'], ['Jarak dari Jupiter', '± 671.000 km'], ['Revolusi', '3,6 hari'], ['Keunikan', 'Diduga punya lautan bawah es']],
    fakta: ['Lapisan es Europa diperkirakan menyembunyikan lautan dengan air dua kali lebih banyak dari semua lautan Bumi.', 'Permukaannya sangat halus, nyaris tanpa gunung atau kawah besar.', 'NASA berencana mengirim wahana Europa Clipper untuk mempelajarinya lebih dekat.']
  },
  {
    id: 'ganymede', nama: 'Ganymede', tipe: 'Satelit alami Jupiter', color: '#a79c8c', img: 'assets/img/ganymede.png',
    orbit: 0, parent: 'jupiter', moonR: 64, moonSpeed: 1.9, size: 3, focusZoom: 8,
    desk: 'Ganymede adalah satelit alami terbesar di seluruh tata surya, bahkan lebih besar daripada planet Merkurius. Ganymede juga satu-satunya bulan yang diketahui memiliki medan magnetnya sendiri.',
    stats: [['Diameter', '5.268 km'], ['Jarak dari Jupiter', '± 1,07 juta km'], ['Revolusi', '7,2 hari'], ['Keunikan', 'Bulan terbesar di tata surya']],
    fakta: ['Ganymede lebih besar daripada planet Merkurius, meski massanya lebih ringan.', 'Ganymede punya medan magnet sendiri, hal yang tidak dimiliki bulan lain.', 'Di bawah permukaannya diduga juga tersembunyi lautan air asin.']
  },
  {
    id: 'callisto', nama: 'Callisto', tipe: 'Satelit alami Jupiter', color: '#7d7265', img: 'assets/img/callisto.png',
    orbit: 0, parent: 'jupiter', moonR: 80, moonSpeed: 1.3, size: 2.9, focusZoom: 7,
    desk: 'Callisto adalah bulan Jupiter dengan permukaan paling penuh kawah di tata surya, menandakan permukaannya nyaris tidak berubah selama miliaran tahun.',
    stats: [['Diameter', '4.821 km'], ['Jarak dari Jupiter', '± 1,88 juta km'], ['Revolusi', '16,7 hari'], ['Keunikan', 'Permukaan paling banyak kawah']],
    fakta: ['Permukaan Callisto diperkirakan berumur hampir sama tuanya dengan tata surya itu sendiri.', 'Callisto adalah bulan Galileo yang jaraknya paling jauh dari Jupiter.', 'Permukaannya dipenuhi kawah tabrakan yang tak terhitung jumlahnya.']
  },
  {
    id: 'saturnus', nama: 'Saturnus', tipe: 'Raksasa gas', color: '#e6cf94', img: 'https://www.missionjuno.swri.edu/pub/n/images/planets/saturn.png',
    orbit: 405, size: 25, imgFit: 2.3, clip: false, focusZoom: 2.4, tahun: 29.46, gravity: 1.06,
    desk: 'Saturnus terkenal dengan cincinnya yang indah, tersusun dari jutaan bongkahan es dan batu. Planet gas raksasa ini sangat ringan untuk ukurannya.',
    stats: [['Diameter', '116.460 km'], ['Jarak dari Matahari', '1,43 miliar km'], ['Revolusi (1 tahun)', '29,4 tahun'], ['Rotasi (1 hari)', '10 jam 33 menit'], ['Suhu awan', '± −140 °C'], ['Satelit', '270+'], ['Gravitasi', '1,06 × Bumi'], ['Isi utama', 'Hidrogen & helium']],
    fakta: ['Massa jenis Saturnus lebih kecil daripada air. Andai ada bak air raksasa, Saturnus akan mengapung!', 'Cincin Saturnus lebarnya ratusan ribu km, tetapi tebalnya hanya sekitar 10 m sampai 1 km.', 'Titan, satelit terbesar Saturnus, memiliki atmosfer yang tebal.'],
    num: { diameter: 116460, jarak: 1434, suhu: -140, tahun: 10759, satelit: 270 }, jarakBumi: 1200000000, memo: 'Terkenal dengan cincin megahnya'
  },
  {
    id: 'titan', nama: 'Titan', tipe: 'Satelit alami Saturnus', color: '#e8b35a', img: 'assets/img/titan.png',
    orbit: 0, parent: 'saturnus', moonR: 58, moonSpeed: 2.1, size: 3, focusZoom: 8,
    desk: 'Titan adalah bulan terbesar Saturnus dan satu-satunya bulan di tata surya yang memiliki atmosfer tebal. Permukaannya bahkan punya sungai dan danau, tetapi berisi metana cair, bukan air.',
    stats: [['Diameter', '5.150 km'], ['Jarak dari Saturnus', '± 1,2 juta km'], ['Revolusi', '16 hari'], ['Keunikan', 'Punya atmosfer & danau metana cair']],
    fakta: ['Titan adalah satu-satunya bulan di tata surya yang memiliki atmosfer tebal seperti planet.', 'Di permukaannya ada danau dan sungai, tapi isinya metana dan etana cair, bukan air.', 'Wahana Huygens milik ESA pernah mendarat di permukaan Titan tahun 2005.']
  },
  {
    id: 'uranus', nama: 'Uranus', tipe: 'Raksasa es', color: '#7fd6e6', img: 'https://www.missionjuno.swri.edu/pub/n/images/planets/uranus.png',
    orbit: 470, size: 18, imgFit: 1, focusZoom: 3, tahun: 84.0, gravity: 0.92,
    desk: 'Uranus adalah raksasa es berwarna biru kehijauan. Sumbunya miring hampir 98°, sehingga planet ini seolah berguling saat mengelilingi Matahari.',
    stats: [['Diameter', '50.724 km'], ['Jarak dari Matahari', '2,87 miliar km'], ['Revolusi (1 tahun)', '84 tahun'], ['Rotasi (1 hari)', '17 jam 14 menit'], ['Suhu awan', '± −195 °C'], ['Satelit', '28+'], ['Gravitasi', '0,92 × Bumi'], ['Isi utama', 'Hidrogen, helium, metana']],
    fakta: ['Uranus adalah planet pertama yang ditemukan dengan teleskop, oleh William Herschel pada 1781.', 'Satu musim di Uranus berlangsung sekitar 21 tahun Bumi.', 'Uranus juga punya cincin, tetapi tipis dan gelap.'],
    num: { diameter: 50724, jarak: 2871, suhu: -195, tahun: 30687, satelit: 28 }, jarakBumi: 2580000000, memo: 'Berputar miring hampir menyamping'
  },
  {
    id: 'neptunus', nama: 'Neptunus', tipe: 'Raksasa es', color: '#4b6cf0', img: 'https://www.missionjuno.swri.edu/pub/n/images/planets/neptune.png',
    orbit: 530, size: 17.5, imgFit: 1, focusZoom: 3, tahun: 164.8, gravity: 1.19,
    desk: 'Neptunus adalah planet terjauh dari Matahari. Warnanya biru pekat, dan angin di sana adalah yang tercepat di seluruh tata surya.',
    stats: [['Diameter', '49.244 km'], ['Jarak dari Matahari', '4,50 miliar km'], ['Revolusi (1 tahun)', '164,8 tahun'], ['Rotasi (1 hari)', '16 jam 6 menit'], ['Suhu awan', '± −200 °C'], ['Satelit', '16+'], ['Gravitasi', '1,19 × Bumi'], ['Isi utama', 'Hidrogen, helium, metana']],
    fakta: ['Kecepatan angin di Neptunus bisa mencapai sekitar 2.000 km/jam.', 'Neptunus ditemukan lewat perhitungan matematika sebelum terlihat teleskop, pada 1846.', 'Neptunus baru menyelesaikan satu putaran penuh sejak ditemukan pada tahun 2011.'],
    num: { diameter: 49244, jarak: 4495, suhu: -200, tahun: 60190, satelit: 16 }, jarakBumi: 4300000000, memo: 'Terjauh dari Matahari, anginnya tercepat'
  },
  {
    id: 'pluto', nama: 'Pluto', tipe: 'Planet katai', color: '#c9b6a3', img: 'assets/img/pluto.png',
    orbit: 590, ecc: 0.25, size: 5, imgFit: 1, focusZoom: 6.5, tahun: 20, gravity: 0.063, jarakBumi: 4280000000,
    desk: 'Pluto dianggap planet kesembilan sejak ditemukan tahun 1930, sampai akhirnya diklasifikasikan ulang menjadi planet katai pada 2006 karena orbitnya belum "membersihkan" lingkungan sekitarnya. Pluto punya 5 bulan, yang terbesar bernama Charon.',
    stats: [['Diameter', '2.377 km'], ['Jarak rata-rata dari Matahari', '5,9 miliar km'], ['Revolusi (1 tahun)', '248 tahun'], ['Satelit', '5 (terbesar: Charon)'], ['Gravitasi', '0,063 × Bumi'], ['Suhu', '± −225 °C']],
    fakta: ['Orbit Pluto cukup lonjong, kadang membuatnya lebih dekat ke Matahari daripada Neptunus.', 'Pluto dan bulannya Charon begitu berdekatan ukurannya sehingga sering disebut "planet ganda".', 'Sejak ditemukan tahun 1930, Pluto baru menyelesaikan sepertiga putaran mengelilingi Matahari.']
  },
  {
    id: 'eris', nama: 'Eris', tipe: 'Planet katai (Sabuk Kuiper)', color: '#d8d2c6', img: 'assets/img/eris.png',
    orbit: 640, ecc: 0.44, size: 4.6, focusZoom: 6.5, tahun: 24, gravity: 0.082,
    desk: 'Eris adalah planet katai yang sangat jauh dan hampir seukuran Pluto. Penemuannya tahun 2005 justru menjadi alasan utama Pluto diklasifikasikan ulang menjadi planet katai.',
    stats: [['Diameter', '2.326 km'], ['Jarak rata-rata dari Matahari', '± 10,1 miliar km'], ['Revolusi (1 tahun)', '± 558 tahun'], ['Ditemukan', 'Tahun 2005'], ['Gravitasi', '0,082 × Bumi']],
    fakta: ['Penemuan Eris tahun 2005 memicu perdebatan yang akhirnya membuat Pluto direklasifikasi jadi planet katai.', 'Eris memiliki satu bulan bernama Dysnomia.', 'Eris adalah salah satu benda terjauh dan terdingin yang pernah diamati di tata surya.']
  },
  {
    id: 'haumea', nama: 'Haumea', tipe: 'Planet katai (Sabuk Kuiper)', color: '#eef1f6', img: 'assets/img/haumea.png',
    orbit: 615, ecc: 0.2, size: 3.6, focusZoom: 7, tahun: 15, gravity: 0.044,
    desk: 'Haumea adalah planet katai dengan bentuk unik lonjong seperti bola rugbi, karena berputar sangat cepat pada porosnya hanya dalam waktu sekitar 4 jam.',
    stats: [['Diameter', '± 1.632 x 1.178 km (lonjong)'], ['Rotasi', '± 4 jam (tercepat di tata surya)'], ['Revolusi (1 tahun)', '± 285 tahun'], ['Satelit', '2 (Hiʻiaka & Namaka)']],
    fakta: ['Rotasi Haumea yang sangat cepat membuat bentuknya lonjong seperti bola rugbi, bukan bulat sempurna.', 'Haumea punya cincin tipis, hal langka untuk planet katai.', 'Haumea dinamai dari dewi kesuburan dan kelahiran dalam mitologi Hawaii.']
  },
  {
    id: 'makemake', nama: 'Makemake', tipe: 'Planet katai (Sabuk Kuiper)', color: '#c99a6b', img: 'assets/img/makemake.png',
    orbit: 625, ecc: 0.16, size: 3.8, focusZoom: 7, tahun: 18, gravity: 0.05,
    desk: 'Makemake adalah planet katai terang kedua di Sabuk Kuiper setelah Pluto. Permukaannya tertutup es metana dan etana, membuatnya tampak kemerahan.',
    stats: [['Diameter', '± 1.430 km'], ['Jarak rata-rata dari Matahari', '± 6,8 miliar km'], ['Revolusi (1 tahun)', '± 305 tahun'], ['Ditemukan', 'Tahun 2005']],
    fakta: ['Makemake dinamai dari dewa pencipta manusia dalam kepercayaan masyarakat Pulau Paskah (Rapa Nui).', 'Permukaannya tertutup es metana yang membuatnya tampak kemerahan.', 'Makemake memiliki satu bulan kecil yang dijuluki "MK 2".']
  },
  {
    id: 'komet', nama: 'Komet Halley', tipe: 'Komet periodik', color: '#bcd6e8', img: 'assets/img/komet.png',
    orbit: 480, ecc: 0.85, size: 3, imgFit: 1, focusZoom: 4, tahun: 6, tailColor: '#cfeeff',
    desk: 'Komet Halley adalah "bola salju kotor" dari es, debu, dan batu yang orbitnya sangat lonjong. Saat mendekati Matahari, panasnya membuat permukaan komet menguap dan membentuk ekor bercahaya yang selalu mengarah menjauhi Matahari.',
    stats: [['Diameter inti', '± 15 km'], ['Periode orbit nyata', '± 76 tahun'], ['Terakhir terlihat', 'Tahun 1986'], ['Akan terlihat lagi', '± Tahun 2061'], ['Terdiri dari', 'Es, debu, dan batu'], ['Arah ekor', 'Selalu menjauhi Matahari']],
    fakta: ['Komet Halley bisa dilihat dari Bumi dengan mata telanjang setiap sekitar 76 tahun sekali.', 'Komet ini dinamai dari astronom Edmond Halley, yang pertama memprediksi kemunculannya kembali.', 'Ekor komet tidak selalu di belakang arah geraknya, melainkan selalu menjauhi Matahari karena didorong angin matahari.']
  }
];
const BY = Object.fromEntries(BODIES.map(b => [b.id, b]));
const PLANETS8 = BODIES.filter(b => b.num);
const TOTAL_EXPLORE = BODIES.length; // 10

/* Ikon planet (dengan cadangan bola berwarna jika gambar tidak ada) */
const icon = (b, cls = '') =>
  `<span class="pl-ico ${cls}" style="--c:${b.color}"><img src="${b.img}" alt="" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" onload="this.parentElement.classList.add('has-img')" onerror="this.remove()"></span>`;

/* ---- Penyimpanan progres ---- */
const store = {
  key: 'tataSuryaProgress_v1',
  data: { stars: 0, explored: [], quizBest: 0, gameBest: null, memBest: null },
  load() { try { Object.assign(this.data, JSON.parse(localStorage.getItem(this.key) || '{}')); } catch (e) { /* abaikan */ } },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* abaikan */ } }
};
store.load();

/* ---- Toast & bintang ---- */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}
function updateHud(pop) {
  $('#starCount').textContent = nf(store.data.stars);
  $('#expCount').textContent = store.data.explored.length;
  if (pop) { const h = $('#starCount').parentElement; h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); }
}
function addStars(n, alasan) {
  if (n <= 0) return;
  store.data.stars += n; store.save(); updateHud(true);
  toast(`+${n} ⭐ ${alasan || ''}`);
  Sound.play('bintang', .5);
}

/* ================= 3. SUARA ================= */
const Sound = (() => {
  let ctx = null, master = null, ambient = null;
  let musicOn = true, sfxOn = true, volume = .4, ducked = false, started = false;
  const files = {}, broken = {};

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type = 'sine', vol = .15, slideTo) {
    const c = getCtx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + start;
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .05);
  }
  function whooshNoise(dur, f1, f2, vol) {
    const c = getCtx(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f1, c.currentTime); f.frequency.exponentialRampToValueAtTime(f2, c.currentTime + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(vol, c.currentTime + dur * .4); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start();
  }
  /* Suara cadangan (dibuat oleh browser jika file mp3 tidak ditemukan) */
  const synth = {
    klik:   () => tone(720, 0, .08, 'triangle', .12, 520),
    hover:  () => tone(1250, 0, .035, 'sine', .035),
    benar:  () => [523, 659, 784].forEach((f, i) => tone(f, i * .09, .22, 'triangle', .14)),
    salah:  () => tone(190, 0, .32, 'sawtooth', .09, 90),
    whoosh: () => whooshNoise(.7, 300, 3200, .2),
    bintang:() => [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, i * .06, .25, 'sine', .08)),
    selesai:() => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, i * .12, .32, 'triangle', .14))
  };

  function load(name) {
    if (files[name]) return files[name];
    const a = new Audio(AUDIO_FILES[name]);
    a.preload = 'auto';
    a.addEventListener('error', () => { broken[name] = true; });
    files[name] = a; return a;
  }
  function play(name, vol = .6) {
    if (!sfxOn) return;
    const a = load(name);
    if (broken[name] || a.error) { synth[name] && synth[name](); return; }
    try {
      const c = a.cloneNode(); c.volume = name === 'hover' ? .25 : vol;
      const p = c.play();
      if (p && p.catch) p.catch(() => synth[name] && synth[name]());
    } catch (e) { synth[name] && synth[name](); }
  }

  /* Musik latar: file mp3 jika ada, jika tidak pakai ambient sintetis */
  function startAmbient() {
    if (ambient) return;
    const c = getCtx(); if (!c) return;
    const g = c.createGain(); g.gain.value = 0; g.connect(master);
    const oscs = [110, 164.8, 220, 277.2, 329.6].map((f, i) => {
      const o = c.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = rand(-8, 8);
      const og = c.createGain(); og.gain.value = .05;
      const lfo = c.createOscillator(); lfo.frequency.value = .05 + i * .03;
      const lg = c.createGain(); lg.gain.value = .035;
      lfo.connect(lg); lg.connect(og.gain); o.connect(og); og.connect(g); o.start(); lfo.start();
      return [o, lfo];
    });
    ambient = { g, oscs };
    g.gain.linearRampToValueAtTime(currentVol() * .8, c.currentTime + 3);
  }
  function stopAmbient() {
    if (!ambient) return;
    const a = ambient; ambient = null;
    a.g.gain.cancelScheduledValues(ctx.currentTime); a.g.gain.setTargetAtTime(0, ctx.currentTime, .15);
    setTimeout(() => a.oscs.forEach(([o, l]) => { try { o.stop(); l.stop(); } catch (e) { /* abaikan */ } }), 800);
  }
  const currentVol = () => volume * (ducked ? .3 : 1);
  function applyVol() {
    const a = files.musik; if (a) a.volume = clamp(currentVol(), 0, 1);
    if (ambient && ctx) ambient.g.gain.setTargetAtTime(currentVol() * .8, ctx.currentTime, .1);
  }
  function startMusic() {
    started = true; if (!musicOn) return;
    const a = load('musik'); a.loop = true; a.volume = clamp(currentVol(), 0, 1);
    if (broken.musik || a.error) { startAmbient(); return; }
    const p = a.play(); if (p && p.catch) p.catch(() => startAmbient());
  }
  function stopMusic() { const a = files.musik; if (a) a.pause(); stopAmbient(); }

  return {
    preload() { Object.keys(AUDIO_FILES).forEach(load); },
    play, startMusic,
    toggleMusic() { musicOn = !musicOn; musicOn ? startMusic() : stopMusic(); return musicOn; },
    toggleSfx() { sfxOn = !sfxOn; return sfxOn; },
    setMusic(v) { musicOn = v; if (!v) stopMusic(); },
    setVolume(v) { volume = v; applyVol(); },
    duck(on) { ducked = on; applyVol(); },
    get started() { return started; }
  };
})();
Sound.preload();

/* ================= 4. SIMULASI CANVAS ================= */
const Sim = (() => {
  const canvas = $('#simCanvas'), ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, last = performance.now(), items = [];
  const S = { zoom: 1, zoomT: 1, off: { x: 0, y: 0 }, tilt: .5, tiltT: .5, speed: 1, paused: false, orbit: true, label: true, follow: null, recenter: false, hover: null, selected: 'bumi', beltA: 0, meteors: [] };

  const sun = BY.matahari;
  const planets = BODIES.filter(b => b.orbit > 0 && !b.parent);
  const moons = BODIES.filter(b => b.parent);
  planets.forEach(p => { p.angle = rand(0, Math.PI * 2); });
  moons.forEach(m => { m.angle = rand(0, Math.PI * 2); });
  BODIES.forEach(b => { b.image = new Image(); b.image.crossOrigin = 'anonymous'; b.image.referrerPolicy = 'no-referrer'; b.ready = false; b.image.onload = () => { b.ready = true; }; b.image.onerror = () => { b.ready = false; }; b.image.src = b.img; });

  const belt = Array.from({ length: 340 }, () => ({ a: rand(0, 6.283), r: rand(232, 268), s: rand(.6, 1.7), o: rand(.3, .85), v: rand(.7, 1.3) }));
  const kuiperBelt = Array.from({ length: 220 }, () => ({ a: rand(0, 6.283), r: rand(605, 660), s: rand(.5, 1.4), o: rand(.2, .6), v: rand(.3, .7) }));
  const bgStars = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random(), r: rand(.3, 1.4), a: rand(.25, .9) }));

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas); resize();

  const baseScale = () => Math.min(w / 2 / 585, h / 2 / (585 * S.tilt)) * .97;

  function worldPos(b, bs) {
    if (b === sun) return { x: 0, y: 0 };
    const z = S.zoom * bs;
    if (b.parent) { const p = worldPos(BY[b.parent], bs); return { x: p.x + Math.cos(b.angle) * b.moonR * z, y: p.y + Math.sin(b.angle) * b.moonR * z * S.tilt }; }
    if (b.ecc) {
      /* orbit elips: Matahari di salah satu fokus elips (persamaan polar fokus) */
      const r = b.orbit * (1 - b.ecc * b.ecc) / (1 + b.ecc * Math.cos(b.angle));
      return { x: Math.cos(b.angle) * r * z, y: Math.sin(b.angle) * r * z * S.tilt };
    }
    return { x: Math.cos(b.angle) * b.orbit * z, y: Math.sin(b.angle) * b.orbit * z * S.tilt };
  }

  function update(dt) {
    if (!S.paused) {
      planets.forEach(p => { p.angle += .35 * S.speed * Math.pow(p.tahun, -.6) * dt; });
      moons.forEach(m => { m.angle += (m.moonSpeed || 1.7) * S.speed * dt; });
      S.beltA += .03 * S.speed * dt;
    }
    if (S.meteors.length) {
      S.meteors.forEach(m => { m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt * .5; });
      S.meteors = S.meteors.filter(m => m.life > 0);
    }
    S.zoom += (S.zoomT - S.zoom) * (1 - Math.exp(-dt * 6));
    S.tilt += (S.tiltT - S.tilt) * (1 - Math.exp(-dt * 5));
    const bs = baseScale();
    if (S.follow) {
      const wp = worldPos(S.follow, bs), k = 1 - Math.exp(-dt * 9);
      S.off.x += (-wp.x - S.off.x) * k; S.off.y += (-wp.y - S.off.y) * k;
    } else if (S.recenter) {
      const k = 1 - Math.exp(-dt * 6);
      S.off.x *= (1 - k); S.off.y *= (1 - k);
      if (Math.abs(S.off.x) + Math.abs(S.off.y) < .5) { S.off.x = S.off.y = 0; S.recenter = false; }
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    const bs = baseScale(), z = S.zoom * bs, cx = w / 2 + S.off.x, cy = h / 2 + S.off.y, tilt = S.tilt, t = now / 1000;

    /* bintang latar dengan efek parallax tipis */
    bgStars.forEach(s => {
      const x = (((s.x * w + S.off.x * .06 * s.r * 3) % w) + w) % w, y = (((s.y * h + S.off.y * .06 * s.r * 3) % h) + h) % h;
      ctx.globalAlpha = s.a * (.7 + .3 * Math.sin(t * 1.5 + s.x * 40));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, s.r, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;

    /* garis orbit */
    if (S.orbit) {
      planets.forEach(p => {
        const sel = S.selected === p.id;
        ctx.beginPath();
        if (p.ecc) {
          const semiMajor = p.orbit * z, semiMinor = p.orbit * Math.sqrt(1 - p.ecc * p.ecc) * z * tilt, ox = -p.orbit * p.ecc * z;
          ctx.ellipse(cx + ox, cy, semiMajor, semiMinor, 0, 0, 7);
        } else {
          ctx.ellipse(cx, cy, p.orbit * z, p.orbit * z * tilt, 0, 0, 7);
        }
        ctx.strokeStyle = sel ? hexA(p.color, .85) : 'rgba(255,255,255,.13)'; ctx.lineWidth = sel ? 1.8 : 1; ctx.stroke();
      });
      moons.forEach(m => {
        const pp = worldPos(BY[m.parent], bs);
        ctx.beginPath(); ctx.ellipse(cx + pp.x, cy + pp.y, m.moonR * z, m.moonR * z * tilt, 0, 0, 7);
        ctx.strokeStyle = S.selected === m.id ? hexA(m.color, .8) : 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke();
      });
    }

    /* sabuk asteroid & sabuk Kuiper */
    ctx.fillStyle = '#c8bfb3';
    belt.forEach(b => {
      const a = b.a + S.beltA * b.v;
      ctx.globalAlpha = b.o;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * b.r * z, cy + Math.sin(a) * b.r * z * tilt, Math.max(.6, b.s * Math.min(S.zoom, 3) * .7), 0, 7); ctx.fill();
    });
    ctx.fillStyle = '#9fc6d9';
    kuiperBelt.forEach(b => {
      const a = b.a + S.beltA * b.v;
      ctx.globalAlpha = b.o;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * b.r * z, cy + Math.sin(a) * b.r * z * tilt, Math.max(.5, b.s * Math.min(S.zoom, 3) * .6), 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (S.label && S.zoom < 1.6) {
      ctx.font = '700 11px "Atkinson Hyperlegible", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,190,175,.65)';
      ctx.fillText('Sabuk asteroid', cx, cy - 268 * z * tilt - 8);
      ctx.fillStyle = 'rgba(170,205,220,.6)';
      ctx.fillText('Sabuk Kuiper', cx, cy - 632 * z * tilt - 8);
    }

    /* hujan meteor (dipicu tombol) */
    if (S.meteors.length) {
      ctx.save();
      S.meteors.forEach(m => {
        const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * .12, m.y - m.vy * .12);
        g.addColorStop(0, `rgba(255,255,255,${clamp(m.life, 0, 1)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * .12, m.y - m.vy * .12); ctx.stroke();
      });
      ctx.restore();
    }

    /* cahaya Matahari */
    const sr = sun.size * z, pulse = 1 + Math.sin(t * 2) * .03;
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(cx, cy, sr * .6, cx, cy, sr * 3.6 * pulse);
    glow.addColorStop(0, 'rgba(255,175,50,.6)'); glow.addColorStop(.4, 'rgba(255,120,30,.18)'); glow.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, sr * 3.6 * pulse, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    /* kumpulkan semua benda, urutkan berdasarkan kedalaman (y) */
    const list = [{ b: sun, x: cx, y: cy, r: sr }];
    planets.forEach(p => { const wp = worldPos(p, bs); list.push({ b: p, x: cx + wp.x, y: cy + wp.y, r: Math.max(p.size * z, 4) }); });
    moons.forEach(m => { const wp = worldPos(m, bs); list.push({ b: m, x: cx + wp.x, y: cy + wp.y, r: Math.max(m.size * z, 2.2) }); });
    list.sort((a, b) => a.y - b.y);
    items = list;
    list.forEach(it => drawBody(it, cx, cy, t));
  }

  function drawBody({ b, x, y, r }, sx, sy, t) {
    const isSun = b === sun, sel = S.selected === b.id, hov = S.hover === b;

    /* ekor komet: selalu menjauhi Matahari, memanjang saat dekat Matahari */
    if (b.id === 'komet' && b.ecc) {
      const peri = b.orbit * (1 - b.ecc), apo = b.orbit * (1 + b.ecc);
      const rNow = b.orbit * (1 - b.ecc * b.ecc) / (1 + b.ecc * Math.cos(b.angle));
      const closeness = clamp(1 - (rNow - peri) / (apo - peri), 0, 1);
      const away = Math.atan2(y - sy, x - sx);
      const tailLen = 16 + closeness * closeness * 130;
      const tx = x + Math.cos(away) * tailLen, ty = y + Math.sin(away) * tailLen;
      ctx.save();
      const g = ctx.createLinearGradient(x, y, tx, ty);
      g.addColorStop(0, hexA(b.tailColor || '#cfeeff', .75)); g.addColorStop(1, hexA(b.tailColor || '#cfeeff', 0));
      ctx.strokeStyle = g; ctx.lineWidth = Math.max(2, r * .9); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.restore();
    }

    ctx.save();

    /* cincin cadangan Saturnus (jika gambar belum ada) - bagian belakang */
    if (b.id === 'saturnus' && !b.ready) ringHalf(x, y, r, Math.PI, Math.PI * 2);

    if (b.ready) {
      const fit = r * 2 * (b.imgFit || 1), iw = b.image.naturalWidth, ih = b.image.naturalHeight, s = fit / Math.max(iw, ih);
      if (b.clip === false) ctx.drawImage(b.image, x - iw * s / 2, y - ih * s / 2, iw * s, ih * s);
      else { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip(); ctx.drawImage(b.image, x - iw * s / 2, y - ih * s / 2, iw * s, ih * s); }
    } else {
      const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
      g.addColorStop(0, shade(b.color, 70)); g.addColorStop(.6, b.color); g.addColorStop(1, shade(b.color, -60));
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = g; ctx.fill();
    }
    ctx.restore();

    /* bayangan sisi malam (menghadap menjauh dari Matahari) */
    if (!isSun) {
      ctx.save();
      const a = Math.atan2(sy - y, sx - x);
      const g = ctx.createLinearGradient(x + Math.cos(a) * r, y + Math.sin(a) * r, x - Math.cos(a) * r, y - Math.sin(a) * r);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(0,0,0,.08)'); g.addColorStop(1, 'rgba(0,0,0,.62)');
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }
    if (b.id === 'saturnus' && !b.ready) ringHalf(x, y, r, 0, Math.PI);

    /* cincin seleksi / hover */
    if (sel || hov) {
      ctx.save();
      const rr = r * (b.id === 'saturnus' && b.ready ? 1.5 : 1) + 8 + Math.sin(t * 4) * 1.5;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, 7);
      ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 14; ctx.lineWidth = 1.8;
      ctx.strokeStyle = sel ? '#62e4ff' : 'rgba(255,255,255,.6)'; ctx.stroke();
      ctx.restore();
    }

    /* label nama */
    const showMoon = !b.parent || sel || hov || S.zoom > 2;
    if ((S.label || sel || hov) && showMoon) {
      ctx.save();
      ctx.font = `700 ${b.parent ? 11 : 13}px "Atkinson Hyperlegible", sans-serif`; ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 6;
      ctx.fillStyle = sel ? '#62e4ff' : 'rgba(255,255,255,.92)';
      const off = r * (b.id === 'saturnus' && b.ready ? 1.5 : 1) + 20;
      ctx.fillText(b.nama, x, y + off);
      ctx.restore();
    }
  }
  function ringHalf(x, y, r, a0, a1) {
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.9, r * .55, -.3, a0, a1);
    ctx.strokeStyle = 'rgba(232,212,160,.75)'; ctx.lineWidth = Math.max(2, r * .32); ctx.stroke();
  }

  /* ----- deteksi klik / hover ----- */
  function pick(mx, my) {
    let best = null, bestScore = 1;
    items.forEach(it => {
      const hitR = Math.max(it.r * (it.b.id === 'saturnus' ? 1.7 : 1) + 5, 16);
      const sc = Math.hypot(mx - it.x, my - it.y) / hitR;
      if (sc <= bestScore) { best = it.b; bestScore = sc; }
    });
    return best;
  }

  /* ----- interaksi pointer: klik, geser, cubit ----- */
  const pointers = new Map(); let drag = null, pinchD = 0;
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    drag = { sx: e.offsetX, sy: e.offsetY, lx: e.offsetX, ly: e.offsetY, moved: false };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); drag.moved = true; }
  });
  canvas.addEventListener('pointermove', e => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchD) S.zoomT = clamp(S.zoomT * d / pinchD, .5, 10);
      pinchD = d; return;
    }
    if (drag && pointers.has(e.pointerId)) {
      if (!drag.moved && Math.hypot(e.offsetX - drag.sx, e.offsetY - drag.sy) > 5) { drag.moved = true; S.follow = null; S.recenter = false; canvas.classList.add('grabbing'); }
      if (drag.moved) { S.off.x += e.offsetX - drag.lx; S.off.y += e.offsetY - drag.ly; }
      drag.lx = e.offsetX; drag.ly = e.offsetY;
    } else if (!isTouch) {
      const hb = pick(e.offsetX, e.offsetY);
      if (hb !== S.hover) { S.hover = hb; canvas.classList.toggle('pointer', !!hb); if (hb) Sound.play('hover'); }
    }
  });
  const endPointer = e => {
    if (drag && !drag.moved && pointers.size === 1) {
      const hb = pick(e.offsetX, e.offsetY);
      if (hb) selectBody(hb.id, { focus: true });
    }
    pointers.delete(e.pointerId); pinchD = 0; canvas.classList.remove('grabbing');
    if (pointers.size === 0) drag = null;
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); drag = null; canvas.classList.remove('grabbing'); });
  canvas.addEventListener('pointerleave', () => { if (!drag) { S.hover = null; canvas.classList.remove('pointer'); } });
  canvas.addEventListener('wheel', e => { e.preventDefault(); S.zoomT = clamp(S.zoomT * (e.deltaY < 0 ? 1.14 : .88), .5, 10); }, { passive: false });

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    update(dt); draw(now); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    select(b, focus) { S.selected = b.id; if (focus) { S.follow = b; S.zoomT = b.focusZoom; S.recenter = false; } },
    reset() { S.follow = null; S.zoomT = 1; S.recenter = true; },
    zoomBy(f) { S.zoomT = clamp(S.zoomT * f, .5, 10); },
    togglePause() { S.paused = !S.paused; return S.paused; },
    toggleOrbit() { S.orbit = !S.orbit; return S.orbit; },
    toggleLabel() { S.label = !S.label; return S.label; },
    toggleTilt() { S.tiltT = S.tiltT < .9 ? 1 : .5; return S.tiltT < .9; },
    setSpeed(v) { S.speed = v; },
    meteorShower(durasiMs = 5000, jumlah = 55) {
      let sisa = jumlah;
      const spawn = () => {
        if (sisa <= 0) return;
        sisa--;
        const sx = rand(0, w), sy = rand(-40, h * .5), ang = rand(.9, 1.5);
        S.meteors.push({ x: sx, y: sy, vx: Math.cos(ang) * rand(260, 420), vy: Math.sin(ang) * rand(260, 420), life: 1 });
        setTimeout(spawn, rand(40, 160));
      };
      spawn();
      return durasiMs;
    }
  };
})();

/* ================= 5. PANEL INFO & PILIHAN PLANET ================= */
const Panel = (() => {
  const el = { panel: $('#infoPanel'), icon: $('#infoIcon'), tag: $('#infoTag'), name: $('#infoName'), desc: $('#infoDesc'), stats: $('#infoStats'), fact: $('#infoFact'), speak: $('#btnSpeak') };
  let cur = null, fi = 0;
  const setFact = () => { el.fact.textContent = cur.fakta[fi]; };
  function stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  return {
    show(b) {
      stopSpeech(); cur = b; fi = 0;
      el.icon.innerHTML = icon(b); el.tag.textContent = b.tipe; el.name.textContent = b.nama; el.desc.textContent = b.desk;
      el.stats.innerHTML = b.stats.map(([l, v]) => `<div class="stat"><span>${l}</span><b>${v}</b></div>`).join('');
      setFact();
      el.panel.classList.remove('swap'); void el.panel.offsetWidth; el.panel.classList.add('swap');
    },
    nextFact() { fi = (fi + 1) % cur.fakta.length; setFact(); el.fact.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 300 }); },
    speak() {
      if (!('speechSynthesis' in window)) { toast('Peramban ini belum mendukung suara narator'); return; }
      if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
      const u = new SpeechSynthesisUtterance(`${cur.nama}. ${cur.desk} Tahukah kamu? ${cur.fakta[fi]}`);
      u.lang = 'id-ID'; u.rate = .95;
      u.onstart = () => { Sound.duck(true); el.speak.textContent = '⏹ Berhenti'; };
      u.onend = u.onerror = () => { Sound.duck(false); el.speak.textContent = '🔊 Dengarkan'; };
      speechSynthesis.speak(u);
    },
    /* Dipakai mode tur otomatis: selalu memutar ulang (bukan toggle), memanggil onEnd saat narasi selesai */
    speakAuto(onEnd) {
      if (!('speechSynthesis' in window) || !cur) { onEnd && onEnd(); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`${cur.nama}. ${cur.desk} Tahukah kamu? ${cur.fakta[0]}`);
      u.lang = 'id-ID'; u.rate = .95;
      u.onstart = () => { Sound.duck(true); el.speak.textContent = '⏹ Berhenti'; };
      u.onend = u.onerror = () => { Sound.duck(false); el.speak.textContent = '🔊 Dengarkan'; onEnd && onEnd(); };
      speechSynthesis.speak(u);
    },
    stopSpeak() { stopSpeech(); Sound.duck(false); el.speak.textContent = '🔊 Dengarkan'; },
    get cur() { return cur; }
  };
})();

let selectedId = null;
function markExplored(id) {
  const d = store.data;
  if (d.explored.includes(id)) return;
  d.explored.push(id); store.save(); updateHud();
  const chip = $(`#chipBar .chip[data-id="${id}"]`); if (chip) chip.classList.add('seen');
  addStars(5, `Menjelajahi ${BY[id].nama}`);
  if (d.explored.length === TOTAL_EXPLORE) setTimeout(() => { addStars(30, 'Lencana Penjelajah Antariksa!'); Confetti.burst(); Sound.play('selesai'); }, 1200);
}
function selectBody(id, { focus = true, count = true } = {}) {
  const b = BY[id]; if (!b) return;
  selectedId = id;
  Panel.show(b); Sim.select(b, focus);
  $$('#chipBar .chip').forEach(c => c.classList.toggle('active', c.dataset.id === id));
  if (focus) Sound.play('whoosh', .35);
  if (count) markExplored(id);
}
function stepBody(dir) {
  const i = BODIES.findIndex(b => b.id === selectedId);
  selectBody(BODIES[(i + dir + BODIES.length) % BODIES.length].id);
}

/* chip pilihan */
$('#chipBar').innerHTML = BODIES.map(b =>
  `<button class="chip ${store.data.explored.includes(b.id) ? 'seen' : ''}" data-id="${b.id}">${icon(b)}<span>${b.nama}</span></button>`).join('');
$('#chipBar').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) selectBody(c.dataset.id); });

/* tombol simulasi */
$('#btnPlay').addEventListener('click', e => { const p = Sim.togglePause(); e.currentTarget.textContent = p ? '▶ Lanjut' : '⏸ Jeda'; });
$('#speedRange').addEventListener('input', e => { const v = parseFloat(e.target.value); Sim.setSpeed(v); $('#speedVal').textContent = nf(v, 1) + '×'; });
$('#btnOrbit').addEventListener('click', e => e.currentTarget.classList.toggle('on', Sim.toggleOrbit()));
$('#btnLabel').addEventListener('click', e => e.currentTarget.classList.toggle('on', Sim.toggleLabel()));
$('#btnTilt').addEventListener('click', e => e.currentTarget.classList.toggle('on', Sim.toggleTilt()));
$('#btnZoomIn').addEventListener('click', () => Sim.zoomBy(1.35));
$('#btnZoomOut').addEventListener('click', () => Sim.zoomBy(1 / 1.35));
$('#btnReset').addEventListener('click', () => { Sim.reset(); Sound.play('whoosh', .35); });
$('#btnMeteor').addEventListener('click', () => { Sim.meteorShower(); toast('🌠 Hujan meteor dimulai, lihat ke simulasi!'); });

/* ----- Tur otomatis ----- */
const TOUR_STOPS = ['matahari', 'merkurius', 'venus', 'bumi', 'mars', 'ceres', 'jupiter', 'saturnus', 'uranus', 'neptunus', 'pluto', 'komet'];
let tourTimer = null, tourSafety = null, tourRunning = false;
function stopTour() {
  if (!tourRunning) return;
  tourRunning = false; clearTimeout(tourTimer); clearTimeout(tourSafety);
  Panel.stopSpeak();
  $('#btnTour').textContent = '🛰️ Mulai tur'; $('#btnTour').classList.remove('on');
}
function startTour() {
  tourRunning = true; $('#btnTour').textContent = '⏹ Hentikan tur'; $('#btnTour').classList.add('on');
  let i = 0;
  const step = () => {
    if (!tourRunning) return;
    selectBody(TOUR_STOPS[i], { focus: true });
    i = (i + 1) % TOUR_STOPS.length;
    let moved = false;
    const goNext = () => { if (moved || !tourRunning) return; moved = true; clearTimeout(tourSafety); tourTimer = setTimeout(step, 1200); };
    /* beri waktu kamera terbang dulu sebelum mulai bicara, lalu tunggu narasi selesai */
    tourTimer = setTimeout(() => { if (tourRunning) Panel.speakAuto(goNext); }, 1600);
    /* jaring pengaman: kalau narasi gagal/tidak didukung, tetap lanjut setelah beberapa detik */
    tourSafety = setTimeout(goNext, 16000);
  };
  step();
}
$('#btnTour').addEventListener('click', () => { tourRunning ? stopTour() : startTour(); });
/* interaksi manual pada simulasi (geser/zoom) membatalkan tur otomatis */
$('#simCanvas').addEventListener('pointerdown', () => stopTour());
$('#chipBar').addEventListener('click', () => stopTour());
$('#btnPrev').addEventListener('click', () => stepBody(-1));
$('#btnNext').addEventListener('click', () => stepBody(1));
$('#btnFact').addEventListener('click', () => Panel.nextFact());
$('#btnSpeak').addEventListener('click', () => Panel.speak());

/* ================= 6. ADU PLANET, PERJALANAN, TIMBANGAN ================= */
/* ----- Adu planet ----- */
const METRICS = {
  diameter: { label: 'Ukuran', log: true, note: 'Diameter planet. Panjang batang memakai skala logaritmik agar planet kecil tetap terlihat.',
    val: p => p.num.diameter, text: p => nf(p.num.diameter) + ' km', sub: p => `${nf(p.num.diameter / BY.bumi.num.diameter, 2)}× Bumi` },
  jarak: { label: 'Jarak dari Matahari', log: true, note: 'Jarak rata-rata ke Matahari. Batang memakai skala logaritmik.',
    val: p => p.num.jarak, text: p => p.num.jarak >= 1000 ? nf(p.num.jarak / 1000, 2) + ' miliar km' : nf(p.num.jarak, 1) + ' juta km', sub: p => `${nf(p.num.jarak / BY.bumi.num.jarak, 1)}× jarak Bumi` },
  suhu: { label: 'Suhu', log: false, base: 273, note: 'Suhu rata-rata permukaan atau puncak awan. Batang dihitung dari nol mutlak (−273 °C).',
    val: p => p.num.suhu + 273, text: p => nf(p.num.suhu) + ' °C', sub: () => '' },
  tahun: { label: 'Lama setahun', log: true, note: 'Waktu satu kali mengelilingi Matahari (revolusi). Skala logaritmik.',
    val: p => p.num.tahun, text: p => p.num.tahun < 1000 ? nf(p.num.tahun) + ' hari Bumi' : nf(p.num.tahun / 365.25, 1) + ' tahun Bumi', sub: p => `${nf(p.num.tahun / 365, 2)}× tahun Bumi` },
  satelit: { label: 'Jumlah satelit', log: false, note: 'Jumlah satelit alami yang sudah terkonfirmasi (angka terus bertambah karena penemuan baru).',
    val: p => p.num.satelit + 0.0001, text: p => nf(p.num.satelit) + (p.num.satelit >= 16 && p.id !== 'bumi' ? '+' : ''), sub: () => '' }
};
let metricKey = 'diameter';
$('#metricTabs').innerHTML = Object.entries(METRICS).map(([k, m]) => `<button class="tab ${k === metricKey ? 'active' : ''}" data-k="${k}" role="tab">${m.label}</button>`).join('');
$('#bars').innerHTML = PLANETS8.map(p => `
  <div class="bar-row" data-id="${p.id}">
    <div class="bar-name">${icon(p)}<span>${p.nama}</span></div>
    <div class="bar-track"><div class="bar-fill" style="--c:${p.color}"></div></div>
    <div class="bar-val"></div>
  </div>`).join('');
function renderMetric() {
  const m = METRICS[metricKey], max = Math.max(...PLANETS8.map(m.val));
  $$('.bar-row').forEach(row => {
    const p = BY[row.dataset.id]; let pct;
    if (m.log) pct = Math.log10(m.val(p) + 1) / Math.log10(max + 1) * 100;
    else if (m.base) pct = m.val(p) / max * 100;
    else pct = m.val(p) / max * 100;
    pct = clamp(pct, 3, 100);
    const sub = m.sub(p);
    $('.bar-val', row).innerHTML = `${m.text(p)}${sub ? `<small>${sub}</small>` : ''}`;
    requestAnimationFrame(() => { $('.bar-fill', row).style.width = pct + '%'; });
  });
  $('#metricNote').textContent = m.note;
}
$('#metricTabs').addEventListener('click', e => {
  const t = e.target.closest('.tab'); if (!t) return;
  metricKey = t.dataset.k;
  $$('.tab').forEach(x => x.classList.toggle('active', x === t));
  $$('.bar-fill').forEach(f => { f.style.transition = 'none'; f.style.width = '0'; void f.offsetWidth; f.style.transition = ''; });
  renderMetric();
});
renderMetric();

/* ----- Perjalanan ----- */
const VEHICLES = [
  { id: 'mobil', nama: 'Mobil', ikon: '🚗', kmh: 100, ket: '100 km/jam' },
  { id: 'pesawat', nama: 'Pesawat jet', ikon: '✈️', kmh: 900, ket: '900 km/jam' },
  { id: 'roket', nama: 'Roket', ikon: '🚀', kmh: 58000, ket: '58.000 km/jam (kecepatan New Horizons)' }
];
const LIGHT_KMS = 299792;
const DEST = BODIES.filter(b => b.jarakBumi);
let dest = BY.mars, raceRunning = false;
const fmtKm = km => km >= 1e9 ? nf(km / 1e9, 2) + ' miliar km' : km >= 1e6 ? nf(km / 1e6, 1) + ' juta km' : nf(km) + ' km';
function fmtDur(hours) {
  if (hours < 1 / 60) return nf(hours * 3600, 1) + ' detik';
  if (hours < 1) return nf(hours * 60, 0) + ' menit';
  if (hours < 48) return nf(hours, 1) + ' jam';
  const d = hours / 24; if (d < 365) return nf(d, 0) + ' hari';
  const y = d / 365.25; if (y < 1e6) return nf(y, y < 100 ? 1 : 0) + ' tahun';
  return nf(y / 1e6, 1) + ' juta tahun';
}
function fmtSec(s) { return s < 60 ? nf(s, 1) + ' detik' : s < 3600 ? nf(s / 60, 1) + ' menit' : nf(s / 3600, 1) + ' jam'; }
$('#destBar').innerHTML = DEST.map(b => `<button class="chip ${b === dest ? 'active' : ''}" data-id="${b.id}">${icon(b)}<span>${b.nama}</span></button>`).join('');
$('#lanes').innerHTML = VEHICLES.map(v => `
  <div class="lane" data-v="${v.id}">
    <span class="lane-name">${v.ikon} ${v.nama}</span>
    <div class="lane-track"><div class="lane-fill"></div><span class="lane-icon">${v.ikon}</span><span class="lane-goal">🏁</span></div>
    <span class="lane-pct">0%</span>
  </div>`).join('');
function renderTravel() {
  $('#distVal').textContent = fmtKm(dest.jarakBumi);
  $('#raceDest').textContent = dest.nama;
  $('#vehicleGrid').innerHTML = VEHICLES.map(v => `
    <div class="veh"><div class="veh-ico">${v.ikon}</div><div class="veh-name">${v.nama}</div><div class="veh-speed">${v.ket}</div><div class="veh-time">${fmtDur(dest.jarakBumi / v.kmh)}</div></div>`).join('') +
    `<div class="veh light"><div class="veh-ico">💡</div><div class="veh-name">Cahaya</div><div class="veh-speed">299.792 km/detik</div><div class="veh-time">${fmtSec(dest.jarakBumi / LIGHT_KMS)}</div></div>`;
  resetLanes();
}
function setLane(v, pct) {
  const lane = $(`.lane[data-v="${v.id}"]`), track = $('.lane-track', lane);
  const px = clamp(pct / 100, 0, 1) * Math.max(0, track.clientWidth - 30);
  $('.lane-fill', lane).style.width = (px + 20) + 'px';
  $('.lane-icon', lane).style.left = px + 'px';
  $('.lane-pct', lane).textContent = nf(pct, pct < 10 ? 2 : 0) + '%';
}
function resetLanes() { raceRunning = false; VEHICLES.forEach(v => setLane(v, 0)); $('#raceNote').textContent = 'Anggap roket tiba di tujuan. Lihat sejauh apa kendaraan lain pada saat yang sama.'; }
function startRace() {
  if (raceRunning) return; raceRunning = true; Sound.play('whoosh');
  const t0 = performance.now(), dur = 6000, vmax = VEHICLES[2].kmh;
  (function step(now) {
    if (!raceRunning) return;
    const t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - t, 2.2);
    VEHICLES.forEach(v => setLane(v, v.kmh / vmax * 100 * e));
    if (t < 1) requestAnimationFrame(step);
    else {
      raceRunning = false; Sound.play('benar');
      $('#raceNote').textContent = `Saat roket tiba di ${dest.nama}, pesawat baru menempuh ${nf(900 / vmax * 100, 2)}% dan mobil hanya ${nf(100 / vmax * 100, 2)}% dari perjalanan.`;
      addStarsOnce('race', 5, 'Balapan antariksa selesai');
    }
  })(t0);
}
$('#destBar').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  dest = BY[c.dataset.id]; $$('#destBar .chip').forEach(x => x.classList.toggle('active', x === c)); renderTravel();
});
$('#btnRace').addEventListener('click', startRace);
renderTravel();
window.addEventListener('resize', () => { if (!raceRunning) resetLanes(); });

/* bintang yang hanya diberikan sekali per sesi */
const onceFlags = {};
function addStarsOnce(key, n, alasan) { if (onceFlags[key]) return; onceFlags[key] = true; addStars(n, alasan); }

/* ----- Timbangan antariksa ----- */
const WEIGHT_BODIES = BODIES.filter(b => b.gravity);
let wPlanet = BY.mars, wMass = 40, wShown = 40;
$('#wBar').innerHTML = WEIGHT_BODIES.map(b => `<button class="chip ${b === wPlanet ? 'active' : ''}" data-id="${b.id}">${icon(b)}<span>${b.nama}</span></button>`).join('');
function animateNum(el, from, to, dur = 650) {
  const t0 = performance.now();
  (function s(n) { const t = clamp((n - t0) / dur, 0, 1); el.textContent = nf(from + (to - from) * (1 - Math.pow(1 - t, 3)), 1); if (t < 1) requestAnimationFrame(s); })(t0);
}
function renderWeight(animate = true) {
  const g = wPlanet.gravity, res = wMass * g;
  $('#wVal').textContent = wMass; $('#wPlanet').textContent = wPlanet.nama;
  $('#wIcon').innerHTML = icon(wPlanet);
  if (animate) animateNum($('#wNum'), wShown, res); else $('#wNum').textContent = nf(res, 1);
  wShown = res;
  $('#wInfo').textContent = g === 1 ? 'Ini beratmu di rumah. Gravitasi Bumi adalah patokan (1 g).' : `Gravitasi di ${wPlanet.nama} ${g > 1 ? 'lebih kuat' : 'lebih lemah'}: ${nf(g, 2)} × gravitasi Bumi. Massamu tetap ${wMass} kg.`;
  $('#wJump').textContent = `Lompatan 50 cm di Bumi menjadi ± ${nf(50 / g, 0)} cm di sini.`;
}
$('#wBar').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  wPlanet = BY[c.dataset.id]; $$('#wBar .chip').forEach(x => x.classList.toggle('active', x === c));
  renderWeight(); addStarsOnce('weight' + wPlanet.id, 2, `Menimbang di ${wPlanet.nama}`);
});
$('#wRange').addEventListener('input', e => { wMass = parseInt(e.target.value, 10); renderWeight(false); });
renderWeight(false);

/* ================= 7. KUIS ================= */
const QUIZ = [
  { q: 'Planet manakah yang paling dekat dengan Matahari?', o: ['Merkurius', 'Venus', 'Mars', 'Bumi'], a: 'Merkurius', e: 'Merkurius berjarak sekitar 57,9 juta km dari Matahari.' },
  { q: 'Apa planet terbesar di tata surya?', o: ['Saturnus', 'Jupiter', 'Neptunus', 'Uranus'], a: 'Jupiter', e: 'Jupiter berdiameter sekitar 139.820 km, lebih dari 11 kali diameter Bumi.' },
  { q: 'Planet manakah yang dijuluki Planet Merah?', o: ['Venus', 'Jupiter', 'Mars', 'Merkurius'], a: 'Mars', e: 'Permukaan Mars kaya besi oksida (karat) sehingga tampak kemerahan.' },
  { q: 'Planet yang terkenal dengan cincinnya yang megah adalah...', o: ['Saturnus', 'Mars', 'Bumi', 'Venus'], a: 'Saturnus', e: 'Cincin Saturnus tersusun dari bongkahan es dan batu.' },
  { q: 'Berapa lama Bumi melakukan satu kali revolusi mengelilingi Matahari?', o: ['24 jam', '30 hari', '365,25 hari', '10 tahun'], a: '365,25 hari', e: 'Itulah sebabnya ada tahun kabisat setiap empat tahun.' },
  { q: 'Planet manakah yang paling panas di tata surya?', o: ['Merkurius', 'Venus', 'Mars', 'Jupiter'], a: 'Venus', e: 'Atmosfer Venus yang tebal menjebak panas hingga sekitar 465 °C, lebih panas daripada Merkurius.' },
  { q: 'Peristiwa siang dan malam disebabkan oleh...', o: ['Revolusi Bumi', 'Rotasi Bumi', 'Gerhana Bulan', 'Revolusi Bulan'], a: 'Rotasi Bumi', e: 'Bumi berputar pada porosnya sehingga bagian yang menghadap Matahari mengalami siang.' },
  { q: 'Sabuk asteroid terletak di antara orbit planet...', o: ['Bumi dan Mars', 'Mars dan Jupiter', 'Jupiter dan Saturnus', 'Uranus dan Neptunus'], a: 'Mars dan Jupiter', e: 'Sabuk asteroid berisi jutaan batuan sisa pembentukan tata surya.' },
  { q: 'Matahari termasuk jenis benda langit apa?', o: ['Planet', 'Satelit', 'Bintang', 'Komet'], a: 'Bintang', e: 'Matahari adalah bintang yang memancarkan cahaya dan panasnya sendiri.' },
  { q: 'Planet manakah yang paling jauh dari Matahari?', o: ['Uranus', 'Saturnus', 'Jupiter', 'Neptunus'], a: 'Neptunus', e: 'Neptunus berjarak sekitar 4,5 miliar km dari Matahari.' },
  { q: 'Apa nama objek terbesar di sabuk asteroid antara Mars dan Jupiter?', o: ['Ceres', 'Pluto', 'Charon', 'Halley'], a: 'Ceres', e: 'Ceres adalah planet katai yang juga merupakan benda terbesar di sabuk asteroid.' },
  { q: 'Komet terbuat dari apa?', o: ['Besi dan nikel murni', 'Es, debu, dan batu', 'Gas hidrogen saja', 'Batu granit padat'], a: 'Es, debu, dan batu', e: 'Komet sering disebut "bola salju kotor" karena tersusun dari es, debu, dan batu.' },
  { q: 'Ke mana arah ekor komet saat mendekati Matahari?', o: ['Selalu menjauhi Matahari', 'Selalu ke arah Bumi', 'Selalu mengikuti arah geraknya', 'Selalu ke bawah'], a: 'Selalu menjauhi Matahari', e: 'Angin matahari mendorong gas dan debu komet sehingga ekornya selalu mengarah menjauhi Matahari.' },
  { q: 'Apa sebutan untuk pecahan batu kecil di angkasa sebelum memasuki atmosfer Bumi?', o: ['Meteor', 'Meteorit', 'Meteoroid', 'Asteroid'], a: 'Meteoroid', e: 'Meteoroid adalah pecahan batu di angkasa; saat terbakar di atmosfer disebut meteor, dan jika sampai ke tanah disebut meteorit.' },
  { q: 'Mengapa Pluto tidak lagi disebut planet sejak 2006?', o: ['Terlalu panas', 'Tidak punya satelit', 'Belum "membersihkan" orbitnya dari benda lain', 'Terlalu dekat Matahari'], a: 'Belum "membersihkan" orbitnya dari benda lain', e: 'Pluto diklasifikasikan ulang menjadi planet katai karena belum mendominasi lingkungan orbitnya sendiri.' },
  { q: 'Berapa kira-kira periode orbit nyata Komet Halley mengelilingi Matahari?', o: ['1 tahun', '11 tahun', '76 tahun', '500 tahun'], a: '76 tahun', e: 'Komet Halley terlihat dari Bumi setiap sekitar 76 tahun sekali; terakhir terlihat tahun 1986.' },
  { q: 'Apa nama satelit terbesar milik Pluto?', o: ['Titan', 'Charon', 'Europa', 'Phobos'], a: 'Charon', e: 'Charon begitu besar dibanding Pluto sehingga keduanya kadang disebut "planet ganda".' },
  { q: 'Fenomena "bintang jatuh" yang kita lihat di langit malam sebenarnya adalah...', o: ['Bintang yang benar-benar jatuh', 'Meteoroid yang terbakar di atmosfer', 'Pecahan Bulan', 'Pesawat luar angkasa'], a: 'Meteoroid yang terbakar di atmosfer', e: 'Yang kita lihat sebagai "bintang jatuh" adalah meteor: meteoroid yang terbakar saat memasuki atmosfer Bumi.' },
  { q: 'Tahun berapa Ceres pertama kali ditemukan?', o: ['1801', '1930', '1969', '1986'], a: '1801', e: 'Ceres ditemukan tahun 1801 dan menjadi objek pertama yang dikenali di sabuk asteroid.' },
  { q: 'Benda langit manakah berikut ini yang memiliki orbit paling lonjong (eksentrik)?', o: ['Bumi', 'Venus', 'Komet Halley', 'Jupiter'], a: 'Komet Halley', e: 'Orbit Komet Halley sangat lonjong, membawanya dari dekat Matahari hingga jauh melewati Neptunus.' }
];
const Quiz = (() => {
  const box = $('#quizBox'); let list, i, score, streak, answered;
  function start() { list = shuffle(QUIZ).slice(0, Math.min(10, QUIZ.length)); i = 0; score = 0; streak = 0; render(); }
  function render() {
    answered = false; const q = list[i];
    box.innerHTML = `
      <div class="q-top"><span>Pertanyaan ${i + 1} dari ${list.length}</span><span>Benar: ${score}${streak >= 2 ? ` &nbsp; 🔥 ${streak} beruntun` : ''}</span></div>
      <div class="q-progress"><i style="width:${i / list.length * 100}%"></i></div>
      <h3 class="q-text">${q.q}</h3>
      <div class="opts">${shuffle(q.o).map(o => `<button class="opt" data-nosfx data-o="${o}">${o}</button>`).join('')}</div>
      <div id="qFb"></div>`;
    requestAnimationFrame(() => { const bar = $('.q-progress i', box); if (bar) bar.style.width = (i / list.length * 100) + '%'; });
  }
  function answer(btn) {
    if (answered) return; answered = true;
    const q = list[i], ok = btn.dataset.o === q.a;
    $$('.opt', box).forEach(b => { b.disabled = true; if (b.dataset.o === q.a) b.classList.add('correct'); });
    if (!ok) btn.classList.add('wrong');
    let msg = '';
    if (ok) {
      score++; streak++; Sound.play('benar'); addStars(10, 'Jawaban benar');
      if (streak === 3) { addStars(5, 'Bonus 3 benar beruntun'); }
      msg = 'Benar! ';
    } else { streak = 0; Sound.play('salah'); msg = `Belum tepat. Jawaban yang benar: ${q.a}. `; }
    $('#qFb').innerHTML = `<div class="q-feedback ${ok ? 'good' : 'bad'}"><b>${msg}</b>${q.e}</div>
      <button class="btn primary q-next" id="qNext">${i === list.length - 1 ? 'Lihat hasil' : 'Pertanyaan berikutnya'}</button>`;
    $('#qNext').focus({ preventScroll: true });
  }
  function next() { i++; if (i >= list.length) finish(); else render(); }
  function finish() {
    const rank = score >= 10 ? ['Komandan Galaksi', '🏆'] : score >= 8 ? ['Kapten Antariksa', '🌟'] : score >= 5 ? ['Astronot Muda', '🚀'] : ['Calon Astronot', '🧑‍🚀'];
    const best = Math.max(store.data.quizBest || 0, score); store.data.quizBest = best; store.save();
    box.innerHTML = `<div class="result">
      <h3>Misi selesai ${rank[1]}</h3>
      <div class="big-score">${score}/${list.length}</div>
      <div class="rank">Pangkatmu: ${rank[0]}</div>
      <p>Skor terbaikmu: ${best}/${list.length}. ${score >= 8 ? 'Luar biasa, pengetahuanmu tentang tata surya sudah hebat!' : 'Buka lagi bagian Jelajah untuk belajar lebih banyak, lalu coba lagi.'}</p>
      <button class="btn primary big" id="qRetry">Main lagi</button></div>`;
    if (score >= 8) { addStars(20, 'Lencana Ahli Tata Surya'); Confetti.burst(); }
    Sound.play('selesai');
  }
  box.addEventListener('click', e => {
    const o = e.target.closest('.opt'); if (o) return answer(o);
    if (e.target.closest('#qNext')) return next();
    if (e.target.closest('#qRetry')) return start();
  });
  return { start };
})();
Quiz.start();

/* ================= 8. GAME URUTAN PLANET + EFEK VISUAL ================= */
const Game = (() => {
  const order = PLANETS8.map(p => p.id); // urutan benar: Merkurius ... Neptunus
  let next, miss, hints, t0, timer, done;
  const slots = $('#slots'), pool = $('#pool'), res = $('#gameResult');
  const bestEl = $('#gameBest');
  const showBest = () => { bestEl.textContent = store.data.gameBest ? nf(store.data.gameBest, 1) + ' dtk' : '-'; };

  function reset() {
    clearInterval(timer); next = 0; miss = 0; hints = 0; t0 = 0; done = false; res.hidden = true; res.innerHTML = '';
    $('#gameTime').textContent = '0,0'; $('#gameMiss').textContent = '0';
    slots.innerHTML = order.map((_, i) => `<div class="slot ${i === 0 ? 'next' : ''}" data-i="${i}"><span class="slot-num">${i + 1}</span></div>`).join('');
    pool.innerHTML = shuffle(order).map(id => `<button class="gcard" data-id="${id}" data-nosfx>${icon(BY[id])}<span>${BY[id].nama}</span></button>`).join('');
    showBest();
  }
  function tick() { $('#gameTime').textContent = nf((Date.now() - t0) / 1000, 1); }
  function pickCard(card) {
    if (done) return;
    if (!t0) { t0 = Date.now(); timer = setInterval(tick, 100); }
    const id = card.dataset.id;
    if (id === order[next]) {
      Sound.play('benar', .5);
      const slot = $(`.slot[data-i="${next}"]`, slots);
      slot.classList.remove('next'); slot.classList.add('filled');
      slot.innerHTML = `${icon(BY[id])}<span>${BY[id].nama}</span>`;
      card.classList.add('used'); next++;
      const nx = $(`.slot[data-i="${next}"]`, slots); if (nx) nx.classList.add('next');
      if (next === order.length) finish();
    } else {
      miss++; $('#gameMiss').textContent = miss; Sound.play('salah');
      card.classList.remove('miss'); void card.offsetWidth; card.classList.add('miss');
    }
  }
  function finish() {
    done = true; clearInterval(timer);
    const sec = (Date.now() - t0) / 1000, reward = clamp(40 - miss * 4 - hints * 6, 10, 40);
    const isBest = !store.data.gameBest || sec < store.data.gameBest;
    if (isBest) { store.data.gameBest = sec; store.save(); }
    showBest(); tick();
    res.hidden = false;
    res.innerHTML = `<h3>Orbit tersusun rapi 🎉</h3><p>Waktu: <b>${nf(sec, 1)} detik</b> &nbsp; Salah: <b>${miss}</b> &nbsp; Petunjuk: <b>${hints}</b>${isBest ? '<br><b>Rekor baru!</b>' : ''}</p><button class="btn primary" id="gAgain">Main lagi</button>`;
    addStars(reward, 'Menyusun orbit planet');
    Confetti.burst(); Sound.play('selesai');
  }
  pool.addEventListener('click', e => { const c = e.target.closest('.gcard'); if (c) pickCard(c); });
  res.addEventListener('click', e => { if (e.target.closest('#gAgain')) reset(); });
  $('#btnHint').addEventListener('click', () => {
    if (done) return; const c = $(`.gcard[data-id="${order[next]}"]`, pool); if (!c) return;
    hints++; c.classList.add('hint'); setTimeout(() => c.classList.remove('hint'), 1600);
  });
  $('#btnGameReset').addEventListener('click', reset);
  reset();
})();

/* ================= 8b. MEMORI (JODOHKAN PLANET & FAKTA) ================= */
const Memory = (() => {
  const wrap = $('#matchWrap'), leftCol = $('#matchLeft'), rightCol = $('#matchRight'), svg = $('#matchLines');
  const res = $('#memResult'), bestEl = $('#memBest');
  let selLeft = null, selRight = null, matchedIds = new Set(), miss = 0, t0 = 0, timer = null;
  const showBest = () => { bestEl.textContent = store.data.memBest ? nf(store.data.memBest, 1) + ' dtk' : '-'; };

  function tick() { $('#memTime').textContent = nf((Date.now() - t0) / 1000, 1); }
  function reset() {
    clearInterval(timer); selLeft = null; selRight = null; matchedIds = new Set(); miss = 0; t0 = 0;
    res.hidden = true; res.innerHTML = '';
    $('#memMiss').textContent = '0'; $('#memTime').textContent = '0,0'; $('#memMatched').textContent = '0'; $('#memTotal').textContent = PLANETS8.length;
    const rightItems = shuffle(PLANETS8.map(p => ({ id: p.id, text: p.fakta[Math.floor(Math.random() * p.fakta.length)] })));
    leftCol.innerHTML = PLANETS8.map(p => `<button type="button" class="match-item" data-id="${p.id}" data-side="l">${icon(p)}<span>${p.nama}</span></button>`).join('');
    rightCol.innerHTML = rightItems.map(f => `<button type="button" class="match-item fact" data-id="${f.id}" data-side="r"><span>${f.text}</span></button>`).join('');
    svg.innerHTML = '';
    showBest();
  }
  function drawLine(a, b, id) {
    const wr = wrap.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const x1 = ra.right - wr.left, y1 = ra.top + ra.height / 2 - wr.top;
    const x2 = rb.left - wr.left, y2 = rb.top + rb.height / 2 - wr.top;
    const mx = (x1 + x2) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
    path.setAttribute('stroke', BY[id].color); path.setAttribute('stroke-width', '2.5');
    path.setAttribute('fill', 'none'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('opacity', '.85');
    path.dataset.id = id;
    svg.appendChild(path);
  }
  function redrawAllLines() {
    svg.innerHTML = '';
    matchedIds.forEach(id => {
      const a = leftCol.querySelector(`[data-id="${id}"]`), b = rightCol.querySelector(`[data-id="${id}"]`);
      if (a && b) drawLine(a, b, id);
    });
  }
  function finish() {
    clearInterval(timer); tick();
    const sec = (Date.now() - t0) / 1000;
    const isBest = !store.data.memBest || sec < store.data.memBest;
    if (isBest) { store.data.memBest = sec; store.save(); }
    showBest();
    res.hidden = false;
    res.innerHTML = `<h3>Semua planet berhasil dijodohkan 🎉</h3><p>Waktu: <b>${nf(sec, 1)} detik</b> &nbsp; Salah: <b>${miss}</b>${isBest ? '<br><b>Rekor baru!</b>' : ''}</p>`;
    addStars(clamp(30 - miss * 2, 10, 30), 'Menjodohkan planet & fakta');
    Confetti.burst(); Sound.play('selesai');
  }
  function tryMatch() {
    if (!selLeft || !selRight) return;
    if (!t0) { t0 = Date.now(); timer = setInterval(tick, 100); }
    const a = selLeft, b = selRight, idL = a.dataset.id, idR = b.dataset.id;
    if (idL === idR) {
      Sound.play('benar', .5);
      a.classList.remove('selected'); b.classList.remove('selected');
      a.classList.add('matched', 'locked'); b.classList.add('matched', 'locked');
      a.insertAdjacentHTML('beforeend', '<span class="check">✔</span>');
      matchedIds.add(idL);
      drawLine(a, b, idL);
      $('#memMatched').textContent = matchedIds.size;
      selLeft = null; selRight = null;
      if (matchedIds.size === PLANETS8.length) finish();
    } else {
      miss++; $('#memMiss').textContent = miss; Sound.play('salah');
      a.classList.add('wrong'); b.classList.add('wrong');
      setTimeout(() => { a.classList.remove('wrong', 'selected'); b.classList.remove('wrong', 'selected'); }, 650);
      selLeft = null; selRight = null;
    }
  }
  function onClickItem(el) {
    if (el.classList.contains('locked')) return;
    if (el.dataset.side === 'l') {
      if (selLeft === el) { el.classList.remove('selected'); selLeft = null; return; }
      if (selLeft) selLeft.classList.remove('selected');
      selLeft = el; el.classList.add('selected');
    } else {
      if (selRight === el) { el.classList.remove('selected'); selRight = null; return; }
      if (selRight) selRight.classList.remove('selected');
      selRight = el; el.classList.add('selected');
    }
    tryMatch();
  }
  leftCol.addEventListener('click', e => { const b = e.target.closest('.match-item'); if (b) onClickItem(b); });
  rightCol.addEventListener('click', e => { const b = e.target.closest('.match-item'); if (b) onClickItem(b); });
  $('#btnMemReset').addEventListener('click', reset);
  let resizeT; window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(redrawAllLines, 150); });
  reset();
})();

/* ----- Konfeti ----- */
const Confetti = (() => {
  const c = $('#confetti'), x = c.getContext('2d'); let parts = [], run = false;
  const size = () => { c.width = innerWidth; c.height = innerHeight; };
  size(); addEventListener('resize', size);
  function loop() {
    x.clearRect(0, 0, c.width, c.height);
    parts.forEach(p => { p.vy += .3; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.globalAlpha = clamp(p.life / 40, 0, 1); x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); x.restore(); });
    parts = parts.filter(p => p.life > 0 && p.y < c.height + 30);
    if (parts.length) requestAnimationFrame(loop); else { run = false; x.clearRect(0, 0, c.width, c.height); }
  }
  return {
    burst(n = 150) {
      if (reduceMotion) return;
      const cols = ['#ffc247', '#ff6f59', '#62e4ff', '#a78bfa', '#43e0a0', '#ffffff'];
      for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2 + rand(-80, 80), y: innerHeight * .4, vx: rand(-9, 9), vy: rand(-16, -4), s: rand(6, 12), c: cols[i % cols.length], r: rand(0, 6), vr: rand(-.3, .3), life: rand(90, 170) });
      if (!run) { run = true; loop(); }
    }
  };
})();

/* ----- Bintang latar halaman (berkelap-kelip + bintang jatuh) ----- */
(() => {
  const c = $('#bgStars'), x = c.getContext('2d'); let W, H, stars = [], shoot = null, mx = 0, my = 0;
  function init() {
    W = c.width = innerWidth; H = c.height = innerHeight;
    stars = Array.from({ length: Math.round(W * H / 6500) }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(.3, 1.6), tw: rand(0, 6.28), sp: rand(.6, 2.4), d: rand(.2, 1) }));
  }
  init(); addEventListener('resize', init);
  addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); });
  let nextShoot = performance.now() + 3000;
  function frame(now) {
    x.clearRect(0, 0, W, H);
    stars.forEach(s => {
      const a = reduceMotion ? .7 : .45 + .45 * Math.sin(now / 1000 * s.sp + s.tw);
      x.globalAlpha = a; x.fillStyle = '#fff'; x.beginPath(); x.arc(s.x - mx * 22 * s.d, s.y - my * 22 * s.d, s.r, 0, 7); x.fill();
    });
    x.globalAlpha = 1;
    if (!reduceMotion) {
      if (!shoot && now > nextShoot) { shoot = { x: rand(W * .3, W), y: rand(0, H * .4), vx: -rand(9, 14), vy: rand(4, 7), life: 1 }; nextShoot = now + rand(4000, 9000); }
      if (shoot) {
        const g = x.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 9, shoot.y - shoot.vy * 9);
        g.addColorStop(0, `rgba(255,255,255,${shoot.life})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.strokeStyle = g; x.lineWidth = 2; x.beginPath(); x.moveTo(shoot.x, shoot.y); x.lineTo(shoot.x - shoot.vx * 9, shoot.y - shoot.vy * 9); x.stroke();
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= .012; if (shoot.life <= 0) shoot = null;
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ================= 9. SERTIFIKAT ASTRONOT ================= */
(() => {
  const canvas = $('#certCanvas'), ctx = canvas.getContext('2d'), input = $('#certName'), dl = $('#certDownload'), note = $('#certNote');

  /* ----- Fotobooth ----- */
  const video = $('#certVideo'), preview = $('#certPhotoPreview'), placeholder = $('#photoPlaceholder');
  const btnCamOpen = $('#btnCamOpen'), btnCamShot = $('#btnCamShot'), btnCamRetake = $('#btnCamRetake'), camNote = $('#camNote');
  let camStream = null, photoImg = null;
  async function openCam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      camNote.textContent = 'Kamera tidak didukung peramban ini. Sertifikat tetap bisa dibuat tanpa foto.'; return;
    }
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      video.srcObject = camStream; video.hidden = false; placeholder.hidden = true; preview.hidden = true;
      btnCamOpen.hidden = true; btnCamShot.hidden = false; btnCamRetake.hidden = true;
      camNote.textContent = 'Atur posisi supaya semua orang muat di bingkai lebar, lalu ambil foto. Di ponsel, miringkan layar agar hasilnya lebih lebar.';
    } catch (e) {
      camNote.textContent = 'Tidak bisa mengakses kamera (butuh izin pengguna & koneksi HTTPS). Sertifikat tetap bisa dibuat tanpa foto.';
    }
  }
  function closeCam() { if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; } }
  function takeShot() {
    const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return;
    /* potong tengah video ke rasio landscape 16:9 supaya muat banyak orang */
    const W = 1280, H = 720, ratio = W / H;
    let sw = vw, sh = vw / ratio;
    if (sh > vh) { sh = vh; sw = vh * ratio; }
    const shot = document.createElement('canvas'); shot.width = W; shot.height = H;
    const sctx = shot.getContext('2d');
    sctx.translate(W, 0); sctx.scale(-1, 1); /* cerminkan biar seperti kaca saat selfie */
    sctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, W, H);
    const url = shot.toDataURL('image/jpeg', .92);
    preview.src = url; preview.hidden = false; video.hidden = true; placeholder.hidden = true;
    btnCamShot.hidden = true; btnCamRetake.hidden = false;
    photoImg = new Image(); photoImg.src = url;
    closeCam();
    camNote.textContent = 'Foto siap dipakai di sertifikat.';
  }
  function retake() {
    preview.hidden = true; placeholder.hidden = false; photoImg = null;
    btnCamRetake.hidden = true; btnCamOpen.hidden = false; camNote.textContent = '';
  }
  btnCamOpen.addEventListener('click', openCam);
  btnCamShot.addEventListener('click', takeShot);
  btnCamRetake.addEventListener('click', retake);

  function wrapGradientBg() {
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, '#12124a'); g.addColorStop(1, '#070826');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 90; i++) { ctx.globalAlpha = rand(.2, .9); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(rand(0, canvas.width), rand(0, canvas.height), rand(.6, 2), 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function draw() {
    const nama = (input.value || 'Astronot Cilik').trim();
    const d = store.data;
    const hasPhoto = !!(photoImg && photoImg.complete && photoImg.naturalWidth);
    /* dengan foto, kanvas dibuat lebih tinggi agar foto landscape lebar muat di atas teks */
    canvas.height = hasPhoto ? 860 : 700;
    wrapGradientBg();
    ctx.strokeStyle = '#ffc247'; ctx.lineWidth = 6; ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
    ctx.strokeStyle = 'rgba(255,194,71,.5)'; ctx.lineWidth = 2; ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    /* posisi teks: tanpa foto = tata letak asli; dengan foto = lebih rapat di bawah foto */
    const Y = hasPhoto
      ? { head: 450, to: 488, name: 548, d1: 592, d2: 618, stars: 664, exp: 694, quiz: 720 }
      : { head: 130, to: 190, name: 270, d1: 330, d2: 358, stars: 430, exp: 465, quiz: 492 };
    if (hasPhoto) {
      const pw = 600, ph = 338, px = (canvas.width - pw) / 2, py = 66;
      const iw = photoImg.naturalWidth, ih = photoImg.naturalHeight, fr = pw / ph;
      let sw = iw, sh = iw / fr; if (sh > ih) { sh = ih; sw = ih * fr; }
      ctx.save();
      ctx.shadowColor = 'rgba(255,194,71,.35)'; ctx.shadowBlur = 24;
      rrect(px, py, pw, ph, 18); ctx.fillStyle = '#0c0c38'; ctx.fill();
      ctx.restore();
      ctx.save();
      rrect(px, py, pw, ph, 18); ctx.clip();
      ctx.drawImage(photoImg, (iw - sw) / 2, (ih - sh) / 2, sw, sh, px, py, pw, ph);
      ctx.restore();
      rrect(px, py, pw, ph, 18); ctx.strokeStyle = '#ffc247'; ctx.lineWidth = 5; ctx.stroke();
    }
    const cx = canvas.width / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffc247'; ctx.font = '700 28px "Atkinson Hyperlegible", sans-serif';
    ctx.fillText('✦ SERTIFIKAT PENJELAJAH ANTARIKSA ✦', cx, Y.head);
    ctx.fillStyle = '#eef1ff'; ctx.font = '400 20px "Atkinson Hyperlegible", sans-serif';
    ctx.fillText('Diberikan kepada', cx, Y.to);
    ctx.fillStyle = '#62e4ff'; ctx.font = '800 56px "Baloo 2", sans-serif';
    ctx.fillText(nama, cx, Y.name);
    ctx.fillStyle = '#eef1ff'; ctx.font = '400 20px "Atkinson Hyperlegible", sans-serif';
    ctx.fillText('atas keberhasilannya menjelajahi tata surya,', cx, Y.d1);
    ctx.fillText('menyelesaikan kuis astronot, dan menyusun orbit planet.', cx, Y.d2);
    ctx.font = '700 22px "Atkinson Hyperlegible", sans-serif'; ctx.fillStyle = '#ffc247';
    ctx.fillText(`⭐ ${nf(d.stars)} bintang dikumpulkan`, cx, Y.stars);
    ctx.fillStyle = '#a9aedb'; ctx.font = '400 17px "Atkinson Hyperlegible", sans-serif';
    ctx.fillText(`🔭 ${d.explored.length}/${TOTAL_EXPLORE} benda langit dijelajahi`, cx, Y.exp);
    ctx.fillText(`Skor kuis terbaik: ${d.quizBest || 0}/10` + (d.gameBest ? `   •   Susun orbit tercepat: ${nf(d.gameBest, 1)} dtk` : ''), cx, Y.quiz);
    const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillStyle = '#eef1ff'; ctx.font = '400 16px "Atkinson Hyperlegible", sans-serif';
    ctx.fillText(tgl, cx, canvas.height - 70);
    ctx.font = '700 16px "Baloo 2", sans-serif'; ctx.fillStyle = '#ff6f59';
    ctx.fillText('Ayo Keliling Tata Surya', cx, canvas.height - 40);
  }
  $('#btnCertMake').addEventListener('click', () => {
    draw();
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      dl.href = url; dl.hidden = false;
      note.textContent = store.data.explored.length < TOTAL_EXPLORE ? 'Jelajahi semua benda langit dulu supaya sertifikatmu makin lengkap!' : 'Sertifikatmu siap diunduh!';
    });
  });
})();

/* ================= INTERAKSI UMUM ================= */
/* efek suara klik & hover otomatis untuk tombol (kecuali yang diberi atribut data-nosfx) */
const SFX_SEL = 'button, .chip, .tab, .btn, .nav a, .flip';
document.addEventListener('click', e => { const b = e.target.closest(SFX_SEL); if (b && !b.closest('[data-nosfx]')) Sound.play('klik', .5); });
let lastHover = 0;
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse') return;
  const b = e.target.closest(SFX_SEL);
  if (!b || b.closest('[data-nosfx]') || b.contains(e.relatedTarget)) return;
  const n = performance.now(); if (n - lastHover < 90) return; lastHover = n; Sound.play('hover');
});

/* kartu istilah */
$$('.flip').forEach(f => {
  const toggle = () => f.classList.toggle('on');
  f.addEventListener('click', toggle);
  f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
});

/* layar pembuka */
function closeIntro() {
  const i = $('#intro'); i.classList.add('hide'); document.body.classList.remove('lock');
  setTimeout(() => i.remove(), 900);
}
$('#btnStart').addEventListener('click', () => { Sound.startMusic(); Sound.play('whoosh'); closeIntro(); });
$('#btnStartMute').addEventListener('click', () => { Sound.setMusic(false); $('#btnMusic').classList.add('off'); closeIntro(); });

/* dock suara */
$('#btnMusic').addEventListener('click', e => e.currentTarget.classList.toggle('off', !Sound.toggleMusic()));
$('#btnSfx').addEventListener('click', e => { const on = Sound.toggleSfx(); e.currentTarget.classList.toggle('off', !on); if (on) Sound.play('klik'); });
$('#volRange').addEventListener('input', e => Sound.setVolume(parseFloat(e.target.value)));

/* menu mobile */
$('#navToggle').addEventListener('click', e => {
  const open = $('#nav').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', open);
});
$('#nav').addEventListener('click', e => { if (e.target.closest('a')) $('#nav').classList.remove('open'); });

/* menu aktif sesuai posisi scroll */
const navLinks = $$('.nav a');
const spy = new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));

/* reset progres */
$('#btnResetProgress').addEventListener('click', () => {
  if (!confirm('Hapus semua bintang dan progres, lalu mulai dari awal?')) return;
  try { localStorage.removeItem(store.key); } catch (e) { /* abaikan */ }
  location.reload();
});

/* keadaan awal */
$('#expTotal').textContent = TOTAL_EXPLORE;
updateHud();
selectBody('bumi', { focus: false, count: false });