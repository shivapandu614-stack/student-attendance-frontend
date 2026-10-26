window.ATTENDANCE_API_BASE_URL = window.ATTENDANCE_API_BASE_URL || "";

window.attendanceApiUrl = path =>
  `${window.ATTENDANCE_API_BASE_URL.replace(/\/+$/, "")}${path}`;

const fetchWithApiBase = window.fetch.bind(window);
window.fetch = (input, options) => {
  if (typeof input === "string" && input.startsWith("/api/")) {
    return fetchWithApiBase(window.attendanceApiUrl(input), options);
  }
  return fetchWithApiBase(input, options);
};
