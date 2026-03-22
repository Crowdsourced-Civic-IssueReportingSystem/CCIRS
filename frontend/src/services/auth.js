export function getAuthToken() {
  return localStorage.getItem("ccirs_token");
}

export function setAuthToken(token) {
  localStorage.setItem("ccirs_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("ccirs_token");
}
