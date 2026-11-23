/**
 * Responsabilidade única: Página 404 - Rota não encontrada
 */

import React from "react";
import { useDocumentTitle } from "@/hooks";
import { PaginaErro } from "@/components/layout/PaginaAcesso";

export const NotFound: React.FC = () => {
  useDocumentTitle("Página não encontrada");

  return (
    <PaginaErro
      codigo="404"
      titulo="Página não encontrada"
      descricao="Desculpe, a página que você está procurando não existe ou foi movida."
    />
  );
};

export default NotFound;
