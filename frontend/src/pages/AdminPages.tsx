import React from "react";
import { useDocumentTitle } from "../hooks";

export const Ranking: React.FC = () => {
  useDocumentTitle("Ranking");

  return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>📈</h1>
      <h2 style={{ color: "#4facfe", marginBottom: "1rem" }}>Ranking</h2>
      <p style={{ color: "#666", fontSize: "1.1rem" }}>
        Em breve você visualizará o ranking e estatísticas dos jogadores
      </p>
      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: "#f5f7fa",
          borderRadius: "10px",
          display: "inline-block",
        }}
      >
        <p style={{ color: "#999", fontSize: "0.95rem", margin: 0 }}>
          📝 Funcionalidade será implementada na <strong>Etapa 6</strong>
        </p>
      </div>
    </div>
  );
};
