// src/services/apiClient.js
const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

async function apiFetch(path, { method = "GET", headers = {}, body, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      let errorBody = null;
      try {
        errorBody = await res.json();
      } catch (_) {
        // no json
      }

      const message =
        errorBody?.message ||
        `Error ${res.status}: ${res.statusText || "Error en la solicitud"}`;

      const error = new Error(message);
      error.status = res.status;
      error.body = errorBody;
      throw error;
    }

    // si no hay contenido
    if (res.status === 204) return null;

    const data = await res.json();
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("La solicitud tardó demasiado (timeout)");
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export { apiFetch, BASE_URL };