import styled from "styled-components";
import { Link } from "react-router-dom";

export const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
`;

// ============== HERO SECTION ==============

export const Hero = styled.div`
  padding: 3rem 1rem;
  text-align: center;

  @media (min-width: 768px) {
    padding: 4rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 5rem 2rem;
  }
`;

export const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    font-size: 3.5rem;
  }

  @media (min-width: 1024px) {
    font-size: 4.5rem;
  }
`;

export const Subtitle = styled.p`
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 3rem 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }

  @media (min-width: 1024px) {
    font-size: 1.5rem;
  }
`;

// ============== FEATURES ==============

export const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto 3rem auto;
  padding: 0 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 2rem;
  }
`;

export const FeatureCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem 1.5rem;
  text-align: center;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  @media (min-width: 768px) {
    padding: 2.5rem 2rem;
  }
`;

export const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 3.5rem;
  }
`;

export const FeatureTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

export const FeatureText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

// ============== ACTIONS ==============

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
  margin: 0 auto;
  padding: 0 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
`;

export const Button = styled(Link)<{ $variant?: "primary" | "secondary" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  ${(props) =>
    props.$variant === "secondary"
      ? `
    background: white;
    color: #134e5e;

    &:hover {
      background: #f9fafb;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
  `
      : `
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;

    &:hover {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    }
  `}

  @media (min-width: 640px) {
    padding: 1rem 2.5rem;
  }
`;

// ============== INFO SECTION ==============

export const InfoSection = styled.div`
  background: white;
  padding: 4rem 1rem;

  @media (min-width: 768px) {
    padding: 5rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 6rem 2rem;
  }
`;

export const InfoTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0 0 3rem 0;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }

  @media (min-width: 1024px) {
    font-size: 3rem;
  }
`;

export const StepsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2.5rem;
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1.5rem;
  }
`;

export const Step = styled.div`
  text-align: center;
  position: relative;

  @media (min-width: 1024px) {
    &:not(:last-child)::after {
      content: "→";
      position: absolute;
      right: -1rem;
      top: 1.5rem;
      font-size: 2rem;
      color: #d1d5db;
      font-weight: 700;
    }
  }
`;

export const StepNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  color: white;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    width: 3.5rem;
    height: 3.5rem;
    font-size: 1.75rem;
  }
`;

export const StepTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

export const StepText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;
