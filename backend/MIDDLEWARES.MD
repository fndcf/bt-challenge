# 🔧 Middlewares - Documentação

## 📋 Visão Geral

Os middlewares são funções que têm acesso aos objetos de requisição (`req`), resposta (`res`) e à próxima função middleware (`next`).

## 🛡️ Middlewares de Segurança

### 1. **Helmet**

Adiciona headers de segurança HTTP.

### 2. **CORS**

Controla quais origens podem acessar a API.

### 3. **Rate Limiting**

Limita o número de requisições por IP/usuário.

**Uso:**

```typescript
import {
  generalLimiter,
  strictLimiter,
  authLimiter,
} from "../middlewares/rateLimiter";

// Aplicar a todas as rotas
app.use("/api", generalLimiter);

// Aplicar a rotas específicas
router.post("/login", authLimiter, handler);
router.post("/gerar-chaves", strictLimiter, handler);
```

**Limiters disponíveis:**

- `generalLimiter`: 100 req/15min (uso geral)
- `strictLimiter`: 5 req/hora (operações críticas)
- `createLimiter`: 20 req/hora (criações)
- `authLimiter`: 5 req/15min (autenticação)

---

## 🔐 Middlewares de Autenticação

### 1. **authenticate**

Verifica token JWT do Firebase e adiciona dados do usuário ao `req.user`.

**Uso:**

```typescript
import { authenticate } from "../middlewares/auth";

router.get("/protegido", authenticate, handler);
```

### 2. **checkArenaAccess**

Verifica se o usuário tem acesso à arena especificada.

**Uso:**

```typescript
import { authenticate, checkArenaAccess } from "../middlewares/auth";

router.post(
  "/arena/:arenaId/jogador",
  authenticate,
  checkArenaAccess("arenaId"),
  handler
);
```

### 3. **requireSuperAdmin**

Apenas super admins podem acessar.

**Uso:**

```typescript
import { authenticate, requireSuperAdmin } from "../middlewares/auth";

router.delete("/arena/:arenaId", authenticate, requireSuperAdmin, handler);
```

### 4. **optionalAuth**

Autenticação opcional - adiciona dados se o token existir.

**Uso:**

```typescript
import { optionalAuth } from "../middlewares/auth";

router.get("/publico", optionalAuth, handler);
```

---

## ✅ Middlewares de Validação

### 1. **validate**

Processa resultados da validação do express-validator.

**Uso:**

```typescript
import { body } from "express-validator";
import { validate } from "../middlewares/validation";

router.post(
  "/jogador",
  [
    body("nome").notEmpty().withMessage("Nome é obrigatório"),
    body("email").isEmail().withMessage("Email inválido"),
  ],
  validate,
  handler
);
```

### 2. **runValidations**

Executa validações em sequência.

**Uso:**

```typescript
import { body } from "express-validator";
import { runValidations } from "../middlewares/validation";

const validations = [body("nome").notEmpty(), body("email").isEmail()];

router.post("/jogador", runValidations(validations), handler);
```

### 3. **Validações Customizadas**

```typescript
import {
  isEvenNumber,
  meetsMinimumPlayers,
  isValidSlug,
  isInEnum,
} from "../middlewares/validation";

// Validar número par
body("numJogadores").custom(isEvenNumber);

// Validar mínimo de jogadores
body("numJogadores").custom(meetsMinimumPlayers);

// Validar slug
body("slug").custom(isValidSlug);

// Validar enum
body("nivel").custom(isInEnum(NIVEIS_JOGADOR));
```

### 4. **sanitizeRequest**

Limpa espaços em branco de strings em body, query e params.

---

## 🚨 Middlewares de Erro

### 1. **errorHandler**

Tratamento global de erros (sempre o último middleware).

**Uso automático** - já configurado no `index.ts`

### 2. **asyncHandler**

Captura erros de funções assíncronas automaticamente.

**Uso:**

```typescript
import { asyncHandler } from "../middlewares/errorHandler";

router.get(
  "/jogadores",
  asyncHandler(async (req, res) => {
    const jogadores = await buscarJogadores();
    res.json(jogadores);
  })
);
```

### 3. **notFoundHandler**

Responde com 404 para rotas não encontradas.

**Uso automático** - já configurado no `index.ts`

---

## 📝 Middlewares de Logging

### 1. **requestLogger**

Loga todas as requisições (apenas em dev).

**Formato:**

```
[2024-01-10T10:30:00.000Z] GET     /api/jogadores                           200     45ms - ::1
```

### 2. **errorLogger**

Loga erros detalhadamente (apenas em dev).

### 3. **slowRequestLogger**

Alerta sobre requisições lentas (> 1 segundo).

---

## 🎯 Ordem dos Middlewares

A ordem é **MUITO IMPORTANTE**! Ordem correta no `index.ts`:

```typescript
// 1. Segurança
app.use(helmet());
app.use(cors());

// 2. Parsers
app.use(express.json());
app.use(express.urlencoded());

// 3. Logging (dev)
app.use(requestLogger);

// 4. Sanitização
app.use(sanitizeRequest);

// 5. Rate Limiting
app.use("/api", generalLimiter);

// 6. Rotas
app.use("/api", apiRoutes);

// 7. Not Found
app.use(notFoundHandler);

// 8. Error Logger (dev)
app.use(errorLogger);

// 9. Error Handler (sempre por último!)
app.use(errorHandler);
```

---

## 💡 Exemplo Completo de Rota

```typescript
import { Router } from "express";
import { body, param } from "express-validator";
import { asyncHandler } from "../middlewares/errorHandler";
import { authenticate, checkArenaAccess } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createLimiter } from "../middlewares/rateLimiter";
import { ResponseHelper } from "../utils/responseHelper";
import { NotFoundError } from "../utils/errors";

const router = Router();

router.post(
  "/arena/:arenaId/jogador",
  createLimiter, // 1. Rate limiting
  authenticate, // 2. Autenticação
  checkArenaAccess("arenaId"), // 3. Verificar acesso à arena
  [
    // 4. Validações
    param("arenaId").notEmpty(),
    body("nome").notEmpty().trim(),
    body("email").isEmail().normalizeEmail(),
    body("nivel").isIn(["Iniciante", "Intermediário", "Avançado"]),
  ],
  validate, // 5. Processar validações
  asyncHandler(async (req, res) => {
    // 6. Handler com tratamento de erro
    const { arenaId } = req.params;
    const jogadorData = req.body;

    // Lógica de negócio
    const jogador = await criarJogador(arenaId, jogadorData);

    if (!jogador) {
      throw new NotFoundError("Não foi possível criar jogador");
    }

    // Resposta padronizada
    return ResponseHelper.created(res, jogador, "Jogador criado com sucesso");
  })
);

export default router;
```

---

## 🔒 Boas Práticas

1. **Sempre use `asyncHandler`** em rotas assíncronas
2. **Valide todos os inputs** do usuário
3. **Use erros customizados** (`NotFoundError`, `ValidationError`, etc)
4. **Sanitize dados** antes de processar
5. **Apply rate limiting** em operações sensíveis
6. **Autentique e autorize** adequadamente
7. **Use `ResponseHelper`** para respostas padronizadas
8. **Log erros** adequadamente (mas não exponha detalhes em produção)

---

## 🚀 Próximos Passos

Com essa estrutura de middlewares, estamos prontos para:

- ✅ Criar rotas protegidas
- ✅ Validar dados de entrada
- ✅ Tratar erros adequadamente
- ✅ Proteger contra ataques
- ✅ Logar requisições e erros
