import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useDocumentTitle } from "../hooks";

// ============== STYLED COMPONENTS ==============

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  position: relative;
  overflow: hidden;

  /* Background Pattern */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(
        circle at 20% 50%,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 80%,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%
      );
    pointer-events: none;
  }
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 600px;
  width: 100%;
`;

// ============== ERROR CODE ==============

const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: 900;
  color: white;
  margin: 0;
  line-height: 1;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  animation: float 3s ease-in-out infinite;
  letter-spacing: -0.05em;

  @media (min-width: 640px) {
    font-size: 12rem;
  }

  @media (min-width: 1024px) {
    font-size: 16rem;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }
`;

// ============== EMOJI ==============

const EmojiContainer = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: spin 4s linear infinite;

  @media (min-width: 640px) {
    font-size: 5rem;
  }

  @media (min-width: 1024px) {
    font-size: 6rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// ============== TEXT ==============

const Title = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: white;
  margin: 1.5rem 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (min-width: 640px) {
    font-size: 2.5rem;
  }

  @media (min-width: 1024px) {
    font-size: 3rem;
  }
`;

const Description = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 2rem 0;
  line-height: 1.6;

  @media (min-width: 640px) {
    font-size: 1.125rem;
  }

  @media (min-width: 1024px) {
    font-size: 1.25rem;
  }
`;

// ============== BUTTON ==============

const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: white;
  color: #667eea;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 640px) {
    padding: 1.125rem 2.5rem;
    font-size: 1.125rem;
  }
`;

// ============== DECORATIONS ==============

const FloatingShape = styled.div<{
  $delay?: number;
  $size?: number;
  $left?: number;
  $top?: number;
}>`
  position: absolute;
  width: ${(props) => props.$size || 100}px;
  height: ${(props) => props.$size || 100}px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  left: ${(props) => props.$left || 10}%;
  top: ${(props) => props.$top || 20}%;
  animation: float-shape 6s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay || 0}s;

  @keyframes float-shape {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -30px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
  }
`;

// ============== COMPONENTE ==============

const NotFound: React.FC = () => {
  useDocumentTitle("Página Não Encontrada");

  return (
    <PageContainer>
      {/* Decorações flutuantes */}
      <FloatingShape $size={80} $left={10} $top={20} $delay={0} />
      <FloatingShape $size={120} $left={85} $top={15} $delay={1} />
      <FloatingShape $size={60} $left={15} $top={75} $delay={2} />
      <FloatingShape $size={100} $left={80} $top={70} $delay={1.5} />

      <ContentContainer>
        <EmojiContainer>🎾</EmojiContainer>
        <ErrorCode>404</ErrorCode>
        <Title>Página Não Encontrada</Title>
        <Description>
          A página que você está procurando não existe ou foi movida.
        </Description>
        <HomeButton to="/">
          <span>←</span>
          Voltar para o Início
        </HomeButton>
      </ContentContainer>
    </PageContainer>
  );
};

export default NotFound;
