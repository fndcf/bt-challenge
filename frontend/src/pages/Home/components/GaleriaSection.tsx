/**
 * Responsabilidade: Galeria de screenshots do sistema com tabs por categoria
 *
 * Os prints são gerados por scripts/demo/galeria (npm run galeria).
 * Nome do arquivo aqui = nome em scripts/demo/galeria/telas.mjs.
 */

import React, { useState } from "react";
import { IconButton, Modal, Tabs } from "@/components/ui";
import * as S from "../Home.styles";

interface Screenshot {
  id: string;
  title: string;
  description: string;
  images: string[];
}

interface Categoria {
  id: string;
  label: string;
  screenshots: Screenshot[];
}

const telas = (...nomes: string[]) =>
  nomes.map((nome) => `/screenshots/${nome}.webp`);

const categorias: Categoria[] = [
  {
    id: "primeiros-passos",
    label: "Primeiros passos",
    screenshots: [
      {
        id: "cadastro-arena",
        title: "Criar sua arena",
        description: "Cadastro rápido da arena e do administrador.",
        images: telas("cadastro-arena"),
      },
      {
        id: "dashboard",
        title: "Painel",
        description: "Visão geral de jogadores, etapas e rankings da arena.",
        images: telas("dashboard", "dashboard2"),
      },
      {
        id: "jogadores",
        title: "Jogadores",
        description:
          "Cadastro por nível e gênero, filtros e importação por planilha Excel.",
        images: telas("jogadores", "novo-jogador", "importar-jogadores"),
      },
      {
        id: "etapas",
        title: "Etapas",
        description: "Lista de etapas da arena com status, formato e inscritos.",
        images: telas("etapas"),
      },
    ],
  },
  {
    id: "montar",
    label: "Montar a etapa",
    screenshots: [
      {
        id: "criar-etapa",
        title: "Criar etapa",
        description:
          "Escolha o formato, as datas, as vagas e as regras de pontuação.",
        images: telas("criar-etapa", "criar-etapa2", "criar-etapa3"),
      },
      {
        id: "inscricoes",
        title: "Inscrições",
        description: "Inscreva jogadores da arena e acompanhe as vagas.",
        images: telas("inscricoes", "inscricoes2"),
      },
      {
        id: "cabecas-chave",
        title: "Cabeças de chave",
        description:
          "Defina os jogadores mais fortes para que fiquem em grupos diferentes.",
        images: telas("cabecas-chave"),
      },
      {
        id: "duplas-manuais",
        title: "Duplas manuais",
        description: "Na Dupla Fixa, monte você mesmo as duplas da etapa.",
        images: telas("duplas-manuais"),
      },
      {
        id: "equipes-manuais",
        title: "Formação de equipes",
        description: "No Teams, monte as equipes manualmente.",
        images: telas("equipes-manuais"),
      },
    ],
  },
  {
    id: "torneio",
    label: "Durante o torneio",
    screenshots: [
      {
        id: "dupla-fixa",
        title: "Dupla Fixa",
        description:
          "Grupos com classificação, lançamento de resultados e chave eliminatória.",
        images: telas(
          "dupla-fixa-grupos",
          "dupla-fixa-resultados",
          "dupla-fixa-eliminatoria",
          "dupla-fixa-eliminatoria2"
        ),
      },
      {
        id: "rei-da-praia",
        title: "Rei da Praia",
        description:
          "Grupos de 4 com parceiros rotativos, classificação individual e eliminatória.",
        images: telas(
          "rei-da-praia-grupos",
          "rei-da-praia-resultados",
          "rei-da-praia-eliminatoria"
        ),
      },
      {
        id: "super-x",
        title: "Super X",
        description: "Grupo único com rodadas e classificação individual.",
        images: telas("super-x", "super-x-resultados"),
      },
      {
        id: "teams",
        title: "Teams",
        description:
          "Confrontos entre equipes, escalação dos jogadores e resultados de cada jogo.",
        images: telas(
          "teams-confrontos",
          "teams-partidas",
          "teams-resultados",
          "teams-escalacao"
        ),
      },
      {
        id: "empates",
        title: "Empates e substituições",
        description:
          "Resolva empates na classificação e troque jogadores quando preciso.",
        images: telas("empates", "empates2", "substituir-jogador"),
      },
      {
        id: "etapa-encerrada",
        title: "Etapa encerrada",
        description:
          "Campeão definido e pontos do ranking atribuídos automaticamente.",
        images: telas("etapa-encerrada"),
      },
    ],
  },
  {
    id: "publico",
    label: "Página Pública",
    screenshots: [
      {
        id: "arena-publica",
        title: "Página da arena",
        description: "Página exclusiva para divulgar etapas e resultados.",
        images: telas("arena-publica"),
      },
      {
        id: "ranking",
        title: "Ranking",
        description: "Ranking por gênero e nível, atualizado após cada etapa.",
        images: telas("ranking"),
      },
      {
        id: "etapa-publica",
        title: "Etapa pública",
        description: "Grupos, resultados e chaveamento abertos para todos.",
        images: telas("etapa-publica", "etapa-publica2"),
      },
      {
        id: "perfil-jogador",
        title: "Perfil do jogador",
        description: "Histórico e estatísticas individuais do jogador.",
        images: telas("perfil-jogador"),
      },
    ],
  },
  {
    id: "celular",
    label: "No celular",
    screenshots: [
      {
        id: "celular-resultados",
        title: "Resultados na quadra",
        description: "Lance os placares pelo celular, direto da quadra.",
        images: telas("celular-resultados"),
      },
      {
        id: "celular-dashboard",
        title: "Painel",
        description: "Toda a gestão da arena também no celular.",
        images: telas("celular-dashboard"),
      },
      {
        id: "celular-etapa-publica",
        title: "Etapa pública",
        description: "Jogadores acompanham grupos e chaves pelo telefone.",
        images: telas("celular-etapa-publica"),
      },
      {
        id: "celular-ranking",
        title: "Ranking",
        description: "Ranking da arena sempre à mão.",
        images: telas("celular-ranking"),
      },
    ],
  },
];

