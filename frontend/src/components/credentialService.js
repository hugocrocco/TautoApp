import { apiFetch } from "./apiClient";

export async function generateCredentialQr({ rut }) {
  return apiFetch("/api/credential/qr", {
    method: "POST",
    body: { rut },
    timeoutMs: 8000,
  });
}

export async function verifyCredentialToken(token) {
  return apiFetch(`/api/credential/verify/${encodeURIComponent(token)}`, {
    method: "GET",
    timeoutMs: 8000,
  });
}
