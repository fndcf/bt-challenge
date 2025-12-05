import styled from "styled-components";
import { Link } from "react-router-dom";

export const PageContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
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
        circle at 30% 40%,
        rgba(255, 255, 255, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 70% 70%,
        rgba(255, 255, 255, 0.08) 0%,
        transparent 50%
      );
    pointer-events: none;
  }
`;

export const ContentContainer = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 600px;
  width: 100%;
  padding: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

// ============== ERROR CODE ==============

export const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: 900;
  color: white;
  margin: 0;
  line-height: 1;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  animation: pulse 2s ease-in-out infinite;
  letter-spacing: -0.05em;

  @media (min-width: 640px) {
    font-size: 10rem;
  }

  @media (min-width: 1024px) {
    font-size: 12rem;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.02);
    }
  }
`;

// ============== TEXT ==============

export const Title = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: white;
  margin: 1.5rem 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (min-width: 640px) {
    font-size: 2.25rem;
  }

  @media (min-width: 1024px) {
    font-size: 2.5rem;
  }
`;

export const Description = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 2rem 0;
  line-height: 1.6;

  @media (min-width: 640px) {
    font-size: 1.125rem;
  }

  @media (min-width: 1024px) {
    font-size: 1.25rem;
    margin: 0 0 2.5rem 0;
  }
`;

// ============== BUTTON ==============

export const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: white;
  color: #134e5e;
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

export const LockIcon = styled.div`
  width: 100px;
  height: 100px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  animation: float-lock 3s ease-in-out infinite;

  svg {
    width: 50px;
    height: 50px;
    color: white;
  }

  @media (min-width: 768px) {
    width: 120px;
    height: 120px;

    svg {
      width: 60px;
      height: 60px;
    }
  }

  @keyframes float-lock {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;
