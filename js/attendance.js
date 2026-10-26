(async () => {
  const app = window.attendanceApp;
  if (!app) return;
  const page = document.getElementById("pageContent");
  page.innerHTML = `<div class="page-heading"><div><h1>Mark attendance</h1><p>Record each student's status for a subject and class session.</p></div></div><div id="pageAlert" class="d-none"></div>
    <section class="content-card"><form id="attendanceForm" class="row g-3 align-items-end">
      <div class="col-md-6"><label class="form-label" for="subjectSelect">Subject and class</label><select id="subjectSelect" class="form-select" required></select></div>
      <div class="col-md-3"><label class="form-label" for="attendanceDate">Attendance date</label><input id="attendanceDate" class="form-control" type="date" required></div>
      <div class="col-md-3"><button class="btn btn-primary w-100" type="submit">Save attendance</button></div>
    </form></section>
    <section class="content-card"><div class="d-flex justify-content-between align-items-center mb-3"><div><h2 class="h6 fw-bold mb-1">Students in this class</h2><p class="text-small mb-0">Late is included as attended in attendance totals.</p></div><input id="studentSearch" class="form-control search-box" placeholder="Search students…" aria-label="Search students"></div><div id="roster" class="empty-state">Select a subject to load its class roster.</div></section>`;
  const byId = id => document.getElementById(id);
  byId("attendanceDate").value = new Date().toISOString().slice(0, 10);
  let subjects = [], students = [], visibleStudents = [], statusByStudent = new Map();
  try {
    [subjects, students] = await Promise.all([app.api("/api/subjects"), app.api("/api/students")]);
    byId("subjectSelect").innerHTML = `<option value="">Choose a subject…</option>` + subjects.map(s => `<option value="${s.id}" data-class="${s.classId}">${escapeHtml(s.name)} · ${escapeHtml(s.className)} (${escapeHtml(s.code)})</option>`).join("");
    if (subjects.length === 1) { byId("subjectSelect").value = subjects[0].id; renderRoster(); }
  } catch (error) { app.showError(error); }
  const renderRoster = () => {
    document.querySelectorAll(".status-select").forEach(select => statusByStudent.set(Number(select.dataset.id), select.value));
    const option = byId("subjectSelect").selectedOptions[0];
    const classId = option && option.dataset.class;
    visibleStudents = students.filter(student => String(student.classId) === String(classId));
    const search = byId("studentSearch").value.toLowerCase();
    const filtered = visibleStudents.filter(s => `${s.studentCode} ${s.name}`.toLowerCase().includes(search));
    byId("roster").innerHTML = classId ? filtered.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Student ID</th><th>Student</th><th>Attendance status</th></tr></thead><tbody>${filtered.map(s => `<tr><td>${escapeHtml(s.studentCode)}</td><td>${escapeHtml(s.name)}</td><td><select class="form-select form-select-sm status-select" data-id="${s.id}" aria-label="Status for ${escapeHtml(s.name)}"><option ${statusByStudent.get(s.id) === "PRESENT" || !statusByStudent.has(s.id) ? "selected" : ""} value="PRESENT">Present</option><option ${statusByStudent.get(s.id) === "ABSENT" ? "selected" : ""} value="ABSENT">Absent</option><option ${statusByStudent.get(s.id) === "LATE" ? "selected" : ""} value="LATE">Late</option></select></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No students are assigned to this class.</div>` : `<div class="empty-state">Select a subject to load its class roster.</div>`;
  };
  byId("subjectSelect").addEventListener("change", () => {
    statusByStudent = new Map();
    byId("roster").replaceChildren();
    renderRoster();
  });
  byId("studentSearch").addEventListener("input", renderRoster);
  byId("attendanceForm").addEventListener("submit", async event => {
    event.preventDefault();
    const subjectId = Number(byId("subjectSelect").value);
    document.querySelectorAll(".status-select").forEach(select => statusByStudent.set(Number(select.dataset.id), select.value));
    const entries = visibleStudents.map(student => ({
      studentId: student.id, status: statusByStudent.get(student.id) || "PRESENT"
    }));
    if (!entries.length) { app.showError(new Error("This class has no students to mark.")); return; }
    const button = event.submitter; button.disabled = true; button.textContent = "Saving…";
    try {
      await app.api("/api/attendance", { method: "POST", body: JSON.stringify({ subjectId, date: byId("attendanceDate").value, entries }) });
      app.showSuccess(`Attendance saved for ${entries.length} students.`);
    } catch (error) { app.showError(error); }
    finally { button.disabled = false; button.textContent = "Save attendance"; }
  });
})();
