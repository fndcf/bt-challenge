import React from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks";
import "./ErrorPages.css";

const NotFound: React.FC = () => {
  useDocumentTitle("Página Não Encontrada");

  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">404</h1>
        <h2>Página Não Encontrada</h2>
        <p>A página que você está procurando não existe ou foi movida.</p>
        <Link to="/" className="btn-home">
          Voltar para o Início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
