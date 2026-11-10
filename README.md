# HRMS Enterprise — PT Sawit Abadi Tbk
**Sistem Informasi Kepegawaian & SDM (Human Resource Management System)**

- **Topik Sistem Informasi:** Aplikasi Kepegawaian & SDM (HRMS)
- **Mata Kuliah:** Pemrograman Web 2 (Client-Side Programming)
- **Konsep Visual:** Glassmorphism UI (Dark Mode Enterprise)

---

## 📂 Struktur Proyek

```text
├── docs/
│   └── perancangan.md         # Dokumentasi Milestone 1 (Hirarki Menu, ER-D Mermaid, Design System, Link Figma & Stitch)
├── assets/
│   ├── css/                   # Stylesheet Utama (style.css) & Spesifik Halaman (pages/*.css)
│   ├── js/                    # Database Mock/LocalStorage + Sync API (db.js) & Logika Interaktif DOM (script.js)
│   └── img/                   # Aset Gambar, Logo PT Sawit Abadi Tbk, & Screenshot Desain UI
├── pages/
│   ├── layout.html            # Master Layout Template (Milestone 2)
│   ├── dashboard.html         # Halaman Dashboard Utama & Grafik Analitik
│   ├── data-master.html       # Halaman Tabel Data Master Karyawan (CRUD)
│   ├── form.html              # Halaman Form Input Karyawan Baru (Validasi JS)
│   ├── presensi.html          # Halaman Manajemen Kehadiran, Cuti, & Jadwal Shift
│   ├── penggajian.html        # Halaman Manajemen Payroll & Cetak e-Payslip
│   ├── laporan.html           # Halaman Laporan Kehadiran, Cetak PDF, & Ekspor CSV
│   └── pengaturan.html        # Halaman Pengaturan Sistem & Profil
├── api/                       # (Opsional) Endpoint REST API PHP & MySQL (XAMPP)
├── database_hrms.sql          # (Opsional) Skema Database MySQL
└── index.html                 # Halaman Utama Login Multi-Role (Admin & Pegawai)
```

---

## 📖 Dokumentasi Perancangan (Milestone 1)
Dokumentasi lengkap meliputi Hirarki Menu, Diagram ER-D (Mermaid.js), Design System Glassmorphism, serta Link Figma & Google Stitch dapat dilihat langsung pada file:
👉 **[docs/perancangan.md](docs/perancangan.md)**

---

## 🚀 Cara Menjalankan Aplikasi
1. **Tanpa Server / Hosting Statis (GitHub Pages / Vercel / Live Server):**
   - Buka langsung file `index.html` di browser. Aplikasi otomatis berjalan penuh menggunakan *Client-Side LocalStorage & Mock Data*.
2. **Dengan XAMPP (PHP + MySQL):**
   - Simpan folder di `C:\xampp\htdocs\`, impor `database_hrms.sql` ke phpMyAdmin, lalu akses melalui `http://localhost/`.

