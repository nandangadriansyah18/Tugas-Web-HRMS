/* ============================================================
   HRMS Admin Panel — Main Application Script
   Tersambung dengan MySQL (XAMPP PHP API) & Local Cache.
   ============================================================ */

"use strict";

// ─── Utility Helpers ───────────────────────────────────────
const Utils = {
  formatRupiah(num) {
    if (num == null) return "Rp 0";
    return "Rp " + Number(num).toLocaleString("id-ID");
  },
  formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return `${String(d.getDate()).padStart(2, "0")} ${
      months[d.getMonth()]
    } ${d.getFullYear()}`;
  },
  formatDateLong(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${
      months[d.getMonth()]
    } ${d.getFullYear()}`;
  },
  getInitials(name) {
    if (!name) return "??";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  },
  getDeptColor(deptId) {
    const map = {
      "dept-it": "cyan",
      "dept-mkt": "purple",
      "dept-fin": "green",
      "dept-hr": "yellow",
    };
    return map[deptId] || "cyan";
  },
  getDeptName(deptId) {
    const depts = HRMSDatabase.getAll("departments");
    const dept = depts.find((d) => d.id === deptId);
    return dept ? dept.name : deptId;
  },
  getDeptShort(deptId) {
    const map = {
      "dept-it": "IT & Eng",
      "dept-mkt": "Marketing",
      "dept-fin": "Finance",
      "dept-hr": "HR",
    };
    return map[deptId] || "Other";
  },
  getStatusClass(status) {
    const map = {
      Aktif: "status-aktif",
      Cuti: "status-cuti",
      "Non-Aktif": "status-nonaktif",
    };
    return map[status] || "status-aktif";
  },
  getEmpById(id) {
    return HRMSDatabase.getById("employees", id);
  },
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },
  showToast(message, type = "success") {
    let container = document.getElementById("hrms-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "hrms-toast-container";
      container.style.cssText =
        "position:fixed;top:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    const colors = {
      success: "#10b981",
      error: "#ef4444",
      warning: "#f59e0b",
      info: "#06b6d4",
    };
    const icons = {
      success: "fa-circle-check",
      error: "fa-circle-xmark",
      warning: "fa-triangle-exclamation",
      info: "fa-circle-info",
    };
    toast.style.cssText = `
            display:flex;align-items:center;gap:10px;padding:14px 20px;border-radius:12px;
            background:rgba(21,23,34,0.95);border:1px solid ${
              colors[type] || colors.info
            };
            color:#f8fafc;font-size:13px;font-family:'Inter',sans-serif;
            box-shadow:0 8px 24px rgba(0,0,0,0.4);backdrop-filter:blur(12px);
            animation:slideIn .3s ease;min-width:280px;max-width:420px;
        `;
    toast.innerHTML = `<i class="fa-solid ${
      icons[type] || icons.info
    }" style="color:${
      colors[type]
    };font-size:16px;"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100px)";
      toast.style.transition = "all .3s";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  confirm(message) {
    return new Promise((resolve) => {
      let overlay = document.getElementById("hrms-confirm-overlay");
      if (overlay) overlay.remove();
      overlay = document.createElement("div");
      overlay.id = "hrms-confirm-overlay";
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);";
      overlay.innerHTML = `
                <div style="background:#151722;border:1px solid #262938;border-radius:16px;padding:28px;max-width:400px;width:90%;box-shadow:0 16px 48px rgba(0,0,0,0.5);">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                        <div style="width:40px;height:40px;border-radius:10px;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;">
                            <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;font-size:18px;"></i>
                        </div>
                        <h3 style="color:#f8fafc;font-size:16px;font-weight:600;margin:0;">Konfirmasi</h3>
                    </div>
                    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin-bottom:24px;">${message}</p>
                    <div style="display:flex;gap:10px;justify-content:flex-end;">
                        <button id="hrms-confirm-cancel" style="padding:8px 20px;border-radius:8px;background:#1b1e2a;border:1px solid #262938;color:#94a3b8;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;">Batal</button>
                        <button id="hrms-confirm-ok" style="padding:8px 20px;border-radius:8px;background:#ef4444;border:none;color:#fff;font-size:13px;cursor:pointer;font-weight:600;font-family:'Inter',sans-serif;">Ya, Hapus</button>
                    </div>
                </div>`;
      document.body.appendChild(overlay);
      document.getElementById("hrms-confirm-cancel").onclick = () => {
        overlay.remove();
        resolve(false);
      };
      document.getElementById("hrms-confirm-ok").onclick = () => {
        overlay.remove();
        resolve(true);
      };
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      };
    });
  },
  generateNIP() {
    const existing = HRMSDatabase.getAll("employees").map((e) => e.nip);
    let nip;
    do {
      nip =
        "EMP-" +
        String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
    } while (existing.includes(nip));
    return nip;
  },
};

