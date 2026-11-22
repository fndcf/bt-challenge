/**
 * Peças da formação manual (equipes do Teams e duplas da Dupla Fixa):
 * cartão com as vagas e lista de jogadores para escolher
 */

import React, { useState } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import {
  FiltroGenero,
  passaNoFiltroGenero,
  SeloGenero,
  ValorFiltroGenero,
} from "@/components/jogadores/Genero";
import { Badge, IconButton } from "@/components/ui";
import { getCoresFormato } from "@/styles/semantic";
import { theme } from "@/styles/theme";
import { FormatoEtapa, Inscricao } from "@/types/etapa";
import { getNivelAbrev } from "@/utils/formatters";

const { texto, superficie, acao, status } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

export const GradeFormacao = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: ${theme.spacing[4]};
`;

const Cartao = styled.div<{ $completa: boolean }>`
  overflow: hidden;
  border: 1px solid
    ${({ $completa }) => ($completa ? status.sucesso.texto : superficie.borda)};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
`;

const Cabecalho = styled.div<{ $fundo: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  min-height: 3rem;
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  background: ${({ $fundo }) => $fundo};
  color: ${texto.inverso};
  font-weight: ${fontWeight.semibold};
`;

const Vagas = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[3]};
`;

const Vaga = styled.div<{ $vazia: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  min-height: 44px;
  padding: 0 ${theme.spacing[1]} 0 ${theme.spacing[3]};
  border: 1px ${({ $vazia }) => ($vazia ? "dashed" : "solid")}
    ${({ $vazia }) => ($vazia ? superficie.bordaForte : superficie.borda)};
  border-radius: ${theme.borderRadius.md};
  background: ${({ $vazia }) =>
    $vazia ? superficie.fundo : superficie.fundoAlternativo};
  color: ${({ $vazia }) => ($vazia ? texto.secundario : texto.principal)};
  font-size: ${fontSize.sm};
`;

const Jogador = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]};
  min-width: 0;
`;

const Titulo = styled.h4`
  margin: 0 0 ${theme.spacing[3]} 0;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

const Filtro = styled.div`
  margin-bottom: ${theme.spacing[3]};
`;

const Lista = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
  max-height: 14rem;
  overflow-y: auto;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Opcao = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  min-height: 40px;
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  border: 1px solid ${superficie.bordaForte};
  border-radius: ${theme.borderRadius.full};
  background: ${superficie.fundo};
  color: ${texto.principal};
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.medium};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${acao.primaria};
    background: ${acao.fundoClaro};
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }

  &:disabled {
    color: ${texto.desabilitado};
    cursor: not-allowed;
  }
`;

const Selos: React.FC<{ inscricao: Inscricao; isMisto: boolean }> = ({
  inscricao,
  isMisto,
}) => (
  <>
    {isMisto && <SeloGenero genero={inscricao.jogadorGenero} />}
    {inscricao.jogadorNivel && (
      <Badge>{getNivelAbrev(inscricao.jogadorNivel)}</Badge>
    )}
  </>
);

interface CartaoFormacaoProps {
  formato: FormatoEtapa;
  /** Nome da equipe ou da dupla (texto ou campo editável) */
  titulo: React.ReactNode;
  jogadores: (Inscricao | undefined)[];
  tamanho: number;
  isMisto: boolean;
  onRemover: (jogadorId: string) => void;
}

export const CartaoFormacao: React.FC<CartaoFormacaoProps> = ({
  formato,
  titulo,
  jogadores,
  tamanho,
  isMisto,
  onRemover,
}) => {
  const completa = jogadores.length === tamanho;

  return (
    <Cartao $completa={completa}>
      <Cabecalho $fundo={getCoresFormato(formato).solido}>
        {titulo}
        <Badge tom={completa ? "sucesso" : "neutro"}>
          {`${jogadores.length}/${tamanho}`}
        </Badge>
      </Cabecalho>
      <Vagas>
        {jogadores.map(
          (inscricao) =>
            inscricao && (
              <Vaga key={inscricao.jogadorId} $vazia={false}>
                <Jogador>
                  <span>{inscricao.jogadorNome}</span>
                  <Selos inscricao={inscricao} isMisto={isMisto} />
                </Jogador>
                <IconButton
                  rotulo={`Remover ${inscricao.jogadorNome}`}
                  title="Remover jogador"
                  tom="perigo"
                  icone={<X aria-hidden="true" />}
                  onClick={() => onRemover(inscricao.jogadorId)}
                />
              </Vaga>
            )
        )}
        {Array.from({ length: tamanho - jogadores.length }, (_, i) => (
          <Vaga key={`vazia-${i}`} $vazia>
            Clique em um jogador para adicionar
          </Vaga>
        ))}
      </Vagas>
    </Cartao>
  );
};

interface JogadoresDisponiveisProps {
  jogadores: Inscricao[];
  isMisto: boolean;
  onEscolher: (jogadorId: string) => void;
  /** true quando todas as vagas já foram preenchidas */
  desabilitado: boolean;
}

export const JogadoresDisponiveis: React.FC<JogadoresDisponiveisProps> = ({
  jogadores,
  isMisto,
  onEscolher,
  desabilitado,
}) => {
  const [filtro, setFiltro] = useState<ValorFiltroGenero>("todos");
  const listados = jogadores.filter((i) =>
    passaNoFiltroGenero(i.jogadorGenero, filtro)
  );

  return (
    <section>
      <Titulo>{`Jogadores Disponíveis (${jogadores.length})`}</Titulo>
      {isMisto && (
        <Filtro>
          <FiltroGenero
            valor={filtro}
            onChange={setFiltro}
            generos={jogadores.map((i) => i.jogadorGenero)}
          />
        </Filtro>
      )}
      <Lista>
        {listados.length === 0 ? (
          <span>
            {jogadores.length === 0
              ? "Todos os jogadores foram alocados"
              : "Nenhum jogador disponível com esse filtro"}
          </span>
        ) : (
          listados.map((inscricao) => (
            <Opcao
              key={inscricao.jogadorId}
              type="button"
              onClick={() => onEscolher(inscricao.jogadorId)}
              disabled={desabilitado}
            >
              {inscricao.jogadorNome}
              <Selos inscricao={inscricao} isMisto={isMisto} />
            </Opcao>
          ))
        )}
      </Lista>
    </section>
  );
};
