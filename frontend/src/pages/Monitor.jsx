import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

const INSTITUTION_CODE =
  import.meta.env.VITE_INSTITUTION_CODE ||
  "HBDT";

const PERIODS = [
  {
    value: "DAILY",
    label: "Diario",
    description: "Últimos 30 días",
  },
  {
    value: "WEEKLY",
    label: "Semanal",
    description: "Últimas 12 semanas",
  },
  {
    value: "MONTHLY",
    label: "Mensual",
    description: "Últimos 12 meses",
  },
];

function getAdminKey() {
  return localStorage.getItem("adminKey") || "";
}

async function monitorFetch(path) {
  const adminKey = getAdminKey();

  if (!adminKey) {
    const error = new Error(
      "La sesión administrativa no está activa."
    );
    error.status = 401;
    throw error;
  }

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method: "GET",
      headers: {
        "X-ADMIN-KEY": adminKey,
        "X-Institution-Code":
          INSTITUTION_CODE,
      },
    }
  );

  const responseText =
    await response.text();

  let data;

  try {
    data = responseText
      ? JSON.parse(responseText)
      : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        response.statusText ||
        "No se pudo cargar el monitor."
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";

  const date = new Date(
    String(value).replace(" ", "T")
  );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(date);
}

function friendlyEvent(value) {
  const labels = {
    LOGIN_SUCCESS:
      "Inicio de sesión correcto",
    LOGIN_FAILED:
      "Inicio de sesión fallido",
    LOGIN_BLOCKED:
      "Acceso bloqueado",
    QR_GENERATED:
      "QR generado",
    QR_VERIFIED:
      "QR verificado",
    QR_INVALID:
      "QR inválido",
    QR_EXPIRED:
      "QR vencido",
    PHOTO_UPDATED:
      "Fotografía actualizada",
    MEMBER_CREATED:
      "Socio creado",
    MEMBER_UPDATED:
      "Socio actualizado",
    MEMBER_DELETED:
      "Socio eliminado",
    MESSAGE_SENT:
      "Mensaje enviado",
    BENEFIT_CREATED:
      "Beneficio creado",
    BENEFIT_DELETED:
      "Beneficio eliminado",
  };

  return (
    labels[value] ||
    String(value || "Evento")
      .replaceAll("_", " ")
  );
}

function eventTone(eventType, result) {
  const type = String(eventType || "");
  const status = String(result || "");

  if (
    status === "FAILED" ||
    status === "ERROR" ||
    type.includes("FAILED") ||
    type.includes("BLOCKED") ||
    type.includes("INVALID")
  ) {
    return "danger";
  }

  if (
    type.includes("EXPIRED") ||
    status === "WARNING"
  ) {
    return "warning";
  }

  if (
    status === "SUCCESS" ||
    type.includes("SUCCESS") ||
    type.includes("VERIFIED") ||
    type.includes("GENERATED") ||
    type.includes("UPDATED") ||
    type.includes("CREATED")
  ) {
    return "success";
  }

  return "info";
}

