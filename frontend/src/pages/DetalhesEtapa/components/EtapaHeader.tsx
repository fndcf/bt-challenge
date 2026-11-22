/**
 * Responsabilidade única: Renderizar cabeçalho da etapa com ações
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/etapas/StatusBadge";
import { CabecalhoPagina } from "@/components/layout/Pagina";
import { Badge, Button } from "@/components/ui";
import { Etapa } from "@/types/etapa";
import { getFormatoEtapaLabel } from "@/utils/etapa";
import { formatarData } from "@/utils/formatters";

interface EtapaHeaderProps {
  etapa: Etapa;
  onEditar: () => void;
  onExcluir: () => void;
  loadingExcluir?: boolean;
}

export const EtapaHeader: React.FC<EtapaHeaderProps> = ({
  etapa,
  onEditar,
  onExcluir,
  loadingExcluir = false,
}) => {
  const navigate = useNavigate();

  return (
    <CabecalhoPagina
      titulo={etapa.nome}
      subtitulo={
        <>
          {formatarData(etapa.dataRealizacao)}
          {etapa.local && ` • ${etapa.local}`}
        </>
      }
      selos={
        <>
          <StatusBadge status={etapa.status} />
          <Badge formato={etapa.formato}>{getFormatoEtapaLabel(etapa)}</Badge>
        </>
      }
      voltar={{
        rotulo: "← Voltar para etapas",
        onClick: () => navigate("/admin/etapas"),
      }}
      acoes={
        <>
          <Button variant="outline" onClick={onEditar}>
            Editar
          </Button>
          <Button variant="danger" onClick={onExcluir} disabled={loadingExcluir}>
            {loadingExcluir ? "Excluindo..." : "Excluir"}
          </Button>
        </>
      }
    />
  );
};

export default EtapaHeader;
