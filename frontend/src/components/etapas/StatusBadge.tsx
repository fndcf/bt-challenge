import React from "react";
import styled from "styled-components";
import { StatusEtapa } from "../../types/etapa";

interface StatusBadgeProps {
  status: StatusEtapa;
  className?: string;
}

// ============== STYLED COMPONENTS ==============

const Badge = styled.span<{ $status: StatusEtapa }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;

  ${(props) => {
    switch (props.$status) {
      case StatusEtapa.INSCRICOES_ABERTAS:
        return `
          background: #dcfce7;
          color: #166534;
          border-color: #bbf7d0;
        `;
      case StatusEtapa.INSCRICOES_ENCERRADAS:
        return `
          background: #fef3c7;
          color: #92400e;
          border-color: #fde68a;
        `;
      case StatusEtapa.CHAVES_GERADAS:
        return `
          background: #dbeafe;
          color: #1e40af;
          border-color: #bfdbfe;
        `;
      case StatusEtapa.EM_ANDAMENTO:
        return `
          background: #f3e8ff;
          color: #6b21a8;
          border-color: #e9d5ff;
        `;
      case StatusEtapa.FINALIZADA:
        return `
          background: #f3f4f6;
          color: #374151;
          border-color: #e5e7eb;
        `;
      case StatusEtapa.CANCELADA:
        return `
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          border-color: #e5e7eb;
        `;
    }
  }}
`;

// ============== COMPONENTE ==============

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case StatusEtapa.INSCRICOES_ABERTAS:
        return {
          label: "Inscrições Abertas",
        };
      case StatusEtapa.INSCRICOES_ENCERRADAS:
        return {
          label: "Inscrições Encerradas",
        };
      case StatusEtapa.CHAVES_GERADAS:
        return {
          label: "Chaves Geradas",
        };
      case StatusEtapa.EM_ANDAMENTO:
        return {
          label: "Em Andamento",
        };
      case StatusEtapa.FINALIZADA:
        return {
          label: "Finalizada",
        };
      case StatusEtapa.CANCELADA:
        return {
          label: "Cancelada",
        };
      case StatusEtapa.FASE_ELIMINATORIA:
        return {
          label: "Fase Eliminatória",
        };
      default:
        return {
          label: status,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge $status={status} className={className}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
