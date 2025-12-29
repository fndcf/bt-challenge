import styled from "styled-components";
import { Link } from "react-router-dom";

export const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
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

// ============== HERO SECTION ==============

export const HeroSection = styled.section`
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  padding: 4rem 1rem;
  text-align: center;

  @media (min-width: 768px) {
    padding: 5rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 6rem 2rem;
  }
`;

export const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
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
  margin: 0 0 2rem 0;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }

  @media (min-width: 1024px) {
    font-size: 1.5rem;
  }
`;
// ============== FORMATOS SECTION ==============

export const FormatosSection = styled.section`
  background: white;
  padding: 4rem 1rem;

  @media (min-width: 768px) {
    padding: 5rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 6rem 2rem;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0 0 1rem 0;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }

  @media (min-width: 1024px) {
    font-size: 3rem;
  }
`;

export const SectionSubtitle = styled.p`
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  margin: 0 auto 3rem auto;
  max-width: 600px;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

export const FormatosGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 2rem;
  }
`;

export const FormatoCard = styled.div`
  background: #f9fafb;
  border-radius: 1rem;
  padding: 2rem 1.5rem;
  text-align: center;
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    border-color: #71b280;
  }

  @media (min-width: 768px) {
    padding: 2.5rem 2rem;
  }
`;

export const FormatoTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem 0;

  @media (min-width: 768px) {
    font-size: 1.375rem;
  }
`;

export const FormatoDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const FormatoFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
`;

export const FormatoFeature = styled.li`
  font-size: 0.8125rem;
  color: #374151;
  padding: 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: "✓";
    color: #71b280;
    font-weight: 700;
  }

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

// ============== FEATURES SECTION ==============

export const FeaturesSection = styled.section`
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  padding: 4rem 1rem;

  @media (min-width: 768px) {
    padding: 5rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 6rem 2rem;
  }
`;

export const FeaturesSectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin: 0 0 3rem 0;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }

  @media (min-width: 1024px) {
    font-size: 3rem;
  }
`;

export const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem;
  }
`;

export const FeatureCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  @media (min-width: 768px) {
    padding: 2rem;
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

// ============== GALERIA SECTION ==============

export const GaleriaSection = styled.section`
  background: #f9fafb;
  padding: 4rem 1rem;

  @media (min-width: 768px) {
    padding: 5rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 6rem 2rem;
  }
`;

export const GaleriaSectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0 0 1rem 0;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }

  @media (min-width: 1024px) {
    font-size: 3rem;
  }
`;

export const GaleriaSectionSubtitle = styled.p`
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  margin: 0 auto 2rem auto;
  max-width: 600px;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

export const GaleriaTabs = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  padding: 0 1rem;

  @media (min-width: 768px) {
    gap: 1rem;
    margin-bottom: 3rem;
  }
`;

export const GaleriaTab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  ${(props) =>
    props.$active
      ? `
    background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `
      : `
    background: white;
    color: #374151;
    border-color: #e5e7eb;

    &:hover {
      border-color: #71b280;
      color: #134e5e;
    }
  `}

  @media (min-width: 768px) {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
`;

export const GaleriaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem;
  }
`;

export const GaleriaItem = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;

export const GaleriaImageWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-top: 62.5%; /* Aspect ratio 16:10 */
  overflow: hidden;
  background: #e5e7eb;
`;

export const GaleriaImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;

  ${GaleriaItem}:hover & {
    transform: scale(1.05);
  }
`;

export const GaleriaPlaceholder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  color: white;
  font-size: 3rem;
`;

export const GaleriaContent = styled.div`
  padding: 1.25rem;
`;

export const GaleriaTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

export const GaleriaDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

export const GaleriaModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const GaleriaModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (min-width: 768px) {
    max-width: 80vw;
  }

  @media (min-width: 1024px) {
    max-width: 70vw;
  }
`;

export const GaleriaModalClose = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 10;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

export const GaleriaModalImageWrapper = styled.div`
  width: 100%;
  max-height: 70vh;
  overflow: hidden;
  background: #e5e7eb;
`;

export const GaleriaModalImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  display: block;
`;

export const GaleriaModalPlaceholder = styled.div`
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  color: white;
  font-size: 5rem;

  @media (min-width: 768px) {
    height: 500px;
    font-size: 6rem;
  }
`;

export const GaleriaModalInfo = styled.div`
  padding: 1.5rem;
  background: white;
`;

export const GaleriaModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const GaleriaModalDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

export const GaleriaImageCount = styled.div`
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &::before {
    content: "";
    width: 12px;
    height: 12px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M3 15l6-6 4 4 8-8'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
  }
`;

export const GaleriaModalNavButton = styled.button<{
  $position: "left" | "right";
}>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(props) => (props.$position === "left" ? "left: 1rem;" : "right: 1rem;")}
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 5;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: translateY(-50%) scale(1.1);
  }

  @media (max-width: 640px) {
    width: 40px;
    height: 40px;
    ${(props) =>
      props.$position === "left" ? "left: 0.5rem;" : "right: 0.5rem;"}
  }
`;

export const GaleriaModalDots = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
`;

export const GaleriaModalDot = styled.button<{ $active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, #134e5e 0%, #71b280 100%)"
      : "#d1d5db"};
  transform: ${(props) => (props.$active ? "scale(1.2)" : "scale(1)")};

  &:hover {
    background: ${(props) =>
      props.$active
        ? "linear-gradient(135deg, #134e5e 0%, #71b280 100%)"
        : "#9ca3af"};
  }
`;

// ============== CTA SECTION ==============

export const CTAButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
  margin: 0 auto;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
`;

export const CTAButton = styled(Link)<{ $variant?: "primary" | "secondary" }>`
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
    border: 2px solid #134e5e;

    &:hover {
      background: #f9fafb;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
  `
      : `
    background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
    color: white;

    &:hover {
      background: linear-gradient(135deg, #0f3f4c 0%, #5a9a6a 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    }
  `}

  @media (min-width: 640px) {
    padding: 1rem 2.5rem;
  }
`;
