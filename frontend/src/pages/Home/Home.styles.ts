import styled from "styled-components";
import { media, theme } from "@/styles/theme";

const { texto, superficie, acao } = theme.semantic;

export const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: ${superficie.fundo};
`;

// ============== BASE DAS SEÇÕES ==============

export const Secao = styled.section<{ $alternativa?: boolean }>`
  padding: ${theme.spacing[12]} ${theme.spacing[4]};
  background: ${({ $alternativa }) =>
    $alternativa ? superficie.pagina : superficie.fundo};

  ${media.md} {
    padding: ${theme.spacing[16]} ${theme.spacing[6]};
  }
`;

export const Conteudo = styled.div`
  max-width: 1120px;
  margin: 0 auto;
`;

export const TituloSecao = styled.h2`
  margin: 0;
  font-size: ${theme.typography.fontSize["2xl"]};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${texto.principal};
  text-align: center;

  ${media.md} {
    font-size: ${theme.typography.fontSize["3xl"]};
  }
`;

export const SubtituloSecao = styled.p`
  max-width: 640px;
  margin: ${theme.spacing[3]} auto ${theme.spacing[8]};
  font-size: ${theme.typography.fontSize.base};
  line-height: 1.6;
  color: ${texto.secundario};
  text-align: center;
`;

/** Grade de cartões: 1 coluna no celular, `$colunas` no computador */
export const Grade = styled.div<{ $colunas: number }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing[4]};

  ${media.sm} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${media.lg} {
    grid-template-columns: repeat(${({ $colunas }) => $colunas}, minmax(0, 1fr));
    gap: ${theme.spacing[6]};
  }
`;

export const Cartao = styled.article<{ $cor?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[5]};
  background: ${superficie.fundo};
  border: 1px solid ${superficie.borda};
  border-top: 4px solid ${({ $cor }) => $cor ?? superficie.borda};
  border-radius: ${theme.borderRadius.xl};
`;

export const TituloCartao = styled.h3<{ $cor?: string }>`
  margin: 0;
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${({ $cor }) => $cor ?? texto.principal};
`;

export const TextoCartao = styled.p`
  margin: 0;
  font-size: ${theme.typography.fontSize.sm};
  line-height: 1.6;
  color: ${texto.secundario};
`;

// ============== HERO ==============

export const Hero = styled.section`
  padding: ${theme.spacing[12]} ${theme.spacing[4]} ${theme.spacing[10]};
  background: ${superficie.pagina};
  border-bottom: 1px solid ${superficie.borda};
  text-align: center;

  ${media.md} {
    padding: ${theme.spacing[20]} ${theme.spacing[6]} ${theme.spacing[16]};
  }
`;

export const Marca = styled.h1`
  margin: 0;
  font-size: ${theme.typography.fontSize["4xl"]};
  font-weight: ${theme.typography.fontWeight.bold};
  letter-spacing: -0.02em;
  color: ${acao.primaria};

  ${media.md} {
    font-size: ${theme.typography.fontSize["5xl"]};
  }
`;

export const Chamada = styled.p`
  max-width: 640px;
  margin: ${theme.spacing[4]} auto 0;
  font-size: ${theme.typography.fontSize.lg};
  line-height: 1.6;
  color: ${texto.secundario};

  ${media.md} {
    font-size: ${theme.typography.fontSize.xl};
  }
`;

export const Acoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
  max-width: 320px;
  margin: ${theme.spacing[8]} auto 0;

  ${media.sm} {
    flex-direction: row;
    justify-content: center;
    max-width: none;
  }
`;

export const Selos = styled.ul`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${theme.spacing[2]};
  margin: ${theme.spacing[8]} 0 0;
  padding: 0;
  list-style: none;
`;

// ============== FORMATOS ==============

export const ListaFormato = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  margin: auto 0 0;
  padding: ${theme.spacing[3]} 0 0;
  border-top: 1px solid ${superficie.borda};
  list-style: none;
`;

export const ItemFormato = styled.li<{ $cor: string }>`
  position: relative;
  padding-left: ${theme.spacing[4]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${texto.principal};

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.5em;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $cor }) => $cor};
  }
`;

// ============== GALERIA ==============

export const AbasGaleria = styled.div`
  margin-bottom: ${theme.spacing[6]};
`;

export const ItemGaleria = styled.button`
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  background: ${superficie.fundo};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.xl};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color ${theme.transitions.base};

  &:hover {
    border-color: ${acao.primaria};
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 2px;
  }
`;

export const MolduraImagem = styled.div`
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: ${superficie.pagina};
  border-bottom: 1px solid ${superficie.borda};
`;

export const Imagem = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  display: block;
`;

export const ContagemImagens = styled.span`
  position: absolute;
  right: ${theme.spacing[2]};
  bottom: ${theme.spacing[2]};
  padding: 2px ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.full};
  background: rgba(0, 0, 0, 0.7);
  color: ${texto.inverso};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.semibold};
`;

export const InfoGaleria = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[1]};
  padding: ${theme.spacing[4]};
`;

export const Visualizador = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
`;

export const ImagemAmpliada = styled.img`
  width: 100%;
  max-height: 60vh;
  max-height: 60dvh;
  object-fit: contain;
  background: ${superficie.pagina};
  border-radius: ${theme.borderRadius.lg};
`;

export const Navegacao = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[3]};
  color: ${texto.principal};
`;

export const Posicao = styled.span`
  min-width: 4rem;
  font-size: ${theme.typography.fontSize.sm};
  color: ${texto.secundario};
  text-align: center;
`;

// ============== COMO FUNCIONA ==============

export const Passos = styled.ol`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing[4]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.sm} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${media.lg} {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
`;

export const Passo = styled.li`
  display: flex;
  gap: ${theme.spacing[3]};

  ${media.lg} {
    flex-direction: column;
  }
`;

export const NumeroPasso = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: ${acao.primaria};
  color: ${acao.textoSobreAcao};
  font-weight: ${theme.typography.fontWeight.bold};
`;
