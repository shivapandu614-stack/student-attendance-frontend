(async () => {
  const app = window.attendanceApp;
  if (!app) return;
  if (app.role !== "ADMIN") return location.replace("index.html");
  const page = document.getElementById("pageContent");
  page.innerHTML = `<div class="page-heading"><div><h1>Classes & subjects</h1><p>Organize academic classes and their subject assignments.</p></div></div><div id="pageAlert" class="d-none"></div>
    <div class="row g-3"><div class="col-xl-5"><section class="content-card"><h2 id="classFormTitle" class="h6 fw-bold mb-3">Add a class</h2><form id="classForm" class="row g-3">
      <input id="classIdEdit" type="hidden">
      <div class="col-12"><label class="form-label">Class name</label><input id="className" class="form-control" required maxlength="100"></div>
      <div class="col-md-7"><label class="form-label">Department</label><input id="classDepartment" class="form-control" required maxlength="100"></div>
      <div class="col-md-5"><label class="form-label">Academic year</label><input id="academicYear" class="form-control" placeholder="2026-2027" required maxlength="30"></div>
      <div class="col-12"><button id="saveClass" class="btn btn-primary">Create class</button> <button id="cancelClassEdit" type="button" class="btn btn-light d-none">Cancel</button></div></form></section></div>
    <div class="col-xl-7"><section class="content-card"><h2 id="subjectFormTitle" class="h6 fw-bold mb-3">Add a subject</h2><form id="subjectForm" class="row g-3">
      <input id="subjectIdEdit" type="hidden">
      <div class="col-md-6"><label class="form-label">Subject name</label><input id="subjectName" class="form-control" required maxlength="120"></div>
      <div class="col-md-6"><label class="form-label">Subject code</label><input id="subjectCode" class="form-control" required maxlength="30"></div>
      <div class="col-md-6"><label class="form-label">Class</label><select id="subjectClass" class="form-select" required></select></div>
      <div class="col-md-6"><label class="form-label">Teacher</label><select id="subjectTeacher" class="form-select" required></select></div>
      <div class="col-12"><button id="saveSubject" class="btn btn-primary">Create subject</button> <button id="cancelSubjectEdit" type="button" class="btn btn-light d-none">Cancel</button></div></form></section></div></div>
    <div class="row g-3"><div class="col-xl-5"><section class="content-card"><h2 class="h6 fw-bold mb-3">Classes</h2><div id="classList"></div></section></div>
    <div class="col-xl-7"><section class="content-card"><h2 class="h6 fw-bold mb-3">Subjects</h2><div id="subjectList"></div></section></div></div>`;
  const get = id => document.getElementById(id);
  let classes = [], teachers = [], subjects = [];
  const load = async () => {
    [classes, teachers, subjects] = await Promise.all([app.api("/api/classes"), app.api("/api/teachers"), app.api("/api/subjects")]);
    get("subjectClass").innerHTML = classes.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    get("subjectTeacher").innerHTML = teachers.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("");
    get("classList").innerHTML = classes.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Class</th><th>Department</th><th>Academic year</th><th>Actions</th></tr></thead><tbody>${classes.map(c => `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.department)}</td><td>${escapeHtml(c.academicYear)}</td><td class="table-actions"><button class="btn btn-light btn-sm class-edit" data-id="${c.id}">Edit</button> <button class="btn btn-outline-danger btn-sm class-delete" data-id="${c.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No classes created.</div>`;
    get("subjectList").innerHTML = subjects.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Subject</th><th>Class</th><th>Teacher</th><th>Actions</th></tr></thead><tbody>${subjects.map(s => `<tr><td>${escapeHtml(s.name)}<div class="text-small">${escapeHtml(s.code)}</div></td><td>${escapeHtml(s.className)}</td><td>${escapeHtml(s.teacherName)}</td><td class="table-actions"><button class="btn btn-light btn-sm subject-edit" data-id="${s.id}">Edit</button> <button class="btn btn-outline-danger btn-sm subject-delete" data-id="${s.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No subjects created.</div>`;
    get("classList").querySelectorAll(".class-edit").forEach(button => button.addEventListener("click", () => {
      const item = classes.find(c => c.id === Number(button.dataset.id));
      get("classIdEdit").value = item.id; get("className").value = item.name; get("classDepartment").value = item.department;
      get("academicYear").value = item.academicYear; get("classFormTitle").textContent = "Edit class";
      get("saveClass").textContent = "Update class"; get("cancelClassEdit").classList.remove("d-none");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    get("subjectList").querySelectorAll(".subject-edit").forEach(button => button.addEventListener("click", () => {
      const item = subjects.find(s => s.id === Number(button.dataset.id));
      get("subjectIdEdit").value = item.id; get("subjectName").value = item.name; get("subjectCode").value = item.code;
      get("subjectClass").value = item.classId; get("subjectTeacher").value = item.teacherId;
      get("subjectFormTitle").textContent = "Edit subject"; get("saveSubject").textContent = "Update subject";
      get("cancelSubjectEdit").classList.remove("d-none"); window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    get("classList").querySelectorAll(".class-delete").forEach(button => button.addEventListener("click", () => remove("/api/classes/", button.dataset.id, "class")));
    get("subjectList").querySelectorAll(".subject-delete").forEach(button => button.addEventListener("click", () => remove("/api/subjects/", button.dataset.id, "subject")));
  };
  const remove = async (path, id, label) => {
    if (!confirm(`Delete this ${label}? Records that reference it may prevent deletion.`)) return;
    try { await app.api(path + id, { method: "DELETE" }); app.showSuccess(`${label[0].toUpperCase() + label.slice(1)} deleted.`); await load(); }
    catch (error) { app.showError(error); }
  };
  try { await load(); } catch (error) { app.showError(error); }
  get("classForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const id = get("classIdEdit").value;
      await app.api(id ? `/api/classes/${id}` : "/api/classes", { method: id ? "PUT" : "POST", body: JSON.stringify({ name: get("className").value.trim(), department: get("classDepartment").value.trim(), academicYear: get("academicYear").value.trim() }) });
      event.target.reset(); get("classIdEdit").value = ""; get("classFormTitle").textContent = "Add a class"; get("saveClass").textContent = "Create class"; get("cancelClassEdit").classList.add("d-none");
      app.showSuccess(id ? "Class updated." : "Class created."); await load();
    } catch (error) { app.showError(error); }
  });
  get("subjectForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const id = get("subjectIdEdit").value;
      await app.api(id ? `/api/subjects/${id}` : "/api/subjects", { method: id ? "PUT" : "POST", body: JSON.stringify({ name: get("subjectName").value.trim(), code: get("subjectCode").value.trim(), classId: Number(get("subjectClass").value), teacherId: Number(get("subjectTeacher").value) }) });
      event.target.reset(); get("subjectIdEdit").value = ""; get("subjectFormTitle").textContent = "Add a subject"; get("saveSubject").textContent = "Create subject"; get("cancelSubjectEdit").classList.add("d-none");
      app.showSuccess(id ? "Subject updated." : "Subject created."); await load();
    } catch (error) { app.showError(error); }
  });
  get("cancelClassEdit").addEventListener("click", () => {
    get("classForm").reset(); get("classIdEdit").value = ""; get("classFormTitle").textContent = "Add a class";
    get("saveClass").textContent = "Create class"; get("cancelClassEdit").classList.add("d-none");
  });
  get("cancelSubjectEdit").addEventListener("click", () => {
    get("subjectForm").reset(); get("subjectIdEdit").value = ""; get("subjectFormTitle").textContent = "Add a subject";
    get("saveSubject").textContent = "Create subject"; get("cancelSubjectEdit").classList.add("d-none");
  });
})();
