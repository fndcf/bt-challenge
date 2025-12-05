/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/mocks/",
    "/__tests__/setup.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.styles.ts", // Arquivos de estilo (styled-components) não precisam de testes
    "!src/main.tsx",
    "!src/vite-env.d.ts",
    "!src/__tests__/**",
    "!src/utils/logger.ts", // Usa import.meta.env (Vite) que não é compatível com Jest
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
