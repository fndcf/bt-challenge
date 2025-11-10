import React from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks";
import "./ErrorPages.css";

const Unauthorized: React.FC = () => {
  useDocumentTitle("Acesso Negado");

  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">403</h1>
        <h2>Acesso Negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
        <Link to="/" className="btn-home">
          Voltar para o Início
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
