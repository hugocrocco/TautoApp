const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function generateCredentialQr(rut) {
  const response = await fetch(`${API_BASE_URL}/credential/qr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rut }),
  });

  if (!response.ok) {
    throw new Error("No se pudo generar el QR temporal.");
  }

  return response.json();
}

export async function verifyCredentialToken(token) {
  const response = await fetch(
    `${API_BASE_URL}/credential/verify/${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    throw new Error("No se pudo verificar la credencial.");
  }

  return response.json();
}