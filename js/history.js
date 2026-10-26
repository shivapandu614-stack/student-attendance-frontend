(async () => {
  const app = window.attendanceApp;
  if (!app) return;
  const page = document.getElementById("pageContent");
  const staff = app.role !== "STUDENT";
  page.innerHTML = `<div class="page-heading"><div><h1>Attendance history</h1><p>Review attendance records and update authorized entries.</p></div></div><div id="pageAlert" class="d-none"></div>
    <section class="content-card"><form id="filterForm" class="row g-3 align-items-end">
      <div class="col-sm-4 col-lg-3"><label class="form-label">From</label><input id="fromDate" class="form-control" type="date"></div>
      <div class="col-sm-4 col-lg-3"><label class="form-label">To</label><input id="toDate" class="form-control" type="date"></div>
      ${staff ? `<div class="col-sm-4 col-lg-2"><label class="form-label">Class</label><select id="classFilter" class="form-select"><option value="">All classes</option></select></div><div class="col-sm-4 col-lg-2"><label class="form-label">Student</label><select id="studentFilter" class="form-select"><option value="">All students</option></select></div>` : ""}
      <div class="col-sm-4 col-lg-2"><label class="form-label">Subject</label><select id="subjectFilter" class="form-select"><option value="">All subjects</option></select></div>
      <div class="col-sm-4 col-lg-2"><button class="btn btn-primary w-100">Apply filters</button></div>
    </form></section><section class="content-card"><div id="historyRows"></div></section>`;
  const from = document.getElementById("fromDate"), to = document.getElementById("toDate");
  if (staff) {
    try {
      const [classes, students] = await Promise.all([app.api("/api/classes"), app.api("/api/students")]);
      document.getElementById("classFilter").innerHTML += classes.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
      document.getElementById("studentFilter").innerHTML += students.map(s => `<option value="${s.id}">${escapeHtml(s.studentCode)} · ${escapeHtml(s.name)}</option>`).join("");
    } catch (error) { app.showError(error); }
  }
  try {
    const subjects = await app.api("/api/subjects");
    document.getElementById("subjectFilter").innerHTML += subjects.map(s => `<option value="${s.id}">${escapeHtml(s.code)} · ${escapeHtml(s.name)}</option>`).join("");
  } catch (error) { app.showError(error); }
  const load = async () => {
    const params = new URLSearchParams();
    if (from.value) params.set("from", from.value);
    if (to.value) params.set("to", to.value);
    const classFilter = document.getElementById("classFilter");
    if (classFilter && classFilter.value) params.set("classId", classFilter.value);
    const studentFilter = document.getElementById("studentFilter");
    if (studentFilter && studentFilter.value) params.set("studentId", studentFilter.value);
    const subjectFilter = document.getElementById("subjectFilter");
    if (subjectFilter && subjectFilter.value) params.set("subjectId", subjectFilter.value);
    try {
      const rows = await app.api(`/api/attendance${params.size ? `?${params}` : ""}`);
      const target = document.getElementById("historyRows");
      target.innerHTML = rows.length ? `<div class="table-responsive"><table class="table"><thead><tr>${app.role === "STUDENT" ? "" : "<th>Student</th>"}<th>Class</th><th>Subject</th><th>Date</th><th>Status</th>${app.role !== "STUDENT" ? "<th>Update</th>" : ""}</tr></thead><tbody>${rows.map(row => `<tr>${app.role === "STUDENT" ? "" : `<td>${escapeHtml(row.studentName)}<div class="text-small">${escapeHtml(row.studentCode)}</div></td>`}<td>${escapeHtml(row.className)}</td><td>${escapeHtml(row.subjectName)}</td><td>${escapeHtml(row.date)}</td><td>${statusBadge(row.status)}</td>${app.role !== "STUDENT" ? `<td><div class="d-flex gap-1"><select class="form-select form-select-sm status-change" data-id="${row.id}" aria-label="New status"><option ${row.status === "PRESENT" ? "selected" : ""} value="PRESENT">Present</option><option ${row.status === "ABSENT" ? "selected" : ""} value="ABSENT">Absent</option><option ${row.status === "LATE" ? "selected" : ""} value="LATE">Late</option></select><button class="btn btn-light btn-sm save-status" data-id="${row.id}">Save</button></div></td>` : ""}</tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No attendance records match the selected filters.</div>`;
      target.querySelectorAll(".save-status").forEach(button => button.addEventListener("click", async () => {
        const select = target.querySelector(`.status-change[data-id="${button.dataset.id}"]`);
        button.disabled = true;
        try { await app.api(`/api/attendance/${button.dataset.id}?status=${select.value}`, { method: "PUT" }); app.showSuccess("Attendance updated."); await load(); }
        catch (error) { app.showError(error); }
        finally { button.disabled = false; }
      }));
    } catch (error) { app.showError(error); }
  };
  document.getElementById("filterForm").addEventListener("submit", event => { event.preventDefault(); load(); });
  await load();
})();
