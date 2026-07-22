import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AuthLayout, AdminLayout } from "../layouts";
import "./AdminResponsive.css";

import {
  Button,
  PasswordInput,
} from "../components/ui";

import {
  QuickAction,
  StatCard,
} from "../components/admin";

import {
  colors,
  globals,
  radius,
  shadows,
  spacing,
  typography,
} from "../theme";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

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
  };

  if (adminKey) {
    headers["X-ADMIN-KEY"] = adminKey;
  }

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

    const error = new Error(message);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

function extractMembers(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.users)) {
    return data.users;
  }

  if (Array.isArray(data?.members)) {
    return data.members;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}

function getMemberStatus(member) {
  return String(
    member?.estadoSindicato ||
      member?.status ||
      member?.estado ||
      ""
  )
    .trim()
    .toUpperCase();
}

function createActivity(
  type,
  title,
  description
) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    type,
    title,
    description,
    time: new Date().toLocaleTimeString(
      "es-CL",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ),
  };
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem("adminKey") || ""
  );

  const [draftKey, setDraftKey] =
    useState(adminKey);

  const [authError, setAuthError] =
    useState("");

  const [authLoading, setAuthLoading] =
    useState(false);

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  const [notice, setNotice] = useState(
    "Ingresa la clave administrativa para continuar."
  );

  const [members, setMembers] = useState([]);

  const [activity, setActivity] = useState([
    createActivity(
      "info",
      "Panel preparado",
      "El dashboard administrativo está listo."
    ),
  ]);

 const dashboardStats = useMemo(() => {
  const total = members.length;

  const active = members.filter(
    (member) =>
      getMemberStatus(member) === "ACTIVO"
  ).length;

  const suspended = members.filter(
    (member) =>
      getMemberStatus(member) === "SUSPENDIDO"
  ).length;

  const retired = members.filter(
    (member) =>
      getMemberStatus(member) === "RETIRADO"
  ).length;

  const registered = members.filter(
    (member) =>
      member?.usuarioRegistrado === true
  ).length;

  const notRegistered =
    Math.max(total - registered, 0);

  const verifiedEmails = members.filter(
    (member) =>
      member?.emailVerificado === true
  ).length;

  const activePercentage =
    total > 0
      ? Math.round((active / total) * 100)
      : 0;

  const registeredPercentage =
    total > 0
      ? Math.round((registered / total) * 100)
      : 0;

  const verifiedPercentage =
    total > 0
      ? Math.round(
          (verifiedEmails / total) * 100
        )
      : 0;

  return {
    total,
    active,
    suspended,
    retired,
    registered,
    notRegistered,
    verifiedEmails,
    activePercentage,
    registeredPercentage,
    verifiedPercentage,
  };
}, [members]);

  const addActivity = useCallback(
    (type, title, description) => {
      setActivity((current) =>
        [
          createActivity(
            type,
            title,
            description
          ),
          ...current,
        ].slice(0, 6)
      );
    },
    []
  );

  const loadDashboard = useCallback(
    async (key = adminKey) => {
      if (!key) return;

      setDashboardLoading(true);

      try {
        const data = await apiFetch(
          "/api/admin/members",
          {
            adminKey: key,
          }
        );

        setMembers(extractMembers(data));
      } catch (requestError) {
        if (
          requestError.status === 401 ||
          requestError.status === 403
        ) {
          localStorage.removeItem("adminKey");
          setAdminKey("");
          setDraftKey("");
          setAuthError(
            "La clave administrativa ya no es válida."
          );
        }
      } finally {
        setDashboardLoading(false);
      }
    },
    [adminKey]
  );

  async function verifyAdminKey(event) {
    event?.preventDefault();

    const cleanKey = draftKey.trim();

    setAuthError("");
    setAuthLoading(true);

    if (!cleanKey) {
      setAuthError(
        "Ingresa la clave administrativa."
      );
      setAuthLoading(false);
      return;
    }

    try {
      const data = await apiFetch(
        "/api/admin/members",
        {
          adminKey: cleanKey,
        }
      );

      localStorage.setItem(
        "adminKey",
        cleanKey
      );

      setAdminKey(cleanKey);
      setMembers(extractMembers(data));

      setNotice(
        "Acceso concedido. Puedes gestionar el padrón."
      );

      addActivity(
        "success",
        "Sesión administrativa iniciada",
        "Se verificó correctamente la clave."
      );
    } catch (requestError) {
      localStorage.removeItem("adminKey");
      setAdminKey("");

      setAuthError(
        requestError?.message ||
          "La clave es incorrecta o el servidor no está disponible."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("adminKey");

    setAdminKey("");
    setDraftKey("");
    setAuthError("");
    setMembers([]);

    setNotice(
      "Ingresa la clave administrativa para continuar."
    );
  }

  useEffect(() => {
    if (!adminKey) return;

    loadDashboard(adminKey);
  }, [adminKey, loadDashboard]);

  if (!adminKey) {
    return (
      <AuthLayout
        title="Acceso administrativo"
        subtitle="Ingresa la clave para administrar el padrón"
      >
        <div style={styles.adminLogoArea}>
          <div style={styles.adminLogoWrap}>
            <img
              src="/logo-sindicato.png"
              alt="Sindicato Humboldt"
              style={styles.adminLogo}
            />
          </div>
        </div>

        <form
          onSubmit={verifyAdminKey}
          style={styles.authForm}
        >
          <PasswordInput
            id="admin-key"
            name="adminKey"
            label="Clave administrativa"
            value={draftKey}
            onChange={(event) => {
              setDraftKey(
                event.target.value
              );

              setAuthError("");
            }}
            placeholder="Ingresa la clave"
            autoComplete="current-password"
            disabled={authLoading}
            required
          />

          {notice ? (
            <div style={styles.authNotice}>
              {notice}
            </div>
          ) : null}

          {authError ? (
            <div
              role="alert"
              style={globals.errorBox}
            >
              {authError}
            </div>
          ) : null}

          <Button
            type="submit"
            loading={authLoading}
            disabled={
              authLoading ||
              !draftKey.trim()
            }
          >
            {authLoading
              ? "Verificando..."
              : "Entrar al panel"}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AdminLayout
      title="Panel de administración"
      subtitle="Sindicato Humboldt"
      onLogout={logout}
    >
      <div
        className="admin-dashboard"
        style={styles.dashboard}
      >
        <section>
          <div
            className="admin-welcome"
            style={styles.welcome}
          >
            <div>
              <div style={styles.eyebrow}>
                RESUMEN GENERAL
              </div>

              <h2 style={styles.welcomeTitle}>
                Gestión del padrón
              </h2>

              <p style={styles.welcomeText}>
                Consulta el estado de los socios y
                accede rápidamente a las principales
                funciones del sistema.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh-button"
              style={styles.refreshButton}
              onClick={() =>
                loadDashboard(adminKey)
              }
              disabled={dashboardLoading}
            >
              {dashboardLoading
                ? "Actualizando..."
                : "Actualizar datos"}
            </button>
          </div>

          <div
  className="admin-stats-grid"
  style={styles.statsGrid}
>
  <StatCard
    icon="👥"
    label="Total de socios"
    value={dashboardStats.total}
    description="Registros encontrados"
    loading={dashboardLoading}
    tone="default"
  />

  <StatCard
    icon="✓"
    label="Socios activos"
    value={dashboardStats.active}
    description={`${dashboardStats.activePercentage}% del padrón`}
    loading={dashboardLoading}
    tone="success"
  />

  <StatCard
    icon="📱"
    label="Registrados en la App"
    value={dashboardStats.registered}
    description={`${dashboardStats.registeredPercentage}% del padrón`}
    loading={dashboardLoading}
    tone="success"
  />

  <StatCard
    icon="○"
    label="Sin registrar"
    value={dashboardStats.notRegistered}
    description="Aún no crean su cuenta"
    loading={dashboardLoading}
    tone="warning"
  />

  <StatCard
    icon="✉"
    label="Email verificado"
    value={dashboardStats.verifiedEmails}
    description={`${dashboardStats.verifiedPercentage}% del padrón`}
    loading={dashboardLoading}
    tone="default"
  />

  <StatCard
    icon="!"
    label="Suspendidos"
    value={dashboardStats.suspended}
    description="Requieren revisión"
    loading={dashboardLoading}
    tone="warning"
  />

  <StatCard
    icon="×"
    label="Retirados"
    value={dashboardStats.retired}
    description="Socios no vigentes"
    loading={dashboardLoading}
    tone="danger"
  />
</div>
        </section>

        <section
          className="admin-dashboard-columns"
          style={styles.dashboardColumns}
        >
  <div
    className="admin-section-card"
    style={styles.sectionCard}
  >
    <SectionTitle
      title="Estado del padrón"
      subtitle="Distribución de socios activos y no vigentes"
    />

    <div style={styles.chartList}>
      <ProgressChart
        label="Socios activos"
        value={dashboardStats.active}
        total={dashboardStats.total}
        percentage={
          dashboardStats.activePercentage
        }
        tone="success"
      />

      <ProgressChart
        label="Suspendidos"
        value={dashboardStats.suspended}
        total={dashboardStats.total}
        tone="warning"
      />

      <ProgressChart
        label="Retirados"
        value={dashboardStats.retired}
        total={dashboardStats.total}
        tone="danger"
      />
    </div>
  </div>

  <div
    className="admin-section-card"
    style={styles.sectionCard}
  >
    <SectionTitle
      title="Adopción de la aplicación"
      subtitle="Socios que ya crearon su cuenta digital"
    />

    <div style={styles.donutArea}>
      <DonutChart
        percentage={
          dashboardStats.registeredPercentage
        }
      />

      <div style={styles.chartLegend}>
        <LegendItem
          color="#22C55E"
          label="Registrados"
          value={dashboardStats.registered}
        />

        <LegendItem
          color="#6B7280"
          label="Sin registrar"
          value={
            dashboardStats.notRegistered
          }
        />

        <LegendItem
          color="#60A5FA"
          label="Email verificado"
          value={
            dashboardStats.verifiedEmails
          }
        />
      </div>
    </div>
  </div>
</section>

        <section
          className="admin-dashboard-columns"
          style={styles.dashboardColumns}
        >
          <div
            className="admin-section-card"
            style={styles.sectionCard}
          >
            <SectionTitle
              title="Accesos rápidos"
              subtitle="Principales herramientas administrativas"
            />

            <div
              className="admin-actions-grid"
              style={styles.actionsGrid}
            >
              <QuickAction
                icon="＋"
                title="Nuevo socio"
                description="Crear un nuevo registro"
                to="/admin/members/new"
              />

              <QuickAction
                icon="👥"
                title="Ver socios"
                description="Consultar el padrón completo"
                to="/admin/members"
              />

              <QuickAction
                icon="📢"
                title="Mensajes"
                description="Enviar avisos a los socios"
                to="/admin/messages"
              />

              <QuickAction
                icon="🎁"
                title="Beneficios"
                description="Administrar convenios"
                to="/admin/benefits"
              />
            </div>
          </div>

          <div
            className="admin-section-card"
            style={styles.sectionCard}
          >
            <SectionTitle
              title="Actividad reciente"
              subtitle="Acciones realizadas en esta sesión"
            />

            <div
              className="admin-activity-list"
              style={styles.activityList}
            >
              {activity.map((item) => (
                <ActivityItem
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          className="admin-section-card"
          style={styles.sectionCard}
        >
          <SectionTitle
            title="Gestión de socios"
            subtitle="Utiliza las herramientas del panel para administrar el padrón."
          />

          <p style={styles.managementText}>
            Desde este panel puedes acceder al
            listado completo de socios, crear nuevos
            registros, editar información existente,
            administrar beneficios y enviar mensajes.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}

function SectionTitle({
  title,
  subtitle,
}) {
  return (
    <div>
      <h3 style={styles.sectionTitle}>
        {title}
      </h3>

      {subtitle ? (
        <p style={styles.sectionSubtitle}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function ActivityItem({ item }) {
  const iconByType = {
    success: "✓",
    warning: "!",
    danger: "×",
    info: "•",
  };

  return (
    <div
      className="admin-activity-item"
      style={styles.activityItem}
    >
      <div
        aria-hidden="true"
        style={{
          ...styles.activityIcon,
          ...(item.type === "success"
            ? styles.activityIconSuccess
            : {}),
        }}
      >
        {iconByType[item.type] || "•"}
      </div>

      <div style={styles.activityContent}>
        <div style={styles.activityTitle}>
          {item.title}
        </div>

        <div style={styles.activityDescription}>
          {item.description}
        </div>
      </div>

      <div style={styles.activityTime}>
        {item.time}
      </div>
    </div>
  );
}



function ProgressChart({
  label,
  value,
  total,
  percentage,
  tone = "default",
}) {
  const calculatedPercentage =
    percentage !== undefined
      ? percentage
      : total > 0
      ? Math.round((value / total) * 100)
      : 0;

  const colorByTone = {
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    default: "#60A5FA",
  };

  return (
    <div style={styles.progressChart}>
      <div style={styles.progressHeader}>
        <span style={styles.progressLabel}>{label}</span>
        <span style={styles.progressValue}>
          {value} · {calculatedPercentage}%
        </span>
      </div>
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressBar,
            width: `${Math.min(calculatedPercentage,100)}%`,
            background: colorByTone[tone] || colorByTone.default,
          }}
        />
      </div>
    </div>
  );
}

function DonutChart({ percentage }) {
  const safe=Math.max(0,Math.min(100,percentage));
  return (
    <div style={{...styles.donutChart,background:`conic-gradient(#22C55E 0% ${safe}%, rgba(107,114,128,.35) ${safe}% 100%)`}}>
      <div style={styles.donutCenter}>
        <strong style={styles.donutPercentage}>{safe}%</strong>
        <span style={styles.donutLabel}>registrados</span>
      </div>
    </div>
  );
}

function LegendItem({color,label,value}) {
 return (
  <div style={styles.legendItem}>
   <span style={{...styles.legendDot,background:color}}/>
   <span style={styles.legendLabel}>{label}</span>
   <strong style={styles.legendValue}>{value}</strong>
  </div>
 );
}


const styles = {
  adminLogoArea: {
    display: "flex",
    justifyContent: "center",
  },

  adminLogoWrap: {
    width: 104,
    height: 104,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    borderRadius: radius.large,
    background: "rgba(255,255,255,0.10)",
    border: `1px solid ${colors.border}`,
  },

  adminLogo: {
    width: 96,
    height: 96,
    objectFit: "contain",
  },

  authForm: {
    display: "grid",
    gap: spacing.md,
  },

  authNotice: {
    color: colors.textMuted,
    fontSize: typography.size.small,
    lineHeight: 1.5,
    textAlign: "center",
  },

  dashboard: {
    display: "grid",
    gap: spacing.xl,
  },

  welcome: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },

  eyebrow: {
    marginBottom: spacing.xs,
    color: colors.accent,
    fontSize: typography.size.tiny,
    fontWeight: typography.weight.extraBold,
    letterSpacing:
      typography.letterSpacing.extraWide,
  },

  welcomeTitle: {
    margin: 0,
    color: colors.text,
    fontSize: 27,
    fontWeight: typography.weight.black,
  },

  welcomeText: {
    maxWidth: 620,
    margin: `${spacing.sm}px 0 0`,
    color: colors.textMuted,
    fontSize: typography.size.small,
    lineHeight: 1.5,
  },

  refreshButton: {
    minHeight: 42,
    padding: "10px 16px",
    borderRadius: radius.input,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.07)",
    color: colors.text,
    fontFamily: "inherit",
    fontWeight: typography.weight.bold,
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: spacing.md,
  },

  dashboardColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: spacing.lg,
  },

  sectionCard: {
    padding: spacing.lg,
    borderRadius: radius.large,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.045)",
    boxShadow: shadows.small,
  },

  sectionTitle: {
    margin: 0,
    color: colors.text,
    fontSize: typography.size.large,
    fontWeight: typography.weight.black,
  },

  sectionSubtitle: {
    margin: `${spacing.xs}px 0 0`,
    color: colors.textMuted,
    fontSize: typography.size.small,
    lineHeight: 1.4,
  },

  managementText: {
    margin: `${spacing.lg}px 0 0`,
    padding: spacing.md,
    borderRadius: radius.medium,
    border: "1px solid rgba(92,198,200,0.22)",
    background: "rgba(92,198,200,0.08)",
    color: colors.textSecondary,
    fontSize: typography.size.small,
    lineHeight: 1.45,
  },

  actionsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  activityList: {
    display: "grid",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.medium,
    background: "rgba(0,0,0,0.14)",
    border: `1px solid ${colors.border}`,
  },

  activityIcon: {
    width: 34,
    height: 34,
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    borderRadius: radius.circle,
    background: "rgba(147,197,253,0.14)",
    color: "#93C5FD",
    fontWeight: typography.weight.black,
  },

  activityIconSuccess: {
    background: "rgba(134,239,172,0.14)",
    color: "#86EFA9",
  },

  activityContent: {
    minWidth: 0,
    flex: 1,
  },

  activityTitle: {
    color: colors.text,
    fontSize: typography.size.small,
    fontWeight: typography.weight.extraBold,
  },

  activityDescription: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: typography.size.tiny,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  activityTime: {
    color: colors.textMuted,
    fontSize: typography.size.tiny,
  },


  chartList:{display:"grid",gap:spacing.lg,marginTop:spacing.lg},
  progressChart:{display:"grid",gap:spacing.sm},
  progressHeader:{display:"flex",justifyContent:"space-between"},
  progressLabel:{color:colors.textSecondary,fontSize:typography.size.small},
  progressValue:{color:colors.text,fontSize:typography.size.small,fontWeight:typography.weight.bold},
  progressTrack:{height:12,borderRadius:999,overflow:"hidden",background:"rgba(255,255,255,.1)"},
  progressBar:{height:"100%",borderRadius:999},
  donutArea:{display:"flex",gap:spacing.xl,alignItems:"center",justifyContent:"center",flexWrap:"wrap",marginTop:spacing.lg},
  donutChart:{width:180,height:180,borderRadius:"50%",display:"grid",placeItems:"center"},
  donutCenter:{width:120,height:120,borderRadius:"50%",background:colors.background,display:"grid",placeItems:"center"},
  donutPercentage:{fontSize:28,fontWeight:typography.weight.black,color:colors.text},
  donutLabel:{fontSize:typography.size.tiny,color:colors.textMuted},
  chartLegend:{display:"grid",gap:spacing.sm},
  legendItem:{display:"grid",gridTemplateColumns:"12px 1fr auto",gap:spacing.sm,alignItems:"center"},
  legendDot:{width:10,height:10,borderRadius:"50%"},
  legendLabel:{color:colors.textSecondary},
  legendValue:{color:colors.text},

};