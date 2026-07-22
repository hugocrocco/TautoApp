import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { AdminLayout } from "../layouts";
import { Input } from "../components/ui";

import {
  colors,
  globals,
  radius,
  shadows,
  spacing,
  typography,
} from "../theme";

import "./AdminResponsive.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

function normalizeRut(rut) {
  return (rut || "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9K-]/g, "");
}

function formatDateCL(value) {
  if (!value) return "";

  const text = String(value).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    return text;
  }

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  return text;
}

function dateCLToISO(value) {
  if (!value) return null;

  const text = String(value).trim();

  const clMatch = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (clMatch) {
    return `${clMatch[3]}-${clMatch[2]}-${clMatch[1]}`;
  }

  return text;
}

async function apiFetch(
  path,
  {
    method = "GET",
    adminKey,
    body,
  } = {}
) {
  const headers = {
    "Content-Type": "application/json",
    "X-ADMIN-KEY": adminKey,
  };

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method,
      headers,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }
  );

  const responseText = await response.text();

  let data;

  try {
    data = responseText
      ? JSON.parse(responseText)
      : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      response.statusText ||
      "Error al realizar la solicitud.";

    throw new Error(message);
  }

  return data;
}

export default function AdminMemberForm() {
  const [searchParams] = useSearchParams();

  const adminKey =
    localStorage.getItem("adminKey") || "";

  const initialRut =
    searchParams.get("rut") || "";

  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("create");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    "Completa los datos para crear un nuevo socio."
  );

  const [rut, setRut] = useState(initialRut);

  const [nombreCompleto, setNombreCompleto] =
    useState("");

  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [
    estadoSindicato,
    setEstadoSindicato,
  ] = useState("ACTIVO");

  const [alDiaCuotas, setAlDiaCuotas] =
    useState(true);

  const [
    ultimaCuotaPagada,
    setUltimaCuotaPagada,
  ] = useState("");

  const rutNorm = useMemo(
    () => normalizeRut(rut),
    [rut]
  );

  function limpiar() {
    setRut("");
    setNombreCompleto("");
    setEmail("");
    setTelefono("");
    setEstadoSindicato("ACTIVO");
    setAlDiaCuotas(true);
    setUltimaCuotaPagada("");

    setMode("create");
    setError("");

    setNotice(
      "Formulario preparado para crear un nuevo socio."
    );
  }

  async function buscar(rutBusqueda = rutNorm) {
    const normalizedRut =
      normalizeRut(rutBusqueda);

    setError("");
    setNotice("");

    if (!normalizedRut) {
      setError("Ingresa un RUT para buscar.");
      return;
    }

    setBusy(true);

    try {
      const data = await apiFetch(
        `/api/admin/members/${encodeURIComponent(
          normalizedRut
        )}`,
        {
          adminKey,
        }
      );

      setRut(data?.rut || normalizedRut);

      setNombreCompleto(
        data?.nombreCompleto ||
          data?.displayName ||
          ""
      );

      setEmail(data?.email || "");
      setTelefono(data?.telefono || "");

      setEstadoSindicato(
        data?.estadoSindicato || "ACTIVO"
      );

      setAlDiaCuotas(
        Boolean(data?.alDiaCuotas)
      );

      setUltimaCuotaPagada(
        formatDateCL(
          data?.ultimaCuotaPagada || ""
        )
      );

      setMode("edit");

      setNotice(
        "Socio encontrado. Puedes actualizar sus datos."
      );
    } catch (requestError) {
      setMode("create");

      setNotice(
        "El socio no fue encontrado. Puedes crearlo completando el formulario."
      );

      setError(
        requestError?.message ||
          "No se pudo buscar el socio."
      );
    } finally {
      setBusy(false);
    }
  }

  async function guardar() {
    setError("");
    setNotice("");

    if (!rutNorm) {
      setError("El RUT es obligatorio.");
      return;
    }

    if (!nombreCompleto.trim()) {
      setError(
        "El nombre completo es obligatorio."
      );
      return;
    }

    setBusy(true);

    try {
      const payload = {
        rut: rutNorm,

        nombreCompleto:
          nombreCompleto
            .trim()
            .replace(/\s+/g, " "),

        email: email.trim() || null,

        telefono:
          telefono.trim() || null,

        estadoSindicato:
          String(
            estadoSindicato || "ACTIVO"
          )
            .trim()
            .toUpperCase(),

        alDiaCuotas:
          Boolean(alDiaCuotas),

        ultimaCuotaPagada:
          dateCLToISO(
            ultimaCuotaPagada
          ),
      };

      await apiFetch(
        "/api/admin/members",
        {
          method: "POST",
          adminKey,
          body: payload,
        }
      );

      const actionWasEdit =
        mode === "edit";

      setMode("edit");

      setNotice(
        actionWasEdit
          ? "Socio actualizado correctamente."
          : "Socio creado correctamente."
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No se pudo guardar el socio."
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialRut && adminKey) {
      buscar(initialRut);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!adminKey) {
    return (
      <div style={styles.accessPage}>
        <div style={styles.accessCard}>
          <h2 style={styles.accessTitle}>
            Sesión administrativa requerida
          </h2>

          <p style={styles.accessText}>
            Debes ingresar primero al panel de
            administración.
          </p>

          <Link
            to="/admin"
            style={styles.backLink}
          >
            Ir al panel administrativo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title={
        mode === "edit"
          ? "Editar socio"
          : "Crear socio"
      }
      subtitle="Sindicato Humboldt"
    >
      <div style={styles.page}>
        <div style={styles.topActions}>
          <Link
            to="/admin"
            style={styles.secondaryLink}
          >
            Volver al panel
          </Link>

          <Link
            to="/admin/members"
            style={styles.secondaryLink}
          >
            Ver socios
          </Link>
        </div>

        <section
          className="admin-section-card admin-member-form-card"
          style={styles.sectionCard}
        >
          <div
            className="admin-form-header"
            style={styles.formHeader}
          >
            <div>
              <h2 style={styles.title}>
                {mode === "edit"
                  ? "Editar socio"
                  : "Crear socio"}
              </h2>

              <p style={styles.subtitle}>
                {mode === "edit"
                  ? "Modifica los datos y guarda los cambios."
                  : "Completa los datos del nuevo integrante."}
              </p>
            </div>

            <span
              style={{
                ...styles.modeBadge,
                ...(mode === "edit"
                  ? styles.modeBadgeEdit
                  : styles.modeBadgeCreate),
              }}
            >
              {mode === "edit"
                ? "EDICIÓN"
                : "NUEVO"}
            </span>
          </div>

          {notice ? (
            <div
              role="status"
              style={styles.notice}
            >
              {notice}
            </div>
          ) : null}

          <div
            className="admin-search-area"
            style={styles.searchArea}
          >
            <Input
              id="member-rut"
              name="rut"
              label="RUT"
              value={rut}
              onChange={(event) => {
                setRut(event.target.value);
                setError("");
              }}
              placeholder="Ej: 12.345.678-9"
              autoComplete="off"
              disabled={busy}
            />

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => buscar()}
              disabled={busy}
            >
              {busy
                ? "Procesando..."
                : "Buscar socio"}
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={limpiar}
              disabled={busy}
            >
              Limpiar
            </button>
          </div>

          <div
            className="admin-form-grid"
            style={styles.formGrid}
          >
            <Input
              id="member-name"
              name="nombreCompleto"
              label="Nombre completo"
              value={nombreCompleto}
              onChange={(event) => {
                setNombreCompleto(
                  event.target.value
                );

                setError("");
              }}
              placeholder="Nombre y apellidos"
              autoComplete="name"
              disabled={busy}
              required
            />

            <Input
              id="member-email"
              name="email"
              type="email"
              label="Correo electrónico"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="correo@dominio.com"
              autoComplete="email"
              disabled={busy}
            />

            <Input
              id="member-phone"
              name="telefono"
              label="Teléfono"
              value={telefono}
              onChange={(event) =>
                setTelefono(event.target.value)
              }
              placeholder="+56 9 1234 5678"
              autoComplete="tel"
              disabled={busy}
            />

            <label style={styles.fieldLabel}>
              Estado sindical

              <select
                value={estadoSindicato}
                onChange={(event) =>
                  setEstadoSindicato(
                    event.target.value
                  )
                }
                style={styles.select}
                disabled={busy}
              >
                <option value="ACTIVO">
                  ACTIVO
                </option>

                <option value="SUSPENDIDO">
                  SUSPENDIDO
                </option>

                <option value="RETIRADO">
                  RETIRADO
                </option>

                <option value="PENDIENTE">
                  PENDIENTE
                </option>
              </select>
            </label>

            <Input
              id="member-last-payment"
              name="ultimaCuotaPagada"
              label="Última cuota pagada"
              value={ultimaCuotaPagada}
              onChange={(event) =>
                setUltimaCuotaPagada(
                  event.target.value
                )
              }
              placeholder="DD/MM/AAAA"
              disabled={busy}
            />

            <label style={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={alDiaCuotas}
                onChange={(event) =>
                  setAlDiaCuotas(
                    event.target.checked
                  )
                }
                disabled={busy}
                style={styles.checkbox}
              />

              <span>
                <strong
                  style={styles.checkboxTitle}
                >
                  Cuotas al día
                </strong>

                <span
                  style={
                    styles.checkboxDescription
                  }
                >
                  El socio está al día con sus
                  obligaciones.
                </span>
              </span>
            </label>
          </div>

          {error ? (
            <div
              role="alert"
              style={{
                ...globals.errorBox,
                marginTop: spacing.lg,
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={styles.formActions}>
            <button
              type="button"
              style={styles.saveButton}
              onClick={guardar}
              disabled={busy}
            >
              {busy
                ? "Guardando..."
                : mode === "edit"
                  ? "Actualizar socio"
                  : "Crear socio"}
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: spacing.md,
  },

  topActions: {
    display: "flex",
    justifyContent: "flex-start",
    gap: spacing.sm,
    flexWrap: "wrap",
  },

  secondaryLink: {
    minHeight: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 16px",
    borderRadius: radius.input,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.06)",
    color: colors.text,
    fontWeight: typography.weight.bold,
    textDecoration: "none",
  },

  sectionCard: {
    padding: spacing.lg,
    borderRadius: radius.large,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.045)",
    boxShadow: shadows.small,
  },

  formHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  title: {
    margin: 0,
    color: colors.text,
    fontSize: 24,
    fontWeight: typography.weight.black,
  },

  subtitle: {
    margin: `${spacing.xs}px 0 0`,
    color: colors.textMuted,
    fontSize: typography.size.small,
  },

  modeBadge: {
    padding: "6px 10px",
    borderRadius: radius.circle,
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.black,
  },

  modeBadgeCreate: {
    background: "rgba(92,198,200,0.15)",
    color: colors.accent,
  },

  modeBadgeEdit: {
    background: "rgba(253,186,116,0.16)",
    color: "#FDBA74",
  },

  notice: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.medium,
    border:
      "1px solid rgba(92,198,200,0.22)",
    background: "rgba(92,198,200,0.08)",
    color: colors.textSecondary,
    fontSize: typography.size.small,
  },

  searchArea: {
    display: "grid",
    gridTemplateColumns:
      "minmax(220px, 1fr) auto auto",
    gap: spacing.sm,
    alignItems: "end",
    marginBottom: spacing.lg,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: spacing.md,
  },

  fieldLabel: {
    display: "grid",
    gap: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.size.small,
    fontWeight: typography.weight.bold,
  },

  select: {
    width: "100%",
    minHeight: 46,
    padding: "0 12px",
    boxSizing: "border-box",
    borderRadius: radius.input,
    border: `1px solid ${colors.border}`,
    background: colors.primaryDark,
    color: colors.text,
    fontFamily: "inherit",
    fontSize: typography.size.medium,
  },

  checkboxCard: {
    minHeight: 76,
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    boxSizing: "border-box",
    borderRadius: radius.medium,
    border: `1px solid ${colors.border}`,
    background: "rgba(0,0,0,0.14)",
    cursor: "pointer",
  },

  checkbox: {
    width: 20,
    height: 20,
  },

  checkboxTitle: {
    display: "block",
    color: colors.text,
    fontSize: typography.size.small,
  },

  checkboxDescription: {
    display: "block",
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: typography.size.tiny,
  },

  primaryButton: {
    minHeight: 46,
    padding: "0 18px",
    border: "none",
    borderRadius: radius.input,
    background: colors.accent,
    color: colors.primaryDark,
    fontWeight: typography.weight.black,
    cursor: "pointer",
  },

  secondaryButton: {
    minHeight: 46,
    padding: "0 18px",
    borderRadius: radius.input,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.06)",
    color: colors.text,
    fontWeight: typography.weight.bold,
    cursor: "pointer",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
  },

  saveButton: {
    minWidth: 220,
    minHeight: 48,
    padding: "0 22px",
    border: "none",
    borderRadius: radius.input,
    background: `linear-gradient(
      135deg,
      ${colors.accent},
      ${colors.accentDark}
    )`,
    color: colors.primaryDark,
    boxShadow: shadows.accent,
    fontSize: typography.size.medium,
    fontWeight: typography.weight.black,
    cursor: "pointer",
  },

  accessPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: colors.primaryDark,
  },

  accessCard: {
    maxWidth: 420,
    padding: 24,
    borderRadius: radius.large,
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${colors.border}`,
    textAlign: "center",
  },

  accessTitle: {
    color: colors.text,
  },

  accessText: {
    color: colors.textMuted,
  },

  backLink: {
    display: "inline-flex",
    marginTop: 12,
    padding: "12px 18px",
    borderRadius: radius.input,
    background: colors.accent,
    color: colors.primaryDark,
    textDecoration: "none",
    fontWeight: typography.weight.black,
  },
};
