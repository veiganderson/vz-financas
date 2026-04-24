// Inicialização do Supabase
const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado global
let allTransactions = [];
let currentFilter = 'all';

// Utility Functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const showLoading = (show = true) => {
  document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
};

const showError = (message) => {
  const errorDiv = document.getElementById('loginError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
};

// Screen Navigation
const showApp = () => {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';
};

const showLogin = () => {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('loginForm').reset();
};

// Authentication
const login = async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    showError('Por favor, preencha todos os campos');
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline-flex';
  
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    document.getElementById('userEmail').textContent = data.user.email;
    showApp();
    await loadTransactions();
    
  } catch (error) {
    showError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
  }
};

const logout = async () => {
  if (!confirm('Deseja realmente sair?')) return;
  
  showLoading(true);
  
  try {
    await client.auth.signOut();
    allTransactions = [];
    currentFilter = 'all';
    showLogin();
  } catch (error) {
    alert('Erro ao fazer logout: ' + error.message);
  } finally {
    showLoading(false);
  }
};

// Session Check
const checkSession = async () => {
  const { data: { session } } = await client.auth.getSession();
  
  if (session) {
    document.getElementById('userEmail').textContent = session.user.email;
    showApp();
    await loadTransactions();
  }
};

// Transaction Management
const addTransaction = async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  
  if (!title) {
    alert('Por favor, preencha a descrição');
    return;
  }
  
  if (!amount || amount <= 0) {
    alert('Por favor, insira um valor válido');
    return;
  }
  
  showLoading(true);
  
  try {
    const { data: { user } } = await client.auth.getUser();
    
    const { error } = await client
      .from('transactions')
      .insert({
        user_id: user.id,
        title,
        amount,
        type
      });
    
    if (error) throw error;
    
    document.getElementById('transactionForm').reset();
    await loadTransactions();
    
  } catch (error) {
    alert('Erro ao adicionar transação: ' + error.message);
  } finally {
    showLoading(false);
  }
};

const deleteTransaction = async (id) => {
  if (!confirm('Deseja realmente excluir esta transação?')) return;
  
  showLoading(true);
  
  try {
    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await loadTransactions();
    
  } catch (error) {
    alert('Erro ao excluir transação: ' + error.message);
  } finally {
    showLoading(false);
  }
};

const loadTransactions = async () => {
  try {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    allTransactions = data || [];
    renderTransactions();
    updateSummary();
    
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
    alert('Erro ao carregar transações: ' + error.message);
  }
};

const filterTransactions = () => {
  currentFilter = document.getElementById('filterType').value;
  renderTransactions();
};

const renderTransactions = () => {
  const listContainer = document.getElementById('transactionsList');
  
  const filteredTransactions = currentFilter === 'all' 
    ? allTransactions 
    : allTransactions.filter(t => t.type === currentFilter);
  
  if (filteredTransactions.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
        <p>Nenhuma transação encontrada</p>
        <span>${currentFilter === 'all' ? 'Adicione sua primeira transação acima' : 'Tente outro filtro'}</span>
      </div>
    `;
    return;
  }
  
  listContainer.innerHTML = filteredTransactions.map(transaction => {
    const isIncome = transaction.type === 'income';
    const icon = isIncome ? '↑' : '↓';
    const sign = isIncome ? '+' : '-';
    
    return `
      <div class="transaction-item ${transaction.type}">
        <div class="transaction-info">
          <div class="transaction-icon">${icon}</div>
          <div class="transaction-details">
            <div class="transaction-title">${escapeHtml(transaction.title)}</div>
            <div class="transaction-date">${formatDate(transaction.created_at)}</div>
          </div>
        </div>
        <div class="transaction-amount">${sign} ${formatCurrency(transaction.amount)}</div>
        <div class="transaction-actions">
          <button class="btn-icon btn-delete" onclick="deleteTransaction(${transaction.id})" title="Excluir">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

const updateSummary = () => {
  const income = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expense;
  
  document.getElementById('totalIncome').textContent = formatCurrency(income);
  document.getElementById('totalExpense').textContent = formatCurrency(expense);
  document.getElementById('balance').textContent = formatCurrency(balance);
  
  // Atualizar cor do saldo
  const balanceElement = document.getElementById('balance');
  balanceElement.className = 'card-value';
  if (balance > 0) {
    balanceElement.classList.add('text-success');
  } else if (balance < 0) {
    balanceElement.classList.add('text-danger');
  }
};

// Security: Escape HTML to prevent XSS
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', login);
document.getElementById('transactionForm').addEventListener('submit', addTransaction);

// Permitir submit com Enter
document.getElementById('email').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('password').focus();
  }
});

document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
  }
});

// Initialize on load
window.addEventListener('DOMContentLoaded', checkSession);

// Listen to auth state changes
client.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    showLogin();
  }
});
