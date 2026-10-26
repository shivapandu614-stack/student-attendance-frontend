# Student Attendance Frontend

Static HTML, CSS, and JavaScript frontend for the student attendance system.

## Run locally

Open `index.html` through the Spring Boot backend at `http://localhost:8080`, or serve this directory with a static web server. By default, API requests use the same origin.

## Connect to a separately hosted backend

Set `window.ATTENDANCE_API_BASE_URL` in `js/config.js` to the backend's public origin (for example, `https://your-backend.example.com`). Do not add `/api` to the value. Redeploy the static frontend after changing the setting.

The backend must allow this frontend's exact origin in its `CORS_ALLOWED_ORIGINS` environment variable. Until a backend is deployed and configured, the Vercel frontend cannot sign in or load API-backed pages.

## Deploy on Vercel

Import this repository in Vercel as a static project. Leave the build command empty and use the repository root as the output directory.
