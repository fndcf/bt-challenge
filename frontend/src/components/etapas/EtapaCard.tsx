import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Etapa, StatusEtapa } from "../../types/etapa";
import { GeneroJogador, NivelJogador } from "../../types/jogador";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EtapaCardProps {
  etapa: Etapa;
}

// ============== STYLED COMPONENTS ==============

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #2563eb;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const HeaderContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconWrapper = styled.span`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const InfoLabel = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.125rem 0;
`;

const InfoValue = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

// Inscrições com barra de progresso
const InscricoesContainer = styled.div`
  flex: 1;
`;

const InscricoesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
  width: ${(props) => props.$progress}%;
  background: ${(props) =>
    props.$progress === 100
      ? "#10b981"
      : props.$progress >= 75
      ? "#f59e0b"
      : "#3b82f6"};
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FooterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
  flex-wrap: wrap;
`;

const FooterItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ActionButton = styled.button<{ $variant?: "blue" | "purple" | "gray" }>`
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  background: none;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;

  color: ${(props) => {
    switch (props.$variant) {
      case "purple":
        return "#9333ea";
      case "gray":
        return "#6b7280";
      default:
        return "#2563eb";
    }
  }};

  &:hover {
    color: ${(props) => {
      switch (props.$variant) {
        case "purple":
          return "#7e22ce";
        case "gray":
          return "#4b5563";
        default:
          return "#1d4ed8";
      }
    }};
  }
`;

// ============== COMPONENTE ==============

export const EtapaCard: React.FC<EtapaCardProps> = ({ etapa }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/admin/etapas/${etapa.id}`);
  };

  const formatarData = (data: any) => {
    try {
      if (data && typeof data === "object" && "_seconds" in data) {
        const date = new Date(data._seconds * 1000);
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }

      if (typeof data === "string") {
        return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
      }

      if (data instanceof Date) {
        return format(data, "dd/MM/yyyy", { locale: ptBR });
      }

      return "Data inválida";
    } catch {
      return "Data inválida";
    }
  };

  const calcularProgresso = () => {
    if (etapa.maxJogadores === 0) return 0;
    return Math.round((etapa.totalInscritos / etapa.maxJogadores) * 100);
  };

  const getNivelIcon = (nivel: NivelJogador) => {
    switch (nivel) {
      case NivelJogador.INICIANTE:
        return "🌱";
      case NivelJogador.INTERMEDIARIO:
        return "⚡";
      case NivelJogador.AVANCADO:
        return "🔥";
      default:
        return "🎯";
    }
  };

  const getGeneroIcon = (genero: GeneroJogador) => {
    switch (genero) {
      case GeneroJogador.MASCULINO:
        return "♂️";
      case GeneroJogador.FEMININO:
        return "♀️";
      default:
        return "👤";
    }
  };

  const getNivelLabel = (nivel: NivelJogador) => {
    switch (nivel) {
      case NivelJogador.INICIANTE:
        return "Iniciante";
      case NivelJogador.INTERMEDIARIO:
        return "Intermediário";
      case NivelJogador.AVANCADO:
        return "Avançado";
      default:
        return nivel;
    }
  };

  const getGeneroLabel = (genero: GeneroJogador) => {
    switch (genero) {
      case GeneroJogador.FEMININO:
        return "Feminino";
      case GeneroJogador.MASCULINO:
        return "Masculino";
      default:
        return genero;
    }
  };

  const progresso = calcularProgresso();

  return (
    <Card onClick={handleClick}>
      {/* Header */}
      <Header>
        <HeaderContent>
          <Title>{etapa.nome}</Title>
          {etapa.descricao && <Description>{etapa.descricao}</Description>}
        </HeaderContent>
        <StatusBadge status={etapa.status} />
      </Header>

      {/* Info Principal */}
      <InfoSection>
        {/* Data */}
        <InfoItem>
          <IconWrapper>📅</IconWrapper>
          <InfoContent>
            <InfoLabel>Realização</InfoLabel>
            <InfoValue>{formatarData(etapa.dataRealizacao)}</InfoValue>
          </InfoContent>
        </InfoItem>

        {/* Nível */}
        <InfoItem>
          <IconWrapper>{getNivelIcon(etapa.nivel)}</IconWrapper>
          <InfoContent>
            <InfoLabel>Nível</InfoLabel>
            <InfoValue>{getNivelLabel(etapa.nivel)}</InfoValue>
          </InfoContent>
        </InfoItem>

        {/* Gênero */}
        <InfoItem>
          <IconWrapper>{getGeneroIcon(etapa.genero)}</IconWrapper>
          <InfoContent>
            <InfoLabel>Gênero</InfoLabel>
            <InfoValue>{getGeneroLabel(etapa.genero)}</InfoValue>
          </InfoContent>
        </InfoItem>

        {/* Local */}
        {etapa.local && (
          <InfoItem>
            <IconWrapper>📍</IconWrapper>
            <InfoContent>
              <InfoLabel>Local</InfoLabel>
              <InfoValue>{etapa.local}</InfoValue>
            </InfoContent>
          </InfoItem>
        )}

        {/* Inscrições */}
        <InfoItem>
          <IconWrapper>👥</IconWrapper>
          <InscricoesContainer>
            <InscricoesHeader>
              <InfoLabel>Inscritos</InfoLabel>
              <InfoValue>
                {etapa.totalInscritos} / {etapa.maxJogadores}
              </InfoValue>
            </InscricoesHeader>
            <ProgressBar>
              <ProgressFill $progress={progresso} />
            </ProgressBar>
          </InscricoesContainer>
        </InfoItem>
      </InfoSection>

      {/* Footer */}
      <Footer>
        <FooterInfo>
          {etapa.qtdGrupos && (
            <FooterItem>
              <span>🎯</span>
              <span>{etapa.qtdGrupos} grupos</span>
            </FooterItem>
          )}
          <FooterItem>
            <span>👤</span>
            <span>{etapa.jogadoresPorGrupo} duplas/grupo</span>
          </FooterItem>
        </FooterInfo>

        {/* Actions baseado no status */}
        {etapa.status === StatusEtapa.INSCRICOES_ABERTAS && (
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/etapas/${etapa.id}`);
            }}
          >
            Ver detalhes →
          </ActionButton>
        )}

        {etapa.status === StatusEtapa.CHAVES_GERADAS && (
          <ActionButton
            $variant="purple"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/etapas/${etapa.id}/chaves`);
            }}
          >
            Ver chaves →
          </ActionButton>
        )}

        {etapa.status === StatusEtapa.FINALIZADA && (
          <ActionButton $variant="gray" as="div">
            <span>🏆</span>
            <span>Concluída</span>
          </ActionButton>
        )}
      </Footer>
    </Card>
  );
};

export default EtapaCard;
