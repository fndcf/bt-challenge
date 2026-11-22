/**
 * Responsabilidade única: Renderizar cabeçalho da etapa com ações
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { StatusBadge } from "@/components/etapas/StatusBadge";
import { Badge, Button } from "@/components/ui";
import { theme } from "@/styles/theme";
import { Etapa } from "@/types/etapa";
import { getFormatoEtapaLabel } from "@/utils/etapa";
import { formatarData } from "@/utils/formatters";

const { texto } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface EtapaHeaderProps {
  etapa: Etapa;
  onEditar: () => void;
  onExcluir: () => void;
  loadingExcluir?: boolean;
}

const Cabecalho = styled.header`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${theme.spacing[4]};
`;

const Linha = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing[4]};
  width: 100%;
`;

const LinhaTitulo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]} ${theme.spacing[3]};
`;

const Titulo = styled.h1`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize["2xl"]};
  font-weight: ${fontWeight.bold};
  color: ${texto.principal};
`;

const Subtitulo = styled.p`
  margin: ${theme.spacing[2]} 0 0 0;
  color: ${texto.secundario};
`;

const Acoes = styled.div`
  display: flex;
  gap: ${theme.spacing[3]};
`;

export const EtapaHeader: React.FC<EtapaHeaderProps> = ({
  etapa,
  onEditar,
  onExcluir,
  loadingExcluir = false,
}) => {
  const navigate = useNavigate();

  return (
    <Cabecalho>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/etapas")}
      >
        ← Voltar para etapas
      </Button>

      <Linha>
        <div>
          <LinhaTitulo>
            <Titulo>{etapa.nome}</Titulo>
            <StatusBadge status={etapa.status} />
            <Badge formato={etapa.formato}>{getFormatoEtapaLabel(etapa)}</Badge>
          </LinhaTitulo>
          <Subtitulo>
            {formatarData(etapa.dataRealizacao)}
            {etapa.local && ` • ${etapa.local}`}
          </Subtitulo>
        </div>

        <Acoes>
          <Button variant="outline" onClick={onEditar}>
            Editar
          </Button>
          <Button variant="danger" onClick={onExcluir} disabled={loadingExcluir}>
            {loadingExcluir ? "Excluindo..." : "Excluir"}
          </Button>
        </Acoes>
      </Linha>
    </Cabecalho>
  );
};

export default EtapaHeader;