export default function Monitor() {
  const navigate = useNavigate();

  const [period, setPeriod] =
    useState("DAILY");

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [exporting, setExporting] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadMonitor = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await monitorFetch(
            `/api/admin/activity/dashboard?period=${encodeURIComponent(
              period
            )}`
          );

        setData(response);
      } catch (requestError) {
        if (
          requestError.status === 401 ||
          requestError.status === 403
        ) {
          localStorage.removeItem(
            "adminKey"
          );

          navigate("/admin", {
            replace: true,
          });

          return;
        }

        setError(
          requestError?.message ||
            "No se pudo cargar el monitor."
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate, period]
  );

  useEffect(() => {
    loadMonitor();
  }, [loadMonitor]);

  async function exportCsv() {
    setExporting(true);
    setError("");

    try {
      const adminKey = getAdminKey();

      const response = await fetch(
        `${API_BASE}/api/admin/activity/export?months=12`,
        {
          headers: {
            "X-ADMIN-KEY": adminKey,
            "X-Institution-Code":
              INSTITUTION_CODE,
          },
        }
      );

      if (!response.ok) {
        let message =
          "No se pudo exportar la actividad.";

        try {
          const body =
            await response.json();
          message =
            body?.message || message;
        } catch {
          // La respuesta puede no ser JSON.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const disposition =
        response.headers.get(
          "content-disposition"
        ) || "";

      const filenameMatch =
        disposition.match(
          /filename="?([^"]+)"?/i
        );

      const filename =
        filenameMatch?.[1] ||
        "actividad-hbdt.csv";

      const downloadUrl =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = filename;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No se pudo exportar la actividad."
      );
    } finally {
      setExporting(false);
    }
  }

  const summary = data?.summary || {};
  const series = Array.isArray(data?.series)
    ? data.series
    : [];

  const recentActivity = Array.isArray(
    data?.recentActivity
  )
    ? data.recentActivity
    : [];

  const alerts = Array.isArray(
    data?.topFailedIps
  )
    ? data.topFailedIps
    : [];

  const activePeriod =
    PERIODS.find(
      (item) => item.value === period
    ) || PERIODS[0];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logoWrap}>
              <img
                src="/logo-sindicato.png"
                alt="Sindicato Humboldt"
                style={styles.logo}
              />
            </div>

            <div>
              <div style={styles.eyebrow}>
                MONITOREO PRIVADO
              </div>

              <h1 style={styles.title}>
                Monitor HBDT
              </h1>

              <p style={styles.subtitle}>
                Actividad y seguridad de la
                credencial digital
              </p>
            </div>
          </div>

          <div style={styles.headerActions}>
            <Link
              to="/admin"
              style={styles.secondaryButton}
            >
              Volver al panel
            </Link>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={loadMonitor}
              disabled={loading}
            >
              {loading
                ? "Actualizando..."
                : "Actualizar"}
            </button>

            <button
              type="button"
              style={styles.exportButton}
              onClick={exportCsv}
              disabled={exporting}
            >
              {exporting
                ? "Exportando..."
                : "Exportar CSV"}
            </button>
          </div>
        </header>

        <section style={styles.toolbar}>
          <div>
            <div style={styles.toolbarTitle}>
              Periodo de las gráficas
            </div>

            <div style={styles.toolbarText}>
              {activePeriod.description}
            </div>
          </div>

          <div style={styles.periodTabs}>
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                style={{
                  ...styles.periodButton,
                  ...(period === item.value
                    ? styles.periodButtonActive
                    : {}),
                }}
                onClick={() =>
                  setPeriod(item.value)
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            style={styles.error}
          >
            {error}
          </div>
        ) : null}

        <section style={styles.kpiGrid}>
          <KpiCard
            icon="⚡"
            label="Eventos hoy"
            value={summary.eventsToday}
            description="Actividad registrada"
            loading={loading}
          />

          <KpiCard
            icon="✓"
            label="Logins correctos"
            value={
              summary.loginSuccessToday
            }
            description="Ingresos exitosos hoy"
            tone="success"
            loading={loading}
          />

          <KpiCard
            icon="▦"
            label="QR generados"
            value={
              summary.qrGeneratedToday
            }
            description="Credenciales temporales"
            tone="info"
            loading={loading}
          />

          <KpiCard
            icon="◎"
            label="QR verificados"
            value={
              summary.qrVerifiedToday
            }
            description="Validaciones correctas"
            tone="success"
            loading={loading}
          />

          <KpiCard
            icon="!"
            label="Intentos fallidos"
            value={
              summary.loginFailedToday
            }
            description="Requieren vigilancia"
            tone="danger"
            loading={loading}
          />

          <KpiCard
            icon="👤"
            label="Usuarios únicos"
            value={
              summary.uniqueUsersToday
            }
            description="Usuarios activos hoy"
            tone="info"
            loading={loading}
          />
        </section>

        <section style={styles.chartCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Evolución de actividad
              </h2>

              <p style={styles.sectionSubtitle}>
                Comparación de eventos,
                accesos y uso del QR
              </p>
            </div>

            <ChartLegend />
          </div>

          <ActivityChart
            rows={series}
            loading={loading}
          />
        </section>

        <section style={styles.columns}>
          <div style={styles.panel}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  Actividad reciente
                </h2>

                <p
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Últimos 100 eventos
                  registrados
                </p>
              </div>

              <span style={styles.counter}>
                {recentActivity.length}
              </span>
            </div>

            <ActivityTable
              rows={recentActivity}
              loading={loading}
            />
          </div>

          <div style={styles.panel}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  Alertas de seguridad
                </h2>

                <p
                  style={
                    styles.sectionSubtitle
                  }
                >
                  IP con tres o más fallos
                  durante 24 horas
                </p>
              </div>

              <span
                style={{
                  ...styles.counter,
                  ...(alerts.length
                    ? styles.counterDanger
                    : {}),
                }}
              >
                {alerts.length}
              </span>
            </div>

            <AlertsList
              rows={alerts}
              loading={loading}
            />

            <div style={styles.retentionBox}>
              <strong>
                Retención de datos
              </strong>

              <span>
                La actividad se conserva en
                MySQL durante 12 meses. Los
                eventos más antiguos se
                eliminan automáticamente.
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  description,
  tone = "default",
  loading,
}) {
  const toneStyle =
    styles.kpiTones[tone] ||
    styles.kpiTones.default;

  return (
    <div style={styles.kpiCard}>
      <div
        style={{
          ...styles.kpiIcon,
          ...toneStyle,
        }}
      >
        {icon}
      </div>

      <div style={styles.kpiLabel}>
        {label}
      </div>

      <div style={styles.kpiValue}>
        {loading
          ? "—"
          : numberValue(value).toLocaleString(
              "es-CL"
            )}
      </div>

      <div style={styles.kpiDescription}>
        {description}
      </div>
    </div>
  );
}

