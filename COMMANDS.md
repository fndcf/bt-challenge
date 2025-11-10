# 📝 Comandos Úteis - Challenge BT

Guia de referência rápida para comandos comuns do projeto.

## 🚀 Início Rápido

### Primeira vez no projeto
```bash
# 1. Instalar dependências
npm run install:all

# 2. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar os arquivos .env com suas credenciais

# 3. Verificar configuração
./check-setup.sh

# 4. Iniciar projeto
./start.sh
# ou
npm run dev
```

### Dia a dia
```bash
# Iniciar tudo
npm run dev

# ou separadamente
npm run dev:backend    # Apenas backend
npm run dev:frontend   # Apenas frontend
```

---

## 📦 Gerenciamento de Dependências

### Instalar

```bash
# Instalar tudo
npm run install:all

# Instalar apenas backend
npm run install:backend

# Instalar apenas frontend
npm run install:frontend

# Adicionar nova dependência no backend
cd backend
npm install nome-do-pacote

# Adicionar nova dependência no frontend
cd frontend
npm install nome-do-pacote
```

### Limpar

```bash
# Limpar todos os node_modules
npm run clean

# Reinstalar tudo do zero
npm run clean && npm run install:all

# Limpar cache do npm
npm cache clean --force
```

---

## 🏗️ Build

### Desenvolvimento

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Produção

```bash
# Build tudo
npm run build

# Build apenas backend
npm run build:backend

# Build apenas frontend
npm run build:frontend
```

### Preview

```bash
# Preview do build do frontend
cd frontend
npm run preview
```

---

## 🧪 Testes

### Verificação Rápida

```bash
# Verificar setup
./check-setup.sh

# Testar integração (com backend e frontend rodando)
./test-integration.sh
```

### Testes Unitários

```bash
# Todos os testes
npm test

# Apenas backend
npm run test:backend

# Apenas frontend
npm run test:frontend
```

### Testes Manuais

```bash
# Testar health check do backend
curl http://localhost:5000/api/health

# Testar endpoint da API
curl http://localhost:5000/api

# Verificar se frontend está rodando
curl http://localhost:3000
```

---

## 🔧 Troubleshooting

### Limpar e Resetar

```bash
# Resetar tudo
npm run clean
rm -rf backend/dist frontend/dist
npm run install:all

# Resetar apenas backend
cd backend
rm -rf node_modules dist package-lock.json
npm install

# Resetar apenas frontend
cd frontend
rm -rf node_modules dist package-lock.json
npm install
```

### Portas em Uso

```bash
# Ver o que está usando a porta 5000
lsof -ti:5000

# Matar processo na porta 5000
lsof -ti:5000 | xargs kill -9

# Ver o que está usando a porta 3000
lsof -ti:3000

# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9
```

### Cache

```bash
# Limpar cache do Vite (frontend)
cd frontend
rm -rf node_modules/.vite

# Limpar cache do TypeScript
rm -rf backend/**/*.tsbuildinfo
rm -rf frontend/**/*.tsbuildinfo

# Limpar cache do npm
npm cache clean --force
```

---

## 🔍 Debug e Logs

### Backend

```bash
# Rodar com logs detalhados
cd backend
NODE_ENV=development npm run dev

# Ver apenas logs de erro
cd backend
npm run dev 2>&1 | grep ERROR

# Rodar em modo debug (Node.js)
cd backend
node --inspect src/index.ts
```

### Frontend

```bash
# Rodar com logs detalhados do Vite
cd frontend
npm run dev -- --debug

# Build com análise de bundle
cd frontend
npm run build -- --mode development

# Verificar erros de TypeScript
cd frontend
npx tsc --noEmit
```

---

## 📁 Arquivos e Pastas

### Ver estrutura

```bash
# Ver estrutura completa
tree -I 'node_modules|dist|.git'

# Ver apenas arquivos TypeScript
find . -name "*.ts" -o -name "*.tsx"

# Ver tamanho das pastas
du -sh backend frontend shared
```

### Buscar no código

```bash
# Buscar texto em arquivos TypeScript
grep -r "texto" --include="*.ts" --include="*.tsx"

# Buscar imports de um pacote
grep -r "from 'firebase'" --include="*.ts"

# Contar linhas de código
find backend/src -name "*.ts" | xargs wc -l
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs wc -l
```

---

## 🔐 Firebase

### Verificar configuração

```bash
# Ver variáveis do Firebase no backend
cat backend/.env | grep FIREBASE

# Ver variáveis do Firebase no frontend
cat frontend/.env | grep VITE_FIREBASE

# Testar conexão
cd backend
npm run dev
# Se ver "✅ Firebase Admin inicializado" está OK
```

---

## 📊 Monitoramento

### Ver processos

```bash
# Ver processos Node.js rodando
ps aux | grep node

# Ver uso de portas
lsof -i :5000
lsof -i :3000

# Monitorar logs em tempo real
cd backend
npm run dev | tee logs.txt
```

---

## 🔄 Git

### Workflow básico

```bash
# Verificar status
git status

# Ver mudanças
git diff

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: descrição da feature"

# Push
git push origin main
```

### Branches

```bash
# Criar nova branch
git checkout -b feature/nome-da-feature

# Listar branches
git branch

# Mudar de branch
git checkout nome-da-branch

# Merge
git checkout main
git merge feature/nome-da-feature
```

---

## 🛠️ Utilitários

### Versões

```bash
# Ver versões instaladas
node --version
npm --version
git --version

# Ver versão dos pacotes
cd backend && npm list --depth=0
cd frontend && npm list --depth=0
```

### Atualizações

```bash
# Verificar pacotes desatualizados
npm outdated

# Atualizar pacotes minor/patch
npm update

# Atualizar pacote específico
npm install pacote@latest
```

---

## 📚 Documentação

### Abrir documentação

```bash
# Ver README
cat README.md

# Ver guia de início rápido
cat QUICK_START.md

# Ver troubleshooting
cat TROUBLESHOOTING.md

# Ver documentação do backend
cat backend/MIDDLEWARES.md

# Ver documentação do frontend
cat frontend/FRONTEND_SETUP.md
```

---

## 💡 Dicas

### Aliases úteis (adicione no ~/.bashrc ou ~/.zshrc)

```bash
# Adicionar ao .bashrc/.zshrc
alias cbt-start='cd /caminho/para/challenge-bt && ./start.sh'
alias cbt-test='cd /caminho/para/challenge-bt && ./test-integration.sh'
alias cbt-check='cd /caminho/para/challenge-bt && ./check-setup.sh'
alias cbt-clean='cd /caminho/para/challenge-bt && npm run clean'
alias cbt-backend='cd /caminho/para/challenge-bt/backend && npm run dev'
alias cbt-frontend='cd /caminho/para/challenge-bt/frontend && npm run dev'
```

### Scripts personalizados

Adicione no `package.json` da raiz:

```json
{
  "scripts": {
    "logs": "tail -f backend/logs.txt",
    "backup": "tar -czf backup-$(date +%Y%m%d).tar.gz backend/src frontend/src",
    "count": "find . -name '*.ts' -o -name '*.tsx' | xargs wc -l"
  }
}
```

---

**Para mais informações, consulte:**
- [README.md](./README.md) - Visão geral
- [QUICK_START.md](./QUICK_START.md) - Início rápido
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solução de problemas