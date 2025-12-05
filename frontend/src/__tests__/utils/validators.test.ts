/**
 * Testes dos validadores
 */

import { coreValidators } from "@/utils/validators/core";
import {
  businessValidators,
  validateReiDaPraiaInscritos,
} from "@/utils/validators/business";
import { validateForm, validateField } from "@/utils/validators/utils";
import {
  loginSchema,
  createJogadorSchema,
  createEtapaDuplaFixaSchema,
  createEtapaReiDaPraiaSchema,
  getEtapaSchema,
} from "@/utils/validators/schemas";

describe("coreValidators", () => {
  describe("required", () => {
    const rule = coreValidators.required();

    it("deve falhar para string vazia", () => {
      expect(rule.validate("")).toBe(false);
    });

    it("deve falhar para string só com espaços", () => {
      expect(rule.validate("   ")).toBe(false);
    });

    it("deve passar para string com conteúdo", () => {
      expect(rule.validate("texto")).toBe(true);
    });

    it("deve falhar para array vazio", () => {
      expect(rule.validate([])).toBe(false);
    });

    it("deve passar para array com elementos", () => {
      expect(rule.validate([1, 2, 3])).toBe(true);
    });

    it("deve falhar para null", () => {
      expect(rule.validate(null)).toBe(false);
    });

    it("deve falhar para undefined", () => {
      expect(rule.validate(undefined)).toBe(false);
    });

    it("deve aceitar mensagem customizada", () => {
      const customRule = coreValidators.required("Este campo é obrigatório");
      expect(customRule.message).toBe("Este campo é obrigatório");
    });
  });

  describe("email", () => {
    const rule = coreValidators.email();

    it("deve passar para email válido", () => {
      expect(rule.validate("teste@email.com")).toBe(true);
    });

    it("deve passar para email com subdomínio", () => {
      expect(rule.validate("teste@mail.empresa.com")).toBe(true);
    });

    it("deve falhar para email sem @", () => {
      expect(rule.validate("testeemail.com")).toBe(false);
    });

    it("deve falhar para email sem domínio", () => {
      expect(rule.validate("teste@")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });

  describe("phone", () => {
    const rule = coreValidators.phone();

    it("deve passar para telefone válido com DDD", () => {
      expect(rule.validate("(11) 99999-9999")).toBe(true);
    });

    it("deve passar para telefone sem formatação", () => {
      expect(rule.validate("11999999999")).toBe(true);
    });

    it("deve passar para telefone fixo", () => {
      expect(rule.validate("(11) 3333-3333")).toBe(true);
    });

    it("deve falhar para telefone com DDD inválido", () => {
      expect(rule.validate("(00) 99999-9999")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });

  describe("minLength", () => {
    const rule = coreValidators.minLength(5);

    it("deve passar para string com tamanho exato", () => {
      expect(rule.validate("12345")).toBe(true);
    });

    it("deve passar para string maior", () => {
      expect(rule.validate("123456")).toBe(true);
    });

    it("deve falhar para string menor", () => {
      expect(rule.validate("1234")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });

    it("deve ter mensagem padrão", () => {
      expect(rule.message).toBe("Mínimo de 5 caracteres");
    });
  });

  describe("maxLength", () => {
    const rule = coreValidators.maxLength(10);

    it("deve passar para string com tamanho exato", () => {
      expect(rule.validate("1234567890")).toBe(true);
    });

    it("deve passar para string menor", () => {
      expect(rule.validate("12345")).toBe(true);
    });

    it("deve falhar para string maior", () => {
      expect(rule.validate("12345678901")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });

  describe("min", () => {
    const rule = coreValidators.min(10);

    it("deve passar para valor igual", () => {
      expect(rule.validate(10)).toBe(true);
    });

    it("deve passar para valor maior", () => {
      expect(rule.validate(15)).toBe(true);
    });

    it("deve falhar para valor menor", () => {
      expect(rule.validate(5)).toBe(false);
    });

    it("deve passar para null (campo opcional)", () => {
      expect(rule.validate(null)).toBe(true);
    });

    it("deve passar para undefined (campo opcional)", () => {
      expect(rule.validate(undefined)).toBe(true);
    });
  });

  describe("max", () => {
    const rule = coreValidators.max(100);

    it("deve passar para valor igual", () => {
      expect(rule.validate(100)).toBe(true);
    });

    it("deve passar para valor menor", () => {
      expect(rule.validate(50)).toBe(true);
    });

    it("deve falhar para valor maior", () => {
      expect(rule.validate(150)).toBe(false);
    });
  });

  describe("pattern", () => {
    const rule = coreValidators.pattern(/^[A-Z]+$/, "Apenas maiúsculas");

    it("deve passar para valor que corresponde ao padrão", () => {
      expect(rule.validate("TESTE")).toBe(true);
    });

    it("deve falhar para valor que não corresponde", () => {
      expect(rule.validate("teste")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });

  describe("date", () => {
    const rule = coreValidators.date();

    it("deve passar para data válida", () => {
      expect(rule.validate("2024-06-15")).toBe(true);
    });

    it("deve falhar para data inválida", () => {
      expect(rule.validate("data-invalida")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });

  describe("futureDate", () => {
    const rule = coreValidators.futureDate();

    it("deve passar para data futura", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(rule.validate(future.toISOString())).toBe(true);
    });

    it("deve falhar para data passada", () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      expect(rule.validate(past.toISOString())).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });

  describe("pastDate", () => {
    const rule = coreValidators.pastDate();

    it("deve passar para data passada", () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      expect(rule.validate(past.toISOString())).toBe(true);
    });

    it("deve falhar para data futura", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(rule.validate(future.toISOString())).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });

  describe("strongPassword", () => {
    const rule = coreValidators.strongPassword();

    it("deve passar para senha forte", () => {
      expect(rule.validate("Senha123")).toBe(true);
    });

    it("deve falhar para senha curta", () => {
      expect(rule.validate("Se1")).toBe(false);
    });

    it("deve falhar para senha sem maiúscula", () => {
      expect(rule.validate("senha123")).toBe(false);
    });

    it("deve falhar para senha sem minúscula", () => {
      expect(rule.validate("SENHA123")).toBe(false);
    });

    it("deve falhar para senha sem número", () => {
      expect(rule.validate("SenhaForte")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });

  describe("passwordMatch", () => {
    const rule = coreValidators.passwordMatch("password");

    it("deve passar quando senhas são iguais", () => {
      expect(rule.validate("senha123", { password: "senha123" })).toBe(true);
    });

    it("deve falhar quando senhas são diferentes", () => {
      expect(rule.validate("senha123", { password: "outrasenha" })).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("", { password: "senha123" })).toBe(true);
    });
  });

  describe("url", () => {
    const rule = coreValidators.url();

    it("deve passar para URL válida com https", () => {
      expect(rule.validate("https://www.exemplo.com")).toBe(true);
    });

    it("deve passar para URL válida com http", () => {
      expect(rule.validate("http://exemplo.com")).toBe(true);
    });

    it("deve falhar para URL inválida", () => {
      expect(rule.validate("nao-e-uma-url")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });

  describe("custom", () => {
    it("deve usar função de validação customizada", () => {
      const rule = coreValidators.custom(
        (value) => value > 0 && value < 10,
        "Valor deve estar entre 0 e 10"
      );

      expect(rule.validate(5)).toBe(true);
      expect(rule.validate(15)).toBe(false);
    });

    it("deve receber dados do formulário", () => {
      const rule = coreValidators.custom(
        (value, formData) => value === formData.otherField,
        "Valores devem ser iguais"
      );

      expect(rule.validate("teste", { otherField: "teste" })).toBe(true);
      expect(rule.validate("teste", { otherField: "outro" })).toBe(false);
    });
  });
});

// ============================================
// BUSINESS VALIDATORS
// ============================================

describe("businessValidators", () => {
  describe("genero", () => {
    const rule = businessValidators.genero();

    it("deve passar para masculino", () => {
      expect(rule.validate("masculino")).toBe(true);
    });

    it("deve passar para feminino", () => {
      expect(rule.validate("feminino")).toBe(true);
    });

    it("deve passar para MASCULINO (case insensitive)", () => {
      expect(rule.validate("MASCULINO")).toBe(true);
    });

    it("deve falhar para gênero inválido", () => {
      expect(rule.validate("outro")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });

    it("deve ter mensagem customizada", () => {
      const customRule = businessValidators.genero("Gênero customizado");
      expect(customRule.message).toBe("Gênero customizado");
    });
  });

  describe("multiploQuatro", () => {
    const rule = businessValidators.multiploQuatro();

    it("deve passar para 8", () => {
      expect(rule.validate(8)).toBe(true);
    });

    it("deve passar para 12", () => {
      expect(rule.validate(12)).toBe(true);
    });

    it("deve passar para 16", () => {
      expect(rule.validate(16)).toBe(true);
    });

    it("deve falhar para 10", () => {
      expect(rule.validate(10)).toBe(false);
    });

    it("deve falhar para 6", () => {
      expect(rule.validate(6)).toBe(false);
    });

    it("deve passar para null (campo opcional)", () => {
      expect(rule.validate(null)).toBe(true);
    });

    it("deve passar para undefined (campo opcional)", () => {
      expect(rule.validate(undefined)).toBe(true);
    });
  });

  describe("minimoReiDaPraia", () => {
    const rule = businessValidators.minimoReiDaPraia();

    it("deve passar para 8", () => {
      expect(rule.validate(8)).toBe(true);
    });

    it("deve passar para 12", () => {
      expect(rule.validate(12)).toBe(true);
    });

    it("deve falhar para 4", () => {
      expect(rule.validate(4)).toBe(false);
    });

    it("deve falhar para 7", () => {
      expect(rule.validate(7)).toBe(false);
    });

    it("deve passar para null (campo opcional)", () => {
      expect(rule.validate(null)).toBe(true);
    });
  });

  describe("numeroPar", () => {
    const rule = businessValidators.numeroPar();

    it("deve passar para número par", () => {
      expect(rule.validate(4)).toBe(true);
      expect(rule.validate(6)).toBe(true);
      expect(rule.validate(10)).toBe(true);
    });

    it("deve falhar para número ímpar", () => {
      expect(rule.validate(3)).toBe(false);
      expect(rule.validate(5)).toBe(false);
      expect(rule.validate(7)).toBe(false);
    });

    it("deve passar para null (campo opcional)", () => {
      expect(rule.validate(null)).toBe(true);
    });
  });

  describe("formatoEtapa", () => {
    const rule = businessValidators.formatoEtapa();

    it("deve passar para rei_da_praia", () => {
      expect(rule.validate("rei_da_praia")).toBe(true);
    });

    it("deve passar para dupla_fixa", () => {
      expect(rule.validate("dupla_fixa")).toBe(true);
    });

    it("deve passar para REI_DA_PRAIA (case insensitive)", () => {
      expect(rule.validate("REI_DA_PRAIA")).toBe(true);
    });

    it("deve falhar para formato inválido", () => {
      expect(rule.validate("outro_formato")).toBe(false);
    });

    it("deve passar para valor vazio (campo opcional)", () => {
      expect(rule.validate("")).toBe(true);
    });
  });
});

describe("validateReiDaPraiaInscritos", () => {
  it("deve passar quando inscritos == maxJogadores e >= 8 e múltiplo de 4", () => {
    const result = validateReiDaPraiaInscritos(8, 8);
    expect(result.isValid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("deve passar para 12 jogadores", () => {
    const result = validateReiDaPraiaInscritos(12, 12);
    expect(result.isValid).toBe(true);
  });

  it("deve falhar quando inscritos != maxJogadores", () => {
    const result = validateReiDaPraiaInscritos(6, 8);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("configurada para 8 jogadores");
  });

  it("deve falhar quando menos de 8 inscritos", () => {
    const result = validateReiDaPraiaInscritos(4, 4);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("mínimo 8 jogadores");
  });

  it("deve falhar quando não é múltiplo de 4", () => {
    const result = validateReiDaPraiaInscritos(10, 10);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("múltiplo de 4");
  });
});

// ============================================
// VALIDATORS UTILS
// ============================================

describe("validateForm", () => {
  it("deve validar formulário com sucesso", () => {
    const data = { email: "teste@email.com", password: "Senha123" };
    const result = validateForm(data, loginSchema);

    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("deve retornar erros para campos inválidos", () => {
    const data = { email: "", password: "" };
    const result = validateForm(data, loginSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
  });

  it("deve parar na primeira falha de cada campo", () => {
    const data = { email: "invalido", password: "123" };
    const result = validateForm(data, loginSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
  });
});

describe("validateField", () => {
  it("deve retornar null para campo válido", () => {
    const rules = [
      coreValidators.required(),
      coreValidators.email(),
    ];
    const result = validateField("teste@email.com", rules);

    expect(result).toBeNull();
  });

  it("deve retornar mensagem de erro para campo inválido", () => {
    const rules = [
      coreValidators.required(),
      coreValidators.email(),
    ];
    const result = validateField("", rules);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("deve parar na primeira falha", () => {
    const rules = [
      coreValidators.required("Campo obrigatório"),
      coreValidators.email("Email inválido"),
    ];
    const result = validateField("", rules);

    expect(result).toBe("Campo obrigatório");
  });

  it("deve aceitar formData opcional", () => {
    const rules = [
      coreValidators.passwordMatch("password"),
    ];
    const result = validateField("senha123", rules, { password: "senha123" });

    expect(result).toBeNull();
  });
});

// ============================================
// SCHEMAS
// ============================================

describe("loginSchema", () => {
  it("deve validar login válido", () => {
    const data = { email: "teste@email.com", password: "Senha123" };
    const result = validateForm(data, loginSchema);

    expect(result.isValid).toBe(true);
  });

  it("deve falhar sem email", () => {
    const data = { email: "", password: "Senha123" };
    const result = validateForm(data, loginSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it("deve falhar sem senha", () => {
    const data = { email: "teste@email.com", password: "" };
    const result = validateForm(data, loginSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });

  it("deve falhar para senha curta", () => {
    const data = { email: "teste@email.com", password: "123" };
    const result = validateForm(data, loginSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });
});

describe("createJogadorSchema", () => {
  it("deve validar jogador válido", () => {
    const data = {
      nome: "João Silva",
      email: "joao@email.com",
      telefone: "(11) 99999-9999",
      nivel: "intermediario",
      genero: "masculino",
    };
    const result = validateForm(data, createJogadorSchema);

    expect(result.isValid).toBe(true);
  });

  it("deve falhar sem nome", () => {
    const data = {
      nome: "",
      nivel: "intermediario",
      genero: "masculino",
    };
    const result = validateForm(data, createJogadorSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.nome).toBeDefined();
  });

  it("deve falhar para nome muito curto", () => {
    const data = {
      nome: "Jo",
      nivel: "intermediario",
      genero: "masculino",
    };
    const result = validateForm(data, createJogadorSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.nome).toContain("3 caracteres");
  });
});

describe("createEtapaDuplaFixaSchema", () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  it("deve validar etapa dupla fixa válida", () => {
    const data = {
      nome: "Etapa Teste",
      dataInicio: "2024-01-01",
      dataFim: "2024-01-15",
      dataRealizacao: futureDateStr,
      maxJogadores: 16,
      jogadoresPorGrupo: 4,
      nivel: "intermediario",
      genero: "masculino",
      formato: "dupla_fixa",
    };
    const result = validateForm(data, createEtapaDuplaFixaSchema);

    expect(result.isValid).toBe(true);
  });

  it("deve falhar para número ímpar de jogadores", () => {
    const data = {
      nome: "Etapa Teste",
      dataInicio: "2024-01-01",
      dataFim: "2024-01-15",
      dataRealizacao: futureDateStr,
      maxJogadores: 15,
      jogadoresPorGrupo: 4,
      nivel: "intermediario",
      genero: "masculino",
      formato: "dupla_fixa",
    };
    const result = validateForm(data, createEtapaDuplaFixaSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.maxJogadores).toBeDefined();
  });
});

describe("createEtapaReiDaPraiaSchema", () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  it("deve validar etapa rei da praia válida", () => {
    const data = {
      nome: "Etapa Rei da Praia",
      dataInicio: "2024-01-01",
      dataFim: "2024-01-15",
      dataRealizacao: futureDateStr,
      maxJogadores: 16,
      nivel: "intermediario",
      genero: "masculino",
      formato: "rei_da_praia",
    };
    const result = validateForm(data, createEtapaReiDaPraiaSchema);

    expect(result.isValid).toBe(true);
  });

  it("deve falhar para menos de 8 jogadores", () => {
    const data = {
      nome: "Etapa Rei da Praia",
      dataInicio: "2024-01-01",
      dataFim: "2024-01-15",
      dataRealizacao: futureDateStr,
      maxJogadores: 4,
      nivel: "intermediario",
      genero: "masculino",
      formato: "rei_da_praia",
    };
    const result = validateForm(data, createEtapaReiDaPraiaSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.maxJogadores).toBeDefined();
  });

  it("deve falhar para número não múltiplo de 4", () => {
    const data = {
      nome: "Etapa Rei da Praia",
      dataInicio: "2024-01-01",
      dataFim: "2024-01-15",
      dataRealizacao: futureDateStr,
      maxJogadores: 10,
      nivel: "intermediario",
      genero: "masculino",
      formato: "rei_da_praia",
    };
    const result = validateForm(data, createEtapaReiDaPraiaSchema);

    expect(result.isValid).toBe(false);
    expect(result.errors.maxJogadores).toBeDefined();
  });
});

describe("getEtapaSchema", () => {
  it("deve retornar schema de rei da praia", () => {
    const schema = getEtapaSchema("rei_da_praia");
    expect(schema).toBe(createEtapaReiDaPraiaSchema);
  });

  it("deve retornar schema de dupla fixa para outros formatos", () => {
    const schema = getEtapaSchema("dupla_fixa");
    expect(schema).toBe(createEtapaDuplaFixaSchema);
  });

  it("deve retornar schema de dupla fixa como padrão", () => {
    const schema = getEtapaSchema("outro");
    expect(schema).toBe(createEtapaDuplaFixaSchema);
  });
});
