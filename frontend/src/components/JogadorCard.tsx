import React from "react";
import { Jogador, NivelJogador, StatusJogador } from "../types/jogador";
import "./JogadorCard.css";

interface JogadorCardProps {
  jogador: Jogador;
  onEdit?: (jogador: Jogador) => void;
  onDelete?: (jogador: Jogador) => void;
  onView?: (jogador: Jogador) => void;
}

const JogadorCard: React.FC<JogadorCardProps> = ({
  jogador,
  onEdit,
  onDelete,
  onView,
}) => {
  /**
   * Retorna emoji e cor para cada nível
   */
  const getNivelInfo = (nivel: NivelJogador) => {
    const niveis = {
      [NivelJogador.INICIANTE]: {
        emoji: "🌱",
        cor: "#4caf50",
        label: "Iniciante",
      },
      [NivelJogador.INTERMEDIARIO]: {
        emoji: "⚡",
        cor: "#2196f3",
        label: "Intermediário",
      },
      [NivelJogador.AVANCADO]: {
        emoji: "🔥",
        cor: "#ff9800",
        label: "Avançado",
      },
      [NivelJogador.PROFISSIONAL]: {
        emoji: "⭐",
        cor: "#9c27b0",
        label: "Profissional",
      },
    };
    return niveis[nivel] || niveis[NivelJogador.INICIANTE];
  };

  /**
   * Retorna badge para status
   */
  const getStatusBadge = (status: StatusJogador) => {
    const badges = {
      [StatusJogador.ATIVO]: {
        emoji: "✅",
        label: "Ativo",
        classe: "status-ativo",
      },
      [StatusJogador.INATIVO]: {
        emoji: "⏸️",
        label: "Inativo",
        classe: "status-inativo",
      },
      [StatusJogador.SUSPENSO]: {
        emoji: "🚫",
        label: "Suspenso",
        classe: "status-suspenso",
      },
    };
    return badges[status] || badges[StatusJogador.ATIVO];
  };

  /**
   * Formatar telefone
   */
  const formatarTelefone = (telefone?: string) => {
    if (!telefone) return "-";
    return telefone;
  };

  const nivelInfo = getNivelInfo(jogador.nivel);
  const statusBadge = getStatusBadge(jogador.status);

  return (
    <div className="jogador-card">
      {/* Header */}
      <div className="jogador-card-header">
        <div className="jogador-avatar">
          {jogador.fotoUrl ? (
            <img src={jogador.fotoUrl} alt={jogador.nome} />
          ) : (
            <div className="avatar-placeholder">
              {jogador.nome.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="jogador-info">
          <h3 className="jogador-nome">{jogador.nome}</h3>
          <div className="jogador-badges">
            <span
              className="nivel-badge"
              style={{
                backgroundColor: `${nivelInfo.cor}20`,
                color: nivelInfo.cor,
              }}
            >
              {nivelInfo.emoji} {nivelInfo.label}
            </span>
            <span className={`status-badge ${statusBadge.classe}`}>
              {statusBadge.emoji} {statusBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="jogador-card-body">
        {/* Contato */}
        {(jogador.email || jogador.telefone) && (
          <div className="jogador-contato">
            {jogador.email && (
              <div className="contato-item">
                <span className="contato-icon">📧</span>
                <span className="contato-texto">{jogador.email}</span>
              </div>
            )}
            {jogador.telefone && (
              <div className="contato-item">
                <span className="contato-icon">📱</span>
                <span className="contato-texto">
                  {formatarTelefone(jogador.telefone)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Estatísticas */}
        <div className="jogador-stats">
          <div className="stat-item">
            <span className="stat-icon">🏆</span>
            <div className="stat-info">
              <span className="stat-value">{jogador.vitorias || 0}</span>
              <span className="stat-label">Vitórias</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">❌</span>
            <div className="stat-info">
              <span className="stat-value">{jogador.derrotas || 0}</span>
              <span className="stat-label">Derrotas</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <div className="stat-info">
              <span className="stat-value">{jogador.pontos || 0}</span>
              <span className="stat-label">Pontos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Ações */}
      <div className="jogador-card-footer">
        {onView && (
          <button
            className="btn-action btn-view"
            onClick={() => onView(jogador)}
            title="Ver detalhes"
          >
            👁️ Ver
          </button>
        )}
        {onEdit && (
          <button
            className="btn-action btn-edit"
            onClick={() => onEdit(jogador)}
            title="Editar jogador"
          >
            ✏️ Editar
          </button>
        )}
        {onDelete && (
          <button
            className="btn-action btn-delete"
            onClick={() => onDelete(jogador)}
            title="Deletar jogador"
          >
            🗑️ Deletar
          </button>
        )}
      </div>
    </div>
  );
};

export default JogadorCard;
