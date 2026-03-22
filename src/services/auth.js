export function getStoredToken() {
  return localStorage.getItem("token");
}

export function setStoredToken(token) {
  localStorage.setItem("token", token);
}

export function clearStoredToken() {
  localStorage.removeItem("token");
}
