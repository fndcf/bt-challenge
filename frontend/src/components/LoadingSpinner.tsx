import React from "react";
import styled, { keyframes } from "styled-components";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  fullScreen?: boolean;
  message?: string;
}

// ============== ANIMATIONS ==============

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// ============== STYLED COMPONENTS ==============

const FullScreenContainer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const SpinnerCircle = styled.div<{ $size: "small" | "medium" | "large" }>`
  border-radius: 50%;
  border-style: solid;
  border-color: #e5e7eb;
  border-top-color: #667eea;
  animation: ${spin} 0.8s linear infinite;

  ${(props) => {
    switch (props.$size) {
      case "small":
        return `
          width: 1.5rem;
          height: 1.5rem;
          border-width: 2px;
        `;
      case "medium":
        return `
          width: 3rem;
          height: 3rem;
          border-width: 3px;
        `;
      case "large":
        return `
          width: 4rem;
          height: 4rem;
          border-width: 4px;
        `;
    }
  }}
`;

const Message = styled.p<{ $size: "small" | "medium" | "large" }>`
  margin: 0;
  color: #6b7280;
  font-weight: 500;
  text-align: center;

  ${(props) => {
    switch (props.$size) {
      case "small":
        return `font-size: 0.75rem;`;
      case "medium":
        return `font-size: 0.875rem;`;
      case "large":
        return `font-size: 1rem;`;
    }
  }}
`;

// ============== COMPONENTE ==============

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  fullScreen = false,
  message,
}) => {
  const spinner = (
    <SpinnerContainer>
      <SpinnerCircle $size={size} />
      {message && <Message $size={size}>{message}</Message>}
    </SpinnerContainer>
  );

  if (fullScreen) {
    return <FullScreenContainer>{spinner}</FullScreenContainer>;
  }

  return spinner;
};

export default LoadingSpinner;
