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

export async function listMyMessages(rut) {
  const res = await fetch(`${API_BASE}/api/messages?rut=${encodeURIComponent(rut || "")}`);
  return parseResponse(res);
}

export async function adminListMessages() {
  const res = await fetch(`${API_BASE}/api/admin/messages`, {
    headers: { "X-ADMIN-KEY": adminKey() },
  });
  return parseResponse(res);
}

export async function adminSendMessage(payload) {
  const res = await fetch(`${API_BASE}/api/admin/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ADMIN-KEY": adminKey(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function adminDeleteMessage(id) {
  const res = await fetch(`${API_BASE}/api/admin/messages/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "X-ADMIN-KEY": adminKey() },
  });
  return parseResponse(res);
}


export async function adminListRecipients(q = "") {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await fetch(`${API_BASE}/api/admin/members${query}`, {
    headers: { "X-ADMIN-KEY": adminKey() },
  });
  return parseResponse(res);
}