const Seta: React.FC<{ d: string }> = ({ d }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

export const GaleriaSection: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState(categorias[0].id);
  const [aberto, setAberto] = useState<Screenshot | null>(null);
  const [indice, setIndice] = useState(0);

  const categoria = categorias.find((c) => c.id === abaAtiva);

  const abrir = (item: Screenshot) => {
    setAberto(item);
    setIndice(0);
  };

  const mover = (passo: number) => {
    if (!aberto) return;
    const total = aberto.images.length;
    setIndice((atual) => (atual + passo + total) % total);
  };

  return (
    <S.Secao>
      <S.Conteudo>
        <S.TituloSecao>Veja o Sistema em Ação</S.TituloSecao>
        <S.SubtituloSecao>
          Conheça as principais telas e funcionalidades do Dupley
        </S.SubtituloSecao>

        <S.AbasGaleria>
          <Tabs
            abas={categorias.map(({ id, label }) => ({ id, label }))}
            ativa={abaAtiva}
            onChange={setAbaAtiva}
            rotulo="Categorias de telas"
          />
        </S.AbasGaleria>

        <S.Grade $colunas={3}>
          {categoria?.screenshots.map((item) => (
            <S.ItemGaleria
              key={item.id}
              type="button"
              onClick={() => abrir(item)}
            >
              <S.MolduraImagem>
                <S.Imagem src={item.images[0]} alt="" loading="lazy" />
                {item.images.length > 1 && (
                  <S.ContagemImagens>
                    {item.images.length} telas
                  </S.ContagemImagens>
                )}
              </S.MolduraImagem>
              <S.InfoGaleria>
                <S.TituloCartao>{item.title}</S.TituloCartao>
                <S.TextoCartao>{item.description}</S.TextoCartao>
              </S.InfoGaleria>
            </S.ItemGaleria>
          ))}
        </S.Grade>
      </S.Conteudo>

      <Modal
        isOpen={aberto !== null}
        onClose={() => setAberto(null)}
        title={aberto?.title}
        subtitle={aberto?.description}
        size="xl"
      >
        {aberto && (
          <S.Visualizador>
            <S.ImagemAmpliada
              src={aberto.images[indice]}
              alt={`${aberto.title} - tela ${indice + 1} de ${aberto.images.length}`}
            />
            {aberto.images.length > 1 && (
              <S.Navegacao>
                <IconButton
                  rotulo="Tela anterior"
                  icone={<Seta d="M15 18l-6-6 6-6" />}
                  onClick={() => mover(-1)}
                />
                <S.Posicao>
                  {indice + 1} de {aberto.images.length}
                </S.Posicao>
                <IconButton
                  rotulo="Próxima tela"
                  icone={<Seta d="M9 18l6-6-6-6" />}
                  onClick={() => mover(1)}
                />
              </S.Navegacao>
            )}
          </S.Visualizador>
        )}
      </Modal>
    </S.Secao>
  );
};

export default GaleriaSection;