// Add toast animation CSS
(() => {
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0;} to { transform: translateX(0); opacity: 1;}}
        .hrms-modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);animation:fadeIn .2s ease;}
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;}}
        .hrms-modal { background:#151722;border:1px solid #262938;border-radius:16px;padding:0;max-width:520px;width:90%;box-shadow:0 16px 48px rgba(0,0,0,0.5);max-height:85vh;overflow-y:auto;}
        .hrms-modal-header { display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #262938;}
        .hrms-modal-header h3 { color:#f8fafc;font-size:16px;font-weight:600;margin:0;}
        .hrms-modal-body { padding:24px;}
        .hrms-modal-footer { display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #262938;}
        .hrms-form-group { margin-bottom:16px;}
        .hrms-form-group label { display:block;color:#94a3b8;font-size:12px;font-weight:600;margin-bottom:6px;letter-spacing:0.5px;}
        .hrms-form-group input, .hrms-form-group select, .hrms-form-group textarea {
            width:100%;padding:10px 14px;background:#1b1e2a;border:1px solid #262938;border-radius:8px;color:#f8fafc;font-size:13px;font-family:'Inter',sans-serif;outline:none;transition:border-color .2s;}
        .hrms-form-group input:focus, .hrms-form-group select:focus, .hrms-form-group textarea:focus { border-color:#4f46e5;}
        .hrms-form-group select { cursor:pointer;}
        .hrms-form-row { display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .hrms-btn { padding:10px 20px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:500;font-family:'Inter',sans-serif;border:none;transition:all .2s;}
        .hrms-btn-primary { background:#4f46e5;color:#fff;}
        .hrms-btn-primary:hover { background:#4338ca;}
        .hrms-btn-secondary { background:#1b1e2a;border:1px solid #262938;color:#94a3b8;}
        .hrms-btn-secondary:hover { background:#262938;color:#f8fafc;}
        .hrms-btn-close { background:none;border:none;color:#64748b;font-size:18px;cursor:pointer;padding:4px;}
        .hrms-btn-close:hover { color:#f8fafc;}
        html, body { height: auto !important; min-height: 100vh !important; overflow-x: hidden !important; overflow-y: auto !important; }
        .admin-layout { height: auto !important; min-height: 100vh !important; }
        .main-content { height: auto !important; min-height: 100vh !important; max-height: none !important; overflow: visible !important; }
        .table-container, .table-panel, .table-card, .table-section { display: block !important; height: auto !important; min-height: fit-content !important; max-height: none !important; overflow: visible !important; flex-shrink: 0 !important; }
        .table-wrapper, .table-responsive, .table-scroll { display: block !important; width: 100% !important; height: auto !important; max-height: none !important; overflow-x: auto !important; overflow-y: visible !important; flex-shrink: 0 !important; }
        .table-wrapper table, .table-responsive table, .table-scroll table { width: 100% !important; min-width: 0 !important; }
        .sidebar { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
        .main-content { transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
        body.sidebar-collapsed .sidebar { transform: translateX(-100%) !important; }
        body.sidebar-collapsed .main-content { margin-left: 0 !important; width: 100% !important; max-width: 100vw !important; }
        .sidebar-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); z-index: 998; display: none; }
        body.sidebar-mobile-open .sidebar-backdrop { display: block; }
        #sidebar-toggle-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.14);
          color: #DAE2FD; display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 15px; flex-shrink: 0; transition: all 0.2s; margin-right: 12px;
        }
        #sidebar-toggle-btn:hover { background: rgba(76, 215, 246, 0.15); border-color: rgba(76, 215, 246, 0.4); color: #4CD7F6; }
        @media (max-width: 992px) {
          .sidebar { transform: translateX(-100%) !important; }
          body.sidebar-mobile-open .sidebar { transform: translateX(0) !important; }
          .main-content { margin-left: 0 !important; width: 100% !important; max-width: 100vw !important; padding: 16px !important; }
          .metrics-grid, .analytics-grid, .kpi-grid, .stats-grid, .grid-2, .charts-grid, .bottom-grid, .content-grid, .settings-layout {
            grid-template-columns: 1fr !important;
          }
          .header-search, .search-bar { width: auto !important; flex: 1 !important; max-width: 260px !important; }
          .page-header, .welcome-banner, .filter-toolbar, .filter-bar, .control-bar { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
        }
    `;
  document.head.appendChild(style);
})();

// ─── PAGE DETECTION ────────────────────────────────────────
const currentPage = (() => {
  const path = window.location.pathname.toLowerCase();
  if (
    path.endsWith("/") ||
    path.endsWith("index.html") ||
    path.includes("login")
  )
    return "login";
  if (path.includes("dashboard")) return "dashboard";
  if (path.includes("data-master")) return "data-master";
  if (path.includes("form")) return "form";
  if (path.includes("presensi") || path.includes("kehadiran"))
    return "presensi";
  if (path.includes("penggajian")) return "penggajian";
  if (path.includes("laporan")) return "laporan";
  if (path.includes("pengaturan")) return "pengaturan";
  return "dashboard";
})();

// ─── Update header date to today & Professional Enhancements ───
document.addEventListener("DOMContentLoaded", () => {
  const activeUser = JSON.parse(
    localStorage.getItem("hrms_active_user") || "null",
  );

  if (currentPage !== "login" && !activeUser) {
    window.location.href = window.location.pathname.includes("pages/")
      ? "../index.html"
      : "index.html";
    return;
  }
  if (currentPage === "login" && activeUser) {
    window.location.href = "pages/dashboard.html";
    return;
  }

  if (activeUser && activeUser.role === "pegawai") {
    let matchedEmp = HRMSDatabase.getById("employees", activeUser.id);
    if (!matchedEmp) {
      const allEmps = HRMSDatabase.getAll("employees");
      matchedEmp =
        allEmps.find(
          (e) =>
            activeUser.name &&
            e.nama.toLowerCase().includes(activeUser.name.toLowerCase().split(",")[0].trim())
        ) || allEmps[0];
      if (matchedEmp) {
        activeUser.id = matchedEmp.id;
        activeUser.name = matchedEmp.nama;
        localStorage.setItem("hrms_active_user", JSON.stringify(activeUser));
      }
    }
  }
  window.currentUserRole = activeUser ? activeUser.role : null;
  window.currentUserId = activeUser ? activeUser.id : null;

  if (window.currentUserRole === "pegawai") {
    document.body.classList.add("role-pegawai");
    const style = document.createElement("style");
    style.textContent =
      '.role-pegawai [data-role-required="admin"], .role-pegawai .add-btn, .role-pegawai .emp-edit, .role-pegawai .emp-delete, .role-pegawai [class*="admin-only"] { display: none !important; }';
    document.head.appendChild(style);
  }

  if (currentPage === "login") {
    initLogin();
    return;
  }

  // 0. ULTIMATE UNIFIED SIDEBAR (100% Consistency Guarantee)
  const sidebar = document.querySelector(".sidebar");
  const isRoot =
    window.location.pathname.endsWith("/") ||
    (window.location.pathname.endsWith("index.html") &&
      !window.location.pathname.includes("pages/"));

  if (sidebar) {
    const path = (page) => (isRoot ? `pages/${page}` : `${page}`);

    const menus = [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: "fa-chart-pie",
        url: "dashboard.html",
      },
      {
        id: "data-master",
        name: "Data Karyawan",
        icon: "fa-users",
        url: "data-master.html",
      },
      {
        id: "presensi",
        name: "Presensi & Cuti",
        icon: "fa-calendar-check",
        url: "presensi.html",
      },
      {
        id: "penggajian",
        name: "Penggajian",
        icon: "fa-money-check-dollar",
        url: "penggajian.html",
      },
      {
        id: "laporan",
        name: "Laporan",
        icon: "fa-file-invoice",
        url: "laporan.html",
      },
      {
        id: "pengaturan",
        name: "Pengaturan",
        icon: "fa-gear",
        url: "pengaturan.html",
      },
    ];

    const activeUser = JSON.parse(
      localStorage.getItem("hrms_active_user") || "{}",
    );
    const role = activeUser.role || "guest";

    if (role === "pegawai" && ["data-master", "form", "laporan"].includes(currentPage)) {
      window.location.href = path("dashboard.html");
      return;
    }

    const filteredMenus = menus
      .filter((m) => {
        if (role === "pegawai") {
          return ["dashboard", "presensi", "penggajian", "pengaturan"].includes(m.id);
        }
        return true;
      })
      .map((m) => {
        if (role === "pegawai") {
          if (m.id === "penggajian") return { ...m, name: "Slip Gaji Saya" };
          if (m.id === "pengaturan") return { ...m, name: "Profil Saya", icon: "fa-id-badge" };
        }
        return m;
      });

    const menuHTML = filteredMenus
      .map(
        (m) => `
            <li>
                <a href="${path(m.url)}" class="${
                  currentPage === m.id ? "active" : ""
                }">
                    <i class="fa-solid ${m.icon}"></i> ${m.name}
                </a>
            </li>
        `,
      )
      .join("");

    const storedSettings = HRMSDatabase.getAllSettings();
    const defaultLogoPath = isRoot
      ? "assets/img/logo-sawit-abadi.jpg"
      : "../assets/img/logo-sawit-abadi.jpg";
    const customLogo = storedSettings["companyLogo"] || defaultLogoPath;
    const logoHTML = customLogo
      ? `<img src="${customLogo}" class="logo-img" style="width: 44px; height: 44px; border-radius: 12px; object-fit: contain; background: #fff; padding: 2px; box-shadow: none; flex-shrink: 0;" alt="Logo">`
      : `<div class="logo-img" style="width: 44px; height: 44px; background: #4CD7F6; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #000; font-size: 20px; font-weight: 800; box-shadow: none; flex-shrink: 0;">H</div>`;

    sidebar.innerHTML = `
            <div style="padding: 28px 24px;">
                <!-- Master Logo -->
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 40px;">
                    ${logoHTML}
                    <div style="display: flex; flex-direction: column; justify-content: center;">
                        <h2 style="color: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; margin: 0 0 4px 0; font-weight: 800; letter-spacing: 0.5px; line-height: 1;">HRMS</h2>
                        <div style="display: flex; gap: 6px;">
                            <span style="background: rgba(87, 27, 193, 0.6); border: 1px solid rgba(233, 221, 255, 0.2); border-radius: 6px; padding: 2px 8px; font-size: 10px; color: #E9DDFF; font-weight: 600;">${role === "pegawai" ? "Pegawai" : "Admin"}</span>
                            <span style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; padding: 2px 8px; font-size: 10px; color: #DAE2FD; font-weight: 500;">Enterprise</span>
                        </div>
                    </div>
                </div>

                <!-- Navigation Menu -->
                <ul class="sidebar-menu">
                    ${menuHTML}
                </ul>
            </div>
            
            <!-- User Profile Footer -->
            <div style="padding: 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); background: rgba(0,0,0,0.2);">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255, 255, 255, 0.04); padding: 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="position: relative;">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(activeUser ? activeUser.name : "User")}&background=1B1C22&color=fff" style="width: 36px; height: 36px; border-radius: 50%;" alt="Profile">
                            <div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #4EDEA3; border-radius: 50%; border: 2px solid #05050A;"></div>
                        </div>
                        <div>
                            <div style="color: #DAE2FD; font-weight: 600; font-size: 13px;">${activeUser ? activeUser.name : "Unknown"}</div>
                            <div style="color: #94A3B8; font-size: 11px; text-transform: capitalize;">${activeUser ? activeUser.role : "Guest"}</div>
                        </div>
                    </div>
                    <button class="logout-btn" style="background: none; border: none; color: #EF4444; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;" title="Keluar">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    </button>
                </div>
            </div>
        `;
  }

  // 0.5 Inject Universal Sidebar Toggle Button (Desktop & Mobile Responsive)
  const topHeader = document.querySelector(".top-header");
  if (topHeader && !document.getElementById("sidebar-toggle-btn")) {
    const existingMobileBtn = document.getElementById("mobile-toggle");
    if (existingMobileBtn) existingMobileBtn.remove();

    const toggleBtn = document.createElement("button");
    toggleBtn.id = "sidebar-toggle-btn";
    toggleBtn.type = "button";
    toggleBtn.title = "Sembunyikan / Tampilkan Sidebar Navigasi";
    toggleBtn.innerHTML = `<i class="fa-solid fa-bars-staggered"></i>`;

    const searchWrap = topHeader.querySelector(".header-search, .search-bar");
    if (searchWrap) {
      const leftGroup = document.createElement("div");
      leftGroup.style.cssText = "display:flex;align-items:center;gap:4px;flex:1;max-width:460px;";
      topHeader.insertBefore(leftGroup, searchWrap);
      leftGroup.appendChild(toggleBtn);
      leftGroup.appendChild(searchWrap);
    } else {
      topHeader.prepend(toggleBtn);
    }

    let backdrop = document.querySelector(".sidebar-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "sidebar-backdrop";
      document.body.appendChild(backdrop);
      backdrop.onclick = () => document.body.classList.remove("sidebar-mobile-open");
    }

    toggleBtn.onclick = () => {
      if (window.innerWidth <= 992) {
        document.body.classList.toggle("sidebar-mobile-open");
      } else {
        document.body.classList.toggle("sidebar-collapsed");
      }
    };
  }

  // 1. Update date displays & topbar profile automatically
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const todayStr = new Date().toLocaleDateString("id-ID", options);
  document.querySelectorAll(".date-badge, .date-display span").forEach((el) => {
    el.innerHTML = `<i class="fa-regular fa-calendar" style="margin-right:6px;"></i> ${todayStr}`;
  });
  document.querySelectorAll(".header-actions > div").forEach((el) => {
    if (el.querySelector(".fa-calendar") && !el.classList.contains("date-badge")) {
      el.innerHTML = `<i class="fa-regular fa-calendar" style="color: #4cd7f6"></i> ${todayStr}`;
    }
  });

  // Update top-right user avatar/initials across all pages
  if (activeUser) {
    const myEmp = HRMSDatabase.getById("employees", activeUser.id);
    const displayName = myEmp ? myEmp.nama : activeUser.name || "User";
    const initials = Utils.getInitials(displayName);
    document.querySelectorAll(".user-profile, .header-profile, .header-actions > div:last-child").forEach((prof) => {
      if (prof.querySelector(".fa-chevron-down") || prof.classList.contains("user-profile") || prof.classList.contains("header-profile")) {
        const avatarSpan = prof.querySelector(".avatar");
        const imgEl = prof.querySelector("img");
        if (avatarSpan) avatarSpan.textContent = initials;
        if (imgEl) {
          imgEl.src = (myEmp && myEmp.photo)
            ? myEmp.photo
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1B1C22&color=4CD7F6`;
        }
        prof.style.cursor = "pointer";
        prof.title = `${displayName} (${activeUser.role === "pegawai" ? "Pegawai" : "Admin"})`;
        prof.onclick = (e) => {
          e.stopPropagation();
          showFilterDropdown(
            prof,
            [
              { value: "profil", label: `👤 ${displayName}` },
              ...(activeUser.role === "pegawai"
                ? [
                    { value: "cuti", label: "✈️ Ajukan Cuti / Izin" },
                    { value: "slip", label: "📄 Lihat Slip Gaji Saya" },
                  ]
                : []),
              { value: "pengaturan", label: activeUser.role === "pegawai" ? "⚙️ Edit Profil Saya" : "⚙️ Pengaturan Sistem" },
              { value: "logout", label: "🚪 Keluar (Logout)" },
            ],
            (val) => {
              if (val === "logout") {
                localStorage.removeItem("hrms_active_user");
                window.location.href = window.location.pathname.includes("pages/") ? "../index.html" : "index.html";
              } else if (val === "pengaturan" || val === "profil") {
                window.location.href = window.location.pathname.includes("pages/") ? "pengaturan.html" : "pages/pengaturan.html";
              } else if (val === "cuti") {
                showLeaveRequestModal(() => location.reload());
              } else if (val === "slip") {
                window.location.href = window.location.pathname.includes("pages/") ? "penggajian.html" : "pages/penggajian.html";
              }
            }
          );
        };
      }
    });
  }

  // 3. Prevent Table Flicker (Clear dummy rows and show skeleton)
  const tbodies = document.querySelectorAll("table tbody");
  tbodies.forEach((tbody) => {
    tbody.innerHTML = `<tr><td colspan="8"><div class="skeleton-loading" style="height: 40px; border-radius: 8px;"></div></td></tr>`;
  });

  // 4. Init the page logic (Slight delay for skeleton effect)
  setTimeout(() => {
    switch (currentPage) {
      case "dashboard":
        initDashboard();
        break;
      case "data-master":
        initDataMaster();
        break;
      case "form":
        initForm();
        break;
      case "presensi":
        initPresensi();
        break;
      case "penggajian":
        initPenggajian();
        break;
      case "laporan":
        initLaporan();
        break;
      case "pengaturan":
        initPengaturan();
        break;
    }
  }, 150);
});

// ════════════════════════════════════════════════════════════
// ▌ GLOBAL UI HOOKS (Header, Search, Notif, Exports)
// ════════════════════════════════════════════════════════════
function initGlobalHooks() {
  // Sinkronkan badge angka notifikasi dengan jumlah cuti pending
  const pendingLeaves = HRMSDatabase.getAll("leave_requests").filter((l) => l.status === "Pending");
  document.querySelectorAll(".notif-dot").forEach((dot) => {
    dot.textContent = pendingLeaves.length;
    dot.style.display = pendingLeaves.length > 0 ? "flex" : "none";
  });

  // Topbar search: hubungkan langsung ke pencarian tabel di halaman aktif atau cari detail karyawan
  document
    .querySelectorAll(".header-search input, .top-header input")
    .forEach((input) => {
      input.addEventListener("input", (e) => {
        const pageSearch = document.querySelector(
          '.tp-actions .search-box input, .control-bar input[type="text"], .filter-right .search-box input, .filter-search input'
        );
        if (pageSearch && pageSearch !== input) {
          pageSearch.value = e.target.value;
          pageSearch.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const q = e.target.value.trim().toLowerCase();
          if (!q) return;
          const emp = HRMSDatabase.getAll("employees").find(
            (x) => x.nama.toLowerCase().includes(q) || x.nip.toLowerCase().includes(q)
          );
          if (emp) {
            showEmployeeDetail(emp.id);
          } else {
            Utils.showToast(`Tidak ditemukan karyawan dengan kata kunci "${e.target.value}"`, "info");
          }
        }
      });
    });

  // Tombol Lonceng Notifikasi Real-Time
  document.querySelectorAll(".fa-bell").forEach((icon) => {
    const btn = icon.closest("div, button");
    if (btn) {
      btn.style.cursor = "pointer";
      btn.onclick = (e) => {
        e.stopPropagation();
        const curLeaves = HRMSDatabase.getAll("leave_requests").filter((l) => l.status === "Pending");
        const items = curLeaves.length > 0
          ? curLeaves.map((l) => {
              const emp = Utils.getEmpById(l.employeeId);
              const nama = emp ? emp.nama : l.employeeName || "Karyawan";
              return {
                value: "cuti:" + l.id,
                label: `⏳ Cuti Pending: ${nama} (${l.type} - ${l.duration} Hari)`,
              };
            })
          : [{ value: "none", label: "✓ Tidak ada pengajuan cuti yang menunggu" }];
        showFilterDropdown(btn, items, (val) => {
          if (val.startsWith("cuti:")) {
            const leaveId = val.split(":")[1];
            showLeaveDetailModal(leaveId);
          }
        });
      };
    }
  });

  // Tombol Amplop (Pesan / Pengumuman HRD)
  document.querySelectorAll(".fa-envelope").forEach((icon) => {
    const btn = icon.closest("div, button");
    if (btn) {
      btn.style.cursor = "pointer";
      btn.onclick = () => showAnnouncementModal();
    }
  });

  // Tombol Ekspor CSV
  document
    .querySelectorAll('.btn-export, [class*="export"]')
    .forEach((btn) => {
      if (btn.tagName === "BUTTON" || btn.classList.contains("btn-export")) {
        btn.onclick = (e) => {
          e.preventDefault();
          exportToCSV();
        };
      }
    });
}

function showAnnouncementModal() {
  const settings = HRMSDatabase.getAllSettings();
  const isAdmin = window.currentUserRole !== "pegawai";
  const currentText =
    settings.announcementText ||
    "Pencairan payroll dilakukan setiap tanggal 28. Pengajuan cuti tahunan wajib diajukan minimal H-3 sebelum tanggal mulai cuti.";

  const overlay = document.createElement("div");
  overlay.className = "hrms-modal-overlay";
  overlay.innerHTML = `
    <div class="hrms-modal" style="max-width:460px;">
      <div class="hrms-modal-header">
        <h3><i class="fa-solid fa-bullhorn" style="color:#4CD7F6;margin-right:8px;"></i>Pengumuman Internal HRD</h3>
        <button class="hrms-btn-close" onclick="this.closest('.hrms-modal-overlay').remove()">&times;</button>
      </div>
      <div class="hrms-modal-body">
        ${
          isAdmin
            ? `<div class="hrms-form-group">
                <label>Pesan Broadcast ke Seluruh Pegawai</label>
                <textarea id="ann-input" rows="4">${currentText}</textarea>
               </div>`
            : `<div style="background:rgba(6,182,212,0.08);border:1px solid rgba(76,215,246,0.25);border-radius:12px;padding:16px;color:#DAE2FD;font-size:13px;line-height:1.6;">
                ${currentText}
               </div>`
        }
      </div>
      <div class="hrms-modal-footer">
        <button class="hrms-btn hrms-btn-secondary" onclick="this.closest('.hrms-modal-overlay').remove()">Tutup</button>
        ${isAdmin ? '<button class="hrms-btn hrms-btn-primary" id="ann-save-btn">Simpan &Siarkan</button>' : ""}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  const saveBtn = overlay.querySelector("#ann-save-btn");
  if (saveBtn) {
    saveBtn.onclick = () => {
      const val = overlay.querySelector("#ann-input").value.trim();
      HRMSDatabase.setSetting("announcementText", val);
      overlay.remove();
      Utils.showToast("Pengumuman berhasil diperbarui untuk seluruh pegawai!", "success");
    };
  }
}

function showLeaveDetailModal(leaveId) {
  const leaves = HRMSDatabase.getAll("leave_requests");
  const leave = leaves.find((l) => l.id === leaveId);
  if (!leave) return;
  const emp = Utils.getEmpById(leave.employeeId) || {
    nama: leave.employeeName || "Budi Santoso, S.Kom",
    nip: leave.nip || "EMP-0012",
    jabatan: "Karyawan",
    departmentId: leave.departmentId || "dept-it",
  };
  const isAdmin = window.currentUserRole !== "pegawai";

  const overlay = document.createElement("div");
  overlay.className = "hrms-modal-overlay";
  overlay.innerHTML = `
    <div class="hrms-modal" style="max-width:460px;">
      <div class="hrms-modal-header">
        <h3><i class="fa-solid fa-file-signature" style="color:#4CD7F6;margin-right:8px;"></i>Detail Permohonan Cuti / Izin</h3>
        <button class="hrms-btn-close" onclick="this.closest('.hrms-modal-overlay').remove()">&times;</button>
      </div>
      <div class="hrms-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
          <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
            <div style="color:#64748b;font-size:10px;margin-bottom:4px;">NAMA PEMOHON</div>
            <div style="color:#f8fafc;font-size:13px;font-weight:600;">${emp.nama}</div>
            <div style="color:#4CD7F6;font-size:11px;">${emp.nip} • ${Utils.getDeptShort(emp.departmentId)}</div>
          </div>
          <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
            <div style="color:#64748b;font-size:10px;margin-bottom:4px;">JENIS & DURASI</div>
            <div style="color:#f8fafc;font-size:13px;font-weight:600;">${leave.type}</div>
            <div style="color:#BCC9CD;font-size:11px;">${leave.duration} Hari Kerja</div>
          </div>
          <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
            <div style="color:#64748b;font-size:10px;margin-bottom:4px;">TANGGAL CUTI</div>
            <div style="color:#f8fafc;font-size:12px;">${Utils.formatDate(leave.startDate)} - ${Utils.formatDate(leave.endDate)}</div>
          </div>
          <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
            <div style="color:#64748b;font-size:10px;margin-bottom:4px;">STATUS VERIFIKASI</div>
            <div style="color:${leave.status === "Approved" ? "#4EDEA3" : leave.status === "Rejected" ? "#FFB4AB" : "#FFCF5C"};font-size:13px;font-weight:700;">
              ${leave.status === "Approved" ? "✓ Disetujui" : leave.status === "Rejected" ? "✕ Ditolak" : "⏳ Menunggu Persetujuan"}
            </div>
          </div>
        </div>
        <div style="background:#1b1e2a;padding:14px;border-radius:10px;">
          <div style="color:#64748b;font-size:10px;margin-bottom:6px;">ALASAN / KETERANGAN</div>
          <div style="color:#DAE2FD;font-size:13px;line-height:1.5;">${leave.reason || "Tidak ada keterangan tambahan."}</div>
        </div>
      </div>
      <div class="hrms-modal-footer">
        <button class="hrms-btn hrms-btn-secondary" onclick="this.closest('.hrms-modal-overlay').remove()">Tutup</button>
        ${
          isAdmin
            ? `<button class="hrms-btn" style="background:rgba(239,68,68,0.15);color:#FFB4AB;border:1px solid rgba(239,68,68,0.3);" id="modal-btn-reject"><i class="fa-solid fa-xmark"></i> Tolak</button>
               <button class="hrms-btn" style="background:#10b981;color:#05050A;font-weight:700;" id="modal-btn-approve"><i class="fa-solid fa-check"></i> Setujui</button>`
            : ""
        }
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  const btnApp = overlay.querySelector("#modal-btn-approve");
  const btnRej = overlay.querySelector("#modal-btn-reject");
  if (btnApp) {
    btnApp.onclick = () => {
      overlay.remove();
      handleLeaveAction(leave.id, "Approved");
      if (currentPage === "presensi") initPresensi();
      if (currentPage === "dashboard") initDashboard();
    };
  }
  if (btnRej) {
    btnRej.onclick = () => {
      overlay.remove();
      handleLeaveAction(leave.id, "Rejected");
      if (currentPage === "presensi") initPresensi();
      if (currentPage === "dashboard") initDashboard();
    };
  }
}
window.showLeaveDetailModal = showLeaveDetailModal;

function exportToCSV() {
  const employees = HRMSDatabase.getAll("employees");
  let csvContent =
    "data:text/csv;charset=utf-8,NIP,Nama,Email,Telepon,Departemen,Jabatan,Kontrak,Gaji Pokok,Tunjangan,Status\n";
  employees.forEach((e) => {
    const row = [
      e.nip,
      e.nama,
      e.email,
      e.phone || "-",
      Utils.getDeptName(e.departmentId),
      e.jabatan,
      e.kontrak || "PKWTT",
      e.gaji || 0,
      e.tunjangan || 0,
      e.status,
    ]
      .map((v) => `"${v}"`)
      .join(",");
    csvContent += row + "\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `Data_HRMS_${new Date().toISOString().split("T")[0]}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  Utils.showToast("Laporan CSV berhasil diunduh!", "success");
}

// ════════════════════════════════════════════════════════════
// ▌ DASHBOARD PAGE
// ════════════════════════════════════════════════════════════
function initDashboard() {
  const activeUser = JSON.parse(
    localStorage.getItem("hrms_active_user") || "{}",
  );
  const role = activeUser.role;
  const myId = activeUser.id;
  const employees = HRMSDatabase.getAll("employees");
  const leaves = HRMSDatabase.getAll("leave_requests");
  const attendance = HRMSDatabase.getAll("attendance");
  const depts = HRMSDatabase.getAll("departments");

  // Dynamic Welcome Banner
  const titleEl = document.querySelector(".wb-title");
  if (titleEl) {
    titleEl.innerHTML = `Selamat Datang, ${activeUser.name} <span style="font-size: 20px;">👋</span>`;
  }

  if (role === "pegawai") {
    initGlobalHooks();
    document
      .querySelectorAll(".metrics-grid, .grid-2, .panel, .wb-actions, .analytics-grid, .table-panel")
      .forEach((el) => el.style.setProperty("display", "none", "important"));

    const myEmp = Utils.getEmpById(myId) || {
      id: myId,
      nip: "EMP-0012",
      nama: activeUser.name || "Budi Santoso, S.Kom",
      email: "budi.santoso@company.co.id",
      phone: "+62 812-3456-7890",
      departmentId: "dept-it",
      jabatan: "Senior Software Engineer",
      status: "Aktif",
      joinDate: "2023-01-15",
      kontrak: "PKWTT",
      level: 4,
      gaji: 18500000,
      tunjangan: 3500000,
      workModel: "Hybrid Flex",
    };

    // Personalize Welcome Banner
    if (titleEl) {
      titleEl.innerHTML = `Selamat Datang, ${myEmp.nama} <span style="font-size: 20px;">👋</span>`;
    }
    const subEl = document.querySelector(".wb-subtitle");
    if (subEl) {
      subEl.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px;">
          <span style="background:rgba(6,182,212,0.15);border:1px solid rgba(76,215,246,0.35);color:#4CD7F6;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;">${myEmp.nip}</span>
          <span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#DAE2FD;padding:4px 12px;border-radius:8px;font-size:12px;">${myEmp.jabatan}</span>
          <span style="background:rgba(208,188,255,0.12);border:1px solid rgba(208,188,255,0.3);color:#D0BCFF;padding:4px 12px;border-radius:8px;font-size:12px;">${Utils.getDeptName(myEmp.departmentId)}</span>
          <span style="background:rgba(78,222,163,0.12);border:1px solid rgba(78,222,163,0.3);color:#4EDEA3;padding:4px 12px;border-radius:8px;font-size:12px;">● ${myEmp.status} (${myEmp.kontrak})</span>
        </div>`;
    }

    // Add Pegawai Quick Action buttons to Welcome Banner
    const wbBanner = document.querySelector(".welcome-banner");
    if (wbBanner) {
      const empActions = document.createElement("div");
      empActions.style.cssText = "display:flex;gap:12px;align-items:center;z-index:2;flex-wrap:wrap;";
      empActions.innerHTML = `
        <button id="wb-btn-slip" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#DAE2FD;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;">
          <i class="fa-solid fa-file-invoice-dollar" style="color:#4CD7F6;"></i> Slip Gaji Saya
        </button>
        <button id="wb-btn-cuti" style="padding:10px 18px;border-radius:12px;background:linear-gradient(135deg,#06B6D4,#3B82F6);border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(6,182,212,0.3);">
          <i class="fa-solid fa-paper-plane"></i> + Ajukan Cuti / Izin
        </button>
      `;
      wbBanner.appendChild(empActions);
      empActions.querySelector("#wb-btn-cuti").onclick = () => showLeaveRequestModal(() => location.reload());
      empActions.querySelector("#wb-btn-slip").onclick = () => showPayslipModal(myId);
    }

    const myAtt = attendance.filter((a) => a.employeeId === myId);
    const myLeaves = leaves.filter((l) => l.employeeId === myId);
    const myPayrolls = HRMSDatabase.getAll("payroll").filter((p) => p.employeeId === myId);
    const latestPayroll = myPayrolls[0] || {
      gajiPokok: myEmp.gaji || 18500000,
      tunjangan: myEmp.tunjangan || 3500000,
      totalPotongan: Math.round(((myEmp.gaji || 18500000) + (myEmp.tunjangan || 3500000)) * 0.05),
      gajiBersih: (myEmp.gaji || 18500000) + (myEmp.tunjangan || 3500000) - Math.round(((myEmp.gaji || 18500000) + (myEmp.tunjangan || 3500000)) * 0.05),
      periode: "Oktober 2026",
      paymentMethod: "Mandiri Payroll •• 4412",
      status: "Terkalkulasi",
    };

    const approvedLeaveDays = myLeaves
      .filter((l) => l.status === "Approved")
      .reduce((sum, l) => sum + (Number(l.duration) || 1), 0);
    const pendingLeaves = myLeaves.filter((l) => l.status === "Pending").length;
    const sisaCuti = Math.max(0, 12 - approvedLeaveDays);
    const tepatWaktuCount = myAtt.filter((a) => a.status === "Tepat Waktu" || a.status === "WFH / Remote").length;
    const terlambatCount = myAtt.filter((a) => a.status === "Terlambat").length;

    const today = new Date().toISOString().split("T")[0];
    const todayAtt = myAtt.find((a) => a.date === today);
    const hasClockIn = !!todayAtt;
    const hasClockOut = todayAtt && todayAtt.clockOut;

    const mainContainer = document.querySelector(".main-content");
    const oldPDash = document.getElementById("pegawai-dashboard-root");
    if (oldPDash) oldPDash.remove();

    const pDash = document.createElement("div");
    pDash.id = "pegawai-dashboard-root";
    pDash.style.cssText = "display:flex;flex-direction:column;gap:24px;flex-shrink:0;";

    pDash.innerHTML = `
      <!-- 4 KPI Cards Khusus Pegawai -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:16px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:11px;font-weight:700;color:#869397;letter-spacing:0.6px;">KEHADIRAN SAYA</span>
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(76,215,246,0.12);display:flex;align-items:center;justify-content:center;color:#4CD7F6;">
              <i class="fa-solid fa-calendar-check"></i>
            </div>
          </div>
          <div style="font-size:28px;font-weight:800;color:#DAE2FD;margin-bottom:6px;">${myAtt.length} <span style="font-size:13px;font-weight:500;color:#869397;">Hari Tercatat</span></div>
          <div style="font-size:12px;color:#4EDEA3;display:flex;gap:10px;">
            <span>✓ ${tepatWaktuCount} Tepat Waktu</span>
            <span style="color:#FFB4AB;">• ${terlambatCount} Terlambat</span>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:16px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:11px;font-weight:700;color:#869397;letter-spacing:0.6px;">SISA KUOTA CUTI</span>
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;color:#F59E0B;">
              <i class="fa-solid fa-plane-departure"></i>
            </div>
          </div>
          <div style="font-size:28px;font-weight:800;color:#DAE2FD;margin-bottom:6px;">${sisaCuti} <span style="font-size:13px;font-weight:500;color:#869397;">/ 12 Hari</span></div>
          <div style="font-size:12px;color:#FFCF5C;">
            ${pendingLeaves > 0 ? `⏳ ${pendingLeaves} Pengajuan Menunggu HR` : "✓ Tidak ada pengajuan tertunda"}
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:16px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:11px;font-weight:700;color:#869397;letter-spacing:0.6px;">GAJI BERSIH (TAKE HOME PAY)</span>
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(78,222,163,0.12);display:flex;align-items:center;justify-content:center;color:#4EDEA3;">
              <i class="fa-solid fa-wallet"></i>
            </div>
          </div>
          <div style="font-size:22px;font-weight:800;color:#4CD7F6;margin-bottom:6px;">${Utils.formatRupiah(latestPayroll.gajiBersih)}</div>
          <div style="font-size:11px;color:#BCC9CD;">${latestPayroll.periode} • <span style="color:#4EDEA3;">${latestPayroll.status}</span></div>
        </div>

        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:16px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:11px;font-weight:700;color:#869397;letter-spacing:0.6px;">MODEL & JADWAL KERJA</span>
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(208,188,255,0.12);display:flex;align-items:center;justify-content:center;color:#D0BCFF;">
              <i class="fa-solid fa-laptop-house"></i>
            </div>
          </div>
          <div style="font-size:20px;font-weight:800;color:#DAE2FD;margin-bottom:6px;">${myEmp.workModel || "Hybrid Flex"}</div>
          <div style="font-size:12px;color:#BCC9CD;">Sen - Jum • 08:00 - 17:00 WIB</div>
        </div>
      </div>

      <!-- Grid 2 Kolom: Terminal Absensi & Pengumuman HRD -->
      <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:24px;">
        <!-- Terminal Presensi Mandiri -->
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:20px;padding:28px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <span style="font-size:12px;font-weight:700;color:#4CD7F6;letter-spacing:0.5px;"><i class="fa-solid fa-fingerprint" style="margin-right:6px;"></i>TERMINAL PRESENSI MANDIRI</span>
              <span style="padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600;background:${hasClockIn ? "rgba(78,222,163,0.15)" : "rgba(245,158,11,0.15)"};color:${hasClockIn ? "#4EDEA3" : "#F59E0B"};">
                ${hasClockOut ? "✓ Selesai Bekerja Hari Ini" : hasClockIn ? "● Sedang Bekerja (Sudah Check-In)" : "⏳ Belum Absen Hari Ini"}
              </span>
            </div>

            <div style="text-align:center;padding:18px 0;background:rgba(11,19,38,0.55);border:1px solid rgba(255,255,255,0.08);border-radius:16px;margin-bottom:20px;">
              <div id="live-clock" style="font-size:40px;font-weight:800;color:#4CD7F6;letter-spacing:1px;font-family:'Liberation Mono',monospace;">00:00:00</div>
              <div id="live-date" style="color:#BCC9CD;font-size:13px;margin-top:4px;">Memuat tanggal...</div>
              <div style="margin-top:12px;display:flex;justify-content:center;gap:16px;font-size:12px;color:#DAE2FD;">
                <span>Masuk: <strong style="color:#4EDEA3;">${todayAtt ? todayAtt.clockIn + " WIB" : "--:--"}</strong></span>
                <span>•</span>
                <span>Pulang: <strong style="color:#FFB4AB;">${todayAtt && todayAtt.clockOut ? todayAtt.clockOut + " WIB" : "--:--"}</strong></span>
              </div>
            </div>

            <div style="margin-bottom:18px;">
              <label style="display:block;font-size:11px;font-weight:600;color:#869397;margin-bottom:6px;">PILIH LOKASI / MODE KERJA HARI INI:</label>
              <select id="att-loc-select" style="width:100%;padding:10px 14px;border-radius:10px;background:#151722;border:1px solid rgba(255,255,255,0.15);color:#DAE2FD;font-size:13px;" ${hasClockIn ? "disabled" : ""}>
                <option value="WFO Sudirman (Gate A)" ${todayAtt && todayAtt.location.includes("WFO") ? "selected" : ""}>🏢 WFO — Menara Sudirman (Gate A)</option>
                <option value="WFH / Remote Location" ${todayAtt && todayAtt.location.includes("Remote") ? "selected" : ""}>🏠 WFH — Remote Working (GPS Verified)</option>
                <option value="Dinas Luar Kota / Client Visit" ${todayAtt && todayAtt.location.includes("Dinas") ? "selected" : ""}>🚗 Dinas Luar Kota / Kunjungan Klien</option>
              </select>
            </div>
          </div>

          <div style="display:flex;gap:14px;">
            <button id="btn-clock-in" style="flex:1;padding:14px;border-radius:12px;border:none;font-size:14px;font-weight:700;cursor:${hasClockIn ? "not-allowed" : "pointer"};background:${hasClockIn ? "rgba(255,255,255,0.06)" : "#4EDEA3"};color:${hasClockIn ? "#869397" : "#05050A"};" ${hasClockIn ? "disabled" : ""}>
              <i class="fa-solid fa-arrow-right-to-bracket" style="margin-right:8px;"></i> ${hasClockIn ? "Sudah Absen Masuk" : "Absen Masuk"}
            </button>
            <button id="btn-clock-out" style="flex:1;padding:14px;border-radius:12px;border:none;font-size:14px;font-weight:700;cursor:${hasClockOut || !hasClockIn ? "not-allowed" : "pointer"};background:${hasClockOut ? "rgba(255,255,255,0.06)" : hasClockIn ? "#FFB4AB" : "rgba(255,255,255,0.06)"};color:${hasClockOut ? "#869397" : hasClockIn ? "#3E0002" : "#869397"};" ${hasClockOut || !hasClockIn ? "disabled" : ""}>
              <i class="fa-solid fa-arrow-right-from-bracket" style="margin-right:8px;"></i> ${hasClockOut ? "Sudah Absen Pulang" : "Absen Pulang"}
            </button>
          </div>
        </div>

        <!-- Pengumuman HRD & Info Kepegawaian -->
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:20px;padding:28px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <span style="font-size:12px;font-weight:700;color:#D0BCFF;letter-spacing:0.5px;"><i class="fa-solid fa-bullhorn" style="margin-right:6px;"></i>PENGUMUMAN &AGENDA HRD</span>
              <span style="font-size:11px;color:#869397;">Terbaru</span>
            </div>

            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="padding:14px;border-radius:12px;background:rgba(6,182,212,0.08);border:1px solid rgba(76,215,246,0.2);">
                <div style="font-size:13px;font-weight:600;color:#4CD7F6;margin-bottom:4px;">💳 Jadwal Pencairan Payroll Bulanan</div>
                <div style="font-size:12px;color:#BCC9CD;line-height:1.5;">Gaji periode berjalan akan ditransfer otomatis pada tanggal <strong>28 setiap bulan</strong> ke rekening terdaftar (${latestPayroll.paymentMethod}).</div>
              </div>
              <div style="padding:14px;border-radius:12px;background:rgba(208,188,255,0.08);border:1px solid rgba(208,188,255,0.2);">
                <div style="font-size:13px;font-weight:600;color:#D0BCFF;margin-bottom:4px;">📋 Kebijakan Pengajuan Cuti & Izin</div>
                <div style="font-size:12px;color:#BCC9CD;line-height:1.5;">Pengajuan cuti tahunan harap diajukan minimal H-3 sebelum tanggal mulai cuti melalui tombol <strong>Ajukan Cuti / Izin</strong>.</div>
              </div>
              <div style="padding:14px;border-radius:12px;background:rgba(78,222,163,0.08);border:1px solid rgba(78,222,163,0.2);">
                <div style="font-size:13px;font-weight:600;color:#4EDEA3;margin-bottom:4px;">🏥 Klaim Medis & BPJS Ketenagakerjaan</div>
                <div style="font-size:12px;color:#BCC9CD;line-height:1.5;">Status kepesertaan BPJS Kesehatan & TK Anda <strong>Aktif</strong>. Hubungi HRD untuk bantuan klaim reimbursement.</div>
              </div>
            </div>
          </div>

          <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#869397;">
            <span>Bergabung sejak: <strong style="color:#DAE2FD;">${Utils.formatDate(myEmp.joinDate)}</strong></span>
            <a href="pengaturan.html" style="color:#4CD7F6;text-decoration:none;font-weight:600;">Edit Profil Saya →</a>
          </div>
        </div>
      </div>

      <!-- Tabel 1: Riwayat Pengajuan Cuti & Izin Saya -->
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:20px;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
          <div>
            <h3 style="margin:0;color:#DAE2FD;font-size:17px;font-weight:700;">Riwayat Pengajuan Cuti & Izin Saya</h3>
            <p style="margin:4px 0 0 0;color:#869397;font-size:12px;">Pantau status persetujuan permohonan cuti dan izin Anda oleh HRD</p>
          </div>
          <button id="btn-new-leave-dash" style="padding:9px 16px;border-radius:10px;background:rgba(6,182,212,0.15);border:1px solid rgba(76,215,246,0.35);color:#4CD7F6;font-size:12px;font-weight:600;cursor:pointer;">
            <i class="fa-solid fa-plus" style="margin-right:6px;"></i> Ajukan Cuti Baru
          </button>
        </div>

        <div class="table-responsive">
          <table style="width:100%;text-align:left;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                <th style="padding:14px 16px;color:#869397;font-size:11px;">TANGGAL CUTI</th>
                <th style="padding:14px 16px;color:#869397;font-size:11px;">JENIS CUTI / IZIN</th>
                <th style="padding:14px 16px;color:#869397;font-size:11px;">DURASI</th>
                <th style="padding:14px 16px;color:#869397;font-size:11px;">ALASAN / KETERANGAN</th>
                <th style="padding:14px 16px;color:#869397;font-size:11px;">STATUS HRD</th>
                <th style="padding:14px 16px;color:#869397;font-size:11px;text-align:right;">AKSI</th>
              </tr>
            </thead>
            <tbody>
              ${
                myLeaves.length === 0
                  ? '<tr><td colspan="6" style="text-align:center;padding:28px;color:#869397;">Belum ada riwayat pengajuan cuti. Klik "+ Ajukan Cuti Baru" untuk membuat permohonan.</td></tr>'
                  : myLeaves
                      .map((l) => {
                        let badge = `<span style="background:rgba(245,158,11,0.15);color:#F59E0B;border:1px solid rgba(245,158,11,0.3);padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600;">⏳ Menunggu Persetujuan</span>`;
                        if (l.status === "Approved")
                          badge = `<span style="background:rgba(78,222,163,0.15);color:#4EDEA3;border:1px solid rgba(78,222,163,0.3);padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600;">✓ Disetujui</span>`;
                        if (l.status === "Rejected")
                          badge = `<span style="background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.3);padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600;">✕ Ditolak</span>`;
                        const cancelBtn =
                          l.status === "Pending"
                            ? `<button class="btn-cancel-leave" data-id="${l.id}" style="padding:5px 12px;border-radius:8px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#FFB4AB;font-size:11px;cursor:pointer;">Batalkan</button>`
                            : `<span style="color:#64748b;font-size:11px;">Selesai</span>`;
                        return `<tr>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#DAE2FD;font-size:13px;font-weight:500;">${Utils.formatDate(l.startDate)}${l.endDate && l.endDate !== l.startDate ? " - " + Utils.formatDate(l.endDate) : ""}</td>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#4CD7F6;font-size:13px;font-weight:500;">${l.type}</td>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#BCC9CD;font-size:13px;">${l.duration} Hari</td>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#BCC9CD;font-size:12px;">${l.reason || "-"}</td>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);">${badge}</td>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${cancelBtn}</td>
                        </tr>`;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabel 2: Riwayat Kehadiran / Log Presensi Saya -->
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:20px;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div>
            <h3 style="margin:0;color:#DAE2FD;font-size:17px;font-weight:700;">Log Kehadiran Terakhir Saya</h3>
            <p style="margin:4px 0 0 0;color:#869397;font-size:12px;">Catatan waktu check-in, check-out, dan lokasi kerja harian Anda</p>
          </div>
          <a href="presensi.html" style="color:#4CD7F6;font-size:12px;font-weight:600;text-decoration:none;">Lihat Semua Presensi →</a>
        </div>
        <div class="table-responsive">
          <table style="width:100%;text-align:left;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                <th style="padding:14px 16px;color:#869397;font-size:11px;">TANGGAL</th>
                <th style="padding:14px 16px;color:#869397;font-size:11px;">JAM MASUK</th>
                <th style="padding:14px 16px;color:#869397;font-size:11px;">JAM PULANG</th>
                <th style="padding:14px 16px;color:#869397;font-size:11px;">LOKASI / MODE KERJA</th>
                <th style="padding:14px 16px;color:#869397;font-size:11px;">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${
                myAtt.length === 0
                  ? '<tr><td colspan="5" style="text-align:center;padding:24px;color:#869397;">Belum ada catatan kehadiran. Silakan klik tombol Absen Masuk di atas.</td></tr>'
                  : [...myAtt]
                      .reverse()
                      .map(
                        (a) => `<tr>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#DAE2FD;font-size:13px;font-weight:500;">${Utils.formatDate(a.date)}</td>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#4CD7F6;font-family:monospace;font-weight:700;font-size:14px;">${a.clockIn} WIB</td>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#BCC9CD;font-size:13px;">${a.clockOut ? a.clockOut + " WIB" : '<span style="color:#FFCF5C;">Masih Bekerja</span>'}</td>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#BCC9CD;font-size:13px;">${a.location}</td>
                          <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span style="background:${a.status === "Terlambat" ? "rgba(255,180,171,0.12)" : "rgba(78,222,163,0.12)"};color:${a.status === "Terlambat" ? "#FFB4AB" : "#4EDEA3"};border:1px solid ${a.status === "Terlambat" ? "rgba(255,180,171,0.3)" : "rgba(78,222,163,0.3)"};padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600;">
                              ${a.status}
                            </span>
                          </td>
                        </tr>`
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    mainContainer.appendChild(pDash);

    // Update clock immediately & every second
    const updateClock = () => {
      const d = new Date();
      const clk = document.getElementById("live-clock");
      if (clk)
        clk.textContent = d.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      const dt = document.getElementById("live-date");
      if (dt)
        dt.textContent = d.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
    };
    updateClock();
    setInterval(updateClock, 1000);

    document.getElementById("btn-clock-in").onclick = () => {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      const locSelect = document.getElementById("att-loc-select");
      const locVal = locSelect ? locSelect.value : "WFO Sudirman (Gate A)";
      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 5);
      const lateMins = isLate ? Math.max(1, (now.getHours() - 8) * 60 + now.getMinutes()) : 0;

      const data = {
        employeeId: myId,
        date: today,
        clockIn: timeStr,
        clockOut: null,
        scheduledIn: "08:00",
        status: locVal.includes("WFH") ? "WFH / Remote" : isLate ? "Terlambat" : "Tepat Waktu",
        location: locVal,
        lateMinutes: lateMins,
      };
      HRMSDatabase.insert("attendance", data);
      Utils.showToast(`Absen Masuk berhasil dicatat pada ${timeStr} WIB!`, "success");
      setTimeout(() => location.reload(), 800);
    };

    document.getElementById("btn-clock-out").onclick = () => {
      const aList = HRMSDatabase.getAll("attendance");
      const rec = aList.find((a) => a.employeeId === myId && a.date === today);
      if (rec) {
        const timeStr = new Date().toTimeString().slice(0, 5);
        HRMSDatabase.update("attendance", rec.id, {
          clockOut: timeStr,
        });
        Utils.showToast(`Absen Pulang berhasil dicatat pada ${timeStr} WIB!`, "success");
        setTimeout(() => location.reload(), 800);
      }
    };

    document.getElementById("btn-new-leave-dash").onclick = () => {
      showLeaveRequestModal(() => location.reload());
    };

    pDash.querySelectorAll(".btn-cancel-leave").forEach((btn) => {
      btn.onclick = async () => {
        const ok = await Utils.confirm("Apakah Anda yakin ingin membatalkan pengajuan cuti ini?");
        if (ok) {
          HRMSDatabase.remove("leave_requests", btn.dataset.id);
          Utils.showToast("Pengajuan cuti berhasil dibatalkan.", "info");
          setTimeout(() => location.reload(), 600);
        }
      };
    });

    return;
  }

  initGlobalHooks();

  const totalEmp = employees.length;
  const activeEmp = employees.filter((e) => e.status === "Aktif").length;
  const cutiEmp = employees.filter((e) => e.status === "Cuti").length;
  const todayISO = new Date().toISOString().split("T")[0];
  const todayAttList =
    attendance.filter((a) => a.date === todayISO || a.date === "2026-10-06").length > 0
      ? attendance.filter((a) => a.date === todayISO || a.date === "2026-10-06")
      : attendance;
  const hadirCount = todayAttList.length;
  const pctHadir = totalEmp > 0 ? Math.min(100, Math.round((hadirCount / totalEmp) * 100)) : 0;
  const belumAbsen = Math.max(0, totalEmp - hadirCount);
  const pendingLeavesCount = leaves.filter((l) => l.status === "Pending").length;
  const approvedLeavesCount = leaves.filter((l) => l.status === "Approved").length;
  const sakitIzinCount = leaves.filter((l) => l.type !== "Cuti Tahunan").length;

  // Update 4 Metric Cards & Sub-descriptions on Admin Dashboard
  const mCards = document.querySelectorAll(".metrics-grid .metric-card");
  if (mCards.length >= 4) {
    mCards[0].querySelector(".mc-value").textContent = totalEmp;
    mCards[0].querySelector(".mc-badge").innerHTML = `<i class="fa-solid fa-user-check"></i> ${activeEmp} Staf Aktif`;
    mCards[0].querySelector(".mc-desc").textContent = `${depts.length} Divisi Operasional`;

    mCards[1].querySelector(".mc-value").textContent = hadirCount;
    mCards[1].querySelector(".mc-badge").innerHTML = `<i class="fa-solid fa-check"></i> ${pctHadir}% Kehadiran`;
    mCards[1].querySelector(".mc-desc").textContent = `${belumAbsen} belum absen`;

    mCards[2].querySelector(".mc-value").textContent = cutiEmp;
    mCards[2].querySelector(".mc-badge").innerHTML = `<i class="fa-regular fa-clock"></i> Pending: ${pendingLeavesCount}`;
    mCards[2].querySelector(".mc-desc").textContent = `${approvedLeavesCount} Cuti Disetujui`;

    mCards[3].querySelector(".mc-value").textContent = sakitIzinCount;
    mCards[3].querySelector(".mc-badge").innerHTML = `<i class="fa-solid fa-shield-halved"></i> Terverifikasi`;
    mCards[3].querySelector(".mc-desc").textContent = `Dari total ${leaves.length} pengajuan`;
  }

  // Update badge "X Pengajuan Baru" on Leave Table Header
  const badgeNew = document.querySelector(".tp-title-area .badge-new");
  if (badgeNew) {
    badgeNew.textContent = pendingLeavesCount > 0 ? `${pendingLeavesCount} Menunggu Persetujuan` : "Semua Terproses";
  }

  const donutValue = document.querySelector(
    '.donut-value, .donut-center .val, [class*="donut"] [class*="value"]',
  );
  if (donutValue) donutValue.textContent = totalEmp;

  const deptCounts = {};
  depts.forEach(
    (d) =>
      (deptCounts[d.id] = employees.filter(
        (e) => e.departmentId === d.id,
      ).length),
  );
  const legendRows = document.querySelectorAll(
    '.legend-row, .donut-legend .legend-row, .dept-item, [class*="dept-stat"]',
  );
  const deptOrder = ["dept-it", "dept-mkt", "dept-fin", "dept-hr"];
  legendRows.forEach((row, i) => {
    if (deptOrder[i]) {
      const count = deptCounts[deptOrder[i]] || 0;
      const pct = totalEmp > 0 ? ((count / totalEmp) * 100).toFixed(1) : 0;
      const valEl = row.querySelector('.legend-val, .d-val, [class*="val"]');
      if (valEl)
        valEl.innerHTML = `${count} <span class="percent" style="font-size:11px;margin-left:4px;color:inherit;">(${pct}%)</span>`;
    }
  });

  // ─── Chart.js Integration for Dashboard ───
  const deptCanvas = document.getElementById("deptChartCanvas");
  if (deptCanvas && window.Chart) {
    const counts = deptOrder.map((id) => deptCounts[id] || 0);
    const bgColors = ["#06B6D4", "#8B5CF6", "#10B981", "#F59E0B"];

    if (window.deptChartInstance) {
      window.deptChartInstance.destroy();
    }

    window.deptChartInstance = new Chart(deptCanvas, {
      type: "doughnut",
      data: {
        labels: ["IT & Engineering", "Marketing", "Finance", "Human Resources"],
        datasets: [
          {
            data: counts,
            backgroundColor: bgColors,
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        cutout: "84%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(11, 19, 38, 0.9)",
            titleColor: "#DAE2FD",
            bodyColor: "#BCC9CD",
            borderColor: "#262938",
            borderWidth: 1,
            padding: 10,
            displayColors: true,
          },
        },
      },
    });
  }

  // --- Trend Chart (Line) with interactive 6B / 3B / 1B buttons ---
  const trendCanvas = document.getElementById("trendChartCanvas");
  const chartPresets = {
    "6 Bulan": {
      labels: ["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"],
      hadir: [78, 82, 85, 89, 93, 95.6],
      terlambat: [15, 12, 10, 7, 5, 3],
      cuti: [7, 6, 5, 4, 2, 1.4],
    },
    "3 Bulan": {
      labels: ["Agustus", "September", "Oktober"],
      hadir: [89, 93, 95.6],
      terlambat: [7, 5, 3],
      cuti: [4, 2, 1.4],
    },
    "1 Bulan": {
      labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
      hadir: [92, 94, 95, 96.2],
      terlambat: [5, 4, 3, 2.5],
      cuti: [3, 2, 2, 1.3],
    },
  };

  function renderTrendChart(periodKey = "6 Bulan") {
    if (!trendCanvas || !window.Chart) return;
    const preset = chartPresets[periodKey] || chartPresets["6 Bulan"];
    if (window.trendChartInstance) {
      window.trendChartInstance.destroy();
    }
    window.trendChartInstance = new Chart(trendCanvas, {
      type: "line",
      data: {
        labels: preset.labels,
        datasets: [
          {
            label: "Tingkat Hadir (%)",
            data: preset.hadir,
            borderColor: "#06B6D4",
            backgroundColor: "rgba(6, 182, 212, 0.15)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: "#0B1326",
            pointBorderColor: "#06B6D4",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Terlambat (%)",
            data: preset.terlambat,
            borderColor: "#F59E0B",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: false,
          },
          {
            label: "Cuti & Sakit (%)",
            data: preset.cuti,
            borderColor: "#8B5CF6",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: false,
          },
          {
            label: "Target (92%)",
            data: preset.labels.map(() => 92),
            borderColor: "rgba(139, 92, 246, 0.4)",
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(11, 19, 38, 0.9)",
            titleColor: "#DAE2FD",
            bodyColor: "#BCC9CD",
            borderColor: "#262938",
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          y: {
            min: 70,
            max: 100,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: {
              color: "#869397",
              font: { size: 11 },
              stepSize: 10,
              callback: (value) => value + "%",
            },
            border: { display: false },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#869397", font: { size: 12 } },
            border: { display: false },
          },
        },
      },
    });
  }
  renderTrendChart("6 Bulan");

  // Wire up 6 Bulan / 3 Bulan / 1 Bulan buttons
  document.querySelectorAll(".time-filters .tf-btn").forEach((btn) => {
    btn.onclick = function () {
      document.querySelectorAll(".time-filters .tf-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      renderTrendChart(this.textContent.trim());
    };
  });

  // Wire up Welcome Banner outline buttons
  document.querySelectorAll(".wb-actions .btn-wb-outline").forEach((btn) => {
    if (btn.textContent.includes("Ekspor")) {
      btn.onclick = () => exportToCSV();
    } else if (btn.textContent.includes("Bulan")) {
      btn.onclick = function () {
        showFilterDropdown(
          this,
          [
            { value: "Bulan Ini (Oktober 2026)", label: "Bulan Ini (Oktober 2026)" },
            { value: "Kuartal III (Jul - Sep 2026)", label: "Kuartal III (Jul - Sep 2026)" },
            { value: "Tahun 2026", label: "Tahun 2026" },
          ],
          (val) => {
            this.innerHTML = `<i class="fa-regular fa-calendar" style="color: #4cd7f6"></i> ${val} <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 4px"></i>`;
            Utils.showToast(`Menampilkan ringkasan periode: ${val}`, "info");
          }
        );
      };
    }
  });

  // ── Populate Leave Request Table ──
  renderLeaveTable(leaves, "Semua");

  // ── Leave Table Filter Buttons ──
  document
    .querySelectorAll(
      '.table-filters .filter-btn, .filter-tabs .filter-btn, .status-filters .sf-btn',
    )
    .forEach((btn) => {
      btn.onclick = function () {
        this.closest('.table-filters, .filter-tabs, .status-filters')
          ?.querySelectorAll("button, .filter-btn, .sf-btn")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        const text = this.textContent.trim();
        let filterStatus = "Semua";
        if (text.includes("Menunggu") || text.includes("Pending"))
          filterStatus = "Pending";
        else if (text.includes("Disetujui") || text.includes("Approved"))
          filterStatus = "Approved";
        else if (text.includes("Ditolak") || text.includes("Rejected"))
          filterStatus = "Rejected";
        renderLeaveTable(HRMSDatabase.getAll("leave_requests"), filterStatus);
      };
    });

  // ── Tambah Karyawan button ──
  document
    .querySelectorAll('.btn-primary, .btn-wb-primary, [class*="btn"][class*="primary"]')
    .forEach((btn) => {
      if (btn.textContent.includes("Tambah")) {
        btn.onclick = () => {
          const formPath = window.location.pathname.includes("pages/")
            ? "form.html"
            : "pages/form.html";
          window.location.href = formPath;
        };
      }
    });

  // Search in leave table
  document
    .querySelectorAll(
      '.table-actions .search-bar input, .table-section input[type="text"], .tp-actions .search-box input',
    )
    .forEach((input) => {
      input.addEventListener(
        "input",
        Utils.debounce((e) => {
          const q = e.target.value.toLowerCase();
          const allLeaves = HRMSDatabase.getAll("leave_requests");
          const filtered = allLeaves.filter((l) => {
            const emp = Utils.getEmpById(l.employeeId);
            const nama = emp ? emp.nama : l.employeeName || "";
            const nip = emp ? emp.nip : l.nip || "";
            return (
              nama.toLowerCase().includes(q) ||
              nip.toLowerCase().includes(q) ||
              (l.type && l.type.toLowerCase().includes(q)) ||
              (l.reason && l.reason.toLowerCase().includes(q))
            );
          });
          renderLeaveTable(filtered, "Semua");
        }),
      );
    });
}

function renderLeaveTable(leaves, filterStatus) {
  // Urutkan agar pengajuan Pending selalu tampil paling atas, diikuti pengajuan terbaru
  const ordered = [
    ...leaves.filter((l) => l.status === "Pending"),
    ...leaves.filter((l) => l.status !== "Pending"),
  ];
  const filtered =
    filterStatus === "Semua"
      ? ordered
      : ordered.filter((l) => l.status === filterStatus);
  const PER_PAGE = 5;
  let page = 1;

  function render() {
    const start = (page - 1) * PER_PAGE;
    const pageData = filtered.slice(start, start + PER_PAGE);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    const tbody = document.querySelector(
      ".table-section tbody, .table-card tbody, .table-panel tbody, table tbody",
    );
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:28px;color:#869397;">Tidak ada data pengajuan cuti untuk filter ini.</td></tr>`;
    } else {
      tbody.innerHTML = pageData
        .map((leave) => {
          const emp = Utils.getEmpById(leave.employeeId) || {
            id: leave.employeeId || "EMP-001",
            nama: leave.employeeName || "Budi Santoso, S.Kom",
            nip: leave.nip || "EMP-0012",
            departmentId: leave.departmentId || "dept-it",
            photo: null,
          };
          const initials = Utils.getInitials(emp.nama);
          const color = Utils.getDeptColor(emp.departmentId);
          const deptShort = Utils.getDeptShort(emp.departmentId);
          const startDate = Utils.formatDate(leave.startDate);
          const endDate =
            leave.endDate && leave.startDate !== leave.endDate
              ? ` - ${Utils.formatDate(leave.endDate)}`
              : "";

          let statusBadge = "";
          let actionBtns = "";
          if (leave.status === "Pending") {
            statusBadge = `<span class="status-badge warning" style="background:rgba(234,179,8,0.1);color:#f59e0b;border:1px solid rgba(234,179,8,0.2);display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;"><i class="fa-regular fa-clock"></i> Pending</span>`;
            actionBtns = `
                    <button class="btn-action success" data-id="${leave.id}" data-action="approve" style="background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.35);display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;cursor:pointer;font-weight:600;"><i class="fa-solid fa-check"></i> Setujui</button>
                    <button class="btn-action danger" data-id="${leave.id}" data-action="reject" style="background:rgba(239,68,68,0.12);color:#ef4444;border:1px solid rgba(239,68,68,0.35);display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;cursor:pointer;font-weight:600;"><i class="fa-solid fa-xmark"></i> Tolak</button>`;
          } else if (leave.status === "Approved") {
            statusBadge = `<span class="status-badge success" style="background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.2);display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;"><i class="fa-regular fa-circle-check"></i> Disetujui</span>`;
            actionBtns = `<button class="btn-icon-outline" data-id="${leave.id}" data-action="view" style="width:32px;height:32px;border-radius:50%;background:transparent;border:1px solid rgba(255,255,255,0.15);color:#94a3b8;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;" title="Lihat Detail"><i class="fa-regular fa-eye"></i></button>`;
          } else {
            statusBadge = `<span class="status-badge" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;"><i class="fa-solid fa-xmark"></i> Ditolak</span>`;
            actionBtns = `<button class="btn-icon-outline" data-id="${leave.id}" data-action="view" style="width:32px;height:32px;border-radius:50%;background:transparent;border:1px solid rgba(255,255,255,0.15);color:#94a3b8;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;" title="Lihat Detail"><i class="fa-regular fa-eye"></i></button>`;
          }

          const avatarColors = {
            cyan: "#06b6d4",
            purple: "#8b5cf6",
            green: "#10b981",
            yellow: "#f59e0b",
          };
          const avatarBg = avatarColors[color] || "#3b82f6";
          const avatarDisplay = emp.photo
            ? `<img src="${emp.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
            : initials;

          return `<tr>
                <td><div class="user-cell" style="display:flex;align-items:center;gap:12px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:${avatarBg};display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;color:#fff;flex-shrink:0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${avatarDisplay}</div>
                    <div><div style="font-weight:600;color:#DAE2FD;">${emp.nama}</div><div style="font-size:11px;color:#64748b;">${emp.nip}</div></div>
                </div></td>
                <td><span style="padding:4px 10px;border-radius:12px;font-size:11px;font-weight:500;background:rgba(6,182,212,0.15);color:#06b6d4;border:1px solid rgba(6,182,212,0.2);">${deptShort}</span></td>
                <td>${startDate}${endDate}</td>
                <td><div style="display:flex;align-items:center;gap:6px;"><span style="width:24px;height:24px;background:#1b1e2a;border:1px solid #34384c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;">${leave.duration}</span> Hari</div></td>
                <td>
                  <div style="font-weight:600;color:#4CD7F6;font-size:13px;">${leave.type}</div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${leave.reason || "-"}</div>
                </td>
                <td>${statusBadge}</td>
                <td><div style="display:flex;gap:8px;justify-content:flex-end;">${actionBtns}</div></td>
            </tr>`;
        })
        .join("");
    }

    tbody.querySelectorAll('[data-action="approve"]').forEach((btn) => {
      btn.onclick = () => handleLeaveAction(btn.dataset.id, "Approved");
    });
    tbody.querySelectorAll('[data-action="reject"]').forEach((btn) => {
      btn.onclick = () => handleLeaveAction(btn.dataset.id, "Rejected");
    });
    tbody.querySelectorAll('[data-action="view"]').forEach((btn) => {
      btn.onclick = () => showLeaveDetailModal(btn.dataset.id);
    });

    const startIdx = filtered.length > 0 ? start + 1 : 0;
    const paginationInfo = document.querySelector(
      '.pagination-info, .page-info, .table-footer > div:first-child, [class*="pagination"] [class*="info"]',
    );
    if (paginationInfo)
      paginationInfo.innerHTML = `Menampilkan <strong>${startIdx}-${Math.min(
        start + PER_PAGE,
        filtered.length,
      )}</strong> dari <strong>${filtered.length}</strong> pengajuan`;

    const paginationCtrl = document.querySelector(
      ".pagination-controls, .pagination, .table-footer .pagination",
    );
    if (paginationCtrl) {
      paginationCtrl.innerHTML = `
                <button class="page-btn" ${
                  page <= 1 ? "disabled" : ""
                } data-page="${
                  page - 1
                }"><i class="fa-solid fa-chevron-left" style="font-size:10px;"></i></button>
                ${Array.from(
                  { length: totalPages },
                  (_, i) =>
                    `<button class="page-btn ${
                      i + 1 === page ? "active" : ""
                    }" data-page="${i + 1}">${i + 1}</button>`,
                ).join("")}
                <button class="page-btn" ${
                  page >= totalPages ? "disabled" : ""
                } data-page="${
                  page + 1
                }"><i class="fa-solid fa-chevron-right" style="font-size:10px;"></i></button>`;
      paginationCtrl.querySelectorAll(".page-btn[data-page]").forEach((btn) => {
        btn.onclick = () => {
          const p = parseInt(btn.dataset.page);
          if (p >= 1 && p <= totalPages) {
            page = p;
            render();
          }
        };
      });
    }
  }

  render();
}

function handleLeaveAction(leaveId, newStatus) {
  HRMSDatabase.update("leave_requests", leaveId, { status: newStatus });
  Utils.showToast(
    `Pengajuan cuti berhasil ${
      newStatus === "Approved" ? "disetujui" : "ditolak"
    }!`,
    newStatus === "Approved" ? "success" : "warning",
  );
  if (currentPage === "dashboard") {
    initDashboard();
  } else if (currentPage === "presensi") {
    initPresensi();
  }
}

// ════════════════════════════════════════════════════════════
// ▌ DATA MASTER (Data Karyawan) PAGE
// ════════════════════════════════════════════════════════════
function initDataMaster() {
  initGlobalHooks();
  let allEmployees = HRMSDatabase.getAll("employees");
  let filterDept = "all";
  let filterStatus = "all";
  let searchQuery = "";
  let currentPageNum = 1;
  const PER_PAGE = 5;

  updateSummary();

  function updateSummary() {
    allEmployees = HRMSDatabase.getAll("employees");
    const total = allEmployees.length;
    const aktif = allEmployees.filter((e) => e.status === "Aktif").length;
    const nonAktif = allEmployees.filter(
      (e) => e.status === "Non-Aktif",
    ).length;
    const cuti = allEmployees.filter((e) => e.status === "Cuti").length;

    document
      .querySelectorAll(
        ".summary-badges .summary-value, .summary-item .summary-value",
      )
      .forEach((el) => {
        const parent = el.closest('.summary-item, [class*="summary"]');
        if (!parent) {
          el.textContent = total;
          return;
        }
        const parentText = parent.textContent.toLowerCase();
        if (parentText.includes("aktif") && !parentText.includes("non"))
          el.textContent = aktif;
        else if (parentText.includes("non")) el.textContent = nonAktif;
        else if (parentText.includes("cuti")) el.textContent = cuti;
      });

    const totalEl = document.querySelector('[style*="color: #4CD7F6"]');
    if (totalEl && totalEl.classList.contains("summary-value"))
      totalEl.textContent = total;
  }

  function getFiltered() {
    return allEmployees.filter((emp) => {
      if (filterDept !== "all" && emp.departmentId !== filterDept) return false;
      if (filterStatus !== "all" && emp.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          emp.nama.toLowerCase().includes(q) ||
          emp.nip.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  function renderTable() {
    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    if (currentPageNum > totalPages) currentPageNum = 1;
    const start = (currentPageNum - 1) * PER_PAGE;
    const pageData = filtered.slice(start, start + PER_PAGE);

    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    const deptColorMap = {
      "dept-it": "#4CD7F6",
      "dept-mkt": "#D0BCFF",
      "dept-fin": "#4EDEA3",
      "dept-hr": "#FFCF5C",
    };
    const statusStyles = {
      Aktif:
        "background:rgba(78,222,163,0.12);border:1px solid rgba(78,222,163,0.3);color:#4EDEA3;",
      Cuti: "background:rgba(208,188,255,0.12);border:1px solid rgba(208,188,255,0.3);color:#D0BCFF;",
      "Non-Aktif":
        "background:rgba(255,180,171,0.12);border:1px solid rgba(255,180,171,0.3);color:#FFB4AB;",
    };

    tbody.innerHTML = pageData
      .map((emp) => {
        const initials = Utils.getInitials(emp.nama);
        const deptName = Utils.getDeptName(emp.departmentId);
        const deptColor = deptColorMap[emp.departmentId] || "#4CD7F6";
        const statusStyle = statusStyles[emp.status] || statusStyles["Aktif"];
        const avatarDisplay = emp.photo
          ? `<img src="${emp.photo}" style="width:100%;height:100%;border-radius:10px;object-fit:cover;">`
          : initials;

        return `<tr>
                  <td style="padding-left:24px;"><input type="checkbox" class="custom-checkbox" data-id="${emp.id}"></td>
                  <td><span class="nip-badge" style="background:rgba(6,182,212,0.15);border:1px solid rgba(76,215,246,0.3);color:#4CD7F6;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;">${emp.nip}</span></td>
                  <td>
                    <div class="user-cell" style="display:flex;align-items:center;gap:12px;">
                      <div style="background:#0B1326;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;color:#DAE2FD;flex-shrink:0;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.3);">${avatarDisplay}</div>
                      <div>
                        <div style="font-weight:600;font-size:14px;">${emp.nama}</div>
                        <div style="color:rgba(188,201,205,0.8);font-size:12px;margin-top:2px;">${emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="dept-badge" style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;font-size:11px;background:rgba(${
                    deptColor === "#4CD7F6"
                      ? "76,215,246"
                      : deptColor === "#D0BCFF"
                      ? "208,188,255"
                      : deptColor === "#4EDEA3"
                      ? "78,222,163"
                      : "255,207,92"
                  },0.12);color:${deptColor};border:1px solid rgba(${
                    deptColor === "#4CD7F6"
                      ? "76,215,246"
                      : deptColor === "#D0BCFF"
                      ? "208,188,255"
                      : deptColor === "#4EDEA3"
                      ? "78,222,163"
                      : "255,207,92"
                  },0.3);"><span style="width:6px;height:6px;border-radius:50%;background:${deptColor};box-shadow:0 0 6px ${deptColor};"></span> ${deptName}</span></td>
                  <td>${emp.jabatan}</td>
                  <td>${Utils.formatDate(emp.joinDate)}</td>
                  <td><span class="status-badge" style="${statusStyle}display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;font-size:11px;"><span class="dot" style="width:6px;height:6px;border-radius:50%;background:currentColor;"></span> ${emp.status}</span></td>
                  <td>
                    <div class="action-btns" style="display:flex;gap:6px;justify-content:flex-end;">
                      <button class="action-btn emp-view" data-id="${emp.id}" style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#BCC9CD;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Lihat Detail"><i class="fa-solid fa-eye" style="font-size:12px;"></i></button>
                      <button class="action-btn emp-edit" data-id="${emp.id}" style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#BCC9CD;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Edit"><i class="fa-solid fa-pen" style="font-size:12px;"></i></button>
                      <button class="action-btn emp-delete" data-id="${emp.id}" style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#BCC9CD;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Hapus"><i class="fa-solid fa-trash" style="font-size:12px;"></i></button>
                    </div>
                  </td>
                </tr>`;
      })
      .join("");

    const paginationInfo = document.querySelector(
      ".table-footer > div:first-child",
    );
    if (paginationInfo)
      paginationInfo.innerHTML = `Menampilkan <span style="color:#DAE2FD;font-weight:600;">1 - ${Math.min(
        start + PER_PAGE,
        filtered.length,
      )}</span> dari <span style="color:#4CD7F6;font-weight:600;">${
        filtered.length
      }</span> Karyawan`;

    const pagination = document.querySelector(".pagination");
    if (pagination) {
      let phtml = `<button class="page-btn" ${
        currentPageNum <= 1 ? "disabled" : ""
      } data-page="${
        currentPageNum - 1
      }" style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#BCC9CD;display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fa-solid fa-chevron-left" style="font-size:10px;"></i></button>`;
      const maxShow = 5;
      const startPage = Math.max(1, currentPageNum - 2);
      const endPage = Math.min(totalPages, startPage + maxShow - 1);
      for (let i = startPage; i <= endPage; i++) {
        phtml += `<button class="page-btn ${
          i === currentPageNum ? "active" : ""
        }" data-page="${i}" style="width:32px;height:32px;border-radius:8px;${
          i === currentPageNum
            ? "background:rgba(6,182,212,0.25);border:1px solid rgba(76,215,246,0.5);color:#4CD7F6;font-weight:700;"
            : "background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#BCC9CD;"
        }display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;">${i}</button>`;
      }
      if (endPage < totalPages) {
        phtml += `<span style="color:#BCC9CD;padding:0 4px;">...</span>`;
        phtml += `<button class="page-btn" data-page="${totalPages}" style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#BCC9CD;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;">${totalPages}</button>`;
      }
      phtml += `<button class="page-btn" ${
        currentPageNum >= totalPages ? "disabled" : ""
      } data-page="${
        currentPageNum + 1
      }" style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#BCC9CD;display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fa-solid fa-chevron-right" style="font-size:10px;"></i></button>`;
      pagination.innerHTML = phtml;
      pagination.querySelectorAll(".page-btn[data-page]").forEach((btn) => {
        btn.onclick = () => {
          const p = parseInt(btn.dataset.page);
          if (p >= 1 && p <= totalPages) {
            currentPageNum = p;
            renderTable();
          }
        };
      });
    }

    tbody
      .querySelectorAll(".emp-view")
      .forEach(
        (btn) => (btn.onclick = () => showEmployeeDetail(btn.dataset.id)),
      );
    tbody
      .querySelectorAll(".emp-edit")
      .forEach(
        (btn) =>
          (btn.onclick = () =>
            showEmployeeEditModal(btn.dataset.id, renderTable, updateSummary)),
      );
    tbody.querySelectorAll(".emp-delete").forEach(
      (btn) =>
        (btn.onclick = async () => {
          const emp = Utils.getEmpById(btn.dataset.id);
          if (!emp) return;
          const ok = await Utils.confirm(
            `Apakah Anda yakin ingin menghapus karyawan <strong>${emp.nama}</strong> (${emp.nip})?`,
          );
          if (ok) {
            HRMSDatabase.remove("employees", btn.dataset.id);
            allEmployees = HRMSDatabase.getAll("employees");
            updateSummary();
            renderTable();
            Utils.showToast(
              `Karyawan ${emp.nama} berhasil dihapus.`,
              "success",
            );
          }
        }),
    );

    updateInsightCards();
  }

  function updateInsightCards() {
    const emps = HRMSDatabase.getAll("employees");
    const total = emps.length;

    const progressItems = document.querySelectorAll(".progress-item");
    const deptGroups = [
      { ids: ["dept-it"], label: "IT & Rekayasa Perangkat Lunak" },
      { ids: ["dept-fin"], label: "Operasional & Keuangan" },
      { ids: ["dept-mkt", "dept-hr"], label: "Pemasaran & SDM" },
    ];
    progressItems.forEach((item, i) => {
      if (deptGroups[i]) {
        const count = emps.filter((e) =>
          deptGroups[i].ids.includes(e.departmentId),
        ).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const pctSpan = item.querySelector(".progress-label span:last-child");
        if (pctSpan) pctSpan.textContent = pct + "%";
        const fill = item.querySelector(".progress-fill");
        if (fill) fill.style.width = pct + "%";
      }
    });

    const insightCards = document.querySelectorAll(".bottom-grid .insight-card");
    if (insightCards.length >= 3) {
      const pkwttCount = emps.filter((e) => e.kontrak === "PKWTT").length;
      const pkwtCount = emps.filter((e) => e.kontrak === "PKWT").length;
      insightCards[1].innerHTML = `
        <div>
          <h3>Status Ikatan Kerja <span style="background:rgba(6,182,212,0.2);border:1px solid rgba(76,215,246,0.3);color:#4cd7f6;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;">${total} Staf</span></h3>
          <p>Tercatat <strong>${pkwttCount} Karyawan Tetap (PKWTT)</strong> dan <strong>${pkwtCount} Karyawan Kontrak (PKWT)</strong> aktif di seluruh divisi.</p>
        </div>
        <div class="card-footer-text">
          <i class="fa-solid fa-circle-check" style="color: #4edea3"></i> Data Kontrak Terverifikasi HRD
        </div>`;

      const totalGaji = emps.reduce((s, e) => s + (Number(e.gaji) || 0) + (Number(e.tunjangan) || 0), 0);
      insightCards[2].innerHTML = `
        <div>
          <h3>Sinkronisasi Payroll <i class="fa-solid fa-arrows-rotate" style="color: #d0bcff; font-size: 14px"></i></h3>
          <p>Total estimasi kompensasi kotor seluruh staf: <strong style="color:#4CD7F6;">${Utils.formatRupiah(totalGaji)}</strong> / bulan.</p>
        </div>
        <div class="card-footer-text" style="justify-content: space-between">
          <span><span style="color: #e9ddff; font-weight: 600">Status:</span> Sinkron 100%</span>
          <a href="penggajian.html" style="color: #4cd7f6; text-decoration: none; font-weight: 600">Buka Penggajian <i class="fa-solid fa-arrow-right" style="font-size: 10px"></i></a>
        </div>`;
    }
  }

  document
    .querySelectorAll(
      '.control-bar input[type="text"], .control-left input[type="text"], .header-search input[type="text"]',
    )
    .forEach((input) => {
      if (
        input.placeholder &&
        (input.placeholder.includes("NIP") ||
          input.placeholder.includes("Nama Karyawan"))
      ) {
        input.addEventListener(
          "input",
          Utils.debounce((e) => {
            searchQuery = e.target.value;
            currentPageNum = 1;
            renderTable();
          }),
        );
      }
    });

  document
    .querySelectorAll(".filter-select, .control-right select")
    .forEach((el, i) => {
      if (i === 0 || el.textContent.includes("Departemen")) {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
          showFilterDropdown(
            el,
            [
              { value: "all", label: "Semua Departemen" },
              { value: "dept-it", label: "IT & Engineering" },
              { value: "dept-mkt", label: "Marketing & Creative" },
              { value: "dept-fin", label: "Finance & Operations" },
              { value: "dept-hr", label: "Human Resources" },
            ],
            (val) => {
              filterDept = val;
              currentPageNum = 1;
              const label =
                val === "all" ? "Semua Departemen" : Utils.getDeptName(val);
              el.innerHTML = `${label} <i class="fa-solid fa-chevron-down" style="font-size:10px;color:#BCC9CD;"></i>`;
              renderTable();
            },
          );
        });
      }
    });

  document
    .querySelectorAll(".filter-select, .control-right select")
    .forEach((el, i) => {
      if (i === 1 || el.textContent.includes("Status")) {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
          showFilterDropdown(
            el,
            [
              { value: "all", label: "Semua Status" },
              { value: "Aktif", label: "Aktif" },
              { value: "Cuti", label: "Cuti" },
              { value: "Non-Aktif", label: "Non-Aktif" },
            ],
            (val) => {
              filterStatus = val;
              currentPageNum = 1;
              const label = val === "all" ? "Semua Status" : val;
              el.innerHTML = `${label} <i class="fa-solid fa-sliders" style="font-size:12px;color:#BCC9CD;"></i>`;
              renderTable();
            },
          );
        });
      }
    });

  const selectAll = document.querySelector("thead .custom-checkbox");
  if (selectAll) {
    selectAll.addEventListener("change", () => {
      document
        .querySelectorAll("tbody .custom-checkbox")
        .forEach((cb) => (cb.checked = selectAll.checked));
    });
  }

  renderTable();
}

function showFilterDropdown(triggerEl, options, onSelect) {
  document.querySelectorAll(".hrms-dropdown").forEach((d) => d.remove());

  const rect = triggerEl.getBoundingClientRect();
  const dropdown = document.createElement("div");
  dropdown.className = "hrms-dropdown";
  dropdown.style.cssText = `position:fixed;top:${rect.bottom + 4}px;left:${
    rect.left
  }px;min-width:${
    rect.width
  }px;background:#1b1e2a;border:1px solid #262938;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:10001;padding:6px;overflow:hidden;`;

  dropdown.innerHTML = options
    .map(
      (opt) => `
        <div class="hrms-dropdown-item" data-value="${opt.value}" style="padding:8px 14px;border-radius:6px;font-size:13px;color:#DAE2FD;cursor:pointer;transition:background .15s;">${opt.label}</div>
    `,
    )
    .join("");

  document.body.appendChild(dropdown);

  dropdown.querySelectorAll(".hrms-dropdown-item").forEach((item) => {
    item.addEventListener(
      "mouseenter",
      () => (item.style.background = "rgba(255,255,255,0.08)"),
    );
    item.addEventListener(
      "mouseleave",
      () => (item.style.background = "transparent"),
    );
    item.addEventListener("click", () => {
      onSelect(item.dataset.value);
      dropdown.remove();
    });
  });

  setTimeout(() => {
    document.addEventListener("click", function closer(e) {
      if (!dropdown.contains(e.target) && e.target !== triggerEl) {
        dropdown.remove();
        document.removeEventListener("click", closer);
      }
    });
  }, 10);
}

// ─── Employee Detail Modal ─────────────────────────────────
function showEmployeeDetail(empId) {
  const emp = Utils.getEmpById(empId);
  if (!emp) return;
  const deptName = Utils.getDeptName(emp.departmentId);
  const initials = Utils.getInitials(emp.nama);

  const overlay = document.createElement("div");
  overlay.className = "hrms-modal-overlay";
  overlay.innerHTML = `
        <div class="hrms-modal" style="max-width:480px;">
            <div class="hrms-modal-header">
                <h3><i class="fa-solid fa-user" style="color:#4CD7F6;margin-right:8px;"></i>Detail Karyawan</h3>
                <button class="hrms-btn-close" onclick="this.closest('.hrms-modal-overlay').remove()">&times;</button>
            </div>
            <div class="hrms-modal-body">
                <div style="text-align:center;margin-bottom:20px;">
                    <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#06b6d4,#3b82f6);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;color:#fff;margin:0 auto 12px;">${initials}</div>
                    <h3 style="color:#f8fafc;margin:0;font-size:18px;">${
                      emp.nama
                    }</h3>
                    <p style="color:#94a3b8;font-size:12px;margin:4px 0;">${
                      emp.nip
                    } • ${emp.jabatan}</p>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
                        <div style="color:#64748b;font-size:10px;letter-spacing:0.5px;margin-bottom:4px;">EMAIL</div>
                        <div style="color:#f8fafc;font-size:12px;word-break:break-all;">${
                          emp.email
                        }</div>
                    </div>
                    <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
                        <div style="color:#64748b;font-size:10px;letter-spacing:0.5px;margin-bottom:4px;">TELEPON</div>
                        <div style="color:#f8fafc;font-size:12px;">${
                          emp.phone || "-"
                        }</div>
                    </div>
                    <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
                        <div style="color:#64748b;font-size:10px;letter-spacing:0.5px;margin-bottom:4px;">DEPARTEMEN</div>
                        <div style="color:#f8fafc;font-size:12px;">${deptName}</div>
                    </div>
                    <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
                        <div style="color:#64748b;font-size:10px;letter-spacing:0.5px;margin-bottom:4px;">STATUS</div>
                        <div style="color:${
                          emp.status === "Aktif"
                            ? "#4EDEA3"
                            : emp.status === "Cuti"
                            ? "#D0BCFF"
                            : "#FFB4AB"
                        };font-size:12px;font-weight:600;">${emp.status}</div>
                    </div>
                    <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
                        <div style="color:#64748b;font-size:10px;letter-spacing:0.5px;margin-bottom:4px;">TGL BERGABUNG</div>
                        <div style="color:#f8fafc;font-size:12px;">${Utils.formatDate(
                          emp.joinDate,
                        )}</div>
                    </div>
                    <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
                        <div style="color:#64748b;font-size:10px;letter-spacing:0.5px;margin-bottom:4px;">KONTRAK</div>
                        <div style="color:#f8fafc;font-size:12px;">${
                          emp.kontrak
                        } • Level ${emp.level}</div>
                    </div>
                    <div style="background:#1b1e2a;padding:12px;border-radius:10px;grid-column:span 2;">
                        <div style="color:#64748b;font-size:10px;letter-spacing:0.5px;margin-bottom:4px;">MODEL KERJA</div>
                        <div style="color:#f8fafc;font-size:12px;">${
                          emp.workModel
                        }</div>
                    </div>
                    <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
                        <div style="color:#64748b;font-size:10px;letter-spacing:0.5px;margin-bottom:4px;">GAJI POKOK</div>
                        <div style="color:#4CD7F6;font-size:12px;font-weight:600;">${Utils.formatRupiah(
                          emp.gaji,
                        )}</div>
                    </div>
                    <div style="background:#1b1e2a;padding:12px;border-radius:10px;">
                        <div style="color:#64748b;font-size:10px;letter-spacing:0.5px;margin-bottom:4px;">TUNJANGAN</div>
                        <div style="color:#4EDEA3;font-size:12px;font-weight:600;">+${Utils.formatRupiah(
                          emp.tunjangan,
                        )}</div>
                    </div>
                </div>
            </div>
        </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

// ─── Employee Edit Modal ───────────────────────────────────
function showEmployeeEditModal(empId, onSave, onUpdateSummary) {
  const emp = empId ? Utils.getEmpById(empId) : null;
  const isNew = !emp;
  const title = isNew ? "Tambah Karyawan Baru" : "Edit Data Karyawan";

  const overlay = document.createElement("div");
  overlay.className = "hrms-modal-overlay";
  overlay.innerHTML = `
        <div class="hrms-modal" style="max-width:560px;">
            <div class="hrms-modal-header">
                <h3><i class="fa-solid fa-${
                  isNew ? "user-plus" : "pen-to-square"
                }" style="color:#4f46e5;margin-right:8px;"></i>${title}</h3>
                <button class="hrms-btn-close" onclick="this.closest('.hrms-modal-overlay').remove()">&times;</button>
            </div>
            <div class="hrms-modal-body">
                <div class="hrms-form-row">
                    <div class="hrms-form-group">
                        <label>Nama Lengkap *</label>
                        <input type="text" id="emp-nama" value="${
                          emp ? emp.nama : ""
                        }" placeholder="cth. Pratama Wijaya, S.Kom">
                    </div>
                    <div class="hrms-form-group">
                        <label>NIP</label>
                        <input type="text" id="emp-nip" value="${
                          emp ? emp.nip : Utils.generateNIP()
                        }" ${emp ? "readonly" : ""} style="background:#151722;">
                    </div>
                </div>
                <div class="hrms-form-row">
                    <div class="hrms-form-group">
                        <label>Email Perusahaan *</label>
                        <input type="email" id="emp-email" value="${
                          emp ? emp.email : ""
                        }" placeholder="name@company.co.id">
                    </div>
                    <div class="hrms-form-group">
                        <label>Nomor Telepon</label>
                        <input type="text" id="emp-phone" value="${
                          emp ? emp.phone || "" : ""
                        }" placeholder="+62 812-3456-7890">
                    </div>
                </div>
                <div class="hrms-form-row">
                    <div class="hrms-form-group">
                        <label>Jenis Kelamin *</label>
                        <select id="emp-gender">
                            <option value="L" ${
                              emp && emp.gender === "L" ? "selected" : ""
                            }>Laki-Laki</option>
                            <option value="P" ${
                              emp && emp.gender === "P" ? "selected" : ""
                            }>Perempuan</option>
                        </select>
                    </div>
                    <div class="hrms-form-group">
                        <label>Departemen *</label>
                        <select id="emp-dept">
                            <option value="dept-it" ${
                              emp && emp.departmentId === "dept-it"
                                ? "selected"
                                : ""
                            }>IT & Engineering</option>
                            <option value="dept-mkt" ${
                              emp && emp.departmentId === "dept-mkt"
                                ? "selected"
                                : ""
                            }>Marketing & Creative</option>
                            <option value="dept-fin" ${
                              emp && emp.departmentId === "dept-fin"
                                ? "selected"
                                : ""
                            }>Finance & Operations</option>
                            <option value="dept-hr" ${
                              emp && emp.departmentId === "dept-hr"
                                ? "selected"
                                : ""
                            }>Human Resources</option>
                        </select>
                    </div>
                </div>
                <div class="hrms-form-row">
                    <div class="hrms-form-group">
                        <label>Jabatan / Posisi *</label>
                        <input type="text" id="emp-jabatan" value="${
                          emp ? emp.jabatan : ""
                        }" placeholder="Senior Software Engineer">
                    </div>
                    <div class="hrms-form-group">
                        <label>Status Kepegawaian</label>
                        <select id="emp-status">
                            <option value="Aktif" ${
                              emp && emp.status === "Aktif" ? "selected" : ""
                            }>Aktif</option>
                            <option value="Cuti" ${
                              emp && emp.status === "Cuti" ? "selected" : ""
                            }>Cuti</option>
                            <option value="Non-Aktif" ${
                              emp && emp.status === "Non-Aktif"
                                ? "selected"
                                : ""
                            }>Non-Aktif</option>
                        </select>
                    </div>
                </div>
                <div class="hrms-form-row">
                    <div class="hrms-form-group">
                        <label>Tanggal Bergabung *</label>
                        <input type="date" id="emp-joindate" value="${
                          emp
                            ? emp.joinDate
                            : new Date().toISOString().split("T")[0]
                        }">
                    </div>
                    <div class="hrms-form-group">
                        <label>Status Kontrak</label>
                        <select id="emp-kontrak">
                            <option value="PKWTT" ${
                              emp && emp.kontrak === "PKWTT" ? "selected" : ""
                            }>Tetap (PKWTT)</option>
                            <option value="PKWT" ${
                              emp && emp.kontrak === "PKWT" ? "selected" : ""
                            }>Kontrak (PKWT)</option>
                        </select>
                    </div>
                </div>
                <div class="hrms-form-row">
                    <div class="hrms-form-group">
                        <label>Gaji Pokok (Rp)</label>
                        <input type="number" id="emp-gaji" value="${
                          emp ? emp.gaji : 10000000
                        }" min="0" step="500000">
                    </div>
                    <div class="hrms-form-group">
                        <label>Tunjangan (Rp)</label>
                        <input type="number" id="emp-tunjangan" value="${
                          emp ? emp.tunjangan : 2000000
                        }" min="0" step="100000">
                    </div>
                </div>
                <div class="hrms-form-group">
                    <label>Model Penempatan Kerja</label>
                    <select id="emp-workmodel">
                        <option value="WFO Jakarta" ${
                          emp && emp.workModel === "WFO Jakarta"
                            ? "selected"
                            : ""
                        }>WFO Jakarta</option>
                        <option value="Hybrid Flex" ${
                          emp && emp.workModel === "Hybrid Flex"
                            ? "selected"
                            : ""
                        }>Hybrid Flex</option>
                        <option value="Full Remote" ${
                          emp && emp.workModel === "Full Remote"
                            ? "selected"
                            : ""
                        }>Full Remote</option>
                    </select>
                </div>
            </div>
            <div class="hrms-modal-footer">
                <button class="hrms-btn hrms-btn-secondary" onclick="this.closest('.hrms-modal-overlay').remove()">Batal</button>
                <button class="hrms-btn hrms-btn-primary" id="emp-save-btn"><i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i>${
                  isNew ? "Simpan & Terbitkan" : "Simpan Perubahan"
                }</button>
            </div>
        </div>`;

  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  document.getElementById("emp-save-btn").onclick = () => {
    const nama = document.getElementById("emp-nama").value.trim();
    const email = document.getElementById("emp-email").value.trim();
    const jabatan = document.getElementById("emp-jabatan").value.trim();
    if (!nama || !email || !jabatan) {
      Utils.showToast("Harap isi semua field yang wajib (*).", "error");
      return;
    }
    const data = {
      nama,
      email,
      jabatan,
      nip: document.getElementById("emp-nip").value.trim(),
      phone: document.getElementById("emp-phone").value.trim(),
      gender: document.getElementById("emp-gender").value,
      departmentId: document.getElementById("emp-dept").value,
      status: document.getElementById("emp-status").value,
      joinDate: document.getElementById("emp-joindate").value,
      kontrak: document.getElementById("emp-kontrak").value,
      gaji: parseInt(document.getElementById("emp-gaji").value) || 0,
      tunjangan: parseInt(document.getElementById("emp-tunjangan").value) || 0,
      workModel: document.getElementById("emp-workmodel").value,
      level: emp ? emp.level : 1,
    };
    if (isNew) {
      HRMSDatabase.insert("employees", data);
      Utils.showToast(`Karyawan ${nama} berhasil ditambahkan!`, "success");
    } else {
      HRMSDatabase.update("employees", empId, data);
      Utils.showToast(`Data ${nama} berhasil diperbarui!`, "success");
    }
    overlay.remove();
    if (onUpdateSummary) onUpdateSummary();
    if (onSave) onSave();
  };
}

// ════════════════════════════════════════════════════════════
// ▌ FORM (Tambah Karyawan Baru) PAGE
// ════════════════════════════════════════════════════════════
function initForm() {
  initGlobalHooks();
  let uploadedPhotoBase64 = null;

  const nipInput = document.querySelector(
    'input[value*="EMP-"], input[readonly]',
  );
  if (nipInput) nipInput.value = Utils.generateNIP();

  const btnUpload = document.querySelector(".btn-upload");
  const btnDelete = document.querySelector(".btn-delete");
  const avatarPlaceholder = document.querySelector(".avatar-placeholder");
  const idAvatar = document.querySelector(
    '.id-avatar, [class*="id-card"] [class*="avatar"]',
  );

  if (btnUpload) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/png, image/jpeg, image/jpg";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    btnUpload.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.click();
    });

    fileInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          Utils.showToast("Maksimal ukuran foto adalah 2MB!", "warning");
          return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
          uploadedPhotoBase64 = e.target.result;
          if (avatarPlaceholder)
            avatarPlaceholder.innerHTML = `<img src="${uploadedPhotoBase64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
          if (idAvatar)
            idAvatar.innerHTML = `<img src="${uploadedPhotoBase64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
          Utils.showToast("Foto berhasil diunggah!", "success");
        };
        reader.readAsDataURL(file);
      }
    });

    if (btnDelete) {
      btnDelete.addEventListener("click", (e) => {
        e.preventDefault();
        uploadedPhotoBase64 = null;
        fileInput.value = "";
        if (avatarPlaceholder)
          avatarPlaceholder.innerHTML =
            '<i class="fa-regular fa-user"></i><div class="avatar-add-btn"><i class="fa-solid fa-camera"></i></div>';
        if (idAvatar) idAvatar.innerHTML = '<i class="fa-regular fa-user"></i>';
        Utils.showToast("Foto profil dihapus.", "info");
      });
    }
  }

  document.querySelectorAll("a, button, span").forEach((el) => {
    if (el.textContent.includes("Acak Baru")) {
      el.style.cursor = "pointer";
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (nipInput) nipInput.value = Utils.generateNIP();
        Utils.showToast("NIP baru di-generate!", "info");
        updateIdCardPreview();
      });
    }
  });

  function updateIdCardPreview() {
    const namaInput = document.querySelector(
      'input[placeholder*="Pratama"], input[placeholder*="Nama"], #emp-nama',
    );
    const previewName = document.querySelector(
      '.preview-name, .id-details h4, [class*="preview"] [class*="name"], [class*="card-name"], .id-profile h3',
    );
    if (previewName && namaInput)
      previewName.textContent = namaInput.value || "Pratama Wijaya";

    const selects = document.querySelectorAll("select");
    selects.forEach((sel) => {
      const label = sel.closest('.form-group')?.querySelector('label')?.textContent || "";
      if (label.includes("Departemen")) {
        const deptEl = document.querySelector(".id-details .dept");
        if (deptEl && sel.selectedOptions[0]) deptEl.textContent = sel.selectedOptions[0].text.trim();
      }
      if (label.includes("Jabatan") || label.includes("Posisi")) {
        const jobEl = document.querySelector(".id-details .job");
        if (jobEl && sel.selectedOptions[0]) jobEl.textContent = sel.selectedOptions[0].text.trim();
      }
    });

    const draftBadge = document.querySelector(".status-badge.draft");
    if (draftBadge && nipInput) {
      draftBadge.innerHTML = '<i class="fa-solid fa-hashtag" style="color: #d0bcff"></i> Draft NIP: ' + nipInput.value;
    }
  }

  document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", updateIdCardPreview);
    el.addEventListener("change", updateIdCardPreview);
  });

  document.querySelectorAll("button").forEach((btn) => {
    if (
      btn.textContent.includes("Simpan") &&
      btn.textContent.includes("Terbitkan")
    ) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const inputs = document.querySelectorAll(
          'input:not([readonly]):not([type="file"]), select',
        );
        const formData = { photo: uploadedPhotoBase64 };

        inputs.forEach((input) => {
          if (input.placeholder) {
            if (
              input.placeholder.includes("Pratama") ||
              input.placeholder.includes("Nama")
            )
              formData.nama = input.value.trim();
            if (input.placeholder.includes("company"))
              formData.email = input.value.trim();
            if (
              input.placeholder.includes("812") ||
              input.placeholder.includes("Telepon")
            )
              formData.phone = input.value.trim();
          }
          if (input.type === "date") formData.joinDate = input.value;
        });

        const selects = document.querySelectorAll("select");
        selects.forEach((sel) => {
          const label = sel
            .closest('.form-group, [class*="form"]')
            ?.querySelector('label, [class*="label"]');
          const labelText = label ? label.textContent : "";
          if (
            labelText.includes("Kelamin") ||
            sel.querySelector('option[value="L"]')
          )
            formData.gender = sel.value;
          if (labelText.includes("Departemen"))
            formData.departmentId = sel.value || "dept-it";
          if (labelText.includes("Jabatan") || labelText.includes("Posisi"))
            formData.jabatan = sel.value;
          if (labelText.includes("Ikatan") || labelText.includes("Kontrak"))
            formData.kontrak = sel.value;
        });

        const nipEl = document.querySelector(
          'input[readonly], input[value*="EMP-"]',
        );
        formData.nip = nipEl ? nipEl.value : Utils.generateNIP();

        if (!formData.nama) {
          Utils.showToast("Nama Lengkap wajib diisi!", "error");
          return;
        }
        if (!formData.email) {
          Utils.showToast("Email Perusahaan wajib diisi!", "error");
          return;
        }

        formData.departmentId = formData.departmentId || "dept-it";
        formData.jabatan = formData.jabatan || "Staff";
        formData.status = "Aktif";
        formData.kontrak = formData.kontrak || "PKWT";
        formData.level = 1;
        formData.gaji = 10000000;
        formData.tunjangan = 2000000;
        formData.workModel = "WFO Jakarta";
        formData.joinDate =
          formData.joinDate || new Date().toISOString().split("T")[0];
        formData.gender = formData.gender || "L";
        formData.phone = formData.phone || "";

        document
          .querySelectorAll(
            'input[type="radio"], [class*="work-model"] [class*="card"]',
          )
          .forEach((el) => {
            if (
              el.checked ||
              el.classList.contains("selected") ||
              el.classList.contains("active")
            ) {
              const text = el.closest("label, div")?.textContent || "";
              if (text.includes("Remote")) formData.workModel = "Full Remote";
              else if (text.includes("Hybrid"))
                formData.workModel = "Hybrid Flex";
              else formData.workModel = "WFO Jakarta";
            }
          });

        HRMSDatabase.insert("employees", formData);
        Utils.showToast(
          `Karyawan ${formData.nama} (${formData.nip}) berhasil ditambahkan! 🎉`,
          "success",
        );

        setTimeout(() => {
          window.location.href = "data-master.html";
        }, 1500);
      });
    }
  });

  document.querySelectorAll("button").forEach((btn) => {
    if (btn.textContent.includes("Bersihkan")) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelectorAll('input:not([readonly]):not([type="file"])')
          .forEach((input) => (input.value = ""));
        document
          .querySelectorAll("select")
          .forEach((sel) => (sel.selectedIndex = 0));
        if (nipInput) nipInput.value = Utils.generateNIP();
        Utils.showToast("Formulir telah dibersihkan.", "info");
      });
    }
  });

  document.querySelectorAll("button, a").forEach((el) => {
    if (
      el.textContent.includes("Kembali") &&
      el.textContent.includes("Data Karyawan")
    ) {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "data-master.html";
      });
    }
  });

  document
    .querySelectorAll('[class*="work-model"], [class*="placement"]')
    .forEach((container) => {
      container
        .querySelectorAll('[class*="card"], [class*="option"]')
        .forEach((card) => {
          card.style.cursor = "pointer";
          card.addEventListener("click", function () {
            container
              .querySelectorAll('[class*="card"], [class*="option"]')
              .forEach((c) => {
                c.style.border = "1px solid rgba(255,255,255,0.12)";
                c.style.background = "rgba(255,255,255,0.04)";
              });
            this.style.border = "1px solid #4CD7F6";
            this.style.background = "rgba(6,182,212,0.1)";
          });
        });
    });
}

// ════════════════════════════════════════════════════════════
// ▌ PRESENSI & CUTI PAGE
// ════════════════════════════════════════════════════════════
function initPresensi() {
  initGlobalHooks();
  const employees = HRMSDatabase.getAll("employees");
  const role = window.currentUserRole;
  const myId = window.currentUserId;
  const isPegawai = role === "pegawai";
  let attendance = HRMSDatabase.getAll("attendance");
  let leaves = HRMSDatabase.getAll("leave_requests");

  if (isPegawai) {
    attendance = attendance.filter((a) => a.employeeId === myId);
    leaves = leaves.filter((l) => l.employeeId === myId);
  }

  const todayISO = new Date().toISOString().split("T")[0];
  const todayAtt = isPegawai
    ? [...attendance].reverse()
    : attendance.filter((a) => a.date === todayISO || a.date === "2026-10-06").length > 0
      ? attendance.filter((a) => a.date === todayISO || a.date === "2026-10-06")
      : attendance;

  const hadir = todayAtt.length;
  const total = isPegawai ? 22 : employees.length || 1;
  const absen = isPegawai ? Math.max(0, 12 - leaves.filter((l) => l.status === "Approved").reduce((s, l) => s + (Number(l.duration) || 1), 0)) : Math.max(0, employees.length - hadir);
  const pctHadir = ((hadir / total) * 100).toFixed(1);
  const tepatWaktu = todayAtt.filter((a) => a.status === "Tepat Waktu").length;
  const terlambat = todayAtt.filter((a) => a.status === "Terlambat").length;
  const wfh = todayAtt.filter((a) => a.status === "WFH / Remote").length;
  const pendingLeavesCount = leaves.filter((l) => l.status === "Pending").length;

  let activeMode = "presensi"; // "presensi" | "cuti" | "jadwal"
  let searchQuery = "";
  let filterStatus = "all";
  let filterDept = "all";
  let pageNum = 1;
  const PER_PAGE = 7;

  if (isPegawai) {
    const myEmp = Utils.getEmpById(myId) || {};
    const bc = document.querySelector(".breadcrumb");
    if (bc) bc.innerHTML = `Portal Mandiri Karyawan (ESS) <i class="fa-solid fa-chevron-right" style="font-size: 8px"></i> <span>Presensi & Cuti Saya</span>`;
    const h1 = document.querySelector(".page-title-row h1");
    if (h1) h1.textContent = "Presensi & Pengajuan Cuti Saya";
    const sub = document.querySelector(".page-subtitle");
    if (sub) sub.textContent = "Pantau riwayat kehadiran harian Anda, lihat jadwal kerja mingguan, dan ajukan permohonan cuti atau izin secara online.";

    // Replace action buttons for Pegawai
    const actCtrl = document.querySelector(".action-controls");
    if (actCtrl) {
      actCtrl.innerHTML = `
        <button class="btn-secondary" id="btn-pegawai-absen-modal">
          <i class="fa-solid fa-fingerprint" style="color:#4CD7F6;"></i> Absen Hari Ini
        </button>
        <button class="btn-primary" id="btn-pegawai-ajukan-cuti" style="display:inline-flex !important;">
          <i class="fa-solid fa-paper-plane"></i> + Ajukan Cuti / Izin
        </button>
      `;
      actCtrl.querySelector("#btn-pegawai-ajukan-cuti").onclick = () => showLeaveRequestModal(() => initPresensi());
      actCtrl.querySelector("#btn-pegawai-absen-modal").onclick = () => {
        window.location.href = "dashboard.html";
      };
    }

    // Customize Card 1 for Pegawai
    const c1Sub = document.querySelector(".card-1 .card-title-sub");
    if (c1Sub) c1Sub.textContent = "REKAP KEHADIRAN SAYA";
    const c1Main = document.querySelector(".card-1 .card-title-main");
    if (c1Main) c1Main.textContent = "Total Kehadiran Tercatat";
    const c1Val = document.querySelector(".card-1 .card-1-value");
    if (c1Val) c1Val.innerHTML = `${hadir} <span class="sub">/ 22 Hari Kerja</span> <span class="pct">${pctHadir}%</span>`;

    // Customize Card 2 for Pegawai
    const c2Sub = document.querySelector(".card-2 .card-title-sub");
    if (c2Sub) c2Sub.textContent = "KUOTA CUTI TAHUNAN";
    const c2Main = document.querySelector(".card-2 .card-title-main");
    if (c2Main) c2Main.innerHTML = "Sisa Hak Cuti &<br/>Status Permohonan";
    const c2Val = document.querySelector(".card-2 .card-1-value");
    if (c2Val) c2Val.innerHTML = `${absen} <span class="sub">Hari Tersisa</span>`;
    const bTags = document.querySelectorAll(".card-2 .breakdown-tags .b-tag");
    if (bTags.length >= 3) {
      const appCount = leaves.filter((l) => l.status === "Approved").length;
      const pendCount = leaves.filter((l) => l.status === "Pending").length;
      const rejCount = leaves.filter((l) => l.status === "Rejected").length;
      bTags[0].innerHTML = `<div class="d-purp"></div> Disetujui: <span class="b-val-purp">${appCount}</span>`;
      bTags[1].innerHTML = `<div class="d-cyan"></div> Pending: <span class="b-val-cyan">${pendCount}</span>`;
      bTags[2].innerHTML = `<div class="d-red"></div> Ditolak: <span class="b-val-red">${rejCount}</span>`;
    }
    const cflText = document.querySelector(".card-2 .cfl-text");
    if (cflText) cflText.innerHTML = `<i class="fa-solid fa-plane-departure"></i> ${pendingLeavesCount} Pengajuan sedang menunggu HR`;
    const cflBtn = document.querySelector(".card-2 .cfl-btn");
    if (cflBtn) {
      cflBtn.innerHTML = `Ajukan Cuti <i class="fa-solid fa-plus"></i>`;
      cflBtn.onclick = (e) => {
        e.preventDefault();
        showLeaveRequestModal(() => initPresensi());
      };
    }

    // Customize Card 3 for Pegawai
    const c3Title = document.querySelector(".card-3 .c3-title");
    if (c3Title) c3Title.textContent = "INFORMASI SHIFT SAYA";
    const mbLabels = document.querySelectorAll(".card-3 .mb-label");
    const mbVals = document.querySelectorAll(".card-3 .mb-val");
    if (mbLabels.length >= 2 && mbVals.length >= 2) {
      mbLabels[0].textContent = "Jam Kerja Reguler";
      mbVals[0].textContent = "08:00 - 17:00 WIB";
      mbLabels[1].textContent = "Model Penempatan Kerja";
      mbVals[1].textContent = myEmp.workModel || "Hybrid Flex";
    }

    // Hide Department filter dropdown for Pegawai
    const filterDropdownsAll = document.querySelectorAll(".filter-right .filter-dropdown");
    if (filterDropdownsAll.length >= 2) {
      filterDropdownsAll[1].style.display = "none";
    }
  } else {
    // Admin KPI updates
    const card1Val = document.querySelector(".card-1 .card-1-value");
    if (card1Val) {
      card1Val.innerHTML = `${hadir} <span class="sub">/ ${employees.length} Staf</span> <span class="pct">${pctHadir}%</span>`;
    }
    const card2Val = document.querySelector(".card-2 .card-1-value");
    if (card2Val) {
      card2Val.innerHTML = `${absen} <span class="sub">Staf Absen</span>`;
    }
    const bTags = document.querySelectorAll(".card-2 .breakdown-tags .b-tag");
    if (bTags.length >= 3) {
      const cutiTahunanCnt = leaves.filter((l) => l.type === "Cuti Tahunan").length;
      const sakitCnt = leaves.filter((l) => l.type === "Cuti Sakit").length;
      const izinCnt = leaves.filter((l) => l.type !== "Cuti Tahunan" && l.type !== "Cuti Sakit").length;
      bTags[0].innerHTML = `<div class="d-purp"></div> Cuti Tahunan: <span class="b-val-purp">${cutiTahunanCnt}</span>`;
      bTags[1].innerHTML = `<div class="d-cyan"></div> Sakit: <span class="b-val-cyan">${sakitCnt}</span>`;
      bTags[2].innerHTML = `<div class="d-red"></div> Izin Lainnya: <span class="b-val-red">${izinCnt}</span>`;
    }
    const cflText = document.querySelector(".card-2 .cfl-text");
    if (cflText) cflText.innerHTML = `<i class="fa-solid fa-file-invoice"></i> ${pendingLeavesCount} Permohonan menunggu verifikasi HR`;
    const cflBtn = document.querySelector(".card-2 .cfl-btn");
    if (cflBtn) {
      cflBtn.onclick = (e) => {
        e.preventDefault();
        const tabs = document.querySelectorAll(".tab-controls .tab-btn");
        if (tabs.length >= 2) tabs[1].click();
      };
    }

    // Wire up Refresh, Date Filter, and Export on Presensi
    const refreshBtn = document.querySelector(".filter-right .btn-icon-square");
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        HRMSDatabase.syncWithMySQL();
        initPresensi();
        Utils.showToast("Data presensi & cuti berhasil disinkronkan!", "success");
      };
    }
    const expBtn = document.querySelector(".action-controls .btn-secondary");
    if (expBtn) {
      expBtn.onclick = () => exportToCSV();
    }
  }

  const pills = document.querySelectorAll(".card-1 .status-pills .pill");
  if (pills.length >= 3) {
    pills[0].innerHTML = `<div class="dot-green"></div> Tepat Waktu: ${tepatWaktu}`;
    pills[1].innerHTML = `<div class="dot-red"></div> Terlambat: ${terlambat}`;
    pills[2].innerHTML = `<i class="fa-solid fa-laptop-house"></i> WFH: ${wfh}`;
  }

  // Update Tab Badges
  const tabBadges = document.querySelectorAll(".tab-controls .tab-badge");
  if (tabBadges.length >= 1) tabBadges[0].textContent = isPegawai ? `${hadir} Log` : `${hadir} Masuk`;
  if (tabBadges.length >= 2) tabBadges[1].textContent = isPegawai ? `${leaves.length} Pengajuan` : `${pendingLeavesCount} Menunggu`;

  document
    .querySelectorAll(
      '[class*="tab"] button, [class*="tab-btn"], [class*="toggle"] button',
    )
    .forEach((tab) => {
      tab.style.cursor = "pointer";
      tab.onclick = function () {
        document
          .querySelectorAll('[class*="tab"] button, [class*="tab-btn"]')
          .forEach((t) => {
            t.classList.remove("active");
            t.style.background = "transparent";
            t.style.borderColor = "transparent";
            t.style.color = "#BCC9CD";
          });
        this.classList.add("active");
        this.style.background = "rgba(6,182,212,0.15)";
        this.style.borderColor = "rgba(76,215,246,0.3)";
        this.style.color = "#4CD7F6";

        pageNum = 1;
        const text = this.textContent.toLowerCase();
        if (text.includes("cuti") || text.includes("izin")) {
          activeMode = "cuti";
          renderLeaveManagement();
        } else if (text.includes("jadwal") || text.includes("shift")) {
          activeMode = "jadwal";
          renderScheduleTab();
        } else {
          activeMode = "presensi";
          renderPresensiTable();
        }
      };
    });

  // Search input in presensi
  const searchInput = document.querySelector(".filter-right .search-box input");
  if (searchInput) {
    if (isPegawai) searchInput.placeholder = "Cari tanggal, lokasi, atau jenis cuti...";
    searchInput.addEventListener(
      "input",
      Utils.debounce((e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        pageNum = 1;
        if (activeMode === "cuti") renderLeaveManagement();
        else if (activeMode === "jadwal") renderScheduleTab();
        else renderPresensiTable();
      }),
    );
  }

  // Filter dropdowns in presensi
  const filterDropdowns = document.querySelectorAll(".filter-right .filter-dropdown");
  if (filterDropdowns.length >= 1) {
    filterDropdowns[0].onclick = function () {
      showFilterDropdown(
        this,
        [
          { value: "all", label: "Semua Status" },
          { value: "Tepat Waktu", label: "Tepat Waktu" },
          { value: "Terlambat", label: "Terlambat" },
          { value: "WFH / Remote", label: "WFH / Remote" },
          { value: "Dinas Luar Kota", label: "Dinas Luar Kota" },
        ],
        (val) => {
          filterStatus = val;
          pageNum = 1;
          this.innerHTML = `${val === "all" ? "Semua Status" : val} <i class="fa-solid fa-chevron-down"></i>`;
          if (activeMode === "presensi") renderPresensiTable();
        },
      );
    };
  }
  if (filterDropdowns.length >= 2 && !isPegawai) {
    filterDropdowns[1].onclick = function () {
      showFilterDropdown(
        this,
        [
          { value: "all", label: "Semua Departemen" },
          { value: "dept-it", label: "IT & Engineering" },
          { value: "dept-mkt", label: "Marketing & Creative" },
          { value: "dept-fin", label: "Finance & Operations" },
          { value: "dept-hr", label: "Human Resources" },
        ],
        (val) => {
          filterDept = val;
          pageNum = 1;
          this.innerHTML = `${val === "all" ? "Semua Departemen" : Utils.getDeptShort(val)} <i class="fa-solid fa-chevron-down"></i>`;
          if (activeMode === "cuti") renderLeaveManagement();
          else renderPresensiTable();
        },
      );
    };
  }

  function renderPagination(totalItems, onPageChange) {
    const pagination = document.querySelector(".table-footer .pagination");
    if (!pagination) return;
    const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));
    if (pageNum > totalPages) pageNum = 1;

    let html = `<button class="page-btn ${pageNum <= 1 ? "disabled" : ""}" data-page="${pageNum - 1}"><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === pageNum ? "active" : ""}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn ${pageNum >= totalPages ? "disabled" : ""}" data-page="${pageNum + 1}"><i class="fa-solid fa-chevron-right"></i></button>`;
    pagination.innerHTML = html;

    pagination.querySelectorAll(".page-btn[data-page]").forEach((btn) => {
      btn.onclick = () => {
        const p = parseInt(btn.dataset.page);
        if (p >= 1 && p <= totalPages && p !== pageNum) {
          pageNum = p;
          onPageChange();
        }
      };
    });
  }

  function renderPresensiTable() {
    const thead = document.querySelector("table thead");
    if (thead) {
      thead.innerHTML = `<tr>
        <th>${isPegawai ? "TANGGAL & NAMA" : "KARYAWAN"}</th>
        <th>DEPARTEMEN</th>
        <th>JAM MASUK</th>
        <th>JAM KELUAR</th>
        <th>VERIFIKASI LOKASI</th>
        <th>STATUS</th>
        <th>AKSI</th>
      </tr>`;
    }
    const thTitle = document.querySelector(".th-title-row h2");
    if (thTitle) thTitle.textContent = isPegawai ? "Riwayat Presensi Harian Saya" : "Log Presensi Hari Ini";

    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    const filtered = todayAtt.filter((att) => {
      const emp = Utils.getEmpById(att.employeeId);
      if (!emp) return false;
      if (filterStatus !== "all" && att.status !== filterStatus) return false;
      if (filterDept !== "all" && emp.departmentId !== filterDept) return false;
      if (searchQuery) {
        return (
          emp.nama.toLowerCase().includes(searchQuery) ||
          emp.nip.toLowerCase().includes(searchQuery) ||
          (att.date && att.date.toLowerCase().includes(searchQuery)) ||
          (att.location && att.location.toLowerCase().includes(searchQuery)) ||
          Utils.getDeptName(emp.departmentId).toLowerCase().includes(searchQuery)
        );
      }
      return true;
    });

    const start = (pageNum - 1) * PER_PAGE;
    const pageData = filtered.slice(start, start + PER_PAGE);
    const startIdx = filtered.length > 0 ? start + 1 : 0;
    const endIdx = Math.min(start + PER_PAGE, filtered.length);

    const thSubtitle = document.querySelector(".th-subtitle");
    if (thSubtitle) {
      thSubtitle.textContent = `Menampilkan ${startIdx} - ${endIdx} dari total ${filtered.length} catatan presensi`;
    }
    const footerInfo = document.querySelector(".footer-info");
    if (footerInfo) {
      footerInfo.textContent = `Menampilkan ${startIdx} - ${endIdx} dari ${filtered.length} data presensi`;
    }

    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#869397;">Belum ada data presensi yang sesuai filter.</td></tr>`;
      renderPagination(0, renderPresensiTable);
      return;
    }

    tbody.innerHTML = pageData
      .map((att) => {
        const emp = Utils.getEmpById(att.employeeId);
        if (!emp) return "";
        const initials = Utils.getInitials(emp.nama);
        const dept = Utils.getDeptShort(emp.departmentId);

        let statusStyle =
          "background:rgba(78,222,163,0.12);color:#4EDEA3;border:1px solid rgba(78,222,163,0.3);";
        let statusText = att.status;
        if (att.status === "Terlambat") {
          statusStyle =
            "background:rgba(255,180,171,0.12);color:#FFB4AB;border:1px solid rgba(255,180,171,0.3);";
          statusText = `Terlambat (${att.lateMinutes || 10} mnt)`;
        } else if (att.status === "WFH / Remote") {
          statusStyle =
            "background:rgba(6,182,212,0.12);color:#4CD7F6;border:1px solid rgba(6,182,212,0.3);";
        } else if (att.status === "Dinas Luar Kota") {
          statusStyle =
            "background:rgba(208,188,255,0.12);color:#D0BCFF;border:1px solid rgba(208,188,255,0.3);";
        }

        return `<tr>
                <td><div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:#0B1326;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#DAE2FD;">${initials}</div>
                    <div><div style="font-weight:600;font-size:13px;color:#DAE2FD;">${
                      isPegawai ? Utils.formatDate(att.date) + " — " + emp.nama : emp.nama
                    }</div><div style="color:#BCC9CD;font-size:11px;">${
                      emp.nip
                    } • ${emp.jabatan}</div></div>
                </div></td>
                <td><span style="padding:4px 10px;border-radius:8px;font-size:11px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#BCC9CD;">${dept}</span></td>
                <td style="font-family:monospace;font-weight:600;color:#4CD7F6;font-size:15px;">${
                  att.clockIn
                } <span style="font-size:11px;color:#BCC9CD;font-weight:400;">WIB</span></td>
                <td style="font-size:13px;color:#BCC9CD;">${
                  att.clockOut ? att.clockOut + " WIB" : "Masih Bekerja"
                }</td>
                <td style="font-size:12px;color:#DAE2FD;">${att.location}</td>
                <td><span style="${statusStyle}display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;font-size:11px;">${statusText}</span></td>
                <td><button style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#BCC9CD;cursor:pointer;" onclick="showEmployeeDetail('${
                  att.employeeId
                }')"><i class="fa-solid fa-eye" style="font-size:11px;"></i></button></td>
            </tr>`;
      })
      .join("");

    renderPagination(filtered.length, renderPresensiTable);
  }

  function renderLeaveManagement() {
    const thead = document.querySelector("table thead");
    if (thead) {
      thead.innerHTML = `<tr>
        <th>KARYAWAN</th>
        <th>TANGGAL CUTI</th>
        <th>DURASI</th>
        <th>JENIS CUTI</th>
        <th>ALASAN / KETERANGAN</th>
        <th>STATUS</th>
        <th style="text-align:right;">AKSI</th>
      </tr>`;
    }
    const thTitle = document.querySelector(".th-title-row h2");
    if (thTitle) thTitle.textContent = isPegawai ? "Riwayat Pengajuan Cuti & Izin Saya" : "Daftar Pengajuan Cuti & Izin";

    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    let currentLeaves = HRMSDatabase.getAll("leave_requests");
    if (isPegawai) currentLeaves = currentLeaves.filter((l) => l.employeeId === myId);

    const pendingLeaves = currentLeaves.filter((l) => l.status === "Pending");
    const orderedLeaves = [
      ...pendingLeaves,
      ...currentLeaves.filter((l) => l.status !== "Pending"),
    ].filter((leave) => {
      const emp = Utils.getEmpById(leave.employeeId);
      if (!emp) return false;
      if (filterDept !== "all" && emp.departmentId !== filterDept) return false;
      if (searchQuery) {
        return (
          emp.nama.toLowerCase().includes(searchQuery) ||
          emp.nip.toLowerCase().includes(searchQuery) ||
          leave.type.toLowerCase().includes(searchQuery) ||
          (leave.reason && leave.reason.toLowerCase().includes(searchQuery))
        );
      }
      return true;
    });

    const start = (pageNum - 1) * PER_PAGE;
    const pageData = orderedLeaves.slice(start, start + PER_PAGE);
    const startIdx = orderedLeaves.length > 0 ? start + 1 : 0;
    const endIdx = Math.min(start + PER_PAGE, orderedLeaves.length);

    const thSubtitle = document.querySelector(".th-subtitle");
    if (thSubtitle) {
      thSubtitle.textContent = `Menampilkan ${startIdx} - ${endIdx} dari total ${orderedLeaves.length} permohonan cuti & izin`;
    }
    const footerInfo = document.querySelector(".footer-info");
    if (footerInfo) {
      footerInfo.textContent = `Menampilkan ${startIdx} - ${endIdx} dari ${orderedLeaves.length} permohonan cuti`;
    }

    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#869397;">Belum ada pengajuan cuti atau izin.</td></tr>`;
      renderPagination(0, renderLeaveManagement);
      return;
    }

    tbody.innerHTML = pageData
      .map((leave) => {
        const emp = Utils.getEmpById(leave.employeeId);
        if (!emp) return "";
        const initials = Utils.getInitials(emp.nama);

        let statusBadge, actions;
        if (leave.status === "Pending") {
          statusBadge =
            '<span style="background:rgba(255,207,92,0.12);color:#FFCF5C;border:1px solid rgba(255,207,92,0.3);padding:4px 12px;border-radius:9999px;font-size:11px;display:inline-flex;align-items:center;gap:4px;"><i class="fa-regular fa-clock"></i> Pending</span>';
          if (isPegawai) {
            actions = `<button class="btn-cancel-my-leave" data-id="${leave.id}" style="padding:5px 12px;border-radius:8px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#FFB4AB;font-size:11px;cursor:pointer;"><i class="fa-solid fa-trash-can" style="margin-right:4px;"></i>Batalkan</button>`;
          } else {
            actions = `
                    <button onclick="handleLeaveAction('${leave.id}','Approved');initPresensi();" style="padding:4px 12px;border-radius:8px;background:rgba(78,222,163,0.12);border:1px solid rgba(78,222,163,0.3);color:#4EDEA3;font-size:11px;cursor:pointer;"><i class="fa-solid fa-check"></i> Setujui</button>
                    <button onclick="handleLeaveAction('${leave.id}','Rejected');initPresensi();" style="padding:4px 12px;border-radius:8px;background:rgba(255,180,171,0.12);border:1px solid rgba(255,180,171,0.3);color:#FFB4AB;font-size:11px;cursor:pointer;"><i class="fa-solid fa-xmark"></i> Tolak</button>`;
          }
        } else if (leave.status === "Approved") {
          statusBadge =
            '<span style="background:rgba(78,222,163,0.12);color:#4EDEA3;border:1px solid rgba(78,222,163,0.3);padding:4px 12px;border-radius:9999px;font-size:11px;">✓ Disetujui</span>';
          actions = `<button onclick="showEmployeeDetail('${leave.employeeId}')" style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#BCC9CD;cursor:pointer;"><i class="fa-solid fa-eye" style="font-size:11px;"></i></button>`;
        } else {
          statusBadge =
            '<span style="background:rgba(255,180,171,0.12);color:#FFB4AB;border:1px solid rgba(255,180,171,0.3);padding:4px 12px;border-radius:9999px;font-size:11px;">✕ Ditolak</span>';
          actions = `<button onclick="showEmployeeDetail('${leave.employeeId}')" style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#BCC9CD;cursor:pointer;"><i class="fa-solid fa-eye" style="font-size:11px;"></i></button>`;
        }

        return `<tr>
                <td><div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:#0B1326;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#DAE2FD;">${initials}</div>
                    <div><div style="font-weight:600;font-size:13px;color:#DAE2FD;">${
                      emp.nama
                    }</div><div style="color:#BCC9CD;font-size:11px;">${
                      emp.nip
                    } • ${Utils.getDeptShort(emp.departmentId)}</div></div>
                </div></td>
                <td>${Utils.formatDate(leave.startDate)} - ${Utils.formatDate(
                  leave.endDate,
                )}</td>
                <td>${leave.duration} Hari</td>
                <td style="color:#4CD7F6;font-weight:500;">${leave.type}</td>
                <td style="color:#BCC9CD;font-size:12px;">${leave.reason || "-"}</td>
                <td>${statusBadge}</td>
                <td><div style="display:flex;gap:6px;justify-content:flex-end;">${actions}</div></td>
            </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".btn-cancel-my-leave").forEach((btn) => {
      btn.onclick = async () => {
        const ok = await Utils.confirm("Apakah Anda yakin ingin membatalkan pengajuan cuti ini?");
        if (ok) {
          HRMSDatabase.remove("leave_requests", btn.dataset.id);
          Utils.showToast("Pengajuan cuti berhasil dibatalkan.", "info");
          initPresensi();
        }
      };
    });

    renderPagination(orderedLeaves.length, renderLeaveManagement);
  }

  function renderScheduleTab() {
    const thead = document.querySelector("table thead");
    if (thead) {
      thead.innerHTML = `<tr>
        <th>HARI KERJA</th>
        <th>JAM SHIFT</th>
        <th>JAM ISTIRAHAT</th>
        <th>MODEL PENEMPATAN</th>
        <th>LOKASI / GEDUNG</th>
        <th>STATUS JADWAL</th>
      </tr>`;
    }
    const thTitle = document.querySelector(".th-title-row h2");
    if (thTitle) thTitle.textContent = isPegawai ? "Jadwal Shift & WFH Mingguan Saya" : "Jadwal Shift Reguler & Hybrid Perusahaan";
    const thSubtitle = document.querySelector(".th-subtitle");
    if (thSubtitle) thSubtitle.textContent = "Menampilkan jadwal jam kerja operasional Senin s/d Jumat";

    const myEmp = Utils.getEmpById(myId) || { workModel: "Hybrid Flex" };
    const wm = myEmp.workModel || "Hybrid Flex";
    const days = [
      { day: "Senin", shift: "08:00 - 17:00 WIB", rest: "12:00 - 13:00 WIB", mode: wm.includes("Remote") ? "Full Remote (WFH)" : "WFO (On-Site)", loc: wm.includes("Remote") ? "Remote / Rumah" : "Menara Sudirman Lt. 28" },
      { day: "Selasa", shift: "08:00 - 17:00 WIB", rest: "12:00 - 13:00 WIB", mode: wm.includes("Remote") ? "Full Remote (WFH)" : "WFO (On-Site)", loc: wm.includes("Remote") ? "Remote / Rumah" : "Menara Sudirman Lt. 28" },
      { day: "Rabu", shift: "08:00 - 17:00 WIB", rest: "12:00 - 13:00 WIB", mode: wm.includes("Hybrid") ? "WFH (Hybrid Day)" : wm, loc: wm.includes("Hybrid") || wm.includes("Remote") ? "Remote / Rumah" : "Menara Sudirman Lt. 28" },
      { day: "Kamis", shift: "08:00 - 17:00 WIB", rest: "12:00 - 13:00 WIB", mode: wm.includes("Remote") ? "Full Remote (WFH)" : "WFO (On-Site)", loc: wm.includes("Remote") ? "Remote / Rumah" : "Menara Sudirman Lt. 28" },
      { day: "Jumat", shift: "08:00 - 17:00 WIB", rest: "11:30 - 13:00 WIB", mode: wm.includes("Hybrid") ? "WFH (Hybrid Day)" : wm, loc: wm.includes("Hybrid") || wm.includes("Remote") ? "Remote / Rumah" : "Menara Sudirman Lt. 28" },
    ];

    const tbody = document.querySelector("table tbody");
    if (!tbody) return;
    tbody.innerHTML = days
      .map(
        (d) => `<tr>
          <td style="font-weight:700;color:#DAE2FD;">${d.day}</td>
          <td style="font-family:monospace;color:#4CD7F6;font-weight:600;">${d.shift}</td>
          <td style="color:#BCC9CD;">${d.rest}</td>
          <td><span style="padding:4px 12px;border-radius:99px;font-size:11px;background:${d.mode.includes("WFH") || d.mode.includes("Remote") ? "rgba(208,188,255,0.12)" : "rgba(6,182,212,0.12)"};color:${d.mode.includes("WFH") || d.mode.includes("Remote") ? "#D0BCFF" : "#4CD7F6"};border:1px solid rgba(255,255,255,0.12);">${d.mode}</span></td>
          <td style="color:#DAE2FD;">${d.loc}</td>
          <td><span style="padding:4px 12px;border-radius:99px;font-size:11px;background:rgba(78,222,163,0.12);color:#4EDEA3;border:1px solid rgba(78,222,163,0.3);">✓ Jadwal Aktif</span></td>
        </tr>`
      )
      .join("");
    renderPagination(days.length, renderScheduleTab);
  }

  document.querySelectorAll("button").forEach((btn) => {
    if (
      btn.textContent.includes("Catat") &&
      btn.textContent.includes("Manual")
    ) {
      btn.onclick = () => showManualAttendanceModal();
    }
  });

  renderPresensiTable();
}

// ─── Leave Request Modal (For Pegawai & Admin) ─────────────
function showLeaveRequestModal(onSuccess) {
  const activeUser = JSON.parse(localStorage.getItem("hrms_active_user") || "{}");
  const myId = activeUser.id || "EMP-001";
  const myEmp = Utils.getEmpById(myId) || { nama: activeUser.name || "Pegawai", nip: "EMP-0012" };
  const todayStr = new Date().toISOString().split("T")[0];

  const overlay = document.createElement("div");
  overlay.className = "hrms-modal-overlay";
  overlay.innerHTML = `
    <div class="hrms-modal" style="max-width:480px;">
      <div class="hrms-modal-header">
        <h3><i class="fa-solid fa-plane-departure" style="color:#4CD7F6;margin-right:8px;"></i>Form Pengajuan Cuti & Izin</h3>
        <button class="hrms-btn-close" onclick="this.closest('.hrms-modal-overlay').remove()">&times;</button>
      </div>
      <div class="hrms-modal-body">
        <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(76,215,246,0.2);border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:#DAE2FD;">
          Pemohon: <strong>${myEmp.nama}</strong> (${myEmp.nip})
        </div>
        <div class="hrms-form-group">
          <label>Jenis Cuti / Izin *</label>
          <select id="leave-type">
            <option value="Cuti Tahunan">Cuti Tahunan</option>
            <option value="Cuti Sakit">Cuti Sakit (Lampirkan Surat Dokter)</option>
            <option value="Izin Urusan Keluarga">Izin Urusan Keluarga</option>
            <option value="Cuti Pribadi">Cuti Pribadi / Penting</option>
            <option value="Cuti Melahirkan / Menikah">Cuti Khusus (Menikah / Kelahiran)</option>
          </select>
        </div>
        <div class="hrms-form-row">
          <div class="hrms-form-group">
            <label>Tanggal Mulai *</label>
            <input type="date" id="leave-start" value="${todayStr}">
          </div>
          <div class="hrms-form-group">
            <label>Tanggal Selesai *</label>
            <input type="date" id="leave-end" value="${todayStr}">
          </div>
        </div>
        <div class="hrms-form-group">
          <label>Total Durasi Hari Kerja</label>
          <input type="number" id="leave-duration" value="1" min="1" max="30" readonly style="background:#11131c;color:#4CD7F6;font-weight:700;">
        </div>
        <div class="hrms-form-group">
          <label>Alasan / Keterangan Lengkap *</label>
          <textarea id="leave-reason" rows="3" placeholder="Tuliskan alasan pengajuan cuti atau izin secara jelas..."></textarea>
        </div>
      </div>
      <div class="hrms-modal-footer">
        <button class="hrms-btn hrms-btn-secondary" onclick="this.closest('.hrms-modal-overlay').remove()">Batal</button>
        <button class="hrms-btn hrms-btn-primary" id="leave-submit-btn"><i class="fa-solid fa-paper-plane" style="margin-right:6px;"></i>Kirim Pengajuan</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  const startEl = overlay.querySelector("#leave-start");
  const endEl = overlay.querySelector("#leave-end");
  const durEl = overlay.querySelector("#leave-duration");

  const calcDur = () => {
    const s = new Date(startEl.value);
    const e = new Date(endEl.value);
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      const diff = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
      durEl.value = diff;
    } else {
      durEl.value = 1;
    }
  };
  startEl.onchange = calcDur;
  endEl.onchange = calcDur;

  overlay.querySelector("#leave-submit-btn").onclick = () => {
    const reason = overlay.querySelector("#leave-reason").value.trim();
    if (!reason) {
      Utils.showToast("Harap isi alasan / keterangan pengajuan cuti!", "error");
      return;
    }
    const record = {
      id: "LVE-" + Date.now().toString().slice(-5),
      employeeId: myEmp.id || myId || "EMP-001",
      employeeName: myEmp.nama || activeUser.name || "Budi Santoso, S.Kom",
      nip: myEmp.nip || "EMP-0012",
      departmentId: myEmp.departmentId || "dept-it",
      startDate: startEl.value,
      endDate: endEl.value,
      duration: parseInt(durEl.value) || 1,
      type: overlay.querySelector("#leave-type").value,
      reason,
      status: "Pending",
    };
    HRMSDatabase.insert("leave_requests", record);
    overlay.remove();
    Utils.showToast("Pengajuan cuti berhasil dikirim ke HRD! ✈️", "success");
    if (onSuccess) onSuccess();
  };
}

// ─── Digital Payslip Modal (Slip Gaji Resmi) ───────────────
function showPayslipModal(empIdOrPayrollId, periodeOverride) {
  const payrolls = HRMSDatabase.getAll("payroll");
  let pay = payrolls.find((p) => p.id === empIdOrPayrollId || p.employeeId === empIdOrPayrollId);
  const emp = Utils.getEmpById(pay ? pay.employeeId : empIdOrPayrollId) || Utils.getEmpById("EMP-001");
  if (!emp) return;

  if (!pay) {
    const gp = Number(emp.gaji) || 15000000;
    const tj = Number(emp.tunjangan) || 2500000;
    const pt = Math.round((gp + tj) * 0.05);
    pay = {
      id: "PAY-AUTO",
      employeeId: emp.id,
      periode: periodeOverride || "Oktober 2026",
      gajiPokok: gp,
      tunjangan: tj,
      tunjanganDetail: "Tunj. Jabatan + Transport + Makan",
      totalPotongan: pt,
      gajiBersih: gp + tj - pt,
      paymentMethod: "Mandiri Payroll •• 4412",
      status: "Terkalkulasi",
    };
  }

  const periode = periodeOverride || pay.periode || "Oktober 2026";
  const settings = HRMSDatabase.getAllSettings();
  const companyName = settings.companyName || "PT Sawit Abadi Tbk";
  const pph21 = Math.round(pay.totalPotongan * 0.6);
  const bpjs = pay.totalPotongan - pph21;

  const overlay = document.createElement("div");
  overlay.className = "hrms-modal-overlay";
  overlay.innerHTML = `
    <div class="hrms-modal" style="max-width:580px;">
      <div class="hrms-modal-header">
        <h3><i class="fa-solid fa-file-invoice-dollar" style="color:#4CD7F6;margin-right:8px;"></i>Slip Gaji Elektronik (e-Payslip)</h3>
        <button class="hrms-btn-close" onclick="this.closest('.hrms-modal-overlay').remove()">&times;</button>
      </div>
      <div class="hrms-modal-body" id="printable-payslip">
        <div style="border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:16px;font-weight:800;color:#4CD7F6;">${companyName}</div>
            <div style="font-size:11px;color:#869397;margin-top:2px;">Dokumen Rahasia & Resmi • Periode Gaji: <strong style="color:#DAE2FD;">${periode}</strong></div>
          </div>
          <span style="padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;background:rgba(78,222,163,0.15);color:#4EDEA3;border:1px solid rgba(78,222,163,0.3);">LUNAS / TERKALKULASI</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#1b1e2a;padding:14px;border-radius:12px;margin-bottom:18px;font-size:12px;">
          <div><span style="color:#869397;">Nama Karyawan:</span><br><strong style="color:#DAE2FD;font-size:13px;">${emp.nama}</strong></div>
          <div><span style="color:#869397;">NIP / ID Staf:</span><br><strong style="color:#4CD7F6;">${emp.nip}</strong></div>
          <div><span style="color:#869397;">Jabatan & Divisi:</span><br><strong style="color:#DAE2FD;">${emp.jabatan} (${Utils.getDeptShort(emp.departmentId)})</strong></div>
          <div><span style="color:#869397;">Metode Pembayaran:</span><br><strong style="color:#DAE2FD;">${pay.paymentMethod}</strong></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;">
          <div style="background:rgba(78,222,163,0.05);border:1px solid rgba(78,222,163,0.2);border-radius:12px;padding:14px;">
            <div style="font-size:11px;font-weight:700;color:#4EDEA3;margin-bottom:10px;letter-spacing:0.5px;">I. RINCIAN PENERIMAAN</div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;color:#BCC9CD;">
              <span>Gaji Pokok</span>
              <strong style="color:#DAE2FD;">${Utils.formatRupiah(pay.gajiPokok)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;color:#BCC9CD;">
              <span>${pay.tunjanganDetail || "Tunjangan Tetap"}</span>
              <strong style="color:#4EDEA3;">+${Utils.formatRupiah(pay.tunjangan)}</strong>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:8px;display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#DAE2FD;">
              <span>Total Bruto</span>
              <span>${Utils.formatRupiah(pay.gajiPokok + pay.tunjangan)}</span>
            </div>
          </div>

          <div style="background:rgba(255,180,171,0.05);border:1px solid rgba(255,180,171,0.2);border-radius:12px;padding:14px;">
            <div style="font-size:11px;font-weight:700;color:#FFB4AB;margin-bottom:10px;letter-spacing:0.5px;">II. RINCIAN POTONGAN</div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;color:#BCC9CD;">
              <span>Pajak PPh 21</span>
              <strong style="color:#FFB4AB;">-${Utils.formatRupiah(pph21)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;color:#BCC9CD;">
              <span>Iuran BPJS Kes & TK</span>
              <strong style="color:#FFB4AB;">-${Utils.formatRupiah(bpjs)}</strong>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:8px;display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#FFB4AB;">
              <span>Total Potongan</span>
              <span>-${Utils.formatRupiah(pay.totalPotongan)}</span>
            </div>
          </div>
        </div>

        <div style="background:linear-gradient(135deg,rgba(6,182,212,0.18),rgba(59,130,246,0.12));border:1px solid rgba(76,215,246,0.4);border-radius:14px;padding:18px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:11px;font-weight:700;color:#4CD7F6;letter-spacing:0.5px;">GAJI BERSIH DITERIMA (TAKE HOME PAY)</div>
            <div style="font-size:11px;color:#BCC9CD;margin-top:2px;">Ditransfer ke ${pay.paymentMethod}</div>
          </div>
          <div style="font-size:24px;font-weight:800;color:#ffffff;">${Utils.formatRupiah(pay.gajiBersih)}</div>
        </div>
      </div>
      <div class="hrms-modal-footer">
        <button class="hrms-btn hrms-btn-secondary" onclick="this.closest('.hrms-modal-overlay').remove()">Tutup</button>
        <button class="hrms-btn hrms-btn-primary" onclick="window.print()"><i class="fa-solid fa-print" style="margin-right:6px;"></i>Cetak / Download PDF</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}
window.showPayslipModal = showPayslipModal;
window.showLeaveRequestModal = showLeaveRequestModal;

function showManualAttendanceModal() {
  const employees = HRMSDatabase.getAll("employees");
  const overlay = document.createElement("div");
  overlay.className = "hrms-modal-overlay";
  overlay.innerHTML = `
        <div class="hrms-modal" style="max-width:440px;">
            <div class="hrms-modal-header">
                <h3><i class="fa-solid fa-clock" style="color:#4CD7F6;margin-right:8px;"></i>Catat Presensi Manual</h3>
                <button class="hrms-btn-close" onclick="this.closest('.hrms-modal-overlay').remove()">&times;</button>
            </div>
            <div class="hrms-modal-body">
                <div class="hrms-form-group">
                    <label>Pilih Karyawan *</label>
                    <select id="att-employee">
                        ${employees
                          .map(
                            (e) =>
                              `<option value="${e.id}">${e.nama} (${e.nip})</option>`,
                          )
                          .join("")}
                    </select>
                </div>
                <div class="hrms-form-row">
                    <div class="hrms-form-group">
                        <label>Tanggal</label>
                        <input type="date" id="att-date" value="${new Date().toISOString().split("T")[0]}">
                    </div>
                    <div class="hrms-form-group">
                        <label>Jam Masuk</label>
                        <input type="time" id="att-clockin" value="08:00">
                    </div>
                </div>
                <div class="hrms-form-group">
                    <label>Status</label>
                    <select id="att-status">
                        <option value="Tepat Waktu">Tepat Waktu</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="WFH / Remote">WFH / Remote</option>
                        <option value="Dinas Luar Kota">Dinas Luar Kota</option>
                    </select>
                </div>
                <div class="hrms-form-group">
                    <label>Lokasi</label>
                    <input type="text" id="att-location" value="WFO Sudirman (Gate A)" placeholder="Lokasi presensi">
                </div>
            </div>
            <div class="hrms-modal-footer">
                <button class="hrms-btn hrms-btn-secondary" onclick="this.closest('.hrms-modal-overlay').remove()">Batal</button>
                <button class="hrms-btn hrms-btn-primary" id="att-save">Simpan Presensi</button>
            </div>
        </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  overlay.querySelector("#att-save").onclick = () => {
    const data = {
      employeeId: overlay.querySelector("#att-employee").value,
      date: overlay.querySelector("#att-date").value,
      clockIn: overlay.querySelector("#att-clockin").value,
      clockOut: null,
      scheduledIn: "08:00",
      status: overlay.querySelector("#att-status").value,
      location: overlay.querySelector("#att-location").value,
      lateMinutes: 0,
    };
    HRMSDatabase.insert("attendance", data);
    overlay.remove();
    Utils.showToast("Presensi manual berhasil dicatat!", "success");
    initPresensi();
  };
}

// ════════════════════════════════════════════════════════════
// ▌ PENGGAJIAN (Payroll) PAGE
// ════════════════════════════════════════════════════════════
function initPenggajian() {
  initGlobalHooks();
  const role = window.currentUserRole;
  const myId = window.currentUserId;
  const isPegawai = role === "pegawai";
  let payroll = HRMSDatabase.getAll("payroll");

  if (isPegawai) {
    payroll = payroll.filter((p) => p.employeeId === myId);
    const myEmp = Utils.getEmpById(myId) || Utils.getEmpById("EMP-001");
    if (payroll.length === 1 && myEmp) {
      // Buat riwayat 3 bulan terakhir agar pegawai dapat melihat arsip slip gaji bulanan
      const base = payroll[0];
      payroll = [
        base,
        { ...base, id: base.id + "-SEP", periode: "September 2026", status: "Terkalkulasi" },
        { ...base, id: base.id + "-AGU", periode: "Agustus 2026", status: "Terkalkulasi" },
      ];
    }
  }

  let filterPayrollStatus = "all";
  let filterDept = "all";
  let filterPeriode = "all";
  let searchPayroll = "";
  let payrollPage = 1;
  const PER_PAGE = 6;

  // Untuk Pegawai, tampilkan metrik dari bulan terbaru (index 0)
  const metricSource = isPegawai && payroll.length > 0 ? [payroll[0]] : payroll;
  const totalPokok = metricSource.reduce((s, p) => s + (p.gajiPokok || 0), 0);
  const totalTunjangan = metricSource.reduce((s, p) => s + (p.tunjangan || 0), 0);
  const totalPotongan = metricSource.reduce((s, p) => s + (p.totalPotongan || 0), 0);
  const totalBersih = metricSource.reduce((s, p) => s + (p.gajiBersih || 0), 0);
  const selesaiCount = payroll.filter((p) => p.status === "Terkalkulasi").length;
  const pendingCount = payroll.filter((p) => p.status !== "Terkalkulasi").length;
  const pctSelesai = payroll.length > 0 ? Math.round((selesaiCount / payroll.length) * 100) : 0;

  if (isPegawai) {
    const bc = document.querySelector(".breadcrumb");
    if (bc) bc.innerHTML = `Portal Mandiri Karyawan (ESS) <i class="fa-solid fa-chevron-right" style="font-size: 8px"></i> <span class="active">Slip Gaji Saya</span>`;
    const pt = document.querySelector(".page-title");
    if (pt) pt.textContent = "Slip Gaji & Kompensasi Saya";
    const ps = document.querySelector(".page-subtitle");
    if (ps) ps.textContent = "Rincian penerimaan gaji pokok, tunjangan, potongan pajak PPh21/BPJS, dan arsip e-Payslip bulanan Anda.";
    const heroTitle = document.querySelector(".card-hero .card-title");
    if (heroTitle) heroTitle.textContent = "GAJI BERSIH SAYA (TAKE HOME PAY)";
    const heroSub = document.querySelector(".card-hero .card-sub");
    if (heroSub) heroSub.textContent = `Periode Oktober 2026 • ${payroll[0]?.paymentMethod || "Mandiri Payroll"}`;
    const warnBadge = document.querySelector(".warn-badge");
    if (warnBadge) warnBadge.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#4EDEA3;"></i> Slip Gaji Terverifikasi Sistem HRD`;

    const firstTh = document.querySelector("table thead th:nth-child(2)");
    if (firstTh) firstTh.textContent = "Periode & Karyawan";
    const firstTabBtn = document.querySelector(".table-tabs .tab-btn:first-child");
    if (firstTabBtn) {
      firstTabBtn.innerHTML = `Semua Periode <span class="tab-count">${payroll.length}</span>`;
    }

    // Customize right controls for Pegawai
    const rightCtrl = document.querySelector(".right-controls");
    if (rightCtrl) {
      rightCtrl.innerHTML = `
        <button class="btn-primary" id="btn-cetak-slip-utama">
          <i class="fa-solid fa-print" style="color: #003640"></i> Lihat & Cetak Slip Gaji
        </button>
      `;
      rightCtrl.querySelector("#btn-cetak-slip-utama").onclick = () => showPayslipModal(myId, "Oktober 2026");
    }

    // Hide Admin-only dept filter & search bar
    document.querySelectorAll(".left-filters .filter-dropdown, .left-filters .search-box").forEach((el) => {
      if (el.textContent.includes("Dept") || el.classList.contains("search-box")) {
        el.style.display = "none";
      }
    });
  }

  // Update Hero Card & Breakdown
  const heroVal = document.querySelector(".card-value-lg");
  if (heroVal) heroVal.textContent = Utils.formatRupiah(totalBersih);
  const brVals = document.querySelectorAll(".breakdown-badges .br-val");
  if (brVals.length >= 3) {
    brVals[0].textContent = Utils.formatRupiah(totalPokok);
    brVals[1].textContent = "+" + Utils.formatRupiah(totalTunjangan);
    brVals[2].textContent = "-" + Utils.formatRupiah(totalPotongan);
  }
  const progTitle = document.querySelector(".progress-box .progress-title");
  if (progTitle) progTitle.textContent = pctSelesai + "%";
  const progPct = document.querySelector(".progress-box .progress-pct");
  if (progPct) progPct.textContent = `${selesaiCount} / ${payroll.length}`;
  const progFill = document.querySelector(".progress-box .progress-fill");
  if (progFill) progFill.style.width = pctSelesai + "%";
  const cardValMd = document.querySelector(".card-value-md");
  if (cardValMd) cardValMd.textContent = Utils.formatRupiah(totalPotongan);

  // Sembunyikan kontrol duplikat yang tidak perlu agar tampilan lebih rapi
  const dupToggle = document.querySelector(".left-filters .status-toggle");
  if (dupToggle) dupToggle.style.display = "none";
  const deadTabActions = document.querySelector(".table-tabs-bar .tab-actions");
  if (deadTabActions) deadTabActions.style.display = "none";
  const warnText = document.querySelector(".metric-card .warn-badge");
  if (warnText && !isPegawai) {
    warnText.innerHTML = pendingCount > 0
      ? `<i class="fa-solid fa-triangle-exclamation"></i> ${pendingCount} Karyawan Butuh Verifikasi Payroll`
      : `<i class="fa-solid fa-circle-check" style="color:#4EDEA3;"></i> Seluruh Payroll Telah Terkalkulasi`;
  }
  const doneSpan = document.querySelector(".warn-badge-bot span:last-child");
  if (doneSpan) doneSpan.textContent = selesaiCount;

  // Update Tab Counts
  const tabCounts = document.querySelectorAll(".table-tabs .tab-count");
  if (tabCounts.length >= 4) {
    tabCounts[0].textContent = payroll.length;
    tabCounts[1].textContent = pendingCount;
    tabCounts[2].textContent = 0;
    tabCounts[3].textContent = selesaiCount;
  }

  function getFilteredPayroll() {
    return payroll.filter((p) => {
      const emp = Utils.getEmpById(p.employeeId);
      if (!emp) return false;
      if (filterPayrollStatus !== "all" && p.status !== filterPayrollStatus)
        return false;
      if (filterDept !== "all" && emp.departmentId !== filterDept)
        return false;
      if (filterPeriode !== "all" && p.periode !== filterPeriode)
        return false;
      if (searchPayroll) {
        const q = searchPayroll.toLowerCase();
        return (
          emp.nama.toLowerCase().includes(q) ||
          emp.nip.toLowerCase().includes(q) ||
          (p.periode && p.periode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }

  function renderPayrollTable() {
    const filtered = getFilteredPayroll();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (payrollPage > totalPages) payrollPage = 1;
    const start = (payrollPage - 1) * PER_PAGE;
    const pageData = filtered.slice(start, start + PER_PAGE);
    const startIdx = filtered.length > 0 ? start + 1 : 0;
    const endIdx = Math.min(start + PER_PAGE, filtered.length);

    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    tbody.innerHTML = pageData
      .map((p) => {
        const emp = Utils.getEmpById(p.employeeId);
        if (!emp) return "";
        const initials = Utils.getInitials(emp.nama);

        const statusStyle =
          p.status === "Terkalkulasi"
            ? "background:rgba(78,222,163,0.12);color:#4EDEA3;border:1px solid rgba(78,222,163,0.3);"
            : "background:rgba(255,207,92,0.12);color:#FFCF5C;border:1px solid rgba(255,207,92,0.3);";

        return `<tr>
                <td style="padding-left:20px;text-align:center;"><input type="checkbox" style="accent-color:#4CD7F6;"></td>
                <td><div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:#0B1326;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#DAE2FD;">${initials}</div>
                    <div><div style="font-weight:600;font-size:13px;">${
                      isPegawai ? p.periode + " — " + emp.nama : emp.nama
                    } <span style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:10px;color:#BCC9CD;margin-left:4px;">${
                      emp.nip
                    }</span></div><div style="color:#BCC9CD;font-size:11px;">${
                      emp.jabatan
                    } • ${emp.kontrak}</div></div>
                </div></td>
                <td style="font-weight:600;">${Utils.formatRupiah(
                  p.gajiPokok,
                )}</td>
                <td style="color:#4EDEA3;text-align:right;">+${Utils.formatRupiah(
                  p.tunjangan,
                )}<br><span style="font-size:10px;color:#BCC9CD;">${
                  p.tunjanganDetail
                }</span></td>
                <td style="color:#FFB4AB;text-align:right;">-${Utils.formatRupiah(
                  p.totalPotongan,
                )}<br><span style="font-size:10px;color:#BCC9CD;">BPJS + PPh21</span></td>
                <td style="font-weight:700;color:#4CD7F6;text-align:right;font-size:14px;">${Utils.formatRupiah(
                  p.gajiBersih,
                )}<br><span style="font-size:10px;color:#BCC9CD;font-weight:400;">${
                  p.paymentMethod
                }</span></td>
                <td style="text-align:center;"><span style="${statusStyle}padding:4px 10px;border-radius:9999px;font-size:10px;display:inline-block;">${
                  p.status
                }</span></td>
                <td style="text-align:center;"><button onclick="showPayslipModal('${emp.id}', '${p.periode || "Oktober 2026"}')" style="padding:5px 12px;border-radius:8px;background:rgba(6,182,212,0.15);border:1px solid rgba(76,215,246,0.35);color:#4CD7F6;font-size:11px;font-weight:600;cursor:pointer;"><i class="fa-solid fa-file-invoice-dollar" style="margin-right:4px;"></i>Slip Gaji</button></td>
            </tr>`;
      })
      .join("");

    const footerInfo = document.querySelector(".table-footer .pagination-info");
    if (footerInfo) {
      footerInfo.textContent = isPegawai
        ? `Menampilkan ${startIdx} - ${endIdx} dari ${filtered.length} Periode Slip Gaji`
        : `Menampilkan ${startIdx} - ${endIdx} dari ${filtered.length} Karyawan`;
    }

    const paginationCtrl = document.querySelector(".table-footer .pagination-controls");
    if (paginationCtrl) {
      let html = `<button class="page-btn" ${payrollPage <= 1 ? "disabled" : ""} data-page="${payrollPage - 1}"><i class="fa-solid fa-chevron-left"></i></button>`;
      for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === payrollPage ? "active" : ""}" data-page="${i}">${i}</button>`;
      }
      html += `<button class="page-btn" ${payrollPage >= totalPages ? "disabled" : ""} data-page="${payrollPage + 1}"><i class="fa-solid fa-chevron-right"></i></button>`;
      paginationCtrl.innerHTML = html;
      paginationCtrl.querySelectorAll(".page-btn[data-page]").forEach((btn) => {
        btn.onclick = () => {
          const p = parseInt(btn.dataset.page);
          if (p >= 1 && p <= totalPages && p !== payrollPage) {
            payrollPage = p;
            renderPayrollTable();
          }
        };
      });
    }
  }

  document.querySelectorAll('input[type="text"]').forEach((input) => {
    if (
      input.placeholder &&
      (input.placeholder.includes("karyawan") ||
        input.placeholder.includes("NIP"))
    ) {
      input.addEventListener(
        "input",
        Utils.debounce((e) => {
          searchPayroll = e.target.value;
          payrollPage = 1;
          renderPayrollTable();
        }),
      );
    }
  });

  // Period & Department filter dropdowns on payroll page
  document.querySelectorAll(".filter-toolbar .filter-dropdown").forEach((btn) => {
    if (btn.textContent.includes("Dept")) {
      btn.onclick = function () {
        showFilterDropdown(
          this,
          [
            { value: "all", label: "Semua Dept" },
            { value: "dept-it", label: "IT & Eng" },
            { value: "dept-mkt", label: "Marketing" },
            { value: "dept-fin", label: "Finance" },
            { value: "dept-hr", label: "HR" },
          ],
          (val) => {
            filterDept = val;
            payrollPage = 1;
            const label = val === "all" ? "Semua Dept" : Utils.getDeptShort(val);
            this.innerHTML = `<i class="fa-solid fa-building" style="color: #d0bcff"></i> ${label} <i class="fa-solid fa-chevron-down" style="color: #bcc9cd; font-size: 10px"></i>`;
            renderPayrollTable();
          },
        );
      };
    } else if (btn.textContent.includes("2026")) {
      btn.onclick = function () {
        showFilterDropdown(
          this,
          [
            { value: "all", label: "Semua Periode (2026)" },
            { value: "Oktober 2026", label: "Oktober 2026" },
            { value: "September 2026", label: "September 2026" },
            { value: "Agustus 2026", label: "Agustus 2026" },
          ],
          (val) => {
            filterPeriode = val;
            payrollPage = 1;
            const label = val === "all" ? "Semua Periode" : val;
            this.innerHTML = `<i class="fa-regular fa-calendar" style="color: #4cd7f6"></i> ${label} <i class="fa-solid fa-chevron-down" style="color: #bcc9cd; font-size: 10px"></i>`;
            renderPayrollTable();
          },
        );
      };
    }
  });

  document
    .querySelectorAll(
      '.table-tabs .tab-btn, .status-toggle button',
    )
    .forEach((btn) => {
      btn.addEventListener("click", function () {
        this.parentElement?.querySelectorAll("button").forEach((b) => {
          b.classList.remove("active");
          b.style.background = "transparent";
          b.style.color = "#BCC9CD";
        });
        this.classList.add("active");
        this.style.background = "rgba(6,182,212,0.15)";
        this.style.color = "#4CD7F6";

        const text = this.textContent.toLowerCase();
        if (text.includes("semua")) filterPayrollStatus = "all";
        else if (
          text.includes("belum") ||
          text.includes("diproses") ||
          text.includes("penyesuaian") ||
          text.includes("pending") ||
          text.includes("draft")
        )
          filterPayrollStatus = "Perlu Penyesuaian";
        else if (text.includes("selesai") || text.includes("terkalkulasi"))
          filterPayrollStatus = "Terkalkulasi";
        else if (text.includes("transfer"))
          filterPayrollStatus = "Sedang Transfer";
        else if (text.includes("masalah")) filterPayrollStatus = "Bermasalah";
        payrollPage = 1;
        renderPayrollTable();
      });
    });

  document.querySelectorAll("button").forEach((btn) => {
    if (
      !isPegawai &&
      (btn.textContent.includes("Generate") ||
        btn.textContent.includes("Proses"))
    ) {
      btn.addEventListener("click", () => {
        payroll.forEach((p) => {
          if (p.status === "Perlu Penyesuaian") {
            HRMSDatabase.update("payroll", p.id, { status: "Terkalkulasi" });
          }
        });
        Utils.showToast(
          "Payroll bulan ini berhasil di-generate! ✅",
          "success",
        );
        setTimeout(() => location.reload(), 1000);
      });
    }
  });

  renderPayrollTable();
}

// ════════════════════════════════════════════════════════════
// ▌ LAPORAN (Report) PAGE
// ════════════════════════════════════════════════════════════
function initLaporan() {
  initGlobalHooks();
  const employees = HRMSDatabase.getAll("employees");
  const attendance = HRMSDatabase.getAll("attendance");
  let filterLaporanTab = "all";
  let filterDept = "all";
  let searchLaporan = "";
  let laporanPage = 1;
  const PER_PAGE = 6;

  function getEmpAttStats(empId) {
    const empAtt = attendance.filter((a) => a.employeeId === empId);
    const empLeaves = HRMSDatabase.getAll("leave_requests").filter(
      (l) => l.employeeId === empId && l.status === "Approved",
    );
    const hariKerja = 22;
    const sakit = empLeaves
      .filter((l) => l.type.includes("Sakit"))
      .reduce((s, l) => s + (Number(l.duration) || 1), 0);
    const izin = empLeaves
      .filter((l) => !l.type.includes("Sakit"))
      .reduce((s, l) => s + (Number(l.duration) || 1), 0);
    const terlambat = empAtt.filter((a) => a.status === "Terlambat").length;
    const hadir = Math.min(hariKerja, Math.max(empAtt.length, 20 - sakit - izin));
    const alpha = Math.max(0, hariKerja - hadir - sakit - izin);
    const pct = Math.min(100, Math.round((hadir / hariKerja) * 100));
    return { hariKerja, hadir, sakit, izin, alpha, terlambat, pct };
  }

  const allStats = employees.map((e) => ({
    ...e,
    stats: getEmpAttStats(e.id),
  }));
  const avgKehadiran =
    allStats.length > 0
      ? (
          allStats.reduce((s, e) => s + e.stats.pct, 0) / allStats.length
        ).toFixed(1)
      : 0;
  const totalLeavesDays = HRMSDatabase.getAll("leave_requests").reduce(
    (s, l) => s + (Number(l.duration) || 1),
    0,
  );
  const totalLateCount = attendance.filter((a) => a.status === "Terlambat").length;
  const totalAlphaCount = allStats.reduce((s, e) => s + e.stats.alpha, 0);

  const kpiCards = document.querySelectorAll(".kpi-grid .kpi-card");
  if (kpiCards.length >= 4) {
    const v0 = kpiCards[0].querySelector(".kpi-value");
    if (v0) v0.textContent = avgKehadiran + "%";
    const v2 = kpiCards[2].querySelector(".kpi-value");
    if (v2) v2.innerHTML = `${totalLeavesDays} <span style="font-size: 16px; color: var(--text-muted); font-weight: 500">Hari</span>`;
    const v3 = kpiCards[3].querySelector(".kpi-value");
    if (v3) v3.innerHTML = `${totalLateCount + totalAlphaCount} <span style="font-size: 16px; color: var(--text-muted); font-weight: 500">Kasus</span>`;
  }

  // Update tab counts dynamically
  const tabBtns = document.querySelectorAll(".filter-bar .tabs-list .tab-btn");
  if (tabBtns.length >= 4) {
    const sempurnaCount = allStats.filter((e) => e.stats.pct >= 95).length;
    const perhatianCount = allStats.filter((e) => e.stats.terlambat > 0 || e.stats.alpha > 0).length;
    const cutiCount = allStats.filter((e) => e.stats.sakit > 0 || e.stats.izin > 0 || e.status === "Cuti").length;
    tabBtns[0].textContent = `Semua (${allStats.length})`;
    tabBtns[1].textContent = `Kehadiran Sempurna (${sempurnaCount})`;
    tabBtns[2].textContent = `Perlu Perhatian (${perhatianCount})`;
    tabBtns[3].textContent = `Cuti / Sakit (${cutiCount})`;
  }

  function getFilteredEmployees() {
    let filtered = allStats;
    if (filterLaporanTab === "sempurna")
      filtered = allStats.filter((e) => e.stats.pct >= 95);
    else if (filterLaporanTab === "perhatian")
      filtered = allStats.filter((e) => e.stats.terlambat > 0 || e.stats.alpha > 0);
    else if (filterLaporanTab === "cuti")
      filtered = allStats.filter((e) => e.stats.sakit > 0 || e.stats.izin > 0 || e.status === "Cuti");

    if (filterDept !== "all") {
      filtered = filtered.filter((e) => e.departmentId === filterDept);
    }

    if (searchLaporan) {
      const q = searchLaporan.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.nama.toLowerCase().includes(q) || e.nip.toLowerCase().includes(q),
      );
    }
    return filtered;
  }

  function renderLaporanTable() {
    const filtered = getFilteredEmployees();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (laporanPage > totalPages) laporanPage = 1;
    const start = (laporanPage - 1) * PER_PAGE;
    const pageData = filtered.slice(start, start + PER_PAGE);
    const startIdx = filtered.length > 0 ? start + 1 : 0;
    const endIdx = Math.min(start + PER_PAGE, filtered.length);

    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    tbody.innerHTML = pageData
      .map((emp) => {
        const s = emp.stats;
        const initials = Utils.getInitials(emp.nama);
        const deptShort = Utils.getDeptShort(emp.departmentId);
        const pctColor =
          s.pct >= 95 ? "#4EDEA3" : s.pct >= 85 ? "#FFCF5C" : "#FFB4AB";

        return `<tr>
                <td><div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:#0B1326;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#DAE2FD;">${initials}</div>
                    <div>
                        <div style="font-weight:600;font-size:13px;">${emp.nama}</div>
                        <div style="color:#BCC9CD;font-size:11px;">${emp.nip} • ${emp.jabatan}</div>
                    </div>
                </div></td>
                <td><span style="padding:4px 10px;border-radius:8px;font-size:11px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#BCC9CD;">${deptShort}</span></td>
                <td style="text-align:center;">${s.hariKerja}</td>
                <td style="text-align:center;color:#4EDEA3;font-weight:600;">${s.hadir}</td>
                <td style="text-align:center;color:#FFB4AB;">${s.sakit}</td>
                <td style="text-align:center;color:#FFCF5C;">${s.izin}</td>
                <td style="text-align:center;color:#FF6B6B;font-weight:600;">${s.alpha}</td>
                <td style="text-align:right;">
                    <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;">
                        <span style="color:${pctColor};font-weight:700;">${s.pct}%</span>
                        <span style="font-size:11px;color:#BCC9CD;">${s.hadir}/${s.hariKerja} Hari</span>
                    </div>
                    <div style="height:4px;background:rgba(255,255,255,0.08);border-radius:99px;margin-top:6px;overflow:hidden;">
                        <div style="height:100%;width:${s.pct}%;background:${pctColor};border-radius:99px;box-shadow:0 0 6px ${pctColor};"></div>
                    </div>
                </td>
            </tr>`;
      })
      .join("");

    const footerText = document.querySelector(".table-footer .footer-text");
    if (footerText) {
      footerText.innerHTML = `Menampilkan <span style="color:#DAE2FD;font-weight:600;">${startIdx} - ${endIdx}</span> dari <span style="color:#4CD7F6;font-weight:600;">${filtered.length}</span> Karyawan Terdaftar`;
    }

    const pagination = document.querySelector(".table-footer .pagination");
    if (pagination) {
      let html = `<button class="page-btn ${laporanPage <= 1 ? "disabled" : ""}" data-page="${laporanPage - 1}"><i class="fa-solid fa-chevron-left"></i></button>`;
      for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === laporanPage ? "active" : ""}" data-page="${i}">${i}</button>`;
      }
      html += `<button class="page-btn ${laporanPage >= totalPages ? "disabled" : ""}" data-page="${laporanPage + 1}"><i class="fa-solid fa-chevron-right"></i></button>`;
      pagination.innerHTML = html;
      pagination.querySelectorAll(".page-btn[data-page]").forEach((btn) => {
        btn.onclick = () => {
          const p = parseInt(btn.dataset.page);
          if (p >= 1 && p <= totalPages && p !== laporanPage) {
            laporanPage = p;
            renderLaporanTable();
          }
        };
      });
    }
  }

  // Period & Department dropdowns on laporan page
  document.querySelectorAll(".action-controls .btn-dropdown").forEach((btn) => {
    if (btn.textContent.includes("Departemen")) {
      btn.onclick = function () {
        showFilterDropdown(
          this,
          [
            { value: "all", label: "Semua Departemen" },
            { value: "dept-it", label: "IT & Engineering" },
            { value: "dept-mkt", label: "Marketing & Creative" },
            { value: "dept-fin", label: "Finance & Operations" },
            { value: "dept-hr", label: "Human Resources" },
          ],
          (val) => {
            filterDept = val;
            laporanPage = 1;
            const label = val === "all" ? "Semua Departemen" : Utils.getDeptShort(val);
            this.innerHTML = `<i class="fa-solid fa-building" style="color: #d0bcff"></i> ${label} <i class="fa-solid fa-chevron-down caret"></i>`;
            renderLaporanTable();
          },
        );
      };
    } else if (btn.textContent.includes("2026")) {
      btn.onclick = function () {
        showFilterDropdown(
          this,
          [
            { value: "Oktober 2026", label: "Oktober 2026" },
            { value: "September 2026", label: "September 2026" },
            { value: "Agustus 2026", label: "Agustus 2026" },
          ],
          (val) => {
            this.innerHTML = `<i class="fa-regular fa-calendar" style="color: #4cd7f6"></i> ${val} <i class="fa-solid fa-chevron-down caret"></i>`;
            Utils.showToast(`Menampilkan rekapitulasi periode ${val}`, "info");
            renderLaporanTable();
          },
        );
      };
    }
  });

  document
    .querySelectorAll(
      '.filter-bar .tab-btn',
    )
    .forEach((btn) => {
      btn.addEventListener("click", function () {
        this.parentElement?.querySelectorAll("button").forEach((b) => {
          b.classList.remove("active");
          b.style.background = "transparent";
          b.style.color = "#BCC9CD";
          b.style.border = "1px solid transparent";
        });
        this.classList.add("active");
        this.style.background = "rgba(6,182,212,0.15)";
        this.style.color = "#4CD7F6";
        this.style.border = "1px solid rgba(76,215,246,0.3)";

        const text = this.textContent.toLowerCase();
        if (text.includes("semua")) filterLaporanTab = "all";
        else if (text.includes("sempurna") || text.includes("100%"))
          filterLaporanTab = "sempurna";
        else if (text.includes("perhatian") || text.includes("alpha"))
          filterLaporanTab = "perhatian";
        else if (text.includes("cuti") || text.includes("sakit"))
          filterLaporanTab = "cuti";
        laporanPage = 1;
        renderLaporanTable();
      });
    });

  document.querySelectorAll('input[type="text"]').forEach((input) => {
    if (
      input.placeholder &&
      (input.placeholder.includes("nama") ||
        input.placeholder.includes("NIP") ||
        input.placeholder.includes("karyawan"))
    ) {
      input.addEventListener(
        "input",
        Utils.debounce((e) => {
          searchLaporan = e.target.value;
          laporanPage = 1;
          renderLaporanTable();
        }),
      );
    }
  });

  document.querySelectorAll("button").forEach((btn) => {
    if (btn.textContent.includes("PDF") || btn.textContent.includes("Cetak")) {
      btn.addEventListener("click", () => {
        Utils.showToast("Membuka dialog cetak dokumen...", "info");
        setTimeout(() => window.print(), 500);
      });
    } else if (btn.textContent.includes("Excel") || btn.textContent.includes("CSV")) {
      btn.addEventListener("click", () => {
        exportToCSV();
      });
    }
  });

  renderLaporanTable();
}

// ════════════════════════════════════════════════════════════
// ▌ PENGATURAN (Settings) PAGE
// ════════════════════════════════════════════════════════════
function initPengaturan() {
  initGlobalHooks();
  const activeUser = JSON.parse(localStorage.getItem("hrms_active_user") || "{}");
  if (activeUser.role === "pegawai") {
    const myId = activeUser.id || "EMP-001";
    const myEmp = Utils.getEmpById(myId) || Utils.getEmpById("EMP-001");
    const bc = document.querySelector(".breadcrumb");
    if (bc) bc.innerHTML = `Portal Mandiri Karyawan (ESS) <i class="fa-solid fa-chevron-right" style="font-size: 8px"></i> <span class="active">Profil & Akun Saya</span>`;
    const pt = document.querySelector(".page-title");
    if (pt) pt.textContent = "Profil & Identitas Digital Saya";
    const ps = document.querySelector(".page-subtitle");
    if (ps) ps.textContent = "Kelola informasi kontak pribadi, foto profil ID Card, dan preferensi model kerja Anda.";

    const layout = document.querySelector(".settings-layout");
    if (layout && myEmp) {
      layout.innerHTML = `
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:20px;padding:28px;text-align:center;height:fit-content;">
          <div style="width:88px;height:88px;border-radius:22px;background:linear-gradient(135deg,#06B6D4,#3B82F6);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:#fff;overflow:hidden;">
            ${myEmp.photo ? `<img src="${myEmp.photo}" style="width:100%;height:100%;object-fit:cover;">` : Utils.getInitials(myEmp.nama)}
          </div>
          <h3 style="margin:0;color:#DAE2FD;font-size:18px;">${myEmp.nama}</h3>
          <div style="color:#4CD7F6;font-size:12px;font-weight:600;margin-top:4px;">${myEmp.nip} • ${myEmp.jabatan}</div>
          <div style="color:#869397;font-size:12px;margin-top:4px;">${Utils.getDeptName(myEmp.departmentId)}</div>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);text-align:left;font-size:12px;display:flex;flex-direction:column;gap:10px;color:#BCC9CD;">
            <div style="display:flex;justify-content:space-between;"><span>Status Kerja:</span><strong style="color:#4EDEA3;">${myEmp.status} (${myEmp.kontrak})</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>Level Jabatan:</span><strong style="color:#DAE2FD;">Grade Level ${myEmp.level || 3}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>Tgl Bergabung:</span><strong style="color:#DAE2FD;">${Utils.formatDate(myEmp.joinDate)}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>Model Kerja:</span><strong style="color:#D0BCFF;">${myEmp.workModel}</strong></div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:20px;padding:32px;">
          <h3 style="margin:0 0 6px 0;color:#DAE2FD;font-size:18px;">Perbarui Data Pribadi & Kontak</h3>
          <p style="margin:0 0 24px 0;color:#869397;font-size:12px;">Perubahan data akan langsung tersimpan ke database pusat HRD.</p>
          <div class="hrms-form-row">
            <div class="hrms-form-group">
              <label>Nama Lengkap & Gelar</label>
              <input type="text" id="prof-nama" value="${myEmp.nama}">
            </div>
            <div class="hrms-form-group">
              <label>Nomor Induk Pegawai (NIP)</label>
              <input type="text" value="${myEmp.nip}" readonly style="background:#11131c;color:#4CD7F6;">
            </div>
          </div>
          <div class="hrms-form-row">
            <div class="hrms-form-group">
              <label>Email Kantor</label>
              <input type="email" id="prof-email" value="${myEmp.email}">
            </div>
            <div class="hrms-form-group">
              <label>Nomor Telepon / WhatsApp Aktif</label>
              <input type="text" id="prof-phone" value="${myEmp.phone || ""}">
            </div>
          </div>
          <div class="hrms-form-row">
            <div class="hrms-form-group">
              <label>Preferensi Model Kerja</label>
              <select id="prof-workmodel">
                <option value="WFO Jakarta" ${myEmp.workModel === "WFO Jakarta" ? "selected" : ""}>WFO Jakarta</option>
                <option value="Hybrid Flex" ${myEmp.workModel === "Hybrid Flex" ? "selected" : ""}>Hybrid Flex</option>
                <option value="Full Remote" ${myEmp.workModel === "Full Remote" ? "selected" : ""}>Full Remote</option>
              </select>
            </div>
            <div class="hrms-form-group">
              <label>Kata Sandi Baru (Opsional)</label>
              <input type="password" id="prof-pass" placeholder="Kosongkan jika tidak diubah">
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:20px;">
            <button class="hrms-btn hrms-btn-primary" id="btn-save-my-profile"><i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i>Simpan Profil Saya</button>
          </div>
        </div>
      `;

      document.getElementById("btn-save-my-profile").onclick = () => {
        const newNama = document.getElementById("prof-nama").value.trim();
        const newEmail = document.getElementById("prof-email").value.trim();
        const newPhone = document.getElementById("prof-phone").value.trim();
        const newWm = document.getElementById("prof-workmodel").value;
        if (!newNama || !newEmail) {
          Utils.showToast("Nama dan Email tidak boleh kosong!", "error");
          return;
        }
        HRMSDatabase.update("employees", myEmp.id, {
          nama: newNama,
          email: newEmail,
          phone: newPhone,
          workModel: newWm,
        });
        activeUser.name = newNama;
        localStorage.setItem("hrms_active_user", JSON.stringify(activeUser));
        Utils.showToast("Profil Anda berhasil diperbarui! ✅", "success");
        setTimeout(() => location.reload(), 800);
      };
    }
    return;
  }
  const settings = HRMSDatabase.getAllSettings();

  const fieldMap = {
    companyName: ["Nama Lengkap", "Perusahaan Legal", "company-name"],
    companyLegalName: ["Nama Lengkap Perusahaan", "Legal"],
    companyNIB: ["NIB", "NPWP"],
    companyEmail: ["Email Resmi", "Email HRD"],
    companyPhone: ["Telepon", "Call Center"],
    companyWebsite: ["Website"],
    companyAddress: ["Alamat", "Kantor Pusat"],
  };

  document
    .querySelectorAll(
      'input[type="text"], input[type="email"], input[type="url"], input[type="tel"], textarea',
    )
    .forEach((input) => {
      const container = input.closest('[class*="form"], [class*="field"], div');
      const label = container?.querySelector('label, [class*="label"], h4');
      if (!label) return;
      const labelText = label.textContent;

      for (const [key, patterns] of Object.entries(fieldMap)) {
        if (patterns.some((p) => labelText.includes(p)) && settings[key]) {
          input.value = settings[key];
          break;
        }
      }
    });

  const logoPreviewImg = document.querySelector(".logo-preview img");
  if (logoPreviewImg && settings["companyLogo"]) {
    logoPreviewImg.src = settings["companyLogo"];
  }

  const btnGantiLogo = document.querySelector(".logo-upload-box button");
  const btnHapusLogo = document.querySelectorAll(".logo-upload-box button")[1];

  if (btnGantiLogo) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/png, image/jpeg, image/jpg";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    btnGantiLogo.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.click();
    });

    fileInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          Utils.showToast("Maksimal ukuran foto adalah 2MB!", "warning");
          return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
          const base64 = e.target.result;
          if (logoPreviewImg) logoPreviewImg.src = base64;
          HRMSDatabase.setSetting("companyLogo", base64);
          const sidebarLogo = document.querySelector(".sidebar .logo-img");
          if (sidebarLogo) sidebarLogo.src = base64;
          Utils.showToast(
            "Logo perusahaan berhasil diunggah dan tersimpan di database!",
            "success",
          );
        };
        reader.readAsDataURL(file);
      }
    });

    if (btnHapusLogo) {
      btnHapusLogo.addEventListener("click", (e) => {
        e.preventDefault();
        HRMSDatabase.setSetting("companyLogo", "");
        if (logoPreviewImg)
          logoPreviewImg.src =
            "https://ui-avatars.com/api/?name=NS&background=random&color=fff";
        Utils.showToast("Logo perusahaan dihapus.", "info");
      });
    }
  }

  document
    .querySelectorAll('.toggle-switch, input[type="checkbox"]')
    .forEach((toggle, i) => {
      const keys = ["allowESS", "autoEmailSlipGaji", "gpsVerificationWFH"];
      if (keys[i] && settings[keys[i]] !== undefined) {
        if (toggle.tagName === "INPUT" && toggle.type === "checkbox") {
          toggle.checked = settings[keys[i]];
        } else {
          if (settings[keys[i]]) {
            toggle.classList.add("active");
            toggle.style.background = "#4CD7F6";
          }
          toggle.style.cursor = "pointer";
          toggle.addEventListener("click", () => {
            const isActive = toggle.classList.toggle("active");
            toggle.style.background = isActive
              ? "#4CD7F6"
              : "rgba(255,255,255,0.15)";
            HRMSDatabase.setSetting(keys[i], isActive);
          });
        }
      }
    });

  document.querySelectorAll("button").forEach((btn) => {
    if (btn.textContent.includes("Simpan")) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelectorAll(
            'input[type="text"], input[type="email"], input[type="url"], input[type="tel"], textarea',
          )
          .forEach((input) => {
            const container = input.closest(
              '[class*="form"], [class*="field"], div',
            );
            const label = container?.querySelector(
              'label, [class*="label"], h4',
            );
            if (!label) return;
            const labelText = label.textContent;
            for (const [key, patterns] of Object.entries(fieldMap)) {
              if (patterns.some((p) => labelText.includes(p))) {
                HRMSDatabase.setSetting(key, input.value);
                break;
              }
            }
          });

        Utils.showToast("Pengaturan berhasil disimpan! ✅", "success");
      });
    }
  });

  document.querySelectorAll("button").forEach((btn) => {
    if (
      btn.textContent.includes("Batal") ||
      btn.textContent.includes("Pulihkan")
    ) {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const ok = await Utils.confirm(
          "Apakah Anda yakin ingin mengembalikan semua pengaturan ke default?",
        );
        if (ok) {
          localStorage.removeItem("hrms_settings");
          localStorage.removeItem("hrms_seeded");
          HRMSDatabase.seed();
          Utils.showToast(
            "Pengaturan berhasil dikembalikan ke default.",
            "info",
          );
          setTimeout(() => location.reload(), 1000);
        }
      });
    }
  });

  document.querySelectorAll("button").forEach((btn) => {
    if (btn.textContent.includes("Preview")) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showPayslipModal("EMP-001", "Oktober 2026");
      });
    }
  });

  document
    .querySelectorAll(
      '.settings-menu .settings-item, [class*="settings-menu"] [class*="item"], [class*="setting-nav"] a',
    )
    .forEach((item) => {
      item.style.cursor = "pointer";
      item.addEventListener("click", function () {
        document
          .querySelectorAll(
            '.settings-menu .settings-item, [class*="settings-menu"] [class*="item"]',
          )
          .forEach((i) => {
            i.classList.remove("active");
            i.style.background = "transparent";
            i.style.borderColor = "transparent";
          });
        this.classList.add("active");
        this.style.background = "rgba(6,182,212,0.1)";
        this.style.borderColor = "#4CD7F6";
        const label = this.querySelector("h4")?.textContent || this.textContent.trim();
        Utils.showToast(`Membuka konfigurasi: ${label}`, "info");
      });
    });
}

