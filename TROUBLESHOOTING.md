# 🔧 Troubleshooting - Challenge BT

Guia para resolver problemas comuns durante o desenvolvimento.

## 🚨 Problemas Comuns

### 1. Erro: "Cannot find module" ou "Module not found"

**Causa:** Dependências não instaladas ou node_modules corrompido

**Solução:**

```bash
# Na raiz do projeto
npm run clean
npm run install:all

# Ou manualmente
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

### 2. Erro: "Port already in use" (EADDRINUSE)

**Causa:** Porta já está sendo usada por outro processo

**Backend (porta 5000):**

```bash
# Descobrir processo usando a porta
lsof -ti:5000

# Matar o processo
lsof -ti:5000 | xargs kill -9

# Ou mudar a porta no .env
PORT=5001
```

**Frontend (porta 3000):**

```bash
# Descobrir processo usando a porta
lsof -ti:3000

# Matar o processo
lsof -ti:3000 | xargs kill -9
```

---

### 3. Erro: "Firebase Admin not initialized"

**Causa:** Credenciais do Firebase não configuradas ou inválidas

**Solução:**

```bash
# 1. Verificar se .env existe
ls backend/.env

# 2. Verificar se contém as variáveis necessárias
cat backend/.env | grep FIREBASE

# 3. Reconfigurar seguindo o guia
# Ver: FIREBASE_SETUP.md
```

**Variáveis necessárias:**

- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY` (com \n preservados)
- `FIREBASE_CLIENT_EMAIL`

---

### 4. Erro: "Property 'env' does not exist on type 'ImportMeta'"

**Causa:** Types do Vite não reconhecidos

**Solução:**

```bash
# Já resolvido! Arquivo vite-env.d.ts criado
# Se ainda ocorrer, reinicie o TypeScript Server:
# VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### 5. Erro: CORS - "Access-Control-Allow-Origin"

**Causa:** Frontend tentando acessar backend de origem diferente

**Solução:**

```bash
# backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Se usar Vite em outra porta, adicione-a
```

---

### 6. Erro: "Token inválido" ou "Unauthorized"

**Causa:** Token JWT expirado ou inválido

**Solução:**

```javascript
// Limpar token e fazer login novamente
localStorage.removeItem("authToken");
// Acessar /login novamente
```

**No código:**

```typescript
// O apiClient já faz logout automático em 401
// Mas você pode forçar:
await logout();
navigate("/login");
```

---

### 7. Erro: "Firebase: Error (auth/configuration-not-found)"

**Causa:** Configuração do Firebase no frontend incorreta

**Solução:**

```bash
# 1. Verificar frontend/.env
cat frontend/.env | grep VITE_FIREBASE

# 2. Garantir que todas as variáveis existem
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

### 8. Frontend não conecta ao Backend (Network Error)

**Causa:** URL da API incorreta ou backend não rodando

**Solução:**

```bash
# 1. Verificar se backend está rodando
curl http://localhost:5000/api/health

# 2. Verificar URL no frontend/.env
VITE_API_URL=http://localhost:5000/api

# 3. Verificar no DevTools (Network tab) qual URL está sendo chamada
```

---

### 9. Erro: "Permission denied" no Firestore

**Causa:** Regras de segurança do Firestore bloqueando acesso

**Solução:**

```javascript
// Temporariamente em DEV, use regras abertas:
// Firebase Console → Firestore → Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // APENAS PARA DEV!
    }
  }
}

// Em produção, use as regras corretas (ver firestore.ts)
```

---

### 10. TypeScript Errors após instalar dependências

**Causa:** Cache do TypeScript desatualizado

**Solução:**

```bash
# Deletar cache do TypeScript
rm -rf backend/dist
rm -rf frontend/dist
rm -rf **/*.tsbuildinfo

# VSCode: Reiniciar TS Server
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Recompilar
cd backend && npm run build
cd ../frontend && npm run build
```

---

### 11. Erro: "Cannot read property 'user' of undefined"

**Causa:** Tentando usar useAuth() fora do AuthProvider

**Solução:**

```typescript
// Certifique-se que o componente está dentro do AuthProvider
// App.tsx já tem isso configurado:

<AuthProvider>
  <ArenaProvider>
    <Routes>{/* seus componentes aqui */}</Routes>
  </ArenaProvider>
</AuthProvider>
```

---

### 12. Página em branco no frontend

**Causa:** Erro JavaScript não capturado

**Solução:**

```bash
# 1. Abrir DevTools Console (F12)
# 2. Ver erros no console
# 3. Verificar erros comuns:
#    - Import path incorreto
#    - Componente não exportado
#    - Erro de sintaxe

# 4. Verificar terminal do frontend por erros de build
```

---

### 13. Modificações não aparecem (cache)

**Causa:** Cache do browser ou do Vite

**Solução:**

```bash
# Hard refresh no browser
# Chrome/Firefox: Ctrl+Shift+R
# Mac: Cmd+Shift+R

# Limpar cache do Vite
cd frontend
rm -rf node_modules/.vite
npm run dev

# Modo incógnito também ajuda
```

---

### 14. Erro: "Module parse failed" no Vite

**Causa:** Arquivo com extensão errada ou sintaxe inválida

**Solução:**

```bash
# Verificar extensão dos arquivos:
# - React components: .tsx
# - TypeScript puro: .ts
# - CSS: .css

# Verificar imports:
import Component from './Component'  # ✗ Faltou extensão
import Component from './Component.tsx'  # ✓ Correto
```

---

## 🔍 Debug Checklist

Quando algo não funcionar, siga esta ordem:

1. ✅ **Backend está rodando?**

   ```bash
   curl http://localhost:5000/api/health
   ```

2. ✅ **Frontend está rodando?**

   ```bash
   curl http://localhost:3000
   ```

3. ✅ **Variáveis de ambiente configuradas?**

   ```bash
   cat backend/.env | grep FIREBASE
   cat frontend/.env | grep VITE
   ```

4. ✅ **Dependências instaladas?**

   ```bash
   ls backend/node_modules
   ls frontend/node_modules
   ```

5. ✅ **Firebase configurado?**

   - Projeto criado no Firebase Console?
   - Firestore ativado?
   - Authentication ativado?
   - Credenciais corretas?

6. ✅ **Console sem erros?**

   - Backend console (terminal)
   - Frontend console (DevTools F12)
   - Network tab (DevTools)

7. ✅ **Cache limpo?**
   ```bash
   # Hard refresh no browser
   Ctrl+Shift+R
   ```

---

## 🆘 Ainda com problemas?

1. **Verificar logs:**

   - Backend: Terminal onde rodou `npm run dev`
   - Frontend: DevTools Console (F12)

2. **Testar com dados mock:**

   - Comentar chamadas à API
   - Usar dados hardcoded temporariamente

3. **Verificar versões:**

   ```bash
   node --version  # Deve ser v18+
   npm --version
   ```

4. **Reinstalar tudo:**

   ```bash
   npm run clean
   npm run install:all
   ```

5. **Verificar firewall/antivírus:**
   - Pode estar bloqueando portas 3000 ou 5000

---

## 📚 Recursos Úteis

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [Express Documentation](https://expressjs.com)

---

**Última atualização:** Etapa 1 - Setup Inicial
