const form = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const alertBox = document.getElementById("alert");
const toggleLink = document.getElementById("toggleAccountForm");
const accountPrompt = document.getElementById("accountPrompt");

toggleLink.addEventListener("click", event => {
  event.preventDefault();
  const registering = registerForm.classList.contains("d-none");
  registerForm.classList.toggle("d-none", !registering);
  form.classList.toggle("d-none", registering);
  document.querySelector(".login-card h1").textContent = registering ? "Create your account" : "Welcome back";
  document.querySelector(".login-card > p.text-secondary").textContent = registering
    ? "Register as a student to access your attendance."
    : "Sign in to continue to your workspace.";
  accountPrompt.textContent = registering ? "Already have an account?" : "Don't have a student account?";
  toggleLink.textContent = registering ? "Sign in" : "Create account";
  alertBox.className = "alert d-none";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.getElementById("submitButton");
  button.disabled = true;
  button.textContent = "Signing in…";
  alertBox.className = "alert d-none";
  try {
    const response = await fetch(window.attendanceApiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: document.getElementById("username").value.trim(), password: document.getElementById("password").value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to sign in.");
    localStorage.setItem("attendanceToken", data.token);
    localStorage.setItem("attendanceRole", data.role);
    localStorage.setItem("attendanceUsername", data.username);
    location.replace(data.role === "ADMIN" ? "admin-dashboard.html" : data.role === "TEACHER" ? "teacher-dashboard.html" : "student-dashboard.html");
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = "alert alert-danger";
  } finally {
    button.disabled = false;
    button.textContent = "Sign in";
  }
});

registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.getElementById("registerButton");
  button.disabled = true;
  button.textContent = "Creating account…";
  alertBox.className = "alert d-none";
  try {
    const response = await fetch(window.attendanceApiUrl("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentCode: document.getElementById("studentCode").value.trim(),
        name: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim() || null,
        department: document.getElementById("department").value.trim(),
        year: Number(document.getElementById("year").value),
        password: document.getElementById("newPassword").value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to create account.");
    localStorage.setItem("attendanceToken", data.token);
    localStorage.setItem("attendanceRole", data.role);
    localStorage.setItem("attendanceUsername", data.username);
    location.replace("student-dashboard.html");
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = "alert alert-danger";
  } finally {
    button.disabled = false;
    button.textContent = "Create account";
  }
});
