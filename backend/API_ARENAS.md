# 🏟️ API de Arenas - Documentação

## Endpoints

### POST /api/arenas

Criar nova arena com administrador.

**Acesso:** Público  
**Rate Limit:** 20 requisições/hora

**Body:**

```json
{
  "nome": "Arena Azul Beach Tennis",
  "slug": "arenaazul",
  "adminEmail": "admin@arenaazul.com",
  "adminPassword": "senha123"
}
```

**Resposta de Sucesso (201):**

```json
{
  "success": true,
  "data": {
    "arena": {
      "id": "arena-123",
      "nome": "Arena Azul Beach Tennis",
      "slug": "arenaazul",
      "adminEmail": "admin@arenaazul.com",
      "adminUid": "uid-123",
      "ativa": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "adminUid": "uid-123",
    "url": "https://challengebt.com.br/arena/arenaazul"
  },
  "message": "Arena \"Arena Azul Beach Tennis\" criada com sucesso!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**

- `400` - Dados inválidos
- `409` - Slug ou email já existe
- `429` - Rate limit excedido

---

### GET /api/arenas

Listar todas as arenas ativas.

**Acesso:** Público

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "arenas": [
      {
        "id": "arena-123",
        "nome": "Arena Azul",
        "slug": "arenaazul",
        "adminEmail": "admin@arenaazul.com",
        "adminUid": "uid-123",
        "ativa": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/arenas/me

Obter arena do administrador autenticado.

**Acesso:** Privado (Admin)  
**Header:** `Authorization: Bearer <token>`

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "id": "arena-123",
    "nome": "Arena Azul",
    "slug": "arenaazul",
    "adminEmail": "admin@arenaazul.com",
    "adminUid": "uid-123",
    "ativa": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**

- `401` - Não autenticado
- `404` - Arena não encontrada

---

### GET /api/arenas/check-slug/:slug

Verificar disponibilidade de slug.

**Acesso:** Público

**Exemplo:**

```
GET /api/arenas/check-slug/arenaazul
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "slug": "arenaazul",
    "available": false,
    "message": "Slug já está em uso"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /api/arenas/slug/:slug

Buscar arena por slug.

**Acesso:** Público

**Exemplo:**

```
GET /api/arenas/slug/arenaazul
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "id": "arena-123",
    "nome": "Arena Azul",
    "slug": "arenaazul",
    "adminEmail": "admin@arenaazul.com",
    "adminUid": "uid-123",
    "ativa": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**

- `404` - Arena não encontrada

---

### GET /api/arenas/:id

Buscar arena por ID.

**Acesso:** Público

**Exemplo:**

```
GET /api/arenas/arena-123
```

**Resposta:** Igual ao endpoint acima.

---

### PUT /api/arenas/:id

Atualizar arena.

**Acesso:** Privado (Admin da arena)  
**Header:** `Authorization: Bearer <token>`

**Body (todos os campos opcionais):**

```json
{
  "nome": "Arena Azul Premium",
  "slug": "arenaazulpremium"
}
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "id": "arena-123",
    "nome": "Arena Azul Premium",
    "slug": "arenaazulpremium",
    "adminEmail": "admin@arenaazul.com",
    "adminUid": "uid-123",
    "ativa": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "message": "Arena atualizada com sucesso",
  "timestamp": "2024-01-02T00:00:00.000Z"
}
```

**Erros:**

- `400` - Dados inválidos ou sem permissão
- `401` - Não autenticado
- `404` - Arena não encontrada
- `409` - Slug já está em uso

---

### DELETE /api/arenas/:id

Desativar arena (soft delete).

**Acesso:** Privado (Admin da arena)  
**Header:** `Authorization: Bearer <token>`

**Exemplo:**

```
DELETE /api/arenas/arena-123
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": null,
  "message": "Arena desativada com sucesso",
  "timestamp": "2024-01-02T00:00:00.000Z"
}
```

**Erros:**

- `400` - Sem permissão
- `401` - Não autenticado
- `404` - Arena não encontrada

---

## Validações

### Nome da Arena

- Obrigatório
- Mínimo: 3 caracteres
- Máximo: 100 caracteres

### Slug

- Obrigatório
- Mínimo: 3 caracteres
- Máximo: 50 caracteres
- Formato: apenas letras minúsculas, números e hífens
- Não pode ser um slug reservado (admin, api, login, etc)
- Deve ser único

### Email do Admin

- Obrigatório
- Formato de email válido
- Deve ser único

### Senha do Admin

- Obrigatório
- Mínimo: 6 caracteres

---

## Exemplos com cURL

### Criar Arena

```bash
curl -X POST http://localhost:5000/api/arenas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Arena Azul",
    "slug": "arenaazul",
    "adminEmail": "admin@arenaazul.com",
    "adminPassword": "senha123"
  }'
```

### Listar Arenas

```bash
curl http://localhost:5000/api/arenas
```

### Buscar por Slug

```bash
curl http://localhost:5000/api/arenas/slug/arenaazul
```

### Verificar Disponibilidade de Slug

```bash
curl http://localhost:5000/api/arenas/check-slug/arenaazul
```

### Obter Minha Arena (autenticado)

```bash
curl http://localhost:5000/api/arenas/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Atualizar Arena (autenticado)

```bash
curl -X PUT http://localhost:5000/api/arenas/arena-123 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Arena Azul Premium"
  }'
```

### Desativar Arena (autenticado)

```bash
curl -X DELETE http://localhost:5000/api/arenas/arena-123 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## Códigos de Status HTTP

- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found (recurso não encontrado)
- `409` - Conflict (slug ou email já existe)
- `422` - Validation Error (erro de validação)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## Notas Importantes

1. **Slugs Reservados:** Os seguintes slugs não podem ser usados:

   - admin, api, login, register, logout
   - home, about, contact, privacy, terms

2. **Rate Limiting:** Criação de arenas é limitada a 20 por hora

3. **Soft Delete:** Ao desativar uma arena, ela não é deletada, apenas marcada como inativa

4. **URL Pública:** Cada arena tem uma URL no formato:

   ```
   https://challengebt.com.br/arena/{slug}
   ```

5. **Autenticação:** Use o token JWT obtido no login no header `Authorization: Bearer <token>`

---

**Documentação criada para Challenge BT API v1.0**
