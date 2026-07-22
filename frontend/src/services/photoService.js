const BASE_URL =
  import.meta.env.VITE_API_URL || window.location.origin;

export async function uploadMemberPhoto({
  institucionId = 1,
  rut,
  file,
}) {
  if (!rut) {
    throw new Error("No se encontró el RUT del socio.");
  }

  if (!file) {
    throw new Error("Debes seleccionar una fotografía.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${BASE_URL}/api/photos/${institucionId}/${encodeURIComponent(rut)}`,
    {
      method: "POST",
      body: formData,
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message || `No se pudo subir la fotografía (${response.status}).`
    );
  }

  return data;
}

export function memberPhotoUrl({
  institucionId = 1,
  rut,
  version = "",
}) {
  if (!rut) return "";

  const suffix = version
    ? `?v=${encodeURIComponent(version)}`
    : "";

  return `${BASE_URL}/api/photos/${institucionId}/${encodeURIComponent(rut)}${suffix}`;
}