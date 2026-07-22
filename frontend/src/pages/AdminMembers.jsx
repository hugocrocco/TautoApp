import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import "./AdminResponsive.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

const API_URL =
  `${API_BASE}/api/admin/members`;

function getAdminKey() {
  return (
    localStorage.getItem("adminKey") || ""
  );
}

function formatDateCL(value) {
  if (!value) return "Sin dato";

  const text = String(value).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    return text;
  }

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  return match
    ? `${match[3]}/${match[2]}/${match[1]}`
    : text;
}

function normalizeRut(rut) {
  return (rut || "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9K-]/g, "");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
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

function isRegistered(member) {
  return member?.usuarioRegistrado === true;
}

function isFeesUpToDate(member) {
  return member?.alDiaCuotas === true;
}

function getPhotoUrl(member) {
  const directPhoto =
    member?.photoDataUrl ||
    member?.photoDataURL ||
    member?.photoUrl ||
    member?.photo ||
    member?.avatar ||
    member?.profilePhoto ||
    member?.profilePhotoUrl;

  if (
    typeof directPhoto === "string" &&
    directPhoto.trim()
  ) {
    const value = directPhoto.trim();

    if (
      value.startsWith("data:image") ||
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      return value;
    }

    if (value.startsWith("/")) {
      return `${API_BASE}${value}`;
    }
  }

  const rut = normalizeRut(
    member?.rut || ""
  );

  return rut
    ? `${API_BASE}/api/photos/1/${encodeURIComponent(
        rut
      )}`
    : "";
}

function MemberPhoto({ member }) {
  const [imageError, setImageError] =
    useState(false);

  const photoUrl = getPhotoUrl(member);

  const initials = String(
    member?.nombreCompleto ||
      member?.displayName ||
      "Socio"
  )
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  if (!photoUrl || imageError) {
    return (
      <div style={styles.photoFallback}>
        {initials || "S"}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={`Foto de ${
        member?.nombreCompleto ||
        member?.displayName ||
        "socio"
      }`}
      style={styles.memberPhoto}
      onError={() => setImageError(true)}
    />
  );
}

async function fetchMembers(q = "") {
  const adminKey = getAdminKey();

  if (!adminKey) {
    throw new Error(
      "La sesión administrativa no está activa."
    );
  }

  const url = q.trim()
    ? `${API_URL}?q=${encodeURIComponent(
        q.trim()
      )}`
    : API_URL;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-ADMIN-KEY": adminKey,
    },
  });

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
    const message =
      data?.message ||
      response.statusText ||
      "Error al cargar socios";

    throw new Error(
      `${message} (${response.status})`
    );
  }

  return data;
}

function extractMembers(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.members)) {
    return data.members;
  }
  if (Array.isArray(data?.users)) {
    return data.users;
  }
  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}

export default function AdminMembers() {
  const [members, setMembers] =
    useState([]);

  const [q, setQ] = useState("");
  const [filter, setFilter] =
    useState("TODOS");
  const [sortBy, setSortBy] =
    useState("NOMBRE");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [expandedRuts, setExpandedRuts] =
    useState(() => new Set());

  async function loadMembers(search = "") {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data =
        await fetchMembers(search);

      const list =
        extractMembers(data);

      setMembers(list);

      if (list.length === 0) {
        setNotice(
          "No se encontraron socios."
        );
      }
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No se pudo cargar el padrón."
      );

      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers("");
  }, []);

  const stats = useMemo(() => {
    const total = members.length;

    const active = members.filter(
      (member) =>
        getMemberStatus(member) ===
        "ACTIVO"
    ).length;

    const suspended = members.filter(
      (member) =>
        getMemberStatus(member) ===
        "SUSPENDIDO"
    ).length;

    const retired = members.filter(
      (member) =>
        getMemberStatus(member) ===
        "RETIRADO"
    ).length;

    const registered = members.filter(
      isRegistered
    ).length;

    const notRegistered =
      Math.max(total - registered, 0);

    const feesPending = members.filter(
      (member) =>
        !isFeesUpToDate(member)
    ).length;

    return {
      total,
      active,
      suspended,
      retired,
      registered,
      notRegistered,
      feesPending,
    };
  }, [members]);

  const filteredMembers =
    useMemo(() => {
      const search =
        normalizeText(q);

      const result = members.filter(
        (member) => {
          const searchable =
            normalizeText(
              [
                member?.nombreCompleto,
                member?.displayName,
                member?.rut,
                member?.email,
                member?.telefono,
              ].join(" ")
            );

          if (
            search &&
            !searchable.includes(search)
          ) {
            return false;
          }

          const status =
            getMemberStatus(member);

          if (
            filter === "ACTIVOS" &&
            status !== "ACTIVO"
          ) {
            return false;
          }

          if (
            filter === "SUSPENDIDOS" &&
            status !== "SUSPENDIDO"
          ) {
            return false;
          }

          if (
            filter === "RETIRADOS" &&
            status !== "RETIRADO"
          ) {
            return false;
          }

          if (
            filter === "REGISTRADOS" &&
            !isRegistered(member)
          ) {
            return false;
          }

          if (
            filter === "NO_REGISTRADOS" &&
            isRegistered(member)
          ) {
            return false;
          }

          if (
            filter === "CUOTAS_PENDIENTES" &&
            isFeesUpToDate(member)
          ) {
            return false;
          }

          return true;
        }
      );

      return [...result].sort(
        (a, b) => {
          if (sortBy === "RUT") {
            return normalizeRut(
              a?.rut
            ).localeCompare(
              normalizeRut(b?.rut),
              "es"
            );
          }

          if (
            sortBy ===
            "ULTIMA_CUOTA"
          ) {
            const first = String(
              a?.ultimaCuotaPagada || ""
            );

            const second = String(
              b?.ultimaCuotaPagada || ""
            );

            return second.localeCompare(
              first
            );
          }

          const first =
            normalizeText(
              a?.nombreCompleto ||
                a?.displayName
            );

          const second =
            normalizeText(
              b?.nombreCompleto ||
                b?.displayName
            );

          return first.localeCompare(
            second,
            "es"
          );
        }
      );
    }, [members, q, filter, sortBy]);

  const visibleRuts =
    useMemo(
      () =>
        filteredMembers
          .map((member) =>
            normalizeRut(
              member?.rut || ""
            )
          )
          .filter(Boolean),
      [filteredMembers]
    );

  const allExpanded =
    visibleRuts.length > 0 &&
    visibleRuts.every((rut) =>
      expandedRuts.has(rut)
    );

  function handleSearch(event) {
    event.preventDefault();
  }

  function clearSearch() {
    setQ("");
    setFilter("TODOS");
    setSortBy("NOMBRE");
  }

  function toggleMember(rut) {
    setExpandedRuts((current) => {
      const next =
        new Set(current);

      if (next.has(rut)) {
        next.delete(rut);
      } else {
        next.add(rut);
      }

      return next;
    });
  }

  function toggleAllMembers() {
    if (allExpanded) {
      setExpandedRuts(new Set());
      return;
    }

    setExpandedRuts(
      new Set(visibleRuts)
    );
  }

  return (
    <div
      className="members-page"
      style={styles.page}
    >
      <div
        className="members-container"
        style={styles.container}
      >
        <div
          className="members-card"
          style={styles.card}
        >
          <div
            className="members-header"
            style={styles.header}
          >
            <div style={styles.brandRow}>
              <div style={styles.logoWrap}>
                <img
                  src="/logo-sindicato.png"
                  alt="Sindicato Humboldt"
                  style={styles.logo}
                />
              </div>

              <div>
                <div style={styles.org}>
                  Sindicato Humboldt
                </div>

                <div style={styles.orgSub}>
                  Padrón de socios
                </div>
              </div>
            </div>

            <div style={styles.topActions}>
              <Link
                to="/admin"
                style={{
                  textDecoration: "none",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    ...styles.smallBtn,
                    textAlign: "center",
                  }}
                >
                  Volver admin
                </div>
              </Link>

              <button
                type="button"
                style={styles.smallBtn}
                onClick={() =>
                  loadMembers("")
                }
                disabled={loading}
              >
                {loading
                  ? "Cargando..."
                  : "Actualizar"}
              </button>
            </div>
          </div>

          <section style={styles.statsGrid}>
            <MiniStat
              label="Total"
              value={stats.total}
              icon="👥"
            />

            <MiniStat
              label="Activos"
              value={stats.active}
              icon="✓"
            />

            <MiniStat
              label="Registrados"
              value={stats.registered}
              icon="📱"
            />

            <MiniStat
              label="Cuotas pendientes"
              value={stats.feesPending}
              icon="!"
            />
          </section>

          <section style={styles.chartsGrid}>
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>
                Estado del padrón
              </div>

              <ProgressBar
                label="Activos"
                value={stats.active}
                total={stats.total}
                color="#22C55E"
              />

              <ProgressBar
                label="Suspendidos"
                value={stats.suspended}
                total={stats.total}
                color="#F59E0B"
              />

              <ProgressBar
                label="Retirados"
                value={stats.retired}
                total={stats.total}
                color="#EF4444"
              />
            </div>

            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>
                Registro en la aplicación
              </div>

              <div style={styles.donutWrap}>
                <DonutChart
                  value={stats.registered}
                  total={stats.total}
                />

                <div style={styles.legend}>
                  <LegendItem
                    color="#22C55E"
                    label="Registrados"
                    value={stats.registered}
                  />

                  <LegendItem
                    color="#6B7280"
                    label="Sin registrar"
                    value={
                      stats.notRegistered
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <form
            style={styles.searchBox}
            onSubmit={handleSearch}
          >
            <input
              value={q}
              onChange={(event) =>
                setQ(event.target.value)
              }
              style={styles.input}
              placeholder="Buscar por RUT, nombre, email o teléfono"
            />

            <div style={styles.filtersGrid}>
              <select
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target.value
                  )
                }
                style={styles.select}
              >
                <option value="TODOS">
                  Todos los socios
                </option>
                <option value="ACTIVOS">
                  Activos
                </option>
                <option value="SUSPENDIDOS">
                  Suspendidos
                </option>
                <option value="RETIRADOS">
                  Retirados
                </option>
                <option value="REGISTRADOS">
                  Registrados
                </option>
                <option value="NO_REGISTRADOS">
                  No registrados
                </option>
                <option value="CUOTAS_PENDIENTES">
                  Cuotas pendientes
                </option>
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
                }
                style={styles.select}
              >
                <option value="NOMBRE">
                  Ordenar por nombre
                </option>
                <option value="RUT">
                  Ordenar por RUT
                </option>
                <option value="ULTIMA_CUOTA">
                  Última cuota
                </option>
              </select>
            </div>

            <button
              type="button"
              style={styles.clearButton}
              onClick={clearSearch}
              disabled={loading}
            >
              Limpiar búsqueda y filtros
            </button>
          </form>

          <div style={styles.listToolbar}>
            <div style={styles.summary}>
              Resultados visibles:{" "}
              <strong>
                {filteredMembers.length}
              </strong>{" "}
              de{" "}
              <strong>{stats.total}</strong>
            </div>

            <button
              type="button"
              style={
                styles.expandAllButton
              }
              onClick={toggleAllMembers}
              disabled={
                loading ||
                filteredMembers.length === 0
              }
            >
              {allExpanded
                ? "Contraer todo"
                : "Expandir todo"}
            </button>
          </div>

          {error ? (
            <div style={styles.error}>
              {error}
            </div>
          ) : null}

          {notice ? (
            <div style={styles.notice}>
              {notice}
            </div>
          ) : null}

          {!loading &&
          !error &&
          filteredMembers.length === 0 ? (
            <div style={styles.notice}>
              No hay socios que coincidan con los filtros seleccionados.
            </div>
          ) : null}

          <div style={styles.list}>
            {filteredMembers.map(
              (member) => {
                const rut =
                  normalizeRut(
                    member?.rut || ""
                  );

                const editTo =
                  `/admin/members/new?rut=${encodeURIComponent(
                    rut
                  )}`;

                const isExpanded =
                  expandedRuts.has(rut);

                const status =
                  getMemberStatus(
                    member
                  );

                return (
                  <div
                    key={
                      rut ||
                      member?.nombreCompleto
                    }
                    style={
                      styles.memberCard
                    }
                  >
                    <button
                      type="button"
                      style={
                        styles.memberSummaryButton
                      }
                      onClick={() =>
                        toggleMember(rut)
                      }
                      aria-expanded={
                        isExpanded
                      }
                    >
                      <div
                        style={
                          styles.compactIdentity
                        }
                      >
                        <MemberPhoto
                          member={member}
                        />

                        <div
                          style={
                            styles.memberSummaryText
                          }
                        >
                          <div
                            style={
                              styles.memberName
                            }
                          >
                            {member?.nombreCompleto ||
                              member?.displayName ||
                              "Sin nombre"}
                          </div>

                          <div
                            style={
                              styles.memberRut
                            }
                          >
                            RUT:{" "}
                            {member?.rut ||
                              "Sin dato"}
                          </div>

                          <div
                            style={
                              styles.chipsRow
                            }
                          >
                            <StatusChip
                              label={
                                status ||
                                "SIN ESTADO"
                              }
                              type={
                                status ===
                                "ACTIVO"
                                  ? "success"
                                  : status ===
                                      "SUSPENDIDO"
                                    ? "warning"
                                    : "danger"
                              }
                            />

                            <StatusChip
                              label={
                                isRegistered(
                                  member
                                )
                                  ? "REGISTRADO"
                                  : "SIN REGISTRO"
                              }
                              type={
                                isRegistered(
                                  member
                                )
                                  ? "info"
                                  : "muted"
                              }
                            />

                            <StatusChip
                              label={
                                isFeesUpToDate(
                                  member
                                )
                                  ? "CUOTAS AL DÍA"
                                  : "CUOTAS PENDIENTES"
                              }
                              type={
                                isFeesUpToDate(
                                  member
                                )
                                  ? "success"
                                  : "warning"
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <span
                        style={
                          styles.expandIcon
                        }
                      >
                        {isExpanded
                          ? "▲"
                          : "▼"}
                      </span>
                    </button>

                    {isExpanded ? (
                      <div
                        style={
                          styles.memberDetails
                        }
                      >
                        <div
                          style={
                            styles.infoGrid
                          }
                        >
                          <InfoItem
                            label="Email"
                            value={
                              member?.email ||
                              "Sin dato"
                            }
                          />

                          <InfoItem
                            label="Teléfono"
                            value={
                              member?.telefono ||
                              "Sin dato"
                            }
                          />

                          <InfoItem
                            label="Estado de cuotas"
                            value={
                              isFeesUpToDate(
                                member
                              )
                                ? "Al día"
                                : "Pendiente"
                            }
                          />

                          <InfoItem
                            label="Última cuota"
                            value={formatDateCL(
                              member?.ultimaCuotaPagada
                            )}
                          />

                          <InfoItem
                            label="Usuario registrado"
                            value={
                              isRegistered(
                                member
                              )
                                ? "Sí"
                                : "No"
                            }
                          />

                          <InfoItem
                            label="Email verificado"
                            value={
                              member?.emailVerificado
                                ? "Sí"
                                : "No"
                            }
                          />
                        </div>

                        <Link
                          to={editTo}
                          style={
                            styles.editButton
                          }
                        >
                          Editar socio
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}) {
  return (
    <div style={styles.miniStat}>
      <div style={styles.miniStatIcon}>
        {icon}
      </div>

      <div>
        <div style={styles.miniStatValue}>
          {value}
        </div>

        <div style={styles.miniStatLabel}>
          {label}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  total,
  color,
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <div style={styles.progressItem}>
      <div style={styles.progressHeader}>
        <span>{label}</span>

        <strong>
          {value} · {percentage}%
        </strong>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${Math.min(
              percentage,
              100
            )}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function DonutChart({
  value,
  total,
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <div
      style={{
        ...styles.donut,
        background: `conic-gradient(
          #22C55E 0% ${percentage}%,
          #4B5563 ${percentage}% 100%
        )`,
      }}
    >
      <div style={styles.donutCenter}>
        <strong
          style={
            styles.donutPercentage
          }
        >
          {percentage}%
        </strong>

        <span style={styles.donutText}>
          registrados
        </span>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}) {
  return (
    <div style={styles.legendItem}>
      <span
        style={{
          ...styles.legendDot,
          background: color,
        }}
      />

      <span style={styles.legendLabel}>
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  );
}

function StatusChip({
  label,
  type,
}) {
  const tone =
    styles.chipTones[type] ||
    styles.chipTones.muted;

  return (
    <span
      style={{
        ...styles.chip,
        ...tone,
      }}
    >
      {label}
    </span>
  );
}

function InfoItem({
  label,
  value,
}) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.label}>
        {label}
      </span>

      <span>{value}</span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B1F3A",
    padding: 20,
    fontFamily: "system-ui",
  },

  container: {
    maxWidth: 980,
    margin: "0 auto",
  },

  card: {
    borderRadius: 24,
    padding: 16,
    background: "#12385A",
    color: "white",
    boxShadow:
      "0 20px 40px rgba(0,0,0,0.40)",
    boxSizing: "border-box",
  },

  header: {
    marginBottom: 12,
    display: "grid",
    gap: 10,
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 14,
    background:
      "rgba(0,0,0,0.22)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    flex: "0 0 auto",
  },

  logo: {
    width: 90,
    height: 90,
    objectFit: "contain",
  },

  org: {
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 0.4,
  },

  orgSub: {
    fontSize: 11,
    textTransform: "uppercase",
    opacity: 0.9,
    letterSpacing: 1.2,
  },

  topActions: {
    display: "flex",
    gap: 8,
    justifyContent:
      "space-between",
  },

  smallBtn: {
    width: "100%",
    minHeight: 42,
    padding: "10px 12px",
    boxSizing: "border-box",
    borderRadius: 12,
    border:
      "1px solid rgba(255,255,255,0.18)",
    background:
      "rgba(0,0,0,0.22)",
    color: "white",
    fontFamily: "inherit",
    fontWeight: 900,
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
    marginTop: 14,
  },

  miniStat: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    background:
      "rgba(0,0,0,0.18)",
    border:
      "1px solid rgba(255,255,255,0.14)",
  },

  miniStatIcon: {
    width: 38,
    height: 38,
    display: "grid",
    placeItems: "center",
    borderRadius: 12,
    background:
      "rgba(92,198,200,0.18)",
    fontWeight: 900,
  },

  miniStatValue: {
    fontSize: 20,
    fontWeight: 900,
  },

  miniStatLabel: {
    marginTop: 2,
    fontSize: 11,
    opacity: 0.8,
  },

  chartsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
    marginTop: 12,
  },

  chartCard: {
    padding: 14,
    borderRadius: 16,
    background:
      "rgba(0,0,0,0.18)",
    border:
      "1px solid rgba(255,255,255,0.14)",
  },

  chartTitle: {
    marginBottom: 14,
    fontSize: 14,
    fontWeight: 900,
  },

  progressItem: {
    display: "grid",
    gap: 6,
    marginTop: 12,
  },

  progressHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 10,
    fontSize: 12,
  },

  progressTrack: {
    height: 10,
    overflow: "hidden",
    borderRadius: 999,
    background:
      "rgba(255,255,255,0.10)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition:
      "width 350ms ease",
  },

  donutWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-around",
    gap: 18,
    flexWrap: "wrap",
  },

  donut: {
    width: 150,
    height: 150,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
  },

  donutCenter: {
    width: 102,
    height: 102,
    display: "grid",
    placeContent: "center",
    justifyItems: "center",
    borderRadius: "50%",
    background: "#12385A",
  },

  donutPercentage: {
    fontSize: 24,
  },

  donutText: {
    marginTop: 2,
    fontSize: 11,
    opacity: 0.8,
  },

  legend: {
    minWidth: 170,
    display: "grid",
    gap: 8,
  },

  legendItem: {
    display: "grid",
    gridTemplateColumns:
      "12px 1fr auto",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 10,
    background:
      "rgba(0,0,0,0.14)",
    fontSize: 12,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },

  legendLabel: {
    opacity: 0.85,
  },

  searchBox: {
    display: "grid",
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    background:
      "rgba(0,0,0,0.18)",
    border:
      "1px solid rgba(255,255,255,0.14)",
  },

  input: {
    width: "100%",
    padding: 11,
    borderRadius: 10,
    border:
      "1px solid rgba(255,255,255,0.35)",
    background:
      "rgba(15,23,42,0.35)",
    color: "white",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
  },

  filtersGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 10,
  },

  select: {
    width: "100%",
    minHeight: 42,
    padding: "10px 12px",
    borderRadius: 10,
    border:
      "1px solid rgba(255,255,255,0.25)",
    background: "#0F2E4B",
    color: "white",
    fontFamily: "inherit",
    fontWeight: 700,
  },

  clearButton: {
    minHeight: 42,
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "#5CC6C8",
    color: "#0B1F3A",
    fontFamily: "inherit",
    fontWeight: 900,
    cursor: "pointer",
  },

  listToolbar: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  summary: {
    fontSize: 13,
    color: "#F4F1C9",
  },

  expandAllButton: {
    minHeight: 38,
    padding: "8px 12px",
    borderRadius: 10,
    border:
      "1px solid rgba(255,255,255,0.20)",
    background:
      "rgba(0,0,0,0.22)",
    color: "white",
    fontFamily: "inherit",
    fontWeight: 900,
    cursor: "pointer",
  },

  error: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 900,
    color: "#FFE08A",
    background:
      "rgba(0,0,0,0.25)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    padding: "8px 10px",
    borderRadius: 12,
  },

  notice: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#F4F1C9",
    background:
      "rgba(0,0,0,0.20)",
    border:
      "1px solid rgba(255,255,255,0.14)",
    padding: "10px 12px",
    borderRadius: 12,
    lineHeight: 1.4,
  },

  list: {
    display: "grid",
    gap: 8,
    marginTop: 12,
  },

  memberCard: {
    borderRadius: 14,
    background:
      "rgba(0,0,0,0.18)",
    border:
      "1px solid rgba(255,255,255,0.14)",
    overflow: "hidden",
  },

  memberSummaryButton: {
    width: "100%",
    minHeight: 76,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 12,
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    color: "white",
    textAlign: "left",
    fontFamily: "inherit",
    cursor: "pointer",
  },

  compactIdentity: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  memberSummaryText: {
    minWidth: 0,
  },

  expandIcon: {
    flex: "0 0 auto",
    fontSize: 13,
    opacity: 0.85,
  },

  memberDetails: {
    padding: "12px",
    borderTop:
      "1px solid rgba(255,255,255,0.10)",
  },

  memberPhoto: {
    width: 48,
    height: 48,
    flex: "0 0 auto",
    borderRadius: 12,
    objectFit: "cover",
    background:
      "rgba(0,0,0,0.24)",
    border:
      "2px solid rgba(255,255,255,0.28)",
  },

  photoFallback: {
    width: 48,
    height: 48,
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    borderRadius: 12,
    background:
      "rgba(92,198,200,0.20)",
    border:
      "2px solid rgba(92,198,200,0.55)",
    color: "#D9FFFF",
    fontSize: 16,
    fontWeight: 900,
  },

  memberName: {
    fontSize: 15,
    fontWeight: 900,
    overflowWrap: "anywhere",
  },

  memberRut: {
    marginTop: 2,
    fontSize: 11,
    opacity: 0.8,
  },

  chipsRow: {
    display: "flex",
    gap: 6,
    marginTop: 7,
    flexWrap: "wrap",
  },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 22,
    padding: "3px 7px",
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 0.2,
  },

  chipTones: {
    success: {
      background:
        "rgba(34,197,94,0.18)",
      border:
        "1px solid rgba(34,197,94,0.60)",
      color: "#BBF7D0",
    },

    warning: {
      background:
        "rgba(245,158,11,0.18)",
      border:
        "1px solid rgba(245,158,11,0.60)",
      color: "#FDE68A",
    },

    danger: {
      background:
        "rgba(239,68,68,0.18)",
      border:
        "1px solid rgba(239,68,68,0.60)",
      color: "#FECACA",
    },

    info: {
      background:
        "rgba(96,165,250,0.18)",
      border:
        "1px solid rgba(96,165,250,0.60)",
      color: "#DBEAFE",
    },

    muted: {
      background:
        "rgba(107,114,128,0.20)",
      border:
        "1px solid rgba(156,163,175,0.45)",
      color: "#E5E7EB",
    },
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 8,
  },

  infoItem: {
    display: "grid",
    gap: 2,
    fontSize: 12,
    background:
      "rgba(0,0,0,0.14)",
    padding: 9,
    borderRadius: 10,
    wordBreak: "break-word",
  },

  label: {
    opacity: 0.75,
    fontWeight: 800,
    fontSize: 11,
  },

  editButton: {
    display: "block",
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    background: "#5CC6C8",
    color: "#0B1F3A",
    textDecoration: "none",
    textAlign: "center",
    fontWeight: 900,
  },
};