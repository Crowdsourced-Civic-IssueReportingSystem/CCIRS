export function getAuthToken() {
  return localStorage.getItem("ccirs_token");
}

export function setAuthToken(token) {
  localStorage.setItem("ccirs_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("ccirs_token");
}

export function getStoredUser() {
  const raw = localStorage.getItem("ccirs_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem("ccirs_user", JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem("ccirs_user");
}
