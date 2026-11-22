/**
 * Digitação do placar de uma partida, igual em todos os modais de resultado
 *
 * Uma linha por dupla e uma coluna por set. A ordem no DOM é set a set
 * (dupla 1, dupla 2, próximo set), que é a ordem em que o placar é ditado:
 * o Tab segue essa ordem e a grade só muda a posição visual.
 */

import React from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { Badge, BadgeTom } from "@/components/ui";
import { deveExibirTerceiroSet } from "@/utils/placarMelhorDe3";
import { CampoSet, ChaveSet, PlacarSets } from "@/utils/resultadosLote";

const { texto, superficie, acao, status } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface LadoPlacar {
  nome: string;
  /** Complemento abaixo do nome (equipe, origem da vaga) */
  detalhe?: string;
}

interface CampoPlacarProps {
  /** Identificação ("PARTIDA 1", "JOGO 2") */
  titulo?: string;
  /** Selos extras ao lado do título (ex.: tipo de jogo) */
  etiquetas?: React.ReactNode;
  situacao?: { label: string; tom: BadgeTom };
  lado1: LadoPlacar;
  lado2: LadoPlacar;
  placar?: PlacarSets;
  melhorDe3?: boolean;
  onChange: (
    chave: ChaveSet,
    campo: CampoSet,
    valor: number | undefined
  ) => void;
  disabled?: boolean;
  obrigatorio?: boolean;
  erro?: string;
  /** Aviso acima do placar (ex.: jogadores não definidos) */
  children?: React.ReactNode;
}

export const ListaPlacares = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
`;

const Card = styled.article<{ $erro: boolean }>`
  padding: ${theme.spacing[3]};
  background: ${superficie.fundo};
  border: 1px solid
    ${({ $erro }) => ($erro ? status.erro.texto : superficie.borda)};
  border-radius: ${theme.borderRadius.lg};

  @media (min-width: 640px) {
    padding: ${theme.spacing[4]};
  }
`;

const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[3]};
`;

const Identificacao = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

const Titulo = styled.span`
  font-size: ${fontSize.xs};
  font-weight: ${fontWeight.semibold};
  color: ${texto.secundario};
`;

const Grade = styled.div<{ $sets: number }>`
  display: grid;
  grid-template-columns: 1fr repeat(${({ $sets }) => $sets}, 3.25rem);
  align-items: center;
  column-gap: ${theme.spacing[2]};
  row-gap: ${theme.spacing[1]};

  @media (min-width: 640px) {
    grid-template-columns: 1fr repeat(${({ $sets }) => $sets}, 4rem);
    column-gap: ${theme.spacing[3]};
  }
`;

const Posicionado = styled.div<{ $linha: number; $coluna: number }>`
  grid-row: ${({ $linha }) => $linha};
  grid-column: ${({ $coluna }) => $coluna};
  min-width: 0;
`;

const NomeLado = styled(Posicionado)`
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.medium};
  color: ${texto.principal};
  overflow-wrap: anywhere;
`;

const Detalhe = styled.div`
  font-size: ${fontSize.xs};
  font-weight: ${fontWeight.normal};
  color: ${texto.secundario};
`;

const TituloSet = styled(Posicionado)`
  text-align: center;
  font-size: ${fontSize.xs};
  font-weight: ${fontWeight.semibold};
  color: ${texto.secundario};
`;

const Versus = styled(Posicionado)`
  /* No celular o espaço vale mais: os campos já separam os lados */
  @media (max-width: 639px) {
    display: none;
  }

  font-size: ${fontSize.xs};
  font-weight: ${fontWeight.semibold};
  color: ${texto.secundario};
`;

const Campo = styled.input`
  width: 100%;
  box-sizing: border-box;
  min-height: 44px;
  padding: ${theme.spacing[1]};
  border: 1px solid ${superficie.bordaForte};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
  color: ${texto.principal};
  text-align: center;
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.bold};

  /* Sem as setinhas: o campo é estreito */
  appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }

  &:disabled {
    background: ${superficie.pagina};
    color: ${texto.desabilitado};
    cursor: not-allowed;
  }
`;

const Erro = styled.p`
  margin: ${theme.spacing[2]} 0 0 0;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.medium};
  color: ${status.erro.texto};
`;

const LINHA_TITULO = 1;
const LINHA_LADO = { 1: 2, 2: 4 } as const;
const LINHA_VERSUS = 3;

export const CampoPlacar: React.FC<CampoPlacarProps> = ({
  titulo,
  etiquetas,
  situacao,
  lado1,
  lado2,
  placar = { set1: {}, set2: {}, set3: {} },
  melhorDe3 = false,
  onChange,
  disabled = false,
  obrigatorio = false,
  erro,
  children,
}) => {
  const sets: { chave: ChaveSet; nome: string }[] = [
    { chave: "set1", nome: "Set 1" },
  ];
  if (melhorDe3) {
    sets.push({ chave: "set2", nome: "Set 2" });
    if (deveExibirTerceiroSet(placar.set1, placar.set2)) {
      sets.push({ chave: "set3", nome: "Set 3" });
    }
  }

  const renderCampo = (
    set: { chave: ChaveSet; nome: string },
    coluna: number,
    lado: 1 | 2
  ) => {
    const campo: CampoSet = lado === 1 ? "gamesDupla1" : "gamesDupla2";
    const nome = lado === 1 ? lado1.nome : lado2.nome;

    return (
      <Posicionado $linha={LINHA_LADO[lado]} $coluna={coluna}>
        <Campo
          type="number"
          inputMode="numeric"
          min="0"
          max="10"
          placeholder="-"
          aria-label={
            melhorDe3 ? `Games de ${nome}, ${set.nome}` : `Games de ${nome}`
          }
          aria-invalid={!!erro}
          value={placar[set.chave][campo] ?? ""}
          // Tocar num placar preenchido e digitar substitui o valor
          onFocus={(e) => e.target.select()}
          onChange={(e) =>
            onChange(
              set.chave,
              campo,
              e.target.value === "" ? undefined : parseInt(e.target.value)
            )
          }
          disabled={disabled}
          required={obrigatorio}
        />
      </Posicionado>
    );
  };

  return (
    <Card $erro={!!erro}>
      {(titulo || etiquetas || situacao) && (
        <Cabecalho>
          <Identificacao>
            {titulo && <Titulo>{titulo}</Titulo>}
            {etiquetas}
          </Identificacao>
          {situacao && <Badge tom={situacao.tom}>{situacao.label}</Badge>}
        </Cabecalho>
      )}

      {children}

      <Grade $sets={sets.length}>
        <NomeLado $linha={LINHA_LADO[1]} $coluna={1}>
          <span>{lado1.nome}</span>
          {lado1.detalhe && <Detalhe>{lado1.detalhe}</Detalhe>}
        </NomeLado>
        <Versus $linha={LINHA_VERSUS} $coluna={1}>
          VS
        </Versus>
        <NomeLado $linha={LINHA_LADO[2]} $coluna={1}>
          <span>{lado2.nome}</span>
          {lado2.detalhe && <Detalhe>{lado2.detalhe}</Detalhe>}
        </NomeLado>

        {sets.map((set, index) => (
          <React.Fragment key={set.chave}>
            {melhorDe3 && (
              <TituloSet $linha={LINHA_TITULO} $coluna={index + 2}>
                {set.nome}
              </TituloSet>
            )}
            {renderCampo(set, index + 2, 1)}
            {renderCampo(set, index + 2, 2)}
          </React.Fragment>
        ))}
      </Grade>

      {erro && <Erro role="alert">{erro}</Erro>}
    </Card>
  );
};

export default CampoPlacar;
