import React from "react";
import styled from "styled-components";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

const Overlay = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${(props) => (props.$isVisible ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 2rem 3rem;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
`;

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: #374151;
  font-weight: 600;
  font-size: 1rem;
  margin: 0;
`;

/**
 * Loading Overlay de tela cheia
 * Bloqueia toda a interface durante operações críticas
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Carregando...",
}) => {
  return (
    <Overlay $isVisible={isLoading}>
      <LoadingContent>
        <Spinner />
        <LoadingText>{message}</LoadingText>
      </LoadingContent>
    </Overlay>
  );
};

export default LoadingOverlay;