function ActivityChart({
  rows,
  loading,
}) {
  const width = 900;
  const height = 290;
  const paddingLeft = 48;
  const paddingRight = 18;
  const paddingTop = 18;
  const paddingBottom = 56;

  const chartWidth =
    width - paddingLeft - paddingRight;

  const chartHeight =
    height - paddingTop - paddingBottom;

  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        label: String(row?.label || ""),
        total: numberValue(row?.total),
        login: numberValue(
          row?.login_success
        ),
        failed: numberValue(
          row?.login_failed
        ),
        qr: numberValue(
          row?.qr_verified
        ),
      })),
    [rows]
  );

  const maximum = Math.max(
    1,
    ...normalizedRows.flatMap((row) => [
      row.total,
      row.login,
      row.failed,
      row.qr,
    ])
  );

  function pointsFor(key) {
    if (normalizedRows.length === 0) {
      return "";
    }

    return normalizedRows
      .map((row, index) => {
        const x =
          paddingLeft +
          (normalizedRows.length === 1
            ? chartWidth / 2
            : (index /
                (normalizedRows.length -
                  1)) *
              chartWidth);

        const y =
          paddingTop +
          chartHeight -
          (row[key] / maximum) *
            chartHeight;

        return `${x},${y}`;
      })
      .join(" ");
  }

  if (loading) {
    return (
      <div style={styles.chartEmpty}>
        Cargando gráfica...
      </div>
    );
  }

  if (normalizedRows.length === 0) {
    return (
      <div style={styles.chartEmpty}>
        Todavía no existen eventos para
        mostrar.
      </div>
    );
  }

  return (
    <div style={styles.chartScroller}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Gráfico de actividad"
        style={styles.chart}
      >
        {[0, 0.25, 0.5, 0.75, 1].map(
          (step) => {
            const y =
              paddingTop +
              chartHeight -
              step * chartHeight;

            return (
              <g key={step}>
                <line
                  x1={paddingLeft}
                  x2={
                    width - paddingRight
                  }
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,.12)"
                  strokeWidth="1"
                />

                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,.60)"
                  fontSize="11"
                >
                  {Math.round(
                    maximum * step
                  )}
                </text>
              </g>
            );
          }
        )}

        <polyline
          points={pointsFor("total")}
          fill="none"
          stroke="#5CC6C8"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <polyline
          points={pointsFor("login")}
          fill="none"
          stroke="#22C55E"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <polyline
          points={pointsFor("qr")}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <polyline
          points={pointsFor("failed")}
          fill="none"
          stroke="#EF4444"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {normalizedRows.map(
          (row, index) => {
            const x =
              paddingLeft +
              (normalizedRows.length === 1
                ? chartWidth / 2
                : (index /
                    (normalizedRows.length -
                      1)) *
                  chartWidth);

            const showLabel =
              normalizedRows.length <= 12 ||
              index %
                Math.ceil(
                  normalizedRows.length / 8
                ) ===
                0 ||
              index ===
                normalizedRows.length - 1;

            return showLabel ? (
              <text
                key={`${row.label}-${index}`}
                x={x}
                y={height - 20}
                textAnchor="middle"
                fill="rgba(255,255,255,.70)"
                fontSize="10"
              >
                {shortLabel(row.label)}
              </text>
            ) : null;
          }
        )}
      </svg>
    </div>
  );
}

