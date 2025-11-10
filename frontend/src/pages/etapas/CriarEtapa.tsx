import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CriarEtapaDTO } from "../../types/etapa";
import { NivelJogador } from "../../types/jogador";
import etapaService from "../../services/etapaService";

/**
 * Página de criar etapa
 */
export const CriarEtapa: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errosDatas, setErrosDatas] = useState<{
    dataInicio?: string;
    dataFim?: string;
    dataRealizacao?: string;
  }>({});

  const [formData, setFormData] = useState<CriarEtapaDTO>({
    nome: "",
    descricao: "",
    nivel: NivelJogador.INTERMEDIARIO, // ← ADICIONADO: Valor padrão
    dataInicio: "",
    dataFim: "",
    dataRealizacao: "",
    local: "",
    maxJogadores: 16,
    jogadoresPorGrupo: 3, // Valor fixo, não editável
  });

  /**
   * Calcula a distribuição otimizada de duplas em grupos
   * Prioriza grupos de 3 duplas, distribui extras nos últimos grupos
   * EXCEÇÃO: 10 jogadores (5 duplas) = 1 grupo único
   */
  const calcularDistribuicaoGrupos = () => {
    // Validar se maxJogadores é um número válido
    if (
      !formData.maxJogadores ||
      isNaN(formData.maxJogadores) ||
      formData.maxJogadores < 6
    ) {
      return {
        qtdGrupos: 0,
        distribuicao: [],
        descricao: "Informe o número de jogadores (mínimo 6)",
        totalDuplas: 0,
      };
    }

    const totalDuplas = Math.floor(formData.maxJogadores / 2);

    if (totalDuplas < 3) {
      return {
        qtdGrupos: 0,
        distribuicao: [],
        descricao: "Mínimo de 6 jogadores (3 duplas) necessário",
        totalDuplas: 0,
      };
    }

    // EXCEÇÃO ESPECIAL: 10 jogadores (5 duplas) = 1 grupo único
    if (totalDuplas === 5) {
      return {
        qtdGrupos: 1,
        distribuicao: [5],
        descricao: "Grupo 1: 5 duplas",
        totalDuplas: 5,
      };
    }

    // Calcular quantidade de grupos (sempre começando com 3 duplas)
    const gruposBase = Math.floor(totalDuplas / 3);
    const duplasRestantes = totalDuplas % 3;

    const distribuicao: number[] = [];

    // Criar grupos de 3 duplas
    for (let i = 0; i < gruposBase; i++) {
      distribuicao.push(3);
    }

    // Distribuir duplas restantes nos últimos grupos (1 por grupo)
    if (duplasRestantes > 0) {
      for (let i = 0; i < duplasRestantes; i++) {
        const index = distribuicao.length - 1 - i;
        if (index >= 0) {
          distribuicao[index]++;
        }
      }
    }

    const qtdGrupos = distribuicao.length;

    // Criar descrição detalhada
    const descricaoGrupos = distribuicao
      .map((duplas, i) => `Grupo ${i + 1}: ${duplas} duplas`)
      .join(" | ");

    return {
      qtdGrupos,
      distribuicao,
      descricao: descricaoGrupos,
      totalDuplas,
    };
  };

  const infoGrupos = calcularDistribuicaoGrupos();

  /**
   * Valida as datas do formulário
   * Regras:
   * 1. Data início < Data fim
   * 2. Data fim < Data realização
   * 3. Data realização deve ser após o fim das inscrições
   */
  const validarDatas = () => {
    const erros: typeof errosDatas = {};

    if (formData.dataInicio && formData.dataFim && formData.dataRealizacao) {
      const inicio = new Date(formData.dataInicio);
      const fim = new Date(formData.dataFim);
      const realizacao = new Date(formData.dataRealizacao);

      // Validar: início < fim
      if (inicio >= fim) {
        erros.dataFim = "Data fim deve ser após a data de início";
      }

      // Validar: fim < realização
      if (fim >= realizacao) {
        erros.dataRealizacao =
          "Data de realização deve ser após o fim das inscrições";
      }

      // Validar: início < realização
      if (inicio >= realizacao) {
        erros.dataRealizacao =
          "Data de realização deve ser após o início das inscrições";
      }
    }

    setErrosDatas(erros);
    return Object.keys(erros).length === 0;
  };

  // Validar datas sempre que mudarem
  React.useEffect(() => {
    if (formData.dataInicio || formData.dataFim || formData.dataRealizacao) {
      validarDatas();
    }
  }, [formData.dataInicio, formData.dataFim, formData.dataRealizacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Validar datas
      if (!validarDatas()) {
        setError("Corrija os erros nas datas antes de continuar");
        setLoading(false);
        return;
      }

      // Validar mínimo de jogadores
      if (formData.maxJogadores < 6) {
        setError("Mínimo de 6 jogadores necessário");
        setLoading(false);
        return;
      }

      // Formatar datas para ISO
      const totalDuplas = Math.floor(formData.maxJogadores / 2);

      // Calcular jogadoresPorGrupo que fará o backend chegar ao qtdGrupos correto
      const jogadoresPorGrupoCalculado = Math.ceil(
        totalDuplas / infoGrupos.qtdGrupos
      );

      const dadosFormatados: CriarEtapaDTO = {
        ...formData,
        dataInicio: formData.dataInicio
          ? new Date(formData.dataInicio + "T00:00:00").toISOString()
          : "",
        dataFim: formData.dataFim
          ? new Date(formData.dataFim + "T23:59:59").toISOString()
          : "",
        dataRealizacao: formData.dataRealizacao
          ? new Date(formData.dataRealizacao + "T00:00:00").toISOString()
          : "",
        jogadoresPorGrupo: jogadoresPorGrupoCalculado,
      };

      await etapaService.criar(dadosFormatados);

      // Redirecionar para a lista de etapas
      navigate("/admin/etapas");
    } catch (err: any) {
      console.error("Erro ao criar etapa:", err);
      setError(err.message || "Erro ao criar etapa");
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CriarEtapaDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/etapas")}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Voltar
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Criar Nova Etapa</h1>
        <p className="text-gray-600 mt-1">
          Preencha os dados para criar uma nova etapa do torneio
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Erro ao criar etapa</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Principal */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informações Básicas
          </h2>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Etapa *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Ex: Etapa 1 - Classificatória"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Descreva os detalhes da etapa..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nível */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nível da Etapa *
              </label>
              <select
                required
                value={formData.nivel}
                onChange={(e) =>
                  handleChange("nivel", e.target.value as NivelJogador)
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={NivelJogador.INICIANTE}>🌱 Iniciante</option>
                <option value={NivelJogador.INTERMEDIARIO}>
                  ⚡ Intermediário
                </option>
                <option value={NivelJogador.AVANCADO}>🔥 Avançado</option>
                <option value={NivelJogador.PROFISSIONAL}>
                  ⭐ Profissional
                </option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                ⚠️ Apenas jogadores deste nível poderão se inscrever
              </p>
            </div>

            {/* Local */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local
              </label>
              <input
                type="text"
                value={formData.local}
                onChange={(e) => handleChange("local", e.target.value)}
                placeholder="Ex: Quadras Arena Beach Tennis"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datas</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Data Início Inscrições */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Início das Inscrições *
              </label>
              <input
                type="date"
                required
                value={formData.dataInicio}
                onChange={(e) => handleChange("dataInicio", e.target.value)}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                  errosDatas.dataInicio
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errosDatas.dataInicio && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ {errosDatas.dataInicio}
                </p>
              )}
            </div>

            {/* Data Fim Inscrições */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fim das Inscrições *
              </label>
              <input
                type="date"
                required
                value={formData.dataFim}
                onChange={(e) => handleChange("dataFim", e.target.value)}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                  errosDatas.dataFim
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errosDatas.dataFim && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ {errosDatas.dataFim}
                </p>
              )}
            </div>

            {/* Data Realização */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Realização *
              </label>
              <input
                type="date"
                required
                value={formData.dataRealizacao}
                onChange={(e) => handleChange("dataRealizacao", e.target.value)}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                  errosDatas.dataRealizacao
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errosDatas.dataRealizacao && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ {errosDatas.dataRealizacao}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configurações
          </h2>

          <div className="space-y-4">
            {/* Máximo de Jogadores */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Jogadores *
              </label>
              <input
                type="number"
                required
                min="6"
                max="64"
                value={formData.maxJogadores || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange(
                    "maxJogadores",
                    value === "" ? 0 : parseInt(value)
                  );
                }}
                onBlur={(e) => {
                  // Validar e ajustar para par ao sair do campo
                  const valor = parseInt(e.target.value);
                  if (isNaN(valor) || valor < 6) {
                    handleChange("maxJogadores", 6);
                  } else if (valor % 2 !== 0) {
                    // Se for ímpar, ajustar para próximo par
                    handleChange("maxJogadores", valor + 1);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deve ser um número par (mínimo 6, máximo 64)
              </p>
            </div>

            {/* Preview da Distribuição de Grupos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                📊 Distribuição Automática de Grupos
              </h3>

              {infoGrupos.qtdGrupos > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-700">
                      <strong>{infoGrupos.totalDuplas}</strong> duplas
                    </span>
                    <span className="text-blue-700">→</span>
                    <span className="text-blue-700">
                      <strong>{infoGrupos.qtdGrupos}</strong>{" "}
                      {infoGrupos.qtdGrupos === 1 ? "grupo" : "grupos"}
                    </span>
                  </div>

                  <div className="bg-white rounded p-3 text-sm text-gray-700">
                    {infoGrupos.descricao}
                  </div>

                  <p className="text-xs text-blue-600">
                    ✓ Grupos criados automaticamente com 3 duplas cada (mínimo)
                  </p>
                </div>
              ) : (
                <p className="text-sm text-blue-700">{infoGrupos.descricao}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/etapas")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              infoGrupos.qtdGrupos === 0 ||
              Object.keys(errosDatas).length > 0
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando..." : "Criar Etapa"}
          </button>
        </div>
      </form>
    </div>
  );
};
