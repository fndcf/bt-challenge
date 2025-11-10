import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Etapa, AtualizarEtapaDTO } from "../../types/etapa";
import { NivelJogador } from "../../types/jogador";
import etapaService from "../../services/etapaService";
import { format } from "date-fns";

/**
 * Página de editar etapa
 */
export const EditarEtapa: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<AtualizarEtapaDTO>({
    nome: "",
    descricao: "",
    nivel: undefined,
    dataInicio: "",
    dataFim: "",
    dataRealizacao: "",
    local: "",
    maxJogadores: 16,
  });

  useEffect(() => {
    carregarEtapa();
  }, [id]);

  const carregarEtapa = async () => {
    try {
      setLoading(true);
      if (!id) {
        setError("ID da etapa não informado");
        return;
      }

      const data = await etapaService.buscarPorId(id);
      setEtapa(data);

      // Converter timestamps para formato de input (apenas data)
      const toInputDate = (timestamp: any) => {
        if (!timestamp) return "";
        const date = timestamp._seconds
          ? new Date(timestamp._seconds * 1000)
          : new Date(timestamp);
        return format(date, "yyyy-MM-dd"); // Apenas data, sem hora
      };

      setFormData({
        nome: data.nome,
        descricao: data.descricao || "",
        nivel: data.nivel,
        dataInicio: toInputDate(data.dataInicio),
        dataFim: toInputDate(data.dataFim),
        dataRealizacao: toInputDate(data.dataRealizacao),
        local: data.local || "",
        maxJogadores: data.maxJogadores || 16, // Garantir que sempre tenha um valor
      });
    } catch (err: any) {
      console.error("Erro ao carregar etapa:", err);
      setError(err.message || "Erro ao carregar etapa");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AtualizarEtapaDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      setSalvando(true);
      setError(null);

      // Validar maxJogadores
      if (!formData.maxJogadores) {
        setError("Número máximo de jogadores é obrigatório");
        return;
      }

      if (formData.maxJogadores < 6) {
        setError("Número mínimo de jogadores é 6 (3 duplas)");
        return;
      }

      if (formData.maxJogadores % 2 !== 0) {
        setError("Número de jogadores deve ser par");
        return;
      }

      if (etapa && formData.maxJogadores < etapa.totalInscritos) {
        setError(
          `Não é possível reduzir para ${formData.maxJogadores}. Já existem ${etapa.totalInscritos} jogador(es) inscrito(s).`
        );
        return;
      }

      // Converter datas para ISO com timezone (adicionar hora 12:00 como padrão)
      const toISO = (dateStr: string) => {
        if (!dateStr) return undefined;
        // Adicionar hora 12:00 UTC
        return new Date(`${dateStr}T12:00:00Z`).toISOString();
      };

      const dadosParaEnviar = {
        ...formData,
        dataInicio: formData.dataInicio
          ? toISO(formData.dataInicio)
          : undefined,
        dataFim: formData.dataFim ? toISO(formData.dataFim) : undefined,
        dataRealizacao: formData.dataRealizacao
          ? toISO(formData.dataRealizacao)
          : undefined,
      };

      console.log("📤 Enviando dados:", dadosParaEnviar);

      await etapaService.atualizar(id, dadosParaEnviar);
      alert("Etapa atualizada com sucesso!");
      navigate(`/admin/etapas/${id}`);
    } catch (err: any) {
      console.error("Erro ao atualizar etapa:", err);
      setError(err.message || "Erro ao atualizar etapa");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando etapa...</p>
        </div>
      </div>
    );
  }

  if (error && !etapa) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate("/admin/etapas")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para etapas
          </button>
        </div>
      </div>
    );
  }

  if (!etapa) return null;

  const temInscritos = etapa.totalInscritos > 0;
  const chavesGeradas = etapa.chavesGeradas;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/admin/etapas/${id}`)}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Voltar
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Etapa</h1>
        <p className="text-gray-600">Atualize as informações da etapa</p>
      </div>

      {/* Avisos */}
      {chavesGeradas && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">
            ⚠️ Esta etapa não pode ser editada pois as chaves já foram geradas
          </p>
        </div>
      )}

      {temInscritos && !chavesGeradas && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium mb-2">
            ⚠️ Esta etapa já possui inscritos. Algumas alterações são restritas:
          </p>
          <ul className="text-sm text-yellow-700 ml-4 list-disc">
            <li>Não é possível alterar o nível</li>
            <li>Não é possível diminuir o número máximo de jogadores</li>
          </ul>
        </div>
      )}

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Etapa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={chavesGeradas}
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Ex: Etapa 1 - Novembro 2025"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              disabled={chavesGeradas}
              value={formData.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Informações adicionais sobre a etapa"
            />
          </div>

          {/* Nível */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível da Etapa <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={chavesGeradas || temInscritos}
              value={formData.nivel}
              onChange={(e) =>
                handleChange("nivel", e.target.value as NivelJogador)
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value={NivelJogador.INICIANTE}>🌱 Iniciante</option>
              <option value={NivelJogador.INTERMEDIARIO}>
                ⚡ Intermediário
              </option>
              <option value={NivelJogador.AVANCADO}>🔥 Avançado</option>
              <option value={NivelJogador.PROFISSIONAL}>⭐ Profissional</option>
            </select>
            {temInscritos && (
              <p className="text-xs text-yellow-700 mt-1">
                ⚠️ Não é possível alterar o nível pois já existem jogadores
                inscritos
              </p>
            )}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Início das Inscrições <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={chavesGeradas}
                value={formData.dataInicio}
                onChange={(e) => handleChange("dataInicio", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fim das Inscrições <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={chavesGeradas}
                value={formData.dataFim}
                onChange={(e) => handleChange("dataFim", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Realização <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={chavesGeradas}
                value={formData.dataRealizacao}
                onChange={(e) => handleChange("dataRealizacao", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Local
            </label>
            <input
              type="text"
              disabled={chavesGeradas}
              value={formData.local}
              onChange={(e) => handleChange("local", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Ex: Arena Beach Tennis São Paulo"
            />
          </div>

          {/* Max Jogadores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número Máximo de Jogadores <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={(() => {
                const minimo = Math.max(
                  6,
                  temInscritos ? etapa.totalInscritos : 6
                );
                return minimo % 2 === 0 ? minimo : minimo + 1;
              })()}
              max={64}
              disabled={chavesGeradas}
              value={formData.maxJogadores || ""}
              onChange={(e) => {
                // Permite apagar e digitar livremente
                const value =
                  e.target.value === "" ? undefined : parseInt(e.target.value);
                handleChange("maxJogadores", value);
              }}
              onBlur={(e) => {
                // Ao sair do campo, validar e ajustar
                if (e.target.value === "" || parseInt(e.target.value) < 6) {
                  const minimo = Math.max(
                    6,
                    temInscritos ? etapa.totalInscritos : 6
                  );
                  // Se minimo for ímpar, ajustar para próximo par
                  const minimoAjustado = minimo % 2 === 0 ? minimo : minimo + 1;
                  handleChange("maxJogadores", minimoAjustado);
                } else {
                  // Garantir que é par
                  const valor = parseInt(e.target.value);
                  if (valor % 2 !== 0) {
                    handleChange("maxJogadores", valor + 1);
                  }
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Ex: 16, 20, 24..."
            />
            {temInscritos ? (
              <p className="text-xs text-yellow-700 mt-1">
                {(() => {
                  const minimoReal = Math.max(6, etapa.totalInscritos);
                  const minimoAjustado =
                    minimoReal % 2 === 0 ? minimoReal : minimoReal + 1;

                  if (etapa.totalInscritos < 6) {
                    return `⚠️ Mínimo de 6 (mínimo absoluto) - sempre número par`;
                  } else if (etapa.totalInscritos % 2 === 0) {
                    return `⚠️ Mínimo de ${etapa.totalInscritos} (${etapa.totalInscritos} jogadores já inscritos) - sempre número par`;
                  } else {
                    return `⚠️ Mínimo de ${minimoAjustado} (${etapa.totalInscritos} inscritos + próximo par é ${minimoAjustado}) - sempre número par`;
                  }
                })()}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                💡 Use números pares (mínimo 6, máximo 64)
              </p>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate(`/admin/etapas/${id}`)}
            disabled={salvando}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando || chavesGeradas}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
};
