import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useArena } from "../contexts/ArenaContext";
import { useDocumentTitle } from "../hooks";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  useDocumentTitle("Dashboard");

  const { user } = useAuth();
  const { arena } = useArena();

  // Dados mockados para demonstração
  const stats = [
    {
      icon: "👥",
      label: "Jogadores",
      value: "0",
      color: "#667eea",
      link: "/admin/jogadores",
    },
    {
      icon: "🏆",
      label: "Challenges",
      value: "0",
      color: "#f093fb",
      link: "/admin/etapas",
    },
    {
      icon: "🎾",
      label: "Jogos",
      value: "0",
      color: "#4facfe",
      link: "/admin/challenges",
    },
    {
      icon: "📊",
      label: "Ranking",
      value: "-",
      color: "#43e97b",
      link: "/admin/ranking",
    },
  ];

  const quickActions = [
    {
      icon: "➕",
      label: "Cadastrar Jogador",
      description: "Adicione novos jogadores à arena",
      link: "/admin/jogadores/novo",
      color: "#667eea",
    },
    {
      icon: "🎯",
      label: "Criar Challenge",
      description: "Inicie uma nova etapa de torneio",
      link: "/admin/etapas/criar",
      color: "#f093fb",
    },
    {
      icon: "📈",
      label: "Ver Ranking",
      description: "Confira a classificação geral",
      link: "/admin/ranking",
      color: "#4facfe",
    },
    {
      icon: "⚙️",
      label: "Configurações",
      description: "Ajuste as configurações da arena",
      link: "/admin/configuracoes",
      color: "#43e97b",
    },
  ];

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h1>Bem-vindo(a), {user?.email?.split("@")[0]}! 👋</h1>
          <p>
            Gerencie sua arena e organize torneios incríveis de Beach Tennis
          </p>
        </div>
        {arena && (
          <div className="arena-badge">
            <span className="arena-badge-icon">🏟️</span>
            <div className="arena-badge-info">
              <div className="arena-badge-name">{arena.nome}</div>
              <div className="arena-badge-url">
                challengebt.com.br/arena/{arena.slug}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="stat-card"
            style={{ borderLeftColor: stat.color }}
          >
            <div
              className="stat-icon"
              style={{ background: `${stat.color}20`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Ações Rápidas</h2>
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link} className="action-card">
              <div
                className="action-icon"
                style={{ background: `${action.color}20`, color: action.color }}
              >
                {action.icon}
              </div>
              <div className="action-content">
                <h3>{action.label}</h3>
                <p>{action.description}</p>
              </div>
              <div className="action-arrow" style={{ color: action.color }}>
                →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="dashboard-section">
        <h2>Primeiros Passos</h2>
        <div className="getting-started">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Cadastre Jogadores</h3>
              <p>Comece adicionando os jogadores da sua arena ao sistema</p>
              <Link to="/admin/jogadores/novo" className="step-link">
                Cadastrar Primeiro Jogador →
              </Link>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Crie um Challenge</h3>
              <p>Organize sua primeira etapa de torneio</p>
              <Link to="/admin/challenges/novo" className="step-link">
                Criar Challenge →
              </Link>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Compartilhe sua Arena</h3>
              <p>Divulgue o link público para os jogadores acompanharem</p>
              {arena && (
                <a
                  href={`/arena/${arena.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="step-link"
                >
                  Ver Página Pública →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="dashboard-help">
        <div className="help-icon">💡</div>
        <div className="help-content">
          <h3>Precisa de Ajuda?</h3>
          <p>
            Acesse nossa documentação ou entre em contato com o suporte para
            tirar dúvidas
          </p>
        </div>
        <div className="help-actions">
          <a href="#" className="help-link">
            📚 Documentação
          </a>
          <a href="#" className="help-link">
            💬 Suporte
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
