import React from "react";
import { useNavigate } from "react-router-dom";
import { Etapa, StatusEtapa } from "../../types/etapa";
import { NivelJogador } from "../../types/jogador";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EtapaCardProps {
  etapa: Etapa;
}

/**
 * Card de etapa
 */
export const EtapaCard: React.FC<EtapaCardProps> = ({ etapa }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/admin/etapas/${etapa.id}`);
  };

  const formatarData = (data: any) => {
    try {
      // Se for um Timestamp do Firebase (objeto com _seconds)
      if (data && typeof data === "object" && "_seconds" in data) {
        const date = new Date(data._seconds * 1000);
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }

      // Se for uma string ISO
      if (typeof data === "string") {
        return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
      }

      // Se for um Date
      if (data instanceof Date) {
        return format(data, "dd/MM/yyyy", { locale: ptBR });
      }

      return "Data inválida";
    } catch (error) {
      console.error("Erro ao formatar data:", error, data);
      return "Data inválida";
    }
  };

  const calcularProgresso = () => {
    if (etapa.maxJogadores === 0) return 0;
    return Math.round((etapa.totalInscritos / etapa.maxJogadores) * 100);
  };

  const progresso = calcularProgresso();

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{etapa.nome}</h3>
          {etapa.descricao && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {etapa.descricao}
            </p>
          )}
        </div>
        <StatusBadge status={etapa.status} />
      </div>

      {/* Info Principal */}
      <div className="space-y-3 mb-4">
        {/* Data de Realização */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-gray-500 text-xs">Realização</p>
            <p className="font-medium text-gray-900">
              {formatarData(etapa.dataRealizacao)}
            </p>
          </div>
        </div>

        {/* Nível */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">
            {etapa.nivel === NivelJogador.INICIANTE && "🌱"}
            {etapa.nivel === NivelJogador.INTERMEDIARIO && "⚡"}
            {etapa.nivel === NivelJogador.AVANCADO && "🔥"}
            {etapa.nivel === NivelJogador.PROFISSIONAL && "⭐"}
          </span>
          <div>
            <p className="text-gray-500 text-xs">Nível</p>
            <p className="font-medium text-gray-900">
              {etapa.nivel === NivelJogador.INICIANTE && "Iniciante"}
              {etapa.nivel === NivelJogador.INTERMEDIARIO && "Intermediário"}
              {etapa.nivel === NivelJogador.AVANCADO && "Avançado"}
              {etapa.nivel === NivelJogador.PROFISSIONAL && "Profissional"}
            </p>
          </div>
        </div>

        {/* Local */}
        {etapa.local && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-gray-500 text-xs">Local</p>
              <p className="font-medium text-gray-900">{etapa.local}</p>
            </div>
          </div>
        )}

        {/* Inscrições */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">👥</span>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <p className="text-gray-500 text-xs">Inscritos</p>
              <p className="font-medium text-gray-900">
                {etapa.totalInscritos} / {etapa.maxJogadores}
              </p>
            </div>
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  progresso === 100
                    ? "bg-green-500"
                    : progresso >= 75
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {etapa.qtdGrupos && (
            <div className="flex items-center gap-1">
              <span>🎯</span>
              <span>{etapa.qtdGrupos} grupos</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>👤</span>
            <span>{etapa.jogadoresPorGrupo} duplas/grupo</span>
          </div>
        </div>

        {/* Call to Action baseado no status */}
        {etapa.status === StatusEtapa.INSCRICOES_ABERTAS && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/etapas/${etapa.id}`);
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ver detalhes →
          </button>
        )}

        {etapa.status === StatusEtapa.CHAVES_GERADAS && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/etapas/${etapa.id}/chaves`);
            }}
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            Ver chaves →
          </button>
        )}

        {etapa.status === StatusEtapa.FINALIZADA && (
          <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
            <span>🏆</span>
            <span>Concluída</span>
          </div>
        )}
      </div>
    </div>
  );
};
