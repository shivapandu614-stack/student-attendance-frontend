(async () => {
  const app = window.attendanceApp;
  if (!app) return;
  if (!["ADMIN", "TEACHER"].includes(app.role)) return location.replace("index.html");
  const page = document.getElementById("pageContent");
  page.innerHTML = `<div class="page-heading"><div><h1>Attendance reports</h1><p>Summarize attendance by student across a date range.</p></div><button id="exportCsv" class="btn btn-light">↓ Export CSV</button></div><div id="pageAlert" class="d-none"></div>
    <section class="content-card"><form id="reportFilters" class="row g-3 align-items-end">
      <div class="col-sm-6 col-lg-3"><label class="form-label">From date</label><input id="fromDate" class="form-control" type="date"></div>
      <div class="col-sm-6 col-lg-3"><label class="form-label">To date</label><input id="toDate" class="form-control" type="date"></div>
      <div class="col-sm-6 col-lg-3"><label class="form-label">Class</label><select id="classId" class="form-select"><option value="">All classes</option></select></div>
      <div class="col-sm-6 col-lg-3"><label class="form-label">Subject</label><select id="subjectId" class="form-select"><option value="">All subjects</option></select></div>
      <div class="col-sm-6 col-lg-3"><label class="form-label">Student ID (optional)</label><input id="studentCode" class="form-control"></div>
      <div class="col-12"><button class="btn btn-primary">Generate report</button></div>
    </form></section><section class="content-card"><div id="reportResults"></div></section>`;
  const get = id => document.getElementById(id);
  try {
    const [classes, subjects] = await Promise.all([app.api("/api/classes"), app.api("/api/subjects")]);
    get("classId").innerHTML += classes.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    get("subjectId").innerHTML += subjects.map(s => `<option value="${s.id}">${escapeHtml(s.code)} · ${escapeHtml(s.name)}</option>`).join("");
  } catch (error) { app.showError(error); }
  const params = () => {
    const query = new URLSearchParams();
    if (get("fromDate").value) query.set("from", get("fromDate").value);
    if (get("toDate").value) query.set("to", get("toDate").value);
    if (get("classId").value) query.set("classId", get("classId").value);
    if (get("subjectId").value) query.set("subjectId", get("subjectId").value);
    if (get("studentCode").value.trim()) query.set("studentCode", get("studentCode").value.trim());
    return query;
  };
  const load = async () => {
    try {
      const rows = await app.api(`/api/reports?${params()}`);
      get("reportResults").innerHTML = rows.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Student</th><th>Class</th><th>Total classes</th><th>Attended</th><th>Absent</th><th>Late</th><th>Attendance</th></tr></thead><tbody>${rows.map(row => `<tr><td class="fw-semibold">${escapeHtml(row.studentName)}<div class="text-small">${escapeHtml(row.studentCode)}</div></td><td>${escapeHtml(row.className)}</td><td>${row.totalClasses}</td><td>${row.attended}</td><td>${row.absent}</td><td>${row.late}</td><td><span class="fw-semibold">${row.percentage}%</span></td></tr>`).join("")}</tbody></table></div><p class="text-small mt-3 mb-0">Late records are included in attended classes.</p>` : `<div class="empty-state">No attendance data for the selected period.</div>`;
    } catch (error) { app.showError(error); }
  };
  get("reportFilters").addEventListener("submit", event => { event.preventDefault(); load(); });
  get("exportCsv").addEventListener("click", async () => {
    try {
      const response = await fetch(`/api/reports/csv?${params()}`, { headers: { Authorization: `Bearer ${localStorage.getItem("attendanceToken")}` } });
      if (!response.ok) throw new Error("CSV export failed. Check your access and filters.");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "attendance-report.csv"; anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) { app.showError(error); }
  });
  await load();
})();
