/* ============================================================
   HRMS Database Engine — Hybrid MySQL (XAMPP PHP API) + Local Cache
   Tersambung otomatis ke backend XAMPP (api/index.php) baik dibuka
   melalui http://localhost/... maupun VS Code Live Server (127.0.0.1:5500).
   ============================================================ */

const HRMSDatabase = (() => {
  "use strict";

  const SCHEMA_VERSION = "v4_enterprise";
  const _key = (table) => `hrms_${table}`;
  const _read = (table) =>
    JSON.parse(localStorage.getItem(_key(table)) || "[]");
  const _write = (table, data) =>
    localStorage.setItem(_key(table), JSON.stringify(data));
  const _readObj = (table) =>
    JSON.parse(localStorage.getItem(_key(table)) || "{}");
  const _writeObj = (table, data) =>
    localStorage.setItem(_key(table), JSON.stringify(data));
  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // Deteksi endpoint API XAMPP secara pintar (mendukung localhost XAMPP & Live Server 5500)
  let resolvedApiBase = null;

  const getApiCandidates = (action) => {
    const isPagesDir = window.location.pathname.toLowerCase().includes("/pages/");
    const relPrefix = isPagesDir ? "../api/index.php" : "api/index.php";
    const xamppUrl = "http://localhost/Tugas_Web_HRMS%20-%20Copy/api/index.php";

    if (resolvedApiBase) {
      return [`${resolvedApiBase}?action=${action}`];
    }
    // Jika dibuka dari Live Server (port 5500) atau file://, prioritaskan XAMPP localhost
    if (window.location.port === "5500" || window.location.protocol === "file:") {
      return [`${xamppUrl}?action=${action}`, `${relPrefix}?action=${action}`];
    }
    return [`${relPrefix}?action=${action}`, `${xamppUrl}?action=${action}`];
  };

  // Kirim request ke backend PHP MySQL secara synchronous agar tidak terputus saat halaman reload
  function _sendToBackend(action, payload) {
    const urls = getApiCandidates(action);
    for (const url of urls) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(payload));
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          if (res && res.status === "success") {
            resolvedApiBase = url.split("?")[0];
            return res;
          }
        }
      } catch (err) {
        // Lanjut ke kandidat URL berikutnya atau fallback ke cache lokal
      }
    }
    return null;
  }

  // Sinkronisasi dua arah antara MySQL (XAMPP) dan cache browser
  function syncWithMySQL() {
    const urls = getApiCandidates("sync");
    for (const url of urls) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send(null);

        if (xhr.status === 200 && xhr.responseText.trim().startsWith("{")) {
          const response = JSON.parse(xhr.responseText);
          if (response && response.status === "success" && response.data) {
            resolvedApiBase = url.split("?")[0];
            const d = response.data;

            // Gabungkan (merge) pengajuan cuti atau presensi lokal yang belum ada di MySQL
            ["leave_requests", "attendance", "employees", "payroll"].forEach((tbl) => {
              if (Array.isArray(d[tbl])) {
                const localRows = _read(tbl);
                const remoteIds = new Set(d[tbl].map((r) => r.id));
                const unsyncedLocal = localRows.filter(
                  (r) => r && r.id && !remoteIds.has(r.id) && String(r.id).match(/^(LVE-|ATT-|EMP-|PAY-)/)
                );
                if (unsyncedLocal.length > 0 && localStorage.getItem("hrms_schema_version") === SCHEMA_VERSION) {
                  unsyncedLocal.forEach((record) => {
                    _sendToBackend("insert", { table: tbl, record });
                    d[tbl].unshift(record);
                  });
                }
                _write(tbl, d[tbl]);
              }
            });

            if (d.departments) _write("departments", d.departments);
            if (d.settings) _writeObj("settings", d.settings);
            localStorage.setItem("hrms_seeded", "true");
            localStorage.setItem("hrms_schema_version", SCHEMA_VERSION);
            localStorage.setItem("hrms_backend_connected", "true");
            return true;
          }
        }
      } catch (e) {
        // Coba URL kandidat berikutnya
      }
    }
    localStorage.setItem("hrms_backend_connected", "false");
    return false;
  }

  function getAll(table) {
    return _read(table);
  }

  function getById(table, id) {
    if (!id) return null;
    const rows = _read(table);
    return (
      rows.find(
        (r) =>
          r.id === id ||
          (r.nip && r.nip.toLowerCase() === String(id).toLowerCase())
      ) || null
    );
  }

  function insert(table, record) {
    const data = _read(table);
    record.id = record.id || uid();
    record.createdAt =
      record.createdAt || new Date().toISOString().slice(0, 19).replace("T", " ");

    // Taruh cuti & presensi terbaru di urutan paling atas (baris pertama)
    if (table === "leave_requests" || table === "attendance") {
      data.unshift(record);
    } else {
      data.push(record);
    }
    _write(table, data);

    // Jika tambah karyawan baru, otomatis buat juga data payroll-nya
    if (table === "employees") {
      const payrolls = _read("payroll");
      const gaji = Number(record.gaji) || 10000000;
      const tunj = Number(record.tunjangan) || 2000000;
      const potongan = Math.round((gaji + tunj) * 0.05);
      payrolls.push({
        id: "PAY-" + uid().toUpperCase().slice(0, 6),
        employeeId: record.id,
        periode: "Oktober 2026",
        gajiPokok: gaji,
        tunjangan: tunj,
        tunjanganDetail: "Tunj. Jabatan + Makan",
        totalPotongan: potongan,
        gajiBersih: gaji + tunj - potongan,
        paymentMethod: "Mandiri Payroll •• 8821",
        status: "Terkalkulasi",
      });
      _write("payroll", payrolls);
    }

    // Simpan langsung ke MySQL XAMPP
    _sendToBackend("insert", { table, record });
    return record;
  }

  function update(table, id, changes) {
    const data = _read(table);
    const idx = data.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    data[idx] = {
      ...data[idx],
      ...changes,
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    };
    _write(table, data);

    // Sinkronkan status karyawan otomatis saat cuti disetujui / ditolak
    if (table === "leave_requests" && changes.status) {
      const empId = data[idx].employeeId;
      const emps = _read("employees");
      const eIdx = emps.findIndex((e) => e.id === empId);
      if (eIdx !== -1) {
        emps[eIdx].status = changes.status === "Approved" ? "Cuti" : "Aktif";
        _write("employees", emps);
      }
    }

    // Sinkronkan payroll otomatis saat gaji/tunjangan karyawan diubah
    if (table === "employees" && (changes.gaji !== undefined || changes.tunjangan !== undefined)) {
      const payrolls = _read("payroll");
      const pIdx = payrolls.findIndex((p) => p.employeeId === id);
      if (pIdx !== -1) {
        const gp = Number(data[idx].gaji) || 0;
        const tj = Number(data[idx].tunjangan) || 0;
        const pt = Math.round((gp + tj) * 0.05);
        payrolls[pIdx].gajiPokok = gp;
        payrolls[pIdx].tunjangan = tj;
        payrolls[pIdx].totalPotongan = pt;
        payrolls[pIdx].gajiBersih = gp + tj - pt;
        _write("payroll", payrolls);
      }
    }

    // Update ke MySQL XAMPP
    _sendToBackend("update", { table, id, changes });
    return data[idx];
  }

  function remove(table, id) {
    const data = _read(table);
    const filtered = data.filter((r) => r.id !== id);
    _write(table, filtered);

    if (table === "employees") {
      _write("attendance", _read("attendance").filter((a) => a.employeeId !== id));
      _write("leave_requests", _read("leave_requests").filter((l) => l.employeeId !== id));
      _write("payroll", _read("payroll").filter((p) => p.employeeId !== id));
    }

    // Hapus dari MySQL XAMPP
    _sendToBackend("delete", { table, id });
  }

  function getAllSettings() {
    return _readObj("settings");
  }

  function setSetting(key, value) {
    const settings = _readObj("settings");
    settings[key] = value;
    _writeObj("settings", settings);

    // Simpan setting ke MySQL XAMPP
    _sendToBackend("setting", { key, value });
  }

  async function authenticate(username, password) {
    const res = _sendToBackend("login", { username, password });
    if (res && res.status === "success" && res.user) {
      return res.user;
    }
    return null;
  }

  function seed() {
    const defaultSettings = {
      companyName: "PT Nebula Solusi Digital Indonesia Tbk",
      companyLegalName: "PT Nebula Solusi Digital Indonesia Tbk",
      companyNIB: "81203912039123",
      companyEmail: "hrd@company.co.id",
      companyPhone: "+62 (21) 5088-9100",
      companyWebsite: "https://nebula.co.id",
      companyAddress:
        "Menara Sudirman Lt. 28, Jl. Jend. Sudirman Kav. 60, Senayan, Kebayoran Baru, Jakarta Selatan 12190",
      allowESS: true,
      autoEmailSlipGaji: true,
      gpsVerificationWFH: true,
      announcementText:
        "Pencairan payroll dilakukan setiap tanggal 28. Pengajuan cuti tahunan wajib diajukan minimal H-3 sebelum tanggal mulai cuti.",
    };
    _writeObj("settings", defaultSettings);

    const depts = [
      { id: "dept-it", name: "IT & Engineering", color: "cyan" },
      { id: "dept-mkt", name: "Marketing & Creative", color: "purple" },
      { id: "dept-fin", name: "Finance & Operations", color: "green" },
      { id: "dept-hr", name: "Human Resources", color: "yellow" },
    ];
    _write("departments", depts);

    const employees = [
      {
        id: "EMP-001",
        nip: "EMP-0012",
        nama: "Budi Santoso, S.Kom",
        email: "budi.santoso@company.co.id",
        phone: "+62 812-3456-7890",
        gender: "L",
        departmentId: "dept-it",
        jabatan: "Senior Software Engineer",
        status: "Aktif",
        joinDate: "2023-01-15",
        kontrak: "PKWTT",
        level: 4,
        gaji: 18500000,
        tunjangan: 3500000,
        workModel: "Hybrid Flex",
      },
      {
        id: "EMP-002",
        nip: "EMP-0104",
        nama: "Siti Nurhaliza, S.I.Kom",
        email: "siti.nurhaliza@company.co.id",
        phone: "+62 813-9876-5432",
        gender: "P",
        departmentId: "dept-mkt",
        jabatan: "Digital Marketing Lead",
        status: "Aktif",
        joinDate: "2023-03-10",
        kontrak: "PKWTT",
        level: 3,
        gaji: 14000000,
        tunjangan: 2500000,
        workModel: "WFO Jakarta",
      },
      {
        id: "EMP-003",
        nip: "EMP-0042",
        nama: "Dimas Pratama, S.E.",
        email: "dimas.pratama@company.co.id",
        phone: "+62 811-2233-4455",
        gender: "L",
        departmentId: "dept-fin",
        jabatan: "Financial Analyst",
        status: "Aktif",
        joinDate: "2022-11-01",
        kontrak: "PKWTT",
        level: 3,
        gaji: 13500000,
        tunjangan: 2200000,
        workModel: "WFO Jakarta",
      },
      {
        id: "EMP-004",
        nip: "EMP-0123",
        nama: "Amanda Putri, S.Psi",
        email: "amanda.putri@company.co.id",
        phone: "+62 857-1122-3344",
        gender: "P",
        departmentId: "dept-hr",
        jabatan: "HR Recruitment Specialist",
        status: "Cuti",
        joinDate: "2024-02-20",
        kontrak: "PKWT",
        level: 2,
        gaji: 10500000,
        tunjangan: 1800000,
        workModel: "WFO Jakarta",
      },
      {
        id: "EMP-005",
        nip: "EMP-0077",
        nama: "Rizky Ramadhan, S.T.",
        email: "rizky.ramadhan@company.co.id",
        phone: "+62 821-5566-7788",
        gender: "L",
        departmentId: "dept-it",
        jabatan: "DevOps & Cloud Architect",
        status: "Aktif",
        joinDate: "2022-06-12",
        kontrak: "PKWTT",
        level: 4,
        gaji: 19500000,
        tunjangan: 4000000,
        workModel: "Full Remote",
      },
      {
        id: "EMP-006",
        nip: "EMP-0089",
        nama: "Nadia Vega, S.Ds",
        email: "nadia.vega@company.co.id",
        phone: "+62 819-4433-2211",
        gender: "P",
        departmentId: "dept-mkt",
        jabatan: "UI/UX Product Designer",
        status: "Aktif",
        joinDate: "2024-05-02",
        kontrak: "PKWT",
        level: 2,
        gaji: 11500000,
        tunjangan: 2000000,
        workModel: "Hybrid Flex",
      },
      {
        id: "EMP-007",
        nip: "EMP-0095",
        nama: "Hendra Wijaya, S.Kom",
        email: "hendra.wijaya@company.co.id",
        phone: "+62 812-9988-7766",
        gender: "L",
        departmentId: "dept-it",
        jabatan: "Backend Developer",
        status: "Aktif",
        joinDate: "2023-08-14",
        kontrak: "PKWTT",
        level: 3,
        gaji: 15000000,
        tunjangan: 2800000,
        workModel: "Hybrid Flex",
      },
      {
        id: "EMP-008",
        nip: "EMP-0110",
        nama: "Clara Shinta, S.Ak",
        email: "clara.shinta@company.co.id",
        phone: "+62 813-6655-4433",
        gender: "P",
        departmentId: "dept-fin",
        jabatan: "Tax & Accounting Officer",
        status: "Non-Aktif",
        joinDate: "2023-04-01",
        kontrak: "PKWT",
        level: 2,
        gaji: 10000000,
        tunjangan: 1500000,
        workModel: "WFO Jakarta",
      },
    ];
    _write("employees", employees);

    const attendance = [
      {
        id: "ATT-001",
        employeeId: "EMP-001",
        date: "2026-10-06",
        clockIn: "07:52",
        clockOut: "17:05",
        scheduledIn: "08:00",
        status: "Tepat Waktu",
        location: "WFO Sudirman (Gate A)",
        lateMinutes: 0,
      },
      {
        id: "ATT-002",
        employeeId: "EMP-002",
        date: "2026-10-06",
        clockIn: "08:14",
        clockOut: "17:15",
        scheduledIn: "08:00",
        status: "Terlambat",
        location: "WFO Sudirman (Gate B)",
        lateMinutes: 14,
      },
      {
        id: "ATT-003",
        employeeId: "EMP-003",
        date: "2026-10-06",
        clockIn: "07:48",
        clockOut: "17:00",
        scheduledIn: "08:00",
        status: "Tepat Waktu",
        location: "WFO Sudirman (Gate A)",
        lateMinutes: 0,
      },
      {
        id: "ATT-004",
        employeeId: "EMP-005",
        date: "2026-10-06",
        clockIn: "08:00",
        clockOut: "17:30",
        scheduledIn: "08:00",
        status: "WFH / Remote",
        location: "Remote Location (Bandung)",
        lateMinutes: 0,
      },
      {
        id: "ATT-005",
        employeeId: "EMP-006",
        date: "2026-10-06",
        clockIn: "07:55",
        clockOut: "17:10",
        scheduledIn: "08:00",
        status: "Tepat Waktu",
        location: "WFO Sudirman (Gate A)",
        lateMinutes: 0,
      },
      {
        id: "ATT-006",
        employeeId: "EMP-007",
        date: "2026-10-06",
        clockIn: "08:25",
        clockOut: null,
        scheduledIn: "08:00",
        status: "Terlambat",
        location: "WFO Sudirman (Gate A)",
        lateMinutes: 25,
      },
    ];
    _write("attendance", attendance);

    const leaves = [
      {
        id: "LVE-001",
        employeeId: "EMP-001",
        startDate: "2026-10-26",
        endDate: "2026-10-28",
        duration: 3,
        type: "Cuti Tahunan",
        reason: "Liburan keluarga ke Yogyakarta",
        status: "Pending",
      },
      {
        id: "LVE-002",
        employeeId: "EMP-002",
        startDate: "2026-10-25",
        endDate: "2026-10-25",
        duration: 1,
        type: "Izin Urusan Keluarga",
        reason: "Menghadiri acara wisuda adik",
        status: "Pending",
      },
      {
        id: "LVE-003",
        employeeId: "EMP-003",
        startDate: "2026-10-20",
        endDate: "2026-10-21",
        duration: 2,
        type: "Cuti Sakit",
        reason: "Istirahat medis sesuai surat dokter",
        status: "Approved",
      },
      {
        id: "LVE-004",
        employeeId: "EMP-004",
        startDate: "2026-10-18",
        endDate: "2026-10-19",
        duration: 2,
        type: "Cuti Tahunan",
        reason: "Keperluan pribadi di luar kota",
        status: "Approved",
      },
      {
        id: "LVE-005",
        employeeId: "EMP-005",
        startDate: "2026-10-15",
        endDate: "2026-10-15",
        duration: 1,
        type: "Cuti Pribadi",
        reason: "Mengurus perpanjangan dokumen negara",
        status: "Approved",
      },
      {
        id: "LVE-006",
        employeeId: "EMP-006",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        duration: 3,
        type: "Cuti Tahunan",
        reason: "Acara pernikahan keluarga",
        status: "Rejected",
      },
    ];
    _write("leave_requests", leaves);

    const payroll = [
      {
        id: "PAY-001",
        employeeId: "EMP-001",
        periode: "Oktober 2026",
        gajiPokok: 18500000,
        tunjangan: 3500000,
        tunjanganDetail: "Tunj. Jabatan + Transport",
        totalPotongan: 1100000,
        gajiBersih: 20900000,
        paymentMethod: "Mandiri Payroll •• 4412",
        status: "Terkalkulasi",
      },
      {
        id: "PAY-002",
        employeeId: "EMP-002",
        periode: "Oktober 2026",
        gajiPokok: 14000000,
        tunjangan: 2500000,
        tunjanganDetail: "Tunj. Kinerja + Makan",
        totalPotongan: 825000,
        gajiBersih: 15675000,
        paymentMethod: "BCA Corporate •• 8819",
        status: "Terkalkulasi",
      },
      {
        id: "PAY-003",
        employeeId: "EMP-003",
        periode: "Oktober 2026",
        gajiPokok: 13500000,
        tunjangan: 2200000,
        tunjanganDetail: "Tunj. Jabatan + Makan",
        totalPotongan: 785000,
        gajiBersih: 14915000,
        paymentMethod: "Mandiri Payroll •• 9012",
        status: "Terkalkulasi",
      },
      {
        id: "PAY-004",
        employeeId: "EMP-004",
        periode: "Oktober 2026",
        gajiPokok: 10500000,
        tunjangan: 1800000,
        tunjanganDetail: "Tunj. Transport + Makan",
        totalPotongan: 615000,
        gajiBersih: 11685000,
        paymentMethod: "BNI Payroll •• 3310",
        status: "Perlu Penyesuaian",
      },
      {
        id: "PAY-005",
        employeeId: "EMP-005",
        periode: "Oktober 2026",
        gajiPokok: 19500000,
        tunjangan: 4000000,
        tunjanganDetail: "Tunj. Cloud + Jabatan",
        totalPotongan: 1175000,
        gajiBersih: 22325000,
        paymentMethod: "BCA Corporate •• 1120",
        status: "Terkalkulasi",
      },
      {
        id: "PAY-006",
        employeeId: "EMP-006",
        periode: "Oktober 2026",
        gajiPokok: 11500000,
        tunjangan: 2000000,
        tunjanganDetail: "Tunj. Kreatif + Makan",
        totalPotongan: 675000,
        gajiBersih: 12825000,
        paymentMethod: "Mandiri Payroll •• 7741",
        status: "Terkalkulasi",
      },
      {
        id: "PAY-007",
        employeeId: "EMP-007",
        periode: "Oktober 2026",
        gajiPokok: 15000000,
        tunjangan: 2800000,
        tunjanganDetail: "Tunj. Engineering + Makan",
        totalPotongan: 890000,
        gajiBersih: 16910000,
        paymentMethod: "Mandiri Payroll •• 5532",
        status: "Perlu Penyesuaian",
      },
      {
        id: "PAY-008",
        employeeId: "EMP-008",
        periode: "Oktober 2026",
        gajiPokok: 10000000,
        tunjangan: 1500000,
        tunjanganDetail: "Tunj. Operasional + Makan",
        totalPotongan: 575000,
        gajiBersih: 10925000,
        paymentMethod: "BCA Corporate •• 6610",
        status: "Terkalkulasi",
      },
    ];
    _write("payroll", payroll);

    localStorage.setItem("hrms_seeded", "true");
    localStorage.setItem("hrms_schema_version", SCHEMA_VERSION);
  }

  // Pastikan skema versi terbaru (migrasi otomatis dari cache lama bila ada)
  if (localStorage.getItem("hrms_schema_version") !== SCHEMA_VERSION) {
    // Simpan pengajuan cuti baru milik user jika ada sebelum reset skema
    const oldLeaves = _read("leave_requests").filter((l) => l && String(l.id).startsWith("LVE-"));
    seed();
    if (oldLeaves.length > 0) {
      const seededLeaves = _read("leave_requests");
      const existingIds = new Set(seededLeaves.map((l) => l.id));
      oldLeaves.forEach((l) => {
        if (!existingIds.has(l.id)) {
          // Normalisasi employeeId lama ("emp-1" -> "EMP-001")
          if (l.employeeId === "emp-1" || !l.employeeId) l.employeeId = "EMP-001";
          seededLeaves.unshift(l);
        }
      });
      _write("leave_requests", seededLeaves);
    }
  }

  // Sinkronisasi dari MySQL XAMPP
  const synced = syncWithMySQL();
  if (!synced && (!localStorage.getItem("hrms_seeded") || _read("employees").length === 0)) {
    seed();
  }

  return {
    getAll,
    getById,
    insert,
    update,
    remove,
    getAllSettings,
    setSetting,
    seed,
    syncWithMySQL,
    authenticate,
  };
})();