function ChartLegend() {
  return (
    <div style={styles.chartLegend}>
      <Legend color="#5CC6C8" label="Eventos" />
      <Legend color="#22C55E" label="Logins" />
      <Legend color="#60A5FA" label="QR válidos" />
      <Legend color="#EF4444" label="Fallidos" />
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span style={styles.legend}>
      <span
        style={{
          ...styles.legendDot,
          background: color,
        }}
      />
      {label}
    </span>
  );
}

function ActivityTable({
  rows,
  loading,
}) {
  if (loading) {
    return (
      <div style={styles.emptyState}>
        Cargando actividad...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div style={styles.emptyState}>
        No existen eventos registrados.
      </div>
    );
  }

  return (
    <div style={styles.activityList}>
      {rows.map((row, index) => {
        const tone = eventTone(
          row?.event_type,
          row?.result
        );

        return (
          <div
            key={
              row?.id ||
              `${row?.created_at}-${index}`
            }
            style={styles.activityRow}
          >
            <span
              style={{
                ...styles.statusDot,
                ...styles.statusTones[tone],
              }}
            />

            <div style={styles.activityMain}>
              <div
                style={
                  styles.activityTitle
                }
              >
                {friendlyEvent(
                  row?.event_type
                )}
              </div>

              <div
                style={
                  styles.activityDescription
                }
              >
                {row?.display_name ||
                  row?.rut ||
                  "Sistema"}

                {row?.details
                  ? ` · ${row.details}`
                  : ""}
              </div>
            </div>

            <div style={styles.activityMeta}>
              <span>
                {formatDateTime(
                  row?.created_at
                )}
              </span>

              <span>
                {row?.ip_address ||
                  "Sin IP"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlertsList({
  rows,
  loading,
}) {
  if (loading) {
    return (
      <div style={styles.emptyState}>
        Revisando alertas...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div style={styles.safeBox}>
        <span style={styles.safeIcon}>
          ✓
        </span>

        <div>
          <strong>
            Sin alertas críticas
          </strong>

          <p>
            No hay direcciones IP con tres
            o más intentos fallidos en las
            últimas 24 horas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.alertList}>
      {rows.map((row, index) => (
        <div
          key={`${row?.ip}-${index}`}
          style={styles.alertRow}
        >
          <div style={styles.alertIcon}>
            !
          </div>

          <div style={styles.alertContent}>
            <strong>
              Intentos fallidos repetidos
            </strong>

            <span>
              IP: {row?.ip || "Sin IP"}
            </span>
          </div>

          <div style={styles.alertCount}>
            {numberValue(
              row?.attempts
            )}{" "}
            intentos
          </div>
        </div>
      ))}
    </div>
  );
}

function shortLabel(value) {
  const text = String(value || "");

  const monthMatch = text.match(
    /^(\d{4})-(\d{2})$/
  );

  if (monthMatch) {
    return `${monthMatch[2]}/${monthMatch[1].slice(
      2
    )}`;
  }

  const dateMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (dateMatch) {
    return `${dateMatch[3]}/${dateMatch[2]}`;
  }

  return text.slice(0, 10);
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 20,
    boxSizing: "border-box",
    background:
      "linear-gradient(180deg, #07182C 0%, #0B1F3A 100%)",
    color: "#FFFFFF",
    fontFamily: "system-ui, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    display: "grid",
    gap: 18,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
    padding: 20,
    borderRadius: 22,
    background: "#12385A",
    border:
      "1px solid rgba(255,255,255,.14)",
    boxShadow:
      "0 18px 40px rgba(0,0,0,.28)",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  logoWrap: {
    width: 74,
    height: 74,
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    borderRadius: 18,
    background:
      "rgba(255,255,255,.09)",
    border:
      "1px solid rgba(255,255,255,.18)",
  },

  logo: {
    width: 68,
    height: 68,
    objectFit: "contain",
  },

  eyebrow: {
    marginBottom: 4,
    color: "#5CC6C8",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.6,
  },

  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.1,
  },

  subtitle: {
    margin: "6px 0 0",
    color: "rgba(255,255,255,.72)",
    fontSize: 13,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    flexWrap: "wrap",
  },

  secondaryButton: {
    minHeight: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    boxSizing: "border-box",
    borderRadius: 12,
    border:
      "1px solid rgba(255,255,255,.20)",
    background:
      "rgba(0,0,0,.18)",
    color: "#FFFFFF",
    textDecoration: "none",
    fontFamily: "inherit",
    fontWeight: 900,
    cursor: "pointer",
  },

  exportButton: {
    minHeight: 42,
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    background: "#5CC6C8",
    color: "#07182C",
    fontFamily: "inherit",
    fontWeight: 900,
    cursor: "pointer",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    padding: 16,
    borderRadius: 18,
    background:
      "rgba(18,56,90,.72)",
    border:
      "1px solid rgba(255,255,255,.12)",
  },

  toolbarTitle: {
    fontWeight: 900,
  },

  toolbarText: {
    marginTop: 3,
    color: "rgba(255,255,255,.65)",
    fontSize: 12,
  },

  periodTabs: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(86px, 1fr))",
    gap: 7,
  },

  periodButton: {
    minHeight: 40,
    padding: "9px 13px",
    borderRadius: 11,
    border:
      "1px solid rgba(255,255,255,.16)",
    background:
      "rgba(0,0,0,.17)",
    color: "#FFFFFF",
    fontFamily: "inherit",
    fontWeight: 800,
    cursor: "pointer",
  },

  periodButtonActive: {
    background: "#5CC6C8",
    color: "#07182C",
    borderColor: "#5CC6C8",
  },

  error: {
    padding: 13,
    borderRadius: 14,
    background:
      "rgba(127,29,29,.82)",
    border:
      "1px solid rgba(254,202,202,.34)",
    color: "#FEE2E2",
    fontWeight: 800,
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },

  kpiCard: {
    minHeight: 150,
    padding: 16,
    boxSizing: "border-box",
    borderRadius: 18,
    background:
      "rgba(18,56,90,.82)",
    border:
      "1px solid rgba(255,255,255,.12)",
    boxShadow:
      "0 12px 25px rgba(0,0,0,.18)",
  },

  kpiIcon: {
    width: 38,
    height: 38,
    display: "grid",
    placeItems: "center",
    marginBottom: 13,
    borderRadius: 12,
    fontWeight: 900,
  },

  kpiTones: {
    default: {
      background:
        "rgba(92,198,200,.17)",
      color: "#A5F3FC",
    },
    success: {
      background:
        "rgba(34,197,94,.18)",
      color: "#BBF7D0",
    },
    info: {
      background:
        "rgba(96,165,250,.18)",
      color: "#DBEAFE",
    },
    danger: {
      background:
        "rgba(239,68,68,.18)",
      color: "#FECACA",
    },
  },

  kpiLabel: {
    color: "rgba(255,255,255,.68)",
    fontSize: 12,
    fontWeight: 800,
  },

  kpiValue: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: 950,
  },

  kpiDescription: {
    marginTop: 4,
    color: "rgba(255,255,255,.58)",
    fontSize: 11,
  },

  chartCard: {
    padding: 18,
    borderRadius: 20,
    background:
      "rgba(18,56,90,.82)",
    border:
      "1px solid rgba(255,255,255,.12)",
    overflow: "hidden",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },

  sectionTitle: {
    margin: 0,
    fontSize: 18,
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "rgba(255,255,255,.62)",
    fontSize: 12,
  },

  chartLegend: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  legend: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "rgba(255,255,255,.75)",
    fontSize: 11,
    fontWeight: 800,
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
  },

  chartScroller: {
    marginTop: 16,
    overflowX: "auto",
  },

  chart: {
    display: "block",
    width: "100%",
    minWidth: 720,
    height: "auto",
  },

  chartEmpty: {
    minHeight: 260,
    display: "grid",
    placeItems: "center",
    color: "rgba(255,255,255,.62)",
  },

  columns: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.65fr) minmax(290px, .85fr)",
    gap: 16,
  },

  panel: {
    minWidth: 0,
    padding: 18,
    borderRadius: 20,
    background:
      "rgba(18,56,90,.82)",
    border:
      "1px solid rgba(255,255,255,.12)",
  },

  counter: {
    minWidth: 34,
    height: 30,
    display: "grid",
    placeItems: "center",
    padding: "0 8px",
    borderRadius: 999,
    background:
      "rgba(92,198,200,.16)",
    color: "#A5F3FC",
    fontSize: 12,
    fontWeight: 900,
  },

  counterDanger: {
    background:
      "rgba(239,68,68,.18)",
    color: "#FECACA",
  },

  activityList: {
    display: "grid",
    gap: 8,
    maxHeight: 520,
    marginTop: 15,
    overflowY: "auto",
    paddingRight: 3,
  },

  activityRow: {
    display: "grid",
    gridTemplateColumns:
      "12px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 13,
    background:
      "rgba(0,0,0,.15)",
    border:
      "1px solid rgba(255,255,255,.08)",
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },

  statusTones: {
    success: {
      background: "#22C55E",
    },
    danger: {
      background: "#EF4444",
    },
    warning: {
      background: "#F59E0B",
    },
    info: {
      background: "#60A5FA",
    },
  },

  activityMain: {
    minWidth: 0,
  },

  activityTitle: {
    fontSize: 12,
    fontWeight: 900,
  },

  activityDescription: {
    marginTop: 3,
    color: "rgba(255,255,255,.62)",
    fontSize: 11,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  activityMeta: {
    display: "grid",
    justifyItems: "end",
    gap: 3,
    color: "rgba(255,255,255,.54)",
    fontSize: 10,
  },

  emptyState: {
    minHeight: 150,
    display: "grid",
    placeItems: "center",
    marginTop: 14,
    borderRadius: 14,
    background:
      "rgba(0,0,0,.14)",
    color: "rgba(255,255,255,.62)",
    textAlign: "center",
  },

  alertList: {
    display: "grid",
    gap: 9,
    marginTop: 15,
  },

  alertRow: {
    display: "grid",
    gridTemplateColumns:
      "36px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 13,
    background:
      "rgba(127,29,29,.32)",
    border:
      "1px solid rgba(239,68,68,.32)",
  },

  alertIcon: {
    width: 34,
    height: 34,
    display: "grid",
    placeItems: "center",
    borderRadius: 11,
    background:
      "rgba(239,68,68,.21)",
    color: "#FECACA",
    fontWeight: 950,
  },

  alertContent: {
    minWidth: 0,
    display: "grid",
    gap: 3,
    fontSize: 12,
  },

  alertCount: {
    color: "#FECACA",
    fontSize: 11,
    fontWeight: 900,
  },

  safeBox: {
    display: "flex",
    gap: 12,
    marginTop: 15,
    padding: 15,
    borderRadius: 15,
    background:
      "rgba(22,101,52,.25)",
    border:
      "1px solid rgba(34,197,94,.27)",
  },

  safeIcon: {
    width: 38,
    height: 38,
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    borderRadius: 12,
    background:
      "rgba(34,197,94,.20)",
    color: "#BBF7D0",
    fontWeight: 950,
  },

  retentionBox: {
    display: "grid",
    gap: 5,
    marginTop: 15,
    padding: 13,
    borderRadius: 14,
    background:
      "rgba(96,165,250,.10)",
    border:
      "1px solid rgba(96,165,250,.20)",
    color: "rgba(255,255,255,.67)",
    fontSize: 11,
    lineHeight: 1.45,
  },
};

if (
  typeof window !== "undefined" &&
  !document.getElementById(
    "monitor-responsive-style"
  )
) {
  const style =
    document.createElement("style");

  style.id =
    "monitor-responsive-style";

  style.textContent = `
    @media (max-width: 880px) {
      .monitor-columns-placeholder {}
    }

    @media (max-width: 760px) {
      body {
        overflow-x: hidden;
      }
    }
  `;

  document.head.appendChild(style);
}