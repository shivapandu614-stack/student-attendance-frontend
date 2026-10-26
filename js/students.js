(async () => {
  const app = window.attendanceApp;
  if (!app) return;
  if (app.role !== "ADMIN") return location.replace("index.html");
  const page = document.getElementById("pageContent");
  page.innerHTML = `<div class="page-heading"><div><h1>Students</h1><p>Create and maintain student profiles and login accounts.</p></div><button id="resetForm" class="btn btn-primary">+ Add student</button></div>
    <div id="pageAlert" class="d-none"></div>
    <section class="content-card"><h2 id="formTitle" class="h6 fw-bold mb-3">Add a student</h2>
      <form id="studentForm" class="row g-3">
        <input id="studentId" type="hidden">
        <div class="col-md-4"><label class="form-label" for="studentCode">Student ID</label><input id="studentCode" class="form-control" required maxlength="40"></div>
        <div class="col-md-4"><label class="form-label" for="studentName">Full name</label><input id="studentName" class="form-control" required maxlength="120"></div>
        <div class="col-md-4"><label class="form-label" for="studentEmail">Email</label><input id="studentEmail" class="form-control" type="email" required maxlength="160"></div>
        <div class="col-md-4"><label class="form-label" for="studentPhone">Phone</label><input id="studentPhone" class="form-control" maxlength="30"></div>
        <div class="col-md-4"><label class="form-label" for="studentDepartment">Department</label><input id="studentDepartment" class="form-control" required maxlength="100"></div>
        <div class="col-md-4"><label class="form-label" for="studentYear">Year</label><input id="studentYear" class="form-control" type="number" min="1" max="8" required></div>
        <div class="col-md-6"><label class="form-label" for="studentClass">Class</label><select id="studentClass" class="form-select"><option value="">Unassigned</option></select></div>
        <div class="col-md-6"><label class="form-label" for="studentPassword">Initial password</label><input id="studentPassword" class="form-control" type="password" minlength="8" required><div class="form-text">Required for a new student; leave blank when editing.</div></div>
        <div class="col-12"><button id="saveStudent" class="btn btn-primary" type="submit">Save student</button> <button id="cancelEdit" class="btn btn-light d-none" type="button">Cancel edit</button></div>
      </form>
    </section>
    <section class="content-card"><div class="d-flex justify-content-between align-items-center gap-3 mb-3"><h2 class="h6 fw-bold mb-0">Student directory</h2><input id="studentSearch" class="form-control search-box" placeholder="Search students…" aria-label="Search students"></div><div id="studentTable"></div></section>`;
  const els = Object.fromEntries(["studentForm", "studentId", "studentCode", "studentName", "studentEmail", "studentPhone", "studentDepartment", "studentYear", "studentClass", "studentPassword", "studentTable", "pageAlert"].map(id => [id, document.getElementById(id)]));
  let rows = [];
  const reset = () => {
    els.studentForm.reset(); els.studentId.value = ""; els.studentPassword.required = true;
    document.getElementById("formTitle").textContent = "Add a student";
    document.getElementById("saveStudent").textContent = "Save student";
    document.getElementById("cancelEdit").classList.add("d-none");
  };
  const renderRows = () => {
    const query = document.getElementById("studentSearch").value.toLowerCase();
    const filtered = rows.filter(row => [row.studentCode, row.name, row.email, row.department, row.className].some(value => (value || "").toLowerCase().includes(query)));
    els.studentTable.innerHTML = filtered.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Student ID</th><th>Name</th><th>Department</th><th>Year</th><th>Class</th><th>Actions</th></tr></thead><tbody>${filtered.map(row => `<tr><td class="fw-semibold">${escapeHtml(row.studentCode)}</td><td>${escapeHtml(row.name)}<div class="text-small">${escapeHtml(row.email)}</div></td><td>${escapeHtml(row.department)}</td><td>${row.year}</td><td>${escapeHtml(row.className || "Unassigned")}</td><td class="table-actions"><button class="btn btn-light btn-sm edit-row" data-id="${row.id}">Edit</button> <button class="btn btn-outline-danger btn-sm delete-row" data-id="${row.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No students match your search.</div>`;
    els.studentTable.querySelectorAll(".edit-row").forEach(button => button.addEventListener("click", () => {
      const row = rows.find(item => item.id === Number(button.dataset.id));
      els.studentId.value = row.id; els.studentCode.value = row.studentCode; els.studentName.value = row.name;
      els.studentEmail.value = row.email; els.studentPhone.value = row.phone || ""; els.studentDepartment.value = row.department;
      els.studentYear.value = row.year; els.studentClass.value = row.classId || ""; els.studentPassword.value = "";
      els.studentPassword.required = false; document.getElementById("formTitle").textContent = "Edit student";
      document.getElementById("saveStudent").textContent = "Update student";
      document.getElementById("cancelEdit").classList.remove("d-none");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    els.studentTable.querySelectorAll(".delete-row").forEach(button => button.addEventListener("click", async () => {
      if (!confirm("Delete this student? Records linked to the student may prevent deletion.")) return;
      try { await app.api(`/api/students/${button.dataset.id}`, { method: "DELETE" }); app.showSuccess("Student deleted."); await load(); }
      catch (error) { app.showError(error); }
    }));
  };
  const load = async () => { rows = await app.api("/api/students"); renderRows(); };
  try {
    const classes = await app.api("/api/classes");
    els.studentClass.innerHTML += classes.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
    await load();
  } catch (error) { app.showError(error); }
  document.getElementById("studentSearch").addEventListener("input", renderRows);
  document.getElementById("resetForm").addEventListener("click", reset);
  document.getElementById("cancelEdit").addEventListener("click", reset);
  els.studentForm.addEventListener("submit", async event => {
    event.preventDefault();
    const id = els.studentId.value;
    const payload = {
      studentCode: els.studentCode.value.trim(), name: els.studentName.value.trim(), email: els.studentEmail.value.trim(),
      phone: els.studentPhone.value.trim() || null, department: els.studentDepartment.value.trim(),
      year: Number(els.studentYear.value), classId: els.studentClass.value ? Number(els.studentClass.value) : null,
      password: els.studentPassword.value || null
    };
    const button = document.getElementById("saveStudent"); button.disabled = true;
    try {
      await app.api(id ? `/api/students/${id}` : "/api/students", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
      reset(); app.showSuccess(id ? "Student updated." : "Student created."); await load();
    } catch (error) { app.showError(error); }
    finally { button.disabled = false; }
  });
})();
