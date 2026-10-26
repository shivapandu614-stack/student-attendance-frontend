(async () => {
  const app = window.attendanceApp;
  if (!app) return;
  if (app.role !== "ADMIN") return location.replace("index.html");
  const page = document.getElementById("pageContent");
  page.innerHTML = `<div class="page-heading"><div><h1>Teachers</h1><p>Manage teacher profiles and sign-in access.</p></div></div><div id="pageAlert" class="d-none"></div>
  <section class="content-card"><h2 id="teacherFormTitle" class="h6 fw-bold mb-3">Add a teacher</h2><form id="teacherForm" class="row g-3">
    <input id="teacherId" type="hidden"><div class="col-md-3"><label class="form-label">Teacher ID</label><input id="teacherCode" class="form-control" required maxlength="40"></div>
    <div class="col-md-3"><label class="form-label">Full name</label><input id="teacherName" class="form-control" required maxlength="120"></div>
    <div class="col-md-3"><label class="form-label">Email / username</label><input id="teacherEmail" type="email" class="form-control" required maxlength="160"></div>
    <div class="col-md-3"><label class="form-label">Department</label><input id="teacherDepartment" class="form-control" required maxlength="100"></div>
    <div class="col-md-6"><label class="form-label">Initial password</label><input id="teacherPassword" type="password" minlength="8" class="form-control" required><div class="form-text">At least 8 characters; required for new accounts.</div></div>
    <div class="col-12"><button id="saveTeacher" class="btn btn-primary">Save teacher</button><button id="cancelTeacher" type="button" class="btn btn-light d-none ms-1">Cancel edit</button></div>
  </form></section>
  <section class="content-card"><h2 class="h6 fw-bold mb-3">Teacher directory</h2><div id="teacherTable"></div></section>`;
  const byId = id => document.getElementById(id);
  let teachers = [];
  const reset = () => {
    byId("teacherForm").reset(); byId("teacherId").value = ""; byId("teacherPassword").required = true;
    byId("teacherFormTitle").textContent = "Add a teacher"; byId("saveTeacher").textContent = "Save teacher";
    byId("cancelTeacher").classList.add("d-none");
  };
  const render = () => {
    byId("teacherTable").innerHTML = teachers.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Teacher ID</th><th>Name</th><th>Email</th><th>Department</th><th>Actions</th></tr></thead><tbody>${teachers.map(t => `<tr><td>${escapeHtml(t.teacherCode)}</td><td>${escapeHtml(t.name)}</td><td>${escapeHtml(t.email)}</td><td>${escapeHtml(t.department)}</td><td><button class="btn btn-light btn-sm teacher-edit" data-id="${t.id}">Edit</button> <button class="btn btn-outline-danger btn-sm teacher-delete" data-id="${t.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No teachers added yet.</div>`;
    byId("teacherTable").querySelectorAll(".teacher-edit").forEach(button => button.addEventListener("click", () => {
      const t = teachers.find(item => item.id === Number(button.dataset.id));
      byId("teacherId").value = t.id; byId("teacherCode").value = t.teacherCode; byId("teacherName").value = t.name;
      byId("teacherEmail").value = t.email; byId("teacherDepartment").value = t.department; byId("teacherPassword").value = "";
      byId("teacherPassword").required = false; byId("teacherFormTitle").textContent = "Edit teacher";
      byId("saveTeacher").textContent = "Update teacher"; byId("cancelTeacher").classList.remove("d-none");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    byId("teacherTable").querySelectorAll(".teacher-delete").forEach(button => button.addEventListener("click", async () => {
      if (!confirm("Delete this teacher? Referenced subjects or attendance records can prevent deletion.")) return;
      try { await app.api(`/api/teachers/${button.dataset.id}`, { method: "DELETE" }); app.showSuccess("Teacher deleted."); await load(); }
      catch (error) { app.showError(error); }
    }));
  };
  const load = async () => { teachers = await app.api("/api/teachers"); render(); };
  try { await load(); } catch (error) { app.showError(error); }
  byId("cancelTeacher").addEventListener("click", reset);
  byId("teacherForm").addEventListener("submit", async event => {
    event.preventDefault();
    const id = byId("teacherId").value;
    const payload = { teacherCode: byId("teacherCode").value.trim(), name: byId("teacherName").value.trim(),
      email: byId("teacherEmail").value.trim(), department: byId("teacherDepartment").value.trim(),
      password: byId("teacherPassword").value || null };
    byId("saveTeacher").disabled = true;
    try {
      await app.api(id ? `/api/teachers/${id}` : "/api/teachers", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
      reset(); app.showSuccess(id ? "Teacher updated." : "Teacher created."); await load();
    } catch (error) { app.showError(error); }
    finally { byId("saveTeacher").disabled = false; }
  });
})();
