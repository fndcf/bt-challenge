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
`;

const ErrorContent = styled.div`
  text-align: center;
  color: white;
  max-width: 600px;
  padding: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: 900;
  margin: 0;
  line-height: 1;
  text-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  @media (min-width: 768px) {
    font-size: 12rem;
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin: 1rem 0;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin: 1.5rem 0;
  }
`;

const Description = styled.p`
  font-size: 1.125rem;
  margin: 0 0 2rem 0;
  opacity: 0.9;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1.25rem;
    margin: 0 0 2.5rem 0;
  }
`;

const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #667eea;
  padding: 0.875rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    padding: 1rem 2.5rem;
    font-size: 1.125rem;
  }
`;

// ============== COMPONENTE ==============

const Unauthorized: React.FC = () => {
  useDocumentTitle("Acesso Negado");

  return (
    <PageContainer>
      <ErrorContent>
        <ErrorCode>403</ErrorCode>
        <Title>Acesso Negado</Title>
        <Description>
          Você não tem permissão para acessar esta página.
        </Description>
        <HomeButton to="/">Voltar para o Início</HomeButton>
      </ErrorContent>
    </PageContainer>
  );
};

export default Unauthorized;
