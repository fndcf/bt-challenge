import styled from "styled-components";
import { Link } from "react-router-dom";

export const PageContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
`;

export const Header = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

export const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem 2rem;
  }
`;

export const ArenaInfo = styled.div`
  flex: 1;

  h1 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.25rem 0;

    @media (min-width: 768px) {
      font-size: 2rem;
    }
  }

  p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }
`;

export const LoginButton = styled(Link)`
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
    padding: 0.875rem 2rem;
  }
`;

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (min-width: 768px) {
    padding: 3rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 4rem 2rem;
  }
`;

export const WelcomeCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

export const WelcomeTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;

  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
`;

export const WelcomeText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
`;

export const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingText = styled.p`
  font-size: 1.125rem;
  font-weight: 500;
`;

export const ErrorContainer = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
  }
`;

export const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

export const ErrorTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

export const ErrorText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin: 0 0 1.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

export const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;
