/**
 * Responsabilidade única: Página 403 - Acesso não autorizado
 */

import React from "react";
import { ShieldAlert } from "lucide-react";
import { useDocumentTitle } from "@/hooks";
import { PaginaErro } from "@/components/layout/PaginaAcesso";

export const Unauthorized: React.FC = () => {
  useDocumentTitle("Acesso Negado");

  return (
    <PaginaErro
      codigo="403"
      titulo="Acesso Negado"
      descricao="Você não tem permissão para acessar esta página."
      icone={<ShieldAlert size={48} />}
    />
  );
};

export default Unauthorized;
