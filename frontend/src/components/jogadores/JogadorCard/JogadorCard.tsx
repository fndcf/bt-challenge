/**
 * Cartão do jogador na listagem do admin
 */

import React from "react";
import { Trash2 } from "lucide-react";
import styled from "styled-components";
import { SeloGenero } from "../Genero";
import { Badge, BadgeTom, Button, ButtonLink, IconButton } from "@/components/ui";
import { theme } from "@/styles/theme";
import { Jogador, StatusJogador } from "@/types/jogador";
import { getNivelLabel } from "@/utils/formatters";

interface JogadorCardProps {
  jogador: Jogador;
  arenaSlug?: string;
  onEdit?: (jogador: Jogador) => void;
  onDelete?: (jogador: Jogador) => void;
}

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  padding: ${theme.spacing[4]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
`;

const Cabecalho = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
`;

const Avatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${acao.fundoClaro};
  color: ${acao.primaria};
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.bold};
`;

const Nome = styled.h3`
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize.base};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

const Contato = styled.p`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Selos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
`;

const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
  margin-top: auto;
  padding-top: ${theme.spacing[3]};
  border-top: 1px solid ${superficie.borda};
  color: ${texto.secundario};

  > :not([aria-label]) {
    flex: 1;
  }
`;

const STATUS: Record<StatusJogador, { label: string; tom: BadgeTom }> = {
  [StatusJogador.ATIVO]: { label: "Ativo", tom: "sucesso" },
  [StatusJogador.INATIVO]: { label: "Inativo", tom: "neutro" },
  [StatusJogador.SUSPENSO]: { label: "Suspenso", tom: "erro" },
};

const JogadorCard: React.FC<JogadorCardProps> = ({
  jogador,
  arenaSlug,
  onEdit,
  onDelete,
}) => {
  const status = STATUS[jogador.status] ?? STATUS[StatusJogador.ATIVO];

  return (
    <Card>
      <Cabecalho>
        <Avatar aria-hidden="true">
          {jogador.nome.charAt(0).toUpperCase()}
        </Avatar>
        <Nome>{jogador.nome}</Nome>
      </Cabecalho>

      {(jogador.email || jogador.telefone) && (
        <div>
          {jogador.email && <Contato>{jogador.email}</Contato>}
          {jogador.telefone && <Contato>{jogador.telefone}</Contato>}
        </div>
      )}

      <Selos>
        <Badge>{getNivelLabel(jogador.nivel)}</Badge>
        <SeloGenero genero={jogador.genero} />
        <Badge tom={status.tom}>{status.label}</Badge>
      </Selos>

      <Acoes>
        {arenaSlug && (
          <ButtonLink
            variant="outline"
            size="sm"
            to={`/arena/${arenaSlug}/jogador/${jogador.id}`}
            title="Ver perfil público"
          >
            Ver
          </ButtonLink>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(jogador)}
            title="Editar jogador"
          >
            Editar
          </Button>
        )}
        {onDelete && (
          <IconButton
            rotulo={`Deletar ${jogador.nome}`}
            title="Deletar jogador"
            tom="perigo"
            icone={<Trash2 aria-hidden="true" />}
            onClick={() => onDelete(jogador)}
          />
        )}
      </Acoes>
    </Card>
  );
};

export default JogadorCard;
