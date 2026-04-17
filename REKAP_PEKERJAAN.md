# REKAP PEKERJAAN & PANDUAN KONTINUITAS (CBT MODERN)

Dokumen ini mencatat fitur-fitur yang sudah **Selesai & Diverifikasi**. DILARANG melakukan perubahan drastis pada area ini tanpa meninjau ulang logika yang sudah ada untuk mencegah regresi.

## 1. Penilaian Otomatis & Real-time
*   **Status**: ✅ BERFUNGSI SEMPURNA
*   **Logika**: Skor dihitung otomatis setiap kali `save-progress` dipanggil.
*   **File Kunci**: `server/app.ts` (`calculateScoreForExamResult` & `/api/exams/:id/save-progress`).
*   **Guna**: Menghilangkan kebutuhan tombol "Regrade" manual.

## 2. Sistem Penilaian Isian Singkat (FIB)
*   **Status**: ✅ BERFUNGSI SEMPURNA
*   **Logika**: Menggunakan *Levenshtein Distance* dengan pembersihan tag HTML via `stripHtml`. Penilaian bersifat proporsional (mirip = dapat poin sebagian).
*   **Penting**: Perbandingan jawaban harus selalu melalui fungsi `stripHtml()` untuk membuang residu format HTML tersembunyi.
*   **File Kunci**: `server/app.ts` (fungsi `stripHtml` & algoritma penilaian FIB).

## 3. Pengawasan Langsung (Proctoring Actions)
*   **Status**: ✅ BERFUNGSI SEMPURNA
*   **Fitur**:
    *   `Buka Kunci (Reset Status)`: Memulihkan status dari 'Locked' ke 'Ongoing' tanpa menghapus progres.
    *   `Buka Akses Ujian Ulang`: Mengaktifkan kembali sesi yang sudah 'Selesai', meriset timer, namun **TETAP MENJAGA JAWABAN LAMA**.
*   **Peningkatan**: Menggunakan `resultId` untuk akurasi target 100%.
*   **File Kunci**: `server/app.ts` (`/api/proctoring/:id/action`) & `src/pages/admin/Proctoring.tsx`.

## 4. Fitur Fullscreen Pintar
*   **Status**: ✅ BERFUNGSI SEMPURNA
*   **Logika**: Masuk fullscreen saat ujian dimulai (via user click) dan **otomatis keluar (exit fallback)** saat kembali ke dashboard.
*   **File Kunci**: `src/pages/student/ExamPage.tsx`.

## 5. Proteksi Dashboard Siswa
*   **Status**: ✅ BERFUNGSI SEMPURNA
*   **Logika**: Tombol "Kerjakan" otomatis disable jika status `completed` (kecuali fitur 'Mulai Ulang' diaktifkan admin).
*   **File Kunci**: `src/pages/student/StudentDashboard.tsx`.

---
**Catatan Penting**: Dokumen ini harus diperbarui setiap ada fitur besar yang diselesaikan. Selalu simpan logika `stripHtml` karena sangat krusial untuk database yang berisi sisa-sisa format Word.
