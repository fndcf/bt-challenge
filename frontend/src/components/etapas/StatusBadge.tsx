import React from "react";
import { StatusEtapa } from "../../types/etapa";

interface StatusBadgeProps {
  status: StatusEtapa;
  className?: string;
}

/**
 * Badge de status da etapa
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case StatusEtapa.INSCRICOES_ABERTAS:
        return {
          label: "Inscrições Abertas",
          className: "bg-green-100 text-green-800 border-green-200",
          icon: "📝",
        };
      case StatusEtapa.INSCRICOES_ENCERRADAS:
        return {
          label: "Inscrições Encerradas",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: "🔒",
        };
      case StatusEtapa.CHAVES_GERADAS:
        return {
          label: "Chaves Geradas",
          className: "bg-blue-100 text-blue-800 border-blue-200",
          icon: "🎯",
        };
      case StatusEtapa.EM_ANDAMENTO:
        return {
          label: "Em Andamento",
          className: "bg-purple-100 text-purple-800 border-purple-200",
          icon: "🎾",
        };
      case StatusEtapa.FINALIZADA:
        return {
          label: "Finalizada",
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "🏆",
        };
      case StatusEtapa.CANCELADA:
        return {
          label: "Cancelada",
          className: "bg-red-100 text-red-800 border-red-200",
          icon: "❌",
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "❓",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.className} ${className}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};
