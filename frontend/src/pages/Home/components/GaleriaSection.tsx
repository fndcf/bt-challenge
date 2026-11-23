/**
 * Responsabilidade: Galeria de screenshots do sistema com tabs por categoria
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

const categorias: Categoria[] = [
  {
    id: "administrativo",
    label: "Administrativo",
    screenshots: [
      {
        id: "dashboard",
        title: "Dashboard",
        description:
          "Visão geral com estatísticas de jogadores, etapas e rankings.",
        images: ["/screenshots/dashboard.png", "/screenshots/dashboard2.png"],
      },
      {
        id: "jogadores",
        title: "Gestão de Jogadores",
        description: "Cadastro e listagem de jogadores por nível e gênero.",
        images: ["/screenshots/jogadores.png", "/screenshots/jogadores2.png"],
      },
      {
        id: "criar-etapa",
        title: "Criar Etapa",
        description: "Configure torneios com diferentes formatos e regras.",
        images: [
          "/screenshots/criar-etapa.png",
          "/screenshots/criar-etapa2.png",
          "/screenshots/criar-etapa3.png",
          "/screenshots/criar-etapa4.png",
        ],
      },
      {
        id: "etapas",
        title: "Etapas",
        description: "Lista de etapas da arena com status, formato e inscritos.",
        images: ["/screenshots/etapas.png"],
      },
    ],
  },
  {
    id: "torneio",
    label: "Torneio",
    screenshots: [
      {
        id: "detalhes-etapa",
        title: "Detalhes da Etapa",
        description: "Visão completa de uma etapa em andamento.",
        images: [
          "/screenshots/detalhe-etapa.png",
          "/screenshots/detalhe-etapa2.png",
          "/screenshots/detalhe-etapa3.png",
          "/screenshots/detalhe-etapa4.png",
          "/screenshots/detalhe-etapa5.png",
        ],
      },
      {
        id: "inscritos-etapa",
        title: "Inscrições da Etapa",
        description: "Inscrição com validação de inscritos da etapa.",
        images: [
          "/screenshots/inscrever-jogador.png",
          "/screenshots/inscrever-jogador2.png",
          "/screenshots/inscrever-jogador3.png",
          "/screenshots/inscrever-jogador4.png",
        ],
      },
      {
        id: "cabecas-chave-etapa",
        title: "Cabeças de Chave da Etapa",
        description: "Escolha os cabeças de chave de cada etapa.",
        images: [
          "/screenshots/cabecas-chave.png",
          "/screenshots/cabecas-chave2.png",
          "/screenshots/cabecas-chave3.png",
          "/screenshots/cabecas-chave4.png",
        ],
      },
      {
        id: "resultados",
        title: "Lançar Resultados",
        description: "Registre placares das partidas de forma simples.",
        images: [
          "/screenshots/resultados.png",
          "/screenshots/resultados2.png",
          "/screenshots/resultados3.png",
          "/screenshots/resultados4.png",
          "/screenshots/resultados5.png",
          "/screenshots/resultados6.png",
        ],
      },
      {
        id: "grupos",
        title: "Fase de Grupos",
        description: "Acompanhe classificação e resultados de cada grupo.",
        images: [
          "/screenshots/fase-grupos.png",
          "/screenshots/fase-grupos2.png",
          "/screenshots/fase-grupos3.png",
          "/screenshots/fase-grupos4.png",
        ],
      },
      {
        id: "chaves",
        title: "Chaves Eliminatórias",
        description: "Bracket visual das fases eliminatórias.",
        images: [
          "/screenshots/fase-eliminatoria.png",
          "/screenshots/fase-eliminatoria2.png",
          "/screenshots/fase-eliminatoria3.png",
          "/screenshots/fase-eliminatoria4.png",
        ],
      },
      {
        id: "confrontro-jogadores",
        title: "Escalação nos Confrontos",
        description:
          "Escalação manual ou automática dos jogadores em cada confronto.",
        images: [
          "/screenshots/definir-jogadores.png",
          "/screenshots/definir-jogadores2.png",
          "/screenshots/definir-jogadores3.png",
          "/screenshots/definir-jogadores4.png",
        ],
      },
    ],
  },
  {
    id: "publico",
    label: "Página Pública",
    screenshots: [
      {
        id: "arena-publica",
        title: "Página da Arena",
        description: "Página exclusiva para divulgar etapas e resultados.",
        images: ["/screenshots/arena-publica.png"],
      },
      {
        id: "ranking",
        title: "Ranking",
        description: "Ranking atualizado automaticamente após cada etapa.",
        images: ["/screenshots/ranking.png"],
      },
      {
        id: "etapa-publica",
        title: "Etapa Pública",
        description: "Visualização pública dos grupos e resultados.",
        images: [
          "/screenshots/detalhe-etapa-publica.png",
          "/screenshots/detalhe-etapa-publica2.png",
        ],
      },
      {
        id: "perfil-jogador",
        title: "Perfil do Jogador",
        description: "Histórico e estatísticas individuais do jogador.",
        images: ["/screenshots/perfil-jogador.png"],
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
