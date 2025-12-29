/**
 * Responsabilidade: Galeria de screenshots do sistema com tabs por categoria
 */

import React, { useState } from "react";
import * as S from "../../Home/Home.styles";

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
          "Visao geral com estatísticas de jogadores, etapas e rankings.",
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
        description: "Gerencie etapas.",
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
        description: "Escolha seus cabeças de chave por etapa",
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
        title: "Confrontos Jogadores por Equipe",
        description:
          "Definição de Jogadores manual/automática para confronto de equipes",
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
    label: "Pagina Pública",
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

export const GaleriaSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("administrativo");
  const [_imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Screenshot | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageError = (imageKey: string) => {
    setImageErrors((prev) => new Set(prev).add(imageKey));
  };

  const handleOpenModal = (item: Screenshot) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
    setCurrentImageIndex(0);
    document.body.style.overflow = "auto";
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItem) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedItem.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItem) {
      setCurrentImageIndex((prev) =>
        prev === selectedItem.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const categoriaAtiva = categorias.find((c) => c.id === activeTab);

  const getImageKey = (itemId: string, imageIndex: number) =>
    `${itemId}-${imageIndex}`;

  return (
    <S.GaleriaSection>
      <S.GaleriaSectionTitle>Veja o Sistema em Ação</S.GaleriaSectionTitle>
      <S.GaleriaSectionSubtitle>
        Conheca as principais telas e funcionalidades do Dupley
      </S.GaleriaSectionSubtitle>

      <S.GaleriaTabs>
        {categorias.map((categoria) => (
          <S.GaleriaTab
            key={categoria.id}
            $active={activeTab === categoria.id}
            onClick={() => setActiveTab(categoria.id)}
          >
            {categoria.label}
          </S.GaleriaTab>
        ))}
      </S.GaleriaTabs>

      <S.GaleriaGrid>
        {categoriaAtiva?.screenshots.map((item) => (
          <S.GaleriaItem key={item.id} onClick={() => handleOpenModal(item)}>
            <S.GaleriaImageWrapper>
              <S.GaleriaImage
                src={item.images[0]}
                alt={item.title}
                onError={() => handleImageError(getImageKey(item.id, 0))}
              />
              {item.images.length > 1 && (
                <S.GaleriaImageCount>{item.images.length}</S.GaleriaImageCount>
              )}
            </S.GaleriaImageWrapper>
            <S.GaleriaContent>
              <S.GaleriaTitle>{item.title}</S.GaleriaTitle>
              <S.GaleriaDescription>{item.description}</S.GaleriaDescription>
            </S.GaleriaContent>
          </S.GaleriaItem>
        ))}
      </S.GaleriaGrid>

      {modalOpen && selectedItem && (
        <S.GaleriaModal onClick={handleCloseModal}>
          <S.GaleriaModalContent onClick={(e) => e.stopPropagation()}>
            <S.GaleriaModalClose onClick={handleCloseModal}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </S.GaleriaModalClose>

            <S.GaleriaModalImageWrapper>
              <S.GaleriaModalImage
                src={selectedItem.images[currentImageIndex]}
                alt={`${selectedItem.title} - ${currentImageIndex + 1}`}
                onError={() =>
                  handleImageError(
                    getImageKey(selectedItem.id, currentImageIndex)
                  )
                }
              />

              {selectedItem.images.length > 1 && (
                <>
                  <S.GaleriaModalNavButton
                    $position="left"
                    onClick={handlePrevImage}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </S.GaleriaModalNavButton>
                  <S.GaleriaModalNavButton
                    $position="right"
                    onClick={handleNextImage}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </S.GaleriaModalNavButton>
                </>
              )}
            </S.GaleriaModalImageWrapper>

            <S.GaleriaModalInfo>
              <S.GaleriaModalTitle>{selectedItem.title}</S.GaleriaModalTitle>
              <S.GaleriaModalDescription>
                {selectedItem.description}
              </S.GaleriaModalDescription>

              {selectedItem.images.length > 1 && (
                <S.GaleriaModalDots>
                  {selectedItem.images.map((_, index) => (
                    <S.GaleriaModalDot
                      key={index}
                      $active={index === currentImageIndex}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </S.GaleriaModalDots>
              )}
            </S.GaleriaModalInfo>
          </S.GaleriaModalContent>
        </S.GaleriaModal>
      )}
    </S.GaleriaSection>
  );
};

export default GaleriaSection;
