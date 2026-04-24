# Vz Finanças - Gestão Financeira Pessoal

Sistema profissional de gestão financeira pessoal desenvolvido com HTML, CSS, JavaScript e Supabase.

## 📋 Funcionalidades

- ✅ Autenticação segura de usuários
- 💰 Registro de receitas e despesas
- 📊 Resumo financeiro em tempo real (Receitas, Despesas, Saldo)
- 🔍 Filtros por tipo de transação
- 🗑️ Exclusão de transações
- 📱 Design responsivo (mobile e desktop)
- 🎨 Interface moderna e profissional

## 🚀 Como Configurar

### 1. Configuração do Supabase

#### Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha os dados e crie o projeto

#### Criar Tabela de Transações
No SQL Editor do Supabase, execute:

```sql
-- Criar tabela de transações
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: usuários só veem suas próprias transações
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários só podem inserir suas próprias transações
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem excluir suas próprias transações
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);
```

#### Configurar Autenticação
1. Vá em "Authentication" > "Providers"
2. Habilite "Email" provider
3. Desabilite "Confirm email" se quiser login direto (opcional)

#### Criar Usuário de Teste
1. Vá em "Authentication" > "Users"
2. Clique em "Add user" > "Create new user"
3. Adicione email e senha de teste

### 2. Configuração do Código

#### Obter Credenciais
1. No Supabase, vá em "Settings" > "API"
2. Copie:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon/public key** (chave pública, segura para frontend)

#### Configurar config.js
Abra o arquivo `config.js` e substitua:

```javascript
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_KEY = 'sua_anon_key_aqui';
```

### 3. Executar o Projeto

#### Método 1: Servidor Local (Recomendado)

**Com Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Com Node.js:**
```bash
npx http-server -p 8000
```

**Com PHP:**
```bash
php -S localhost:8000
```

Depois acesse: `http://localhost:8000`

#### Método 2: Abrir Diretamente
⚠️ Pode ter problemas com CORS. Prefira usar um servidor local.

Simplesmente abra o arquivo `index.html` no navegador.

## 📁 Estrutura de Arquivos

```
vz-financas/
│
├── index.html          # Estrutura HTML principal
├── styles.css          # Estilos CSS profissionais
├── app.js              # Lógica JavaScript
├── config.js           # Configurações do Supabase
└── README.md           # Este arquivo
```

## 🎨 Recursos Visuais

- **Design System Profissional**: Cores, espaçamentos e tipografia consistentes
- **Animações Suaves**: Transições e efeitos hover
- **Cards de Resumo**: Visualização clara de receitas, despesas e saldo
- **Ícones SVG**: Gráficos vetoriais escaláveis
- **Responsividade**: Adapta-se a todos os tamanhos de tela
- **Estados de Loading**: Feedback visual durante operações
- **Empty States**: Mensagens quando não há dados

## 🔒 Segurança

- ✅ Row Level Security (RLS) habilitado
- ✅ Proteção contra XSS (escape de HTML)
- ✅ Autenticação do Supabase
- ✅ Apenas anon key no frontend (segura)
- ✅ Usuários isolados (cada um vê só suas transações)

## 💡 Dicas de Uso

1. **Primeiro Acesso**: Use o email/senha que você criou no Supabase
2. **Cadastro**: Configure sign-up no Supabase se quiser permitir auto-cadastro
3. **Personalização**: Edite cores no `:root` do `styles.css`
4. **Backup**: Supabase faz backup automático dos dados

## 🐛 Solução de Problemas

### Erro de Login
- Verifique se o usuário foi criado no Supabase
- Confirme que email/senha estão corretos
- Veja o console do navegador para mensagens de erro

### Transações Não Aparecem
- Verifique se as RLS policies foram criadas corretamente
- Confirme que está logado com o usuário correto
- Verifique o console do navegador

### Erro de Conexão
- Confirme que SUPABASE_URL e SUPABASE_KEY estão corretos
- Verifique sua conexão com internet
- Certifique-se de que o projeto Supabase está ativo

## 📱 Compatibilidade

- ✅ Chrome/Edge (últimas versões)
- ✅ Firefox (últimas versões)
- ✅ Safari (últimas versões)
- ✅ Mobile (iOS/Android)

## 🚀 Próximas Melhorias (Sugestões)

- [ ] Categorias de transações
- [ ] Gráficos e relatórios
- [ ] Exportação de dados (CSV, PDF)
- [ ] Metas financeiras
- [ ] Recorrências mensais
- [ ] Múltiplas contas/carteiras
- [ ] Dark mode
- [ ] Notificações

## 📄 Licença

Projeto de código aberto para uso pessoal e educacional.

---

Desenvolvido com ❤️ para gestão financeira pessoal eficiente.
