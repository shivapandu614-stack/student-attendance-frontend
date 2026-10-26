(async () => {
  const app = window.attendanceApp;
  if (!app) return;
  const page = document.getElementById("pageContent");
  const title = app.role === "ADMIN" ? "Good day, Admin" : app.role === "TEACHER" ? "Your teaching overview" : "Your attendance";
  page.innerHTML = `<div class="page-heading"><div><h1>${title}</h1><p>Here’s a snapshot of attendance activity.</p></div><span class="text-small">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span></div><div id="pageAlert" class="d-none"></div><div id="dashboardContent" class="loading-state">Loading your overview…</div>`;
  const target = document.getElementById("dashboardContent");
  try {
    if (app.role === "ADMIN") {
      const data = await app.api("/api/dashboard");
      const cards = [
        ["Total students", data.totalStudents, "♙"], ["Total teachers", data.totalTeachers, "♧"],
        ["Total classes", data.totalClasses, "▦"], ["Present today", data.presentToday, "✓"],
        ["Absent today", data.absentToday, "×"], ["Attendance today", `${data.attendancePercentage}%`, "%"]
      ];
      target.className = "";
      target.innerHTML = `<div class="row g-3 mb-4">${cards.map(([label, value, icon]) => `<div class="col-6 col-xl-4"><div class="stat-card"><div class="d-flex justify-content-between"><span class="stat-label">${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-number">${escapeHtml(value)}</div><div class="text-small">Today’s system summary</div></div></div>`).join("")}</div>
        <section class="content-card"><div class="d-flex justify-content-between align-items-center mb-3"><h2 class="h6 fw-bold mb-0">Recent attendance activity</h2><a class="small text-decoration-none" href="attendance-history.html">View history</a></div>
        ${data.recentActivity.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Date</th><th>Status</th></tr></thead><tbody>${data.recentActivity.map(row => `<tr><td>${escapeHtml(row.studentName)}</td><td>${escapeHtml(row.className)}</td><td>${escapeHtml(row.subjectName)}</td><td>${escapeHtml(row.date)}</td><td>${statusBadge(row.status)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No attendance has been recorded today.</div>`}</section>`;
    } else {
      const [records, profileOrSubjects] = await Promise.all([
        app.api("/api/attendance"),
        app.role === "STUDENT" ? app.api("/api/students/me") : app.api("/api/subjects")
      ]);
      const total = records.length;
      const attended = records.filter(row => row.status !== "ABSENT").length;
      const percent = total ? Math.round(attended * 10000 / total) / 100 : 0;
      target.className = "";
      const details = app.role === "STUDENT"
        ? `<section class="content-card mt-4"><h2 class="h6 fw-bold mb-3">Profile</h2><div class="row g-3"><div class="col-md-4"><div class="text-small">Student ID</div><strong>${escapeHtml(profileOrSubjects.studentCode)}</strong></div><div class="col-md-4"><div class="text-small">Department</div><strong>${escapeHtml(profileOrSubjects.department)}</strong></div><div class="col-md-4"><div class="text-small">Class</div><strong>${escapeHtml(profileOrSubjects.className || "Not assigned")}</strong></div></div></section>`
        : `<section class="content-card mt-4"><div class="d-flex justify-content-between"><h2 class="h6 fw-bold">Assigned subjects</h2><span class="text-small">${profileOrSubjects.length} total</span></div><div class="row g-3">${profileOrSubjects.map(subject => `<div class="col-md-6"><div class="p-3 rounded-3 border"><strong>${escapeHtml(subject.name)}</strong><div class="text-small mt-1">${escapeHtml(subject.code)} · ${escapeHtml(subject.className)}</div></div></div>`).join("") || `<div class="empty-state">No subjects assigned yet.</div>`}</div></section>`;
      target.innerHTML = `<div class="row g-3">${[
        ["Total classes", total, "▦"], ["Classes attended", attended, "✓"], ["Classes missed", total - attended, "×"], ["Attendance rate", `${percent}%`, "%"]
      ].map(([label, value, icon]) => `<div class="col-6 col-xl-3"><div class="stat-card"><div class="d-flex justify-content-between"><span class="stat-label">${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-number">${value}</div><div class="text-small">${label === "Classes attended" ? "Late counts as attended" : "Across recorded classes"}</div></div></div>`).join("")}</div>${details}
        <section class="content-card mt-4"><div class="d-flex justify-content-between align-items-center mb-3"><h2 class="h6 fw-bold mb-0">Recent attendance</h2><a class="small text-decoration-none" href="attendance-history.html">Full history</a></div>${records.slice(0, 8).length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead><tbody>${records.slice(0, 8).map(row => `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.subjectName)}</td><td>${statusBadge(row.status)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No attendance records yet.</div>`}</section>`;
    }
  } catch (error) {
    target.className = "";
    target.innerHTML = `<div id="dashboardLoadError" class="alert alert-danger">${escapeHtml(error.message)}</div>`;
  }
})();
