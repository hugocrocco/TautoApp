const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

function adminKey() {
  return localStorage.getItem("adminKey") || "hbdt";
}

async function parseResponse(res) {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.message || res.statusText || "Error");
  }
  return data;
}

export async function listBenefits(zone = "") {
  const query = zone ? `?zone=${encodeURIComponent(zone)}` : "";
  const res = await fetch(`${API_BASE}/api/benefits${query}`);
  return parseResponse(res);
}

export async function adminListBenefits(q = "") {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await fetch(`${API_BASE}/api/admin/benefits${query}`, {
    headers: { "X-ADMIN-KEY": adminKey() },
  });
  return parseResponse(res);
}

export async function adminSaveBenefit({ id, title, zone, shortInfo, active, pdfFile }) {
  const fd = new FormData();
  if (id) fd.append("id", String(id));
  fd.append("title", title || "");
  fd.append("zone", zone || "NORTE");
  fd.append("shortInfo", shortInfo || "");
  fd.append("active", String(active !== false));
  if (pdfFile) fd.append("pdf", pdfFile);

  const res = await fetch(`${API_BASE}/api/admin/benefits`, {
    method: "POST",
    headers: { "X-ADMIN-KEY": adminKey() },
    body: fd,
  });
  return parseResponse(res);
}

export async function adminDeleteBenefit(id) {
  const res = await fetch(`${API_BASE}/api/admin/benefits/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "X-ADMIN-KEY": adminKey() },
  });
  return parseResponse(res);
}


export function benefitPdfUrl(item) {
  if (!item?.pdfUrl) return "";
  if (String(item.pdfUrl).startsWith("http")) return item.pdfUrl;
  return `${API_BASE}${item.pdfUrl}`;
}
