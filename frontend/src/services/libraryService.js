const API_BASE =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

async function readResponse(response) {
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
      response.statusText ||
      "No se pudo completar la solicitud."
    );

    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function listLibraryDocuments({
  category = "",
  q = "",
} = {}) {
  const params = new URLSearchParams();

  if (category) params.set("category", category);
  if (q) params.set("q", q);

  const suffix = params.toString()
    ? `?${params.toString()}`
    : "";

  const response = await fetch(
    `${API_BASE}/api/library${suffix}`
  );

  return readResponse(response);
}

export function libraryPdfUrl(document) {
  const path =
    document?.pdfUrl ||
    (document?.id
      ? `/api/library/${document.id}/pdf`
      : "");

  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  return `${API_BASE}${path}`;
}

export async function listAdminLibraryDocuments({
  q = "",
  category = "",
} = {}) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (category) params.set("category", category);

  const suffix = params.toString()
    ? `?${params.toString()}`
    : "";

  const adminKey =
    localStorage.getItem("adminKey") || "";

  const response = await fetch(
    `${API_BASE}/api/admin/library${suffix}`,
    {
      headers: {
        "X-ADMIN-KEY": adminKey,
      },
    }
  );

  return readResponse(response);
}

export async function saveLibraryDocument({
  id,
  title,
  description,
  category,
  active,
  pdf,
}) {
  const adminKey =
    localStorage.getItem("adminKey") || "";

  const formData = new FormData();

  if (id) formData.append("id", String(id));
  formData.append("title", title || "");
  formData.append("description", description || "");
  formData.append("category", category || "");
  formData.append("active", String(Boolean(active)));

  if (pdf) {
    formData.append("pdf", pdf);
  }

  const response = await fetch(
    `${API_BASE}/api/admin/library`,
    {
      method: "POST",
      headers: {
        "X-ADMIN-KEY": adminKey,
      },
      body: formData,
    }
  );

  return readResponse(response);
}

export async function deleteLibraryDocument(id) {
  const adminKey =
    localStorage.getItem("adminKey") || "";

  const response = await fetch(
    `${API_BASE}/api/admin/library/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        "X-ADMIN-KEY": adminKey,
      },
    }
  );

  return readResponse(response);
}
