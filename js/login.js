const form = document.getElementById("loginForm");
const alertBox = document.getElementById("alert");
form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.getElementById("submitButton");
  button.disabled = true;
  button.textContent = "Signing in…";
  alertBox.className = "alert d-none";
  try {
    const response = await fetch("/api/auth/login", {
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
