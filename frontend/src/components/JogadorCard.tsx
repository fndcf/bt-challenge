import React from "react";
import styled from "styled-components";
import { Jogador, NivelJogador, StatusJogador } from "../types/jogador";

interface JogadorCardProps {
  jogador: Jogador;
  onEdit?: (jogador: Jogador) => void;
  onDelete?: (jogador: Jogador) => void;
  onView?: (jogador: Jogador) => void;
}

// ============== STYLED COMPONENTS ==============

const Card = styled.div`
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const Header = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  border-bottom: 1px solid #e5e7eb;
`;

const AvatarContainer = styled.div`
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const AvatarPlaceholder = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const InfoContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

const Nome = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BadgesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const NivelBadge = styled.span<{ $cor: string }>`
  background: ${(props) => `${props.$cor}20`};
  color: ${(props) => props.$cor};
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const StatusBadge = styled.span<{ $status: StatusJogador }>`
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  ${(props) => {
    switch (props.$status) {
      case StatusJogador.ATIVO:
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case StatusJogador.INATIVO:
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case StatusJogador.SUSPENSO:
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #6b7280;
        `;
    }
  }}
`;

const Body = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ContatoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ContatoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const ContatoIcon = styled.span`
  font-size: 1rem;
  flex-shrink: 0;
`;

const ContatoTexto = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const StatIcon = styled.span`
  font-size: 1.5rem;
`;

const StatValue = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
`;

const StatLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Footer = styled.div`
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant: "view" | "edit" | "delete" }>`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;

  ${(props) => {
    switch (props.$variant) {
      case "view":
        return `
          background: white;
          color: #3b82f6;
          border-color: #3b82f6;
          
          &:hover {
            background: #3b82f6;
            color: white;
          }
        `;
      case "edit":
        return `
          background: white;
          color: #f59e0b;
          border-color: #f59e0b;
          
          &:hover {
            background: #f59e0b;
            color: white;
          }
        `;
      case "delete":
        return `
          background: white;
          color: #dc2626;
          border-color: #dc2626;
          
          &:hover {
            background: #dc2626;
            color: white;
          }
        `;
    }
  }}
`;

// ============== HELPER FUNCTIONS ==============

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

const getStatusBadge = (status: StatusJogador) => {
  const badges = {
    [StatusJogador.ATIVO]: {
      emoji: "✅",
      label: "Ativo",
    },
    [StatusJogador.INATIVO]: {
      emoji: "⏸️",
      label: "Inativo",
    },
    [StatusJogador.SUSPENSO]: {
      emoji: "🚫",
      label: "Suspenso",
    },
  };
  return badges[status] || badges[StatusJogador.ATIVO];
};

const formatarTelefone = (telefone?: string) => {
  if (!telefone) return "-";
  return telefone;
};

// ============== COMPONENTE ==============

const JogadorCard: React.FC<JogadorCardProps> = ({
  jogador,
  onEdit,
  onDelete,
  onView,
}) => {
  const nivelInfo = getNivelInfo(jogador.nivel);
  const statusBadge = getStatusBadge(jogador.status);

  return (
    <Card>
      <Header>
        <AvatarContainer>
          {jogador.fotoUrl ? (
            <Avatar src={jogador.fotoUrl} alt={jogador.nome} />
          ) : (
            <AvatarPlaceholder>
              {jogador.nome.charAt(0).toUpperCase()}
            </AvatarPlaceholder>
          )}
        </AvatarContainer>

        <InfoContainer>
          <Nome>{jogador.nome}</Nome>
          <BadgesRow>
            <NivelBadge $cor={nivelInfo.cor}>
              {nivelInfo.emoji} {nivelInfo.label}
            </NivelBadge>
            <StatusBadge $status={jogador.status}>
              {statusBadge.emoji} {statusBadge.label}
            </StatusBadge>
          </BadgesRow>
        </InfoContainer>
      </Header>

      <Body>
        {(jogador.email || jogador.telefone) && (
          <ContatoSection>
            {jogador.email && (
              <ContatoItem>
                <ContatoIcon>📧</ContatoIcon>
                <ContatoTexto>{jogador.email}</ContatoTexto>
              </ContatoItem>
            )}
            {jogador.telefone && (
              <ContatoItem>
                <ContatoIcon>📱</ContatoIcon>
                <ContatoTexto>
                  {formatarTelefone(jogador.telefone)}
                </ContatoTexto>
              </ContatoItem>
            )}
          </ContatoSection>
        )}

        <StatsGrid>
          <StatItem>
            <StatIcon>🏆</StatIcon>
            <StatValue>{jogador.vitorias || 0}</StatValue>
            <StatLabel>Vitórias</StatLabel>
          </StatItem>
          <StatItem>
            <StatIcon>❌</StatIcon>
            <StatValue>{jogador.derrotas || 0}</StatValue>
            <StatLabel>Derrotas</StatLabel>
          </StatItem>
          <StatItem>
            <StatIcon>⭐</StatIcon>
            <StatValue>{jogador.pontos || 0}</StatValue>
            <StatLabel>Pontos</StatLabel>
          </StatItem>
        </StatsGrid>
      </Body>

      <Footer>
        {onView && (
          <ActionButton
            $variant="view"
            onClick={() => onView(jogador)}
            title="Ver detalhes"
          >
            👁️ Ver
          </ActionButton>
        )}
        {onEdit && (
          <ActionButton
            $variant="edit"
            onClick={() => onEdit(jogador)}
            title="Editar jogador"
          >
            ✏️ Editar
          </ActionButton>
        )}
        {onDelete && (
          <ActionButton
            $variant="delete"
            onClick={() => onDelete(jogador)}
            title="Deletar jogador"
          >
            🗑️ Deletar
          </ActionButton>
        )}
      </Footer>
    </Card>
  );
};

export default JogadorCard;
