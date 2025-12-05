/**
 * Testes do hook useForm
 */

import { renderHook, act } from "@testing-library/react";
import { useForm } from "@/hooks/useForm";

interface TestFormValues {
  name: string;
  email: string;
  age: number;
}

const initialValues: TestFormValues = {
  name: "",
  email: "",
  age: 0,
};

describe("useForm", () => {
  describe("inicialização", () => {
    it("deve inicializar com os valores passados", () => {
      const { result } = renderHook(() => useForm(initialValues));

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.hasErrors).toBe(false);
    });

    it("deve inicializar com valores preenchidos", () => {
      const filledValues = { name: "João", email: "joao@email.com", age: 25 };
      const { result } = renderHook(() => useForm(filledValues));

      expect(result.current.values).toEqual(filledValues);
    });
  });

  describe("handleChange", () => {
    it("deve atualizar o valor de um campo", () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.handleChange("name", "João");
      });

      expect(result.current.values.name).toBe("João");
    });

    it("deve limpar erro do campo quando o usuário começa a digitar", () => {
      const { result } = renderHook(() => useForm(initialValues));

      // Primeiro, setar um erro
      act(() => {
        result.current.setFieldError("name", "Nome é obrigatório");
      });

      expect(result.current.errors.name).toBe("Nome é obrigatório");

      // Quando o usuário digita, o erro deve ser limpo
      act(() => {
        result.current.handleChange("name", "J");
      });

      expect(result.current.errors.name).toBeUndefined();
    });

    it("não deve afetar outros campos", () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.handleChange("name", "João");
        result.current.handleChange("email", "joao@email.com");
      });

      expect(result.current.values).toEqual({
        name: "João",
        email: "joao@email.com",
        age: 0,
      });
    });
  });

  describe("handleBlur", () => {
    it("deve marcar campo como touched", () => {
      const { result } = renderHook(() => useForm(initialValues));

      expect(result.current.touched.name).toBeUndefined();

      act(() => {
        result.current.handleBlur("name");
      });

      expect(result.current.touched.name).toBe(true);
    });

    it("não deve afetar touched de outros campos", () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.handleBlur("name");
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.email).toBeUndefined();
    });
  });

  describe("setFieldError", () => {
    it("deve setar erro em um campo", () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setFieldError("email", "Email inválido");
      });

      expect(result.current.errors.email).toBe("Email inválido");
    });

    it("deve atualizar hasErrors quando há erro", () => {
      const { result } = renderHook(() => useForm(initialValues));

      expect(result.current.hasErrors).toBe(false);

      act(() => {
        result.current.setFieldError("name", "Erro");
      });

      expect(result.current.hasErrors).toBe(true);
    });
  });

  describe("setFieldValue", () => {
    it("deve setar valor de um campo diretamente", () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setFieldValue("age", 30);
      });

      expect(result.current.values.age).toBe(30);
    });
  });

  describe("setErrors", () => {
    it("deve setar múltiplos erros de uma vez", () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setErrors({
          name: "Nome é obrigatório",
          email: "Email inválido",
        });
      });

      expect(result.current.errors).toEqual({
        name: "Nome é obrigatório",
        email: "Email inválido",
      });
    });
  });

  describe("reset", () => {
    it("deve resetar valores para o estado inicial", () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.handleChange("name", "João");
        result.current.handleChange("email", "joao@email.com");
        result.current.setFieldError("name", "Erro");
        result.current.handleBlur("name");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });

  describe("hasErrors", () => {
    it("deve retornar false quando não há erros", () => {
      const { result } = renderHook(() => useForm(initialValues));
      expect(result.current.hasErrors).toBe(false);
    });

    it("deve retornar true quando há pelo menos um erro", () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setFieldError("name", "Erro");
      });

      expect(result.current.hasErrors).toBe(true);
    });

    it("deve retornar false após limpar todos os erros", () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setFieldError("name", "Erro");
      });

      expect(result.current.hasErrors).toBe(true);

      act(() => {
        result.current.handleChange("name", "Valor");
      });

      expect(result.current.hasErrors).toBe(false);
    });
  });
});
