/**
 * Equipe com seus jogadores; o nome pode ser trocado no próprio card
 */

import React, { useState } from "react";
import styled from "styled-components";
import { Pencil } from "lucide-react";
import { Badge, IconButton } from "@/components/ui";
import { SeloGenero } from "@/components/jogadores/Genero";
import { CoresStatus } from "@/styles/semantic";
import { theme } from "@/styles/theme";
import { Equipe } from "@/types/teams";
import { getNivelAbrev } from "@/utils/formatters";

const { texto, superficie, acao, medalha, status } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface EquipeCardProps {
  equipe: Equipe;
  posicao: number;
  podeRenomear: boolean;
  onRenomear: (equipeId: string, nome: string) => Promise<boolean>;
}

const coresDaPosicao = (posicao: number): CoresStatus => {
  if (posicao === 1) return medalha.ouro;
  if (posicao === 2) return medalha.prata;
  if (posicao === 3) return medalha.bronze;
  return status.neutro;
};

const Card = styled.div`
  overflow: hidden;
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
`;

const Cabecalho = styled.div<{ $cores: CoresStatus }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  min-height: 3rem;
  padding: ${theme.spacing[1]} ${theme.spacing[4]};
  border-bottom: 1px solid ${({ $cores }) => $cores.borda};
  background: ${({ $cores }) => $cores.fundo};
  color: ${({ $cores }) => $cores.texto};
`;

const Nome = styled.h4`
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize.base};
  font-weight: ${fontWeight.bold};
`;

const CampoNome = styled.input`
  flex: 1;
  min-width: 0;
  min-height: 36px;
  padding: 0 ${theme.spacing[2]};
  border: 1px solid ${superficie.bordaForte};
  border-radius: ${theme.borderRadius.md};
  background: ${superficie.fundo};
  color: ${texto.principal};
  font-family: inherit;
  font-size: ${fontSize.base};
  font-weight: ${fontWeight.bold};

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }
`;

const Posicao = styled.span`
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.bold};
`;

const Jogadores = styled.ul`
  margin: 0;
  padding: ${theme.spacing[2]} ${theme.spacing[4]};
  list-style: none;
`;

const Jogador = styled.li`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[1]} 0;
  font-size: ${fontSize.sm};
  color: ${texto.principal};

  > span:first-child {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

export const EquipeCard: React.FC<EquipeCardProps> = ({
  equipe,
  posicao,
  podeRenomear,
  onRenomear,
}) => {
  // null = não está editando
  const [nomeEditado, setNomeEditado] = useState<string | null>(null);

  const salvar = async () => {
    const nome = nomeEditado?.trim();
    if (!nome || (await onRenomear(equipe.id, nome))) {
      setNomeEditado(null);
    }
  };

  return (
    <Card>
      <Cabecalho $cores={coresDaPosicao(posicao)}>
        {nomeEditado !== null ? (
          <CampoNome
            aria-label="Nome da equipe"
            value={nomeEditado}
            onChange={(e) => setNomeEditado(e.target.value)}
            onBlur={salvar}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvar();
              else if (e.key === "Escape") setNomeEditado(null);
            }}
            autoFocus
            maxLength={50}
          />
        ) : (
          <>
            <Nome>{equipe.nome}</Nome>
            {podeRenomear && (
              <IconButton
                rotulo="Renomear equipe"
                icone={<Pencil />}
                onClick={() => setNomeEditado(equipe.nome)}
              />
            )}
          </>
        )}
        <Posicao>{`#${posicao}`}</Posicao>
      </Cabecalho>

      <Jogadores>
        {equipe.jogadores.map((jogador) => (
          <Jogador key={jogador.id}>
            <span>{jogador.nome}</span>
            <SeloGenero genero={jogador.genero} />
            {jogador.nivel && <Badge>{getNivelAbrev(jogador.nivel)}</Badge>}
          </Jogador>
        ))}
      </Jogadores>
    </Card>
  );
};
