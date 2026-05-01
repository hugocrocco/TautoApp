import { useState } from "react";
import { Link } from "react-router-dom";

export default function VerifyEmail() {
  const [code, setCode] = useState("");

  const handleVerify = () => {
    if (!code) {
      alert("Ingresa el código");
      return;
    }

    alert("Código ingresado: " + code + "\n(Aún no validamos en backend)");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>Verificar correo</h2>

        <input
          style={styles.input}
          placeholder="Código de verificación"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button style={styles.button} onClick={handleVerify}>
          Verificar
        </button>

        <Link to="/" style={styles.link}>
          Volver
        </Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B1F3A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#12385A",
    padding: 20,
    borderRadius: 20,
    color: "white",
    width: 300,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
    border: "none",
  },
  button: {
    marginTop: 10,
    padding: 10,
    width: "100%",
    borderRadius: 10,
    background: "#5CC6C8",
    border: "none",
    fontWeight: "bold",
  },
  link: {
    display: "block",
    marginTop: 10,
    color: "white",
  },
};