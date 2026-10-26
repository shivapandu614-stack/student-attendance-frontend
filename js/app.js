(() => {
  const role = localStorage.getItem("attendanceRole");
  const token = localStorage.getItem("attendanceToken");
  if (!token || !role) {
    location.replace("login.html");
    return;
  }
  window.escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[character]);
  const routes = {
    ADMIN: [
      ["Overview", "admin-dashboard.html", "⌂"], ["Students", "students.html", "♙"],
      ["Teachers", "teachers.html", "♧"], ["Classes & subjects", "classes-subjects.html", "▦"],
      ["Mark attendance", "attendance.html", "✓"], ["Attendance history", "attendance-history.html", "◷"],
      ["Reports", "reports.html", "▤"]
    ],
    TEACHER: [
      ["Overview", "teacher-dashboard.html", "⌂"], ["Mark attendance", "attendance.html", "✓"],
      ["Attendance history", "attendance-history.html", "◷"], ["Reports", "reports.html", "▤"]
    ],
    STUDENT: [["My attendance", "student-dashboard.html", "⌂"], ["Attendance history", "attendance-history.html", "◷"]]
  };
  const current = location.pathname.split("/").pop();
  const selectedLink = (routes[role] || []).find(item => item[1] === current);
  if (!selectedLink) {
    location.replace(role === "ADMIN" ? "admin-dashboard.html" : role === "TEACHER" ? "teacher-dashboard.html" : "student-dashboard.html");
    return;
  }
  const content = document.getElementById("pageContent");
  const shell = document.getElementById("appShell");
  shell.innerHTML = `
    <aside id="sidebar" class="sidebar">
      <a class="sidebar-brand" href="${role === "ADMIN" ? "admin-dashboard.html" : role === "TEACHER" ? "teacher-dashboard.html" : "student-dashboard.html"}"><span class="brand-mark">A</span>Attendly</a>
      <div class="nav-caption">WORKSPACE</div>
      ${(routes[role] || []).map(item => `<a class="side-link ${item[1] === current ? "active" : ""}" href="${item[1]}"><span class="side-icon">${item[2]}</span>${item[0]}</a>`).join("")}
      <div class="sidebar-bottom"><div class="user-chip">${escapeHtml(localStorage.getItem("attendanceUsername") || "")}</div><div class="text-white-50 mt-1">${role.toLowerCase()}</div></div>
    </aside>
    <section class="main-area">
      <header class="topbar"><div class="d-flex align-items-center gap-3"><button id="menuButton" class="btn btn-light mobile-menu" aria-label="Toggle menu">☰</button><span class="fw-semibold">${selectedLink[0]}</span></div>
      <button id="logoutButton" class="btn btn-light btn-sm">Sign out</button></header>
      <main id="pageContent" class="page-content">${content ? content.innerHTML : ""}</main>
    </section>`;
  document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("attendanceToken");
    localStorage.removeItem("attendanceRole");
    localStorage.removeItem("attendanceUsername");
    location.replace("login.html");
  });
  document.getElementById("menuButton").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));

  window.attendanceApp = {
    role,
    async api(path, options = {}) {
      const headers = { "Authorization": `Bearer ${localStorage.getItem("attendanceToken")}`, ...(options.headers || {}) };
      if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
      const response = await fetch(window.attendanceApiUrl(path), { ...options, headers });
      if (response.status === 401) {
        localStorage.clear();
        location.replace("login.html");
        throw new Error("Your session expired. Please sign in again.");
      }
      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try { const data = await response.json(); message = data.error || message; } catch {}
        throw new Error(message);
      }
      if (response.status === 204) return null;
      return response.json();
    },
    showError(error, target = "pageAlert") {
      const box = document.getElementById(target);
      if (!box) return;
      box.textContent = error.message || String(error);
      box.className = "alert alert-danger inline-alert";
      box.classList.remove("d-none");
    },
    showSuccess(message, target = "pageAlert") {
      const box = document.getElementById(target);
      if (!box) return;
      box.textContent = message;
      box.className = "alert alert-success inline-alert";
      box.classList.remove("d-none");
    }
  };
  window.statusBadge = status => `<span class="badge-status status-${String(status).toLowerCase()}">${escapeHtml(status)}</span>`;
})();
