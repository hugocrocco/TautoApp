// src/services/authService.js

import { apiFetch } from "./apiClient";
// Para requests multipart (foto). Si no hay .env, usa backend local.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function login(credentials) {
  // credentials: { rut, password } o lo que uses
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export async function register(payload) {
  // payload con todos los datos del formulario de registro
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function registerWithPhoto({
  displayName,
  rut,
  password,
  photoFile,
  institucionId = 1,
} = {}) {
  const fd = new FormData();

  // El backend espera estos campos como multipart/form-data
  fd.append("institucionId", String(institucionId));
  fd.append("displayName", displayName ?? "");
  fd.append("rut", rut ?? "");
  fd.append("password", password ?? "");

  // El backend espera el archivo en el campo `photo`
  if (photoFile) {
    fd.append("photo", photoFile);
  }

  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    // intenta leer mensaje útil
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