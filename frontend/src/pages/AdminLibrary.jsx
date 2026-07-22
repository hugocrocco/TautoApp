import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteLibraryDocument,
  listAdminLibraryDocuments,
  saveLibraryDocument,
} from "../services/libraryService";

const EMPTY_FORM = {
  id: null,
  title: "",
  description: "",
  category: "",
  active: true,
  pdf: null,
  pdfOriginalName: "",
};

export default function AdminLibrary() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const adminKey =
    localStorage.getItem("adminKey") || "";

  useEffect(() => {
    if (!adminKey) {
      navigate("/admin", { replace: true });
      return;
    }

    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    setError("");

    try {
      const data =
        await listAdminLibraryDocuments();

      setDocuments(
        Array.isArray(data?.documents)
          ? data.documents
          : []
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
        "No se pudieron cargar los documentos."
      );

      if (
        requestError?.status === 401 ||
        requestError?.status === 403
      ) {
        localStorage.removeItem("adminKey");
      }
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setNotice("");
  }

  function editDocument(document) {
    setForm({
      id: document.id,
      title: document.title || "",
      description: document.description || "",
      category: document.category || "",
      active: Boolean(document.active),
      pdf: null,
      pdfOriginalName:
        document.pdfOriginalName || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function clearForm() {
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    if (!form.category.trim()) {
      setError("La categoría es obligatoria.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const data = await saveLibraryDocument({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
      });

      if (data?.ok === false) {
        throw new Error(
          data?.message || "No se pudo guardar."
        );
      }

      setNotice(
        form.id
          ? "Documento actualizado correctamente."
          : "Documento creado correctamente."
      );

      setForm(EMPTY_FORM);
      await loadDocuments();
    } catch (requestError) {
      setError(
        requestError?.message ||
        "No se pudo guardar el documento."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(document) {
    const confirmed = window.confirm(
      `¿Eliminar "${document.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const data =
        await deleteLibraryDocument(document.id);

      if (data?.ok === false) {
        throw new Error(
          data?.message || "No se pudo eliminar."
        );
      }

      setNotice("Documento eliminado.");
      await loadDocuments();
    } catch (requestError) {
      setError(
        requestError?.message ||
        "No se pudo eliminar el documento."
      );
    }
  }

  const filtered = documents.filter((document) => {
    const value = search.trim().toLowerCase();

    if (!value) return true;

    return [
      document.title,
      document.description,
      document.category,
    ]
      .filter(Boolean)
      .some((item) =>
        String(item).toLowerCase().includes(value)
      );
  });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              Administración
            </div>
            <h1 style={styles.title}>
              Biblioteca
            </h1>
          </div>

          <Link to="/admin" style={styles.backButton}>
            Volver al panel
          </Link>
        </header>

        <form
          onSubmit={handleSubmit}
          style={styles.formCard}
        >
          <h2 style={styles.sectionTitle}>
            {form.id
              ? "Editar documento"
              : "Nuevo documento"}
          </h2>

          <div style={styles.formGrid}>
            <label style={styles.field}>
              <span style={styles.label}>Título</span>
              <input
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value
                  )
                }
                style={styles.input}
                maxLength={180}
                required
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>
                Categoría
              </span>
              <input
                value={form.category}
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value
                  )
                }
                style={styles.input}
                placeholder="Ej.: Reglamentos"
                maxLength={80}
                required
              />
            </label>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>
              Descripción
            </span>
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              style={styles.textarea}
              maxLength={1000}
              rows={4}
            />
          </label>

          <div style={styles.formGrid}>
            <label style={styles.field}>
              <span style={styles.label}>
                Archivo PDF
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  updateField(
                    "pdf",
                    event.target.files?.[0] || null
                  )
                }
                style={styles.fileInput}
              />

              {form.pdfOriginalName ? (
                <small style={styles.help}>
                  Actual: {form.pdfOriginalName}
                </small>
              ) : null}
            </label>

            <label style={styles.checkRow}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  updateField(
                    "active",
                    event.target.checked
                  )
                }
              />
              Documento activo
            </label>
          </div>

          {error ? (
            <div style={styles.error}>{error}</div>
          ) : null}

          {notice ? (
            <div style={styles.notice}>{notice}</div>
          ) : null}

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={saving}
              style={styles.primaryButton}
            >
              {saving
                ? "Guardando..."
                : form.id
                  ? "Guardar cambios"
                  : "Crear documento"}
            </button>

            {form.id ? (
              <button
                type="button"
                onClick={clearForm}
                style={styles.secondaryButton}
              >
                Cancelar edición
              </button>
            ) : null}
          </div>
        </form>

        <section style={styles.listCard}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>
              Documentos cargados
            </h2>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar..."
              style={styles.search}
            />
          </div>

          {loading ? (
            <div style={styles.empty}>
              Cargando documentos...
            </div>
          ) : null}

          {!loading && filtered.length === 0 ? (
            <div style={styles.empty}>
              No hay documentos cargados.
            </div>
          ) : null}

          <div style={styles.list}>
            {filtered.map((document) => (
              <article
                key={document.id}
                style={styles.item}
              >
                <div style={styles.itemContent}>
                  <div style={styles.itemTop}>
                    <strong>{document.title}</strong>

                    <span
                      style={{
                        ...styles.status,
                        ...(document.active
                          ? styles.active
                          : styles.inactive),
                      }}
                    >
                      {document.active
                        ? "Activo"
                        : "Inactivo"}
                    </span>
                  </div>

                  <div style={styles.category}>
                    {document.category}
                  </div>

                  {document.description ? (
                    <p style={styles.description}>
                      {document.description}
                    </p>
                  ) : null}

                  <small style={styles.help}>
                    {document.hasPdf
                      ? document.pdfOriginalName ||
                        "PDF cargado"
                      : "Sin PDF"}
                  </small>
                </div>

                <div style={styles.itemActions}>
                  <button
                    type="button"
                    onClick={() =>
                      editDocument(document)
                    }
                    style={styles.editButton}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(document)
                    }
                    style={styles.deleteButton}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#07182C",
    color: "white",
    padding: "24px 16px 44px",
    fontFamily: "system-ui, sans-serif",
  },
  container: {
    maxWidth: 1000,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  eyebrow: {
    color: "#5CC6C8",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: 900,
  },
  title: {
    margin: "4px 0 0",
    fontSize: 38,
  },
  backButton: {
    textDecoration: "none",
    color: "#07182C",
    background: "#5CC6C8",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 900,
  },
  formCard: {
    background: "#12385A",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
  },
  listCard: {
    background: "#12385A",
    borderRadius: 22,
    padding: 20,
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 22,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 7,
    marginBottom: 14,
  },
  label: {
    fontWeight: 800,
    fontSize: 13,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "12px 13px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    fontSize: 15,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "12px 13px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    fontSize: 15,
    resize: "vertical",
  },
  fileInput: {
    width: "100%",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 800,
    paddingTop: 26,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    border: "none",
    borderRadius: 12,
    padding: "12px 17px",
    background: "#5CC6C8",
    color: "#07182C",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 12,
    padding: "12px 17px",
    background: "transparent",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  error: {
    background: "#7F1D1D",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  notice: {
    background: "#14532D",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  search: {
    minWidth: 220,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "11px 12px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
  },
  list: {
    display: "grid",
    gap: 12,
  },
  item: {
    background: "rgba(255,255,255,0.96)",
    color: "#0F172A",
    borderRadius: 16,
    padding: 15,
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  itemContent: {
    flex: "1 1 500px",
  },
  itemTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  category: {
    marginTop: 6,
    color: "#1E4E75",
    fontSize: 13,
    fontWeight: 900,
  },
  description: {
    margin: "8px 0",
    color: "#475569",
  },
  status: {
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 900,
  },
  active: {
    background: "#DCFCE7",
    color: "#166534",
  },
  inactive: {
    background: "#FEE2E2",
    color: "#991B1B",
  },
  itemActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    border: "none",
    borderRadius: 10,
    padding: "9px 12px",
    background: "#DBEAFE",
    color: "#1E3A8A",
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteButton: {
    border: "none",
    borderRadius: 10,
    padding: "9px 12px",
    background: "#FEE2E2",
    color: "#991B1B",
    fontWeight: 900,
    cursor: "pointer",
  },
  empty: {
    padding: 18,
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
  },
  help: {
    color: "#64748B",
  },
};
