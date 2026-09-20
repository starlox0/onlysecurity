export const API_BASE_URL = 'https://onlysecurity-ctf-backend.vercel.app/';

const TOKEN_KEY = 'os-ctf-token';
const USERNAME_KEY = 'os-ctf-username';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUsername() {
  try {
    return localStorage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
}

export function setSession(token, username) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
  } catch {
    // localStorage unavailable (private browsing) — session just won't persist across reloads
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch {
    // ignore
  }
}

async function request(path, {method = 'GET', body, auth = false} = {}) {
  const headers = {'Content-Type': 'application/json'};
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const register = (username, password) => request('/api/register', {method: 'POST', body: {username, password}});
export const login = (username, password) => request('/api/login', {method: 'POST', body: {username, password}});
export const fetchChallenges = () => request('/api/challenges', {auth: true});
export const submitFlag = (challengeId, flag) => request('/api/submit', {method: 'POST', body: {challengeId, flag}, auth: true});
export const fetchScoreboard = () => request('/api/scoreboard');
export const fetchMe = () => request('/api/me', {auth: true});
