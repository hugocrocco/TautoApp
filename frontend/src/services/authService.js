// src/services/authService.js

import { apiFetch } from "./apiClient";

const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;
export async function login(credentials) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export async function register(payload) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function verifyEmail({ rut, code }) {
  return apiFetch("/api/auth/verify-email", {
    method: "POST",
    body: {
      rut,
      code,
    },
  });
}

export async function registerWithPhoto({
  displayName,
  rut,
  password,
  photoFile,
  email,
  telefono,
  direccion,
  institucionId = 1,
} = {}) {
  const fd = new FormData();

  fd.append("institucionId", String(institucionId));
  fd.append("displayName", displayName ?? "");
  fd.append("rut", rut ?? "");
  fd.append("password", password ?? "");
  fd.append("email", email ?? "");
  fd.append("telefono", telefono ?? "");
  fd.append("direccion", direccion ?? "");

  if (photoFile) {
    fd.append("photo", photoFile);
  }

  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;

    try {
      const errJson = await res.json();
      message = errJson?.message || message;
    } catch (_) {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch (_) {}
    }

    throw new Error(message);
  }

  return await res.json();
}

export async function checkSession() {
  return apiFetch("/api/auth/me", { method: "GET" });
}

export async function pingHealth() {
  return apiFetch("/api/health", { method: "GET", timeoutMs: 3000 });
}

export async function adminListUsers(adminKey = "hbdt", q = "") {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";

  const res = await fetch(`${BASE_URL}/api/admin/users${query}`, {
    method: "GET",
    headers: {
      "X-ADMIN-KEY": adminKey,
    },
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;

    try {
      const errJson = await res.json();
      message = errJson?.message || message;
    } catch (_) {}

    throw new Error(message);
  }

  return await res.json();
}

export async function adminListMembers(adminKey = "hbdt", q = "") {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";

  const res = await fetch(`${BASE_URL}/api/admin/members${query}`, {
    method: "GET",
    headers: {
      "X-ADMIN-KEY": adminKey,
    },
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;

    try {
      const errJson = await res.json();
      message = errJson?.message || message;
    } catch (_) {}

    throw new Error(message);
  }

  return await res.json();
}