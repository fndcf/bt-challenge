import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Banco so por repositorio
    files: [
      "src/services/**/*.ts",
      "src/controllers/**/*.ts",
      "src/routes/**/*.ts",
    ],
    // Ainda acessam o banco direto (passo 8). A lista so pode diminuir.
    ignores: [
      "src/controllers/EtapaController.ts",
      "src/routes/publicRoutes.ts",
      "src/services/ArenaService.ts",
      "src/services/CabecaDeChaveService.ts",
      "src/services/EstatisticasJogadorService.ts",
      "src/services/ExcelJogadorService.ts",
      "src/services/HistoricoDuplaService.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/config/firebase"],
              importNames: ["db"],
              message: "Acesse o banco por um repository.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "**/*.test.ts",
      "**/__tests__/**",
    ],
  }
);