// ─── Global: Make functions accessible from inline HTML ────
window.showEmployeeDetail = showEmployeeDetail;
window.showEmployeeEditModal = showEmployeeEditModal;
window.handleLeaveAction = handleLeaveAction;
window.initPresensi = initPresensi;
window.Utils = Utils;

// --- LOGIN PAGE LOGIC ---
function initLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  document.getElementById("togglePass").onclick = function () {
    const input = document.getElementById("loginPassword");
    const icon = this.querySelector("i");
    if (input.type === "password") {
      input.type = "text";
      icon.className = "fa-regular fa-eye-slash";
    } else {
      input.type = "password";
      icon.className = "fa-regular fa-eye";
    }
  };

  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const email = document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();
    const pass = document.getElementById("loginPassword").value;
    const btn = document.getElementById("btnLogin");

    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Memverifikasi...`;
    btn.style.opacity = "0.8";

    setTimeout(async () => {
      let userObj = null;

      // 1. Coba autentikasi langsung ke Database MySQL (XAMPP API)
      if (typeof HRMSDatabase.authenticate === "function") {
        userObj = await HRMSDatabase.authenticate(email, pass);
      }

      // 2. Fallback apabila XAMPP belum nyala / dibuka langsung via file
      if (!userObj) {
        if ((email === "admin" || email.startsWith("admin@")) && pass === "admin123") {
          userObj = {
            id: "ADMIN-1",
            role: "admin",
            name: "Sarah Wijaya (Admin HRD)",
          };
        } else if ((email === "pegawai" || email.startsWith("pegawai@")) && pass === "pegawai123") {
          userObj = { id: "EMP-001", role: "pegawai", name: "Budi Santoso" };
        } else {
          const emps = HRMSDatabase.getAll("employees");
          const found = emps.find(
            (emp) =>
              emp.nip.toLowerCase() === email ||
              emp.email.toLowerCase() === email,
          );
          if (found && pass === "pegawai123") {
            userObj = { id: found.id, role: "pegawai", name: found.nama };
          }
        }
      }

      if (userObj) {
        localStorage.setItem("hrms_active_user", JSON.stringify(userObj));
        Utils.showToast("Login berhasil! Mengalihkan ke Dashboard...", "success");
        setTimeout(() => {
          window.location.href = "pages/dashboard.html";
        }, 800);
      } else {
        Utils.showToast(
          "Email/NIP atau kata sandi yang Anda masukkan salah.",
          "error",
        );
        btn.innerHTML = `Masuk ke Sistem <i class="fa-solid fa-arrow-right"></i>`;
        btn.style.opacity = "1";
      }
    }, 500);
  };
}

// Ensure logout works
document.addEventListener("click", (e) => {
  const target = e.target.closest(".logout-btn");
  if (target) {
    e.preventDefault();
    localStorage.removeItem("hrms_active_user");
    window.location.href = window.location.pathname.includes("pages/")
      ? "../index.html"
      : "index.html";
  }
});
