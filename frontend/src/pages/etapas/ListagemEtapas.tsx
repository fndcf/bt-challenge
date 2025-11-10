import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Etapa, StatusEtapa, FiltrosEtapa } from "../../types/etapa";
import etapaService from "../../services/etapaService";
import { EtapaCard } from "../../components/etapas/EtapaCard";
import LoadingSpinner from "../../components/LoadingSpinner";

/**
 * Página de listagem de etapas
 */
export const ListagemEtapas: React.FC = () => {
  const navigate = useNavigate();

  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<StatusEtapa | "">("");
  const [ordenacao, setOrdenacao] = useState<"dataRealizacao" | "criadoEm">(
    "dataRealizacao"
  );

  // Estatísticas
  const [stats, setStats] = useState({
    totalEtapas: 0,
    inscricoesAbertas: 0,
    emAndamento: 0,
    finalizadas: 0,
  });

  useEffect(() => {
    carregarDados();
  }, [filtroStatus, ordenacao]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const filtros: FiltrosEtapa = {
        ordenarPor: ordenacao,
        ordem: "desc",
        limite: 50,
      };

      if (filtroStatus) {
        filtros.status = filtroStatus;
      }

      const [resultado, estatisticas] = await Promise.all([
        etapaService.listar(filtros),
        etapaService.obterEstatisticas(),
      ]);

      setEtapas(resultado.etapas);
      setStats(estatisticas);
    } catch (err: any) {
      console.error("Erro ao carregar etapas:", err);
      setError(err.response?.data?.error || "Erro ao carregar etapas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Etapas</h1>
            <p className="text-gray-600 mt-1">Gerencie as etapas do torneio</p>
          </div>
          <button
            onClick={() => navigate("/admin/etapas/criar")}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <span className="text-xl">➕</span>
            Criar Etapa
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-lg p-3">
              <span className="text-3xl">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Etapas</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalEtapas}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-lg p-3">
              <span className="text-3xl">📝</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inscrições Abertas</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inscricoesAbertas}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-lg p-3">
              <span className="text-3xl">🎾</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.emAndamento}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 rounded-lg p-3">
              <span className="text-3xl">🏆</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Finalizadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.finalizadas}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Filtrar por:
            </span>
            <select
              value={filtroStatus}
              onChange={(e) =>
                setFiltroStatus(e.target.value as StatusEtapa | "")
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value={StatusEtapa.INSCRICOES_ABERTAS}>
                Inscrições Abertas
              </option>
              <option value={StatusEtapa.INSCRICOES_ENCERRADAS}>
                Inscrições Encerradas
              </option>
              <option value={StatusEtapa.CHAVES_GERADAS}>Chaves Geradas</option>
              <option value={StatusEtapa.EM_ANDAMENTO}>Em Andamento</option>
              <option value={StatusEtapa.FINALIZADA}>Finalizadas</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Ordenar por:
            </span>
            <select
              value={ordenacao}
              onChange={(e) =>
                setOrdenacao(e.target.value as "dataRealizacao" | "criadoEm")
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dataRealizacao">Data de Realização</option>
              <option value="criadoEm">Data de Criação</option>
            </select>
          </div>

          {(filtroStatus || ordenacao !== "dataRealizacao") && (
            <button
              onClick={() => {
                setFiltroStatus("");
                setOrdenacao("dataRealizacao");
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Etapas */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {etapas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <span className="text-6xl mb-4 block">🎾</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma etapa encontrada
          </h3>
          <p className="text-gray-600 mb-6">
            {filtroStatus
              ? "Não há etapas com esse status."
              : "Comece criando sua primeira etapa!"}
          </p>
          {!filtroStatus && (
            <button
              onClick={() => navigate("/admin/etapas/criar")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Criar Primeira Etapa
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {etapas.map((etapa) => (
            <EtapaCard key={etapa.id} etapa={etapa} />
          ))}
        </div>
      )}
    </div>
  );
};
