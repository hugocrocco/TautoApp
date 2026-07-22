import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  libraryPdfUrl,
  listLibraryDocuments,
} from "../services/libraryService";

export default function Library() {
  
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await listLibraryDocuments();

        if (!alive) return;

        setDocuments(
          Array.isArray(data?.documents)
            ? data.documents
            : []
        );

        setCategories(
          Array.isArray(data?.categories)
            ? data.categories
            : []
        );
      } catch (requestError) {
        if (!alive) return;

        setError(
          requestError?.message ||
          "No se pudo cargar la biblioteca."
        );
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const filteredDocuments = useMemo(() => {
    const search = query.trim().toLowerCase();

    return documents.filter((document) => {
      const categoryMatches =
        !category ||
        document.category === category;

      const searchMatches =
        !search ||
        [
          document.title,
          document.description,
          document.category,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(search)
          );

      return categoryMatches && searchMatches;
    });
  }, [documents, category, query]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              Sindicato Humboldt
            </div>
            <h1 style={styles.title}>Biblioteca</h1>
            <p style={styles.subtitle}>
              Reglamentos, manuales, convenios y documentos
              importantes para los socios.
            </p>
          </div>

          <Link to="/card" style={styles.backButton}>
            Volver
          </Link>
        </header>

        <section style={styles.filters}>
          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Buscar documento..."
            style={styles.input}
          />

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            style={styles.select}
          >
            <option value="">Todas las categorías</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <div style={styles.message}>
            Cargando biblioteca...
          </div>
        ) : null}

        {error ? (
          <div style={styles.error}>{error}</div>
        ) : null}

        {!loading &&
        !error &&
        filteredDocuments.length === 0 ? (
          <div style={styles.message}>
            No hay documentos disponibles.
          </div>
        ) : null}

        <div style={styles.grid}>
          {filteredDocuments.map((document) => (
            <article
              key={document.id}
              style={styles.card}
            >
              <div style={styles.cardTop}>
                <div style={styles.icon}>📄</div>

                <span style={styles.category}>
                  {document.category}
                </span>
              </div>

              <h2 style={styles.cardTitle}>
                {document.title}
              </h2>

              {document.description ? (
                <p style={styles.description}>
                  {document.description}
                </p>
              ) : null}

              {document.hasPdf ? (
                <a
                  href={libraryPdfUrl(document)}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.downloadButton}
                >
                  Descargar PDF
                </a>
              ) : (
                <div style={styles.noPdf}>
                  Documento sin PDF
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #07182c 0%, #0b1f3a 100%)",
    color: "white",
    padding: "24px 16px 40px",
    fontFamily: "system-ui, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 1000,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    marginBottom: 24,
  },
  eyebrow: {
    color: "#5CC6C8",
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    margin: "6px 0 8px",
    fontSize: "clamp(30px, 7vw, 48px)",
  },
  subtitle: {
    margin: 0,
    maxWidth: 620,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.5,
  },
  backButton: {
    flexShrink: 0,
    textDecoration: "none",
    color: "#07182c",
    background: "#5CC6C8",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 900,
  },
  filters: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.09)",
    color: "white",
    fontSize: 15,
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#12385A",
    color: "white",
    fontSize: 15,
  },
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 16,
  },
  card: {
    minHeight: 230,
    display: "flex",
    flexDirection: "column",
    padding: 18,
    borderRadius: 20,
    background: "rgba(255,255,255,0.97)",
    color: "#0F172A",
    boxShadow: "0 18px 38px rgba(0,0,0,0.24)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    fontSize: 30,
  },
  category: {
    background: "#DBEAFE",
    color: "#1E3A8A",
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 12,
    fontWeight: 900,
  },
  cardTitle: {
    margin: "16px 0 8px",
    fontSize: 20,
  },
  description: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.5,
    flex: 1,
  },
  downloadButton: {
    marginTop: 18,
    display: "block",
    textAlign: "center",
    textDecoration: "none",
    background: "#1E4E75",
    color: "white",
    padding: "11px 14px",
    borderRadius: 12,
    fontWeight: 900,
  },
  noPdf: {
    marginTop: 18,
    textAlign: "center",
    color: "#64748B",
    fontWeight: 700,
  },
  message: {
    padding: 22,
    borderRadius: 16,
    background: "rgba(255,255,255,0.08)",
    textAlign: "center",
  },
  error: {
    padding: 14,
    borderRadius: 14,
    background: "#7F1D1D",
    marginBottom: 18,
  },
};
