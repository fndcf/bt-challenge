import React from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks";
import "./Home.css";

const Home: React.FC = () => {
  useDocumentTitle("Início");

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>🎾 Challenge BT</h1>
        <p className="home-subtitle">
          Sistema de Gerenciamento de Torneios de Beach Tennis
        </p>

        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Gestão de Jogadores</h3>
            <p>Cadastro e organização de jogadores por nível</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Torneios</h3>
            <p>Criação automática de chaves e grupos</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Rankings</h3>
            <p>Sistema de pontuação e estatísticas</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏟️</div>
            <h3>Multi-Arena</h3>
            <p>Suporte para múltiplas arenas</p>
          </div>
        </div>

        <div className="home-actions">
          <Link to="/register" className="btn btn-primary">
            Criar Minha Arena
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Já tenho uma Arena
          </Link>
        </div>
      </div>

      <div className="home-info">
        <h2>Como Funciona?</h2>
        <div className="info-steps">
          <div className="info-step">
            <span className="step-number">1</span>
            <h4>Cadastro de Jogadores</h4>
            <p>Jogadores se cadastram individualmente por nível e gênero</p>
          </div>

          <div className="info-step">
            <span className="step-number">2</span>
            <h4>Geração de Chaves</h4>
            <p>Sistema forma duplas automaticamente e cria grupos</p>
          </div>

          <div className="info-step">
            <span className="step-number">3</span>
            <h4>Fase de Grupos</h4>
            <p>Todos jogam contra todos no grupo</p>
          </div>

          <div className="info-step">
            <span className="step-number">4</span>
            <h4>Eliminatórias</h4>
            <p>Os melhores avançam para a fase final</p>
          </div>

          <div className="info-step">
            <span className="step-number">5</span>
            <h4>Ranking</h4>
            <p>Pontuação individual acumulada ao longo das etapas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
