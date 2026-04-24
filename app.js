// Inicialização do Supabase
const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado global
let allTransactions = [];
let currentFilter = 'all';
let currentDate = new Date();

// ======================
// Utility Functions
// ======================
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
    year: 'numeric'
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

// ======================
// Navegação
// ======================
const showApp = () => {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';
};

const showLogin = () => {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('loginForm').reset();
};

// ======================
// Auth
// ======================
const login = async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showError('Preencha todos os campos');
    return;
  }

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
    showError(error.message);
  }
};

const logout = async () => {
  if (!confirm('Deseja sair?')) return;

  await client.auth.signOut();
  allTransactions = [];
  showLogin();
};

const checkSession = async () => {
  const { data: { session } } = await client.auth.getSession();

  if (session) {
    document.getElementById('userEmail').textContent = session.user.email;
    showApp();
    await loadTransactions();
  }
};

// ======================
// FILTROS
// ======================
const getFilteredByDate = () => {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  return allTransactions.filter(t => {
    const d = new Date(t.created_at);
    return d.getMonth() === month && d.getFullYear() === year;
  });
};

const getVisibleTransactions = () => {
  let data = getFilteredByDate();

  if (currentFilter !== 'all') {
    data = data.filter(t => t.type === currentFilter);
  }

  return data;
};

// ======================
// CRUD
// ======================
const addTransaction = async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const category = document.getElementById('category')?.value || null;
  const installments = parseInt(document.getElementById('installments')?.value || 1);
  const isRecurring = document.getElementById('isRecurring')?.checked || false;

  if (!title || !amount) {
    alert('Preencha os campos corretamente');
    return;
  }

  showLoading(true);

  try {
    const { data: { user } } = await client.auth.getUser();

    const groupId = crypto.randomUUID();
    const transactions = [];

    for (let i = 1; i <= installments; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + (i - 1));

      transactions.push({
        user_id: user.id,
        title: installments > 1 ? `${title} (${i}/${installments})` : title,
        amount,
        type,
        category,
        is_recurring: isRecurring,
        installment_number: installments > 1 ? i : null,
        installment_total: installments > 1 ? installments : null,
        installment_group_id: installments > 1 ? groupId : null,
        created_at: date.toISOString()
      });
    }

    const { error } = await client.from('transactions').insert(transactions);
    if (error) throw error;

    document.getElementById('transactionForm').reset();
    await loadTransactions();

  } catch (error) {
    alert(error.message);
  } finally {
    showLoading(false);
  }
};

const deleteTransaction = async (id) => {
  if (!confirm('Excluir transação?')) return;

  showLoading(true);

  try {
    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await loadTransactions();

  } catch (error) {
    alert(error.message);
  } finally {
    showLoading(false);
  }
};

const editTransaction = async (id) => {
  const t = allTransactions.find(t => t.id === id);

  const newTitle = prompt('Editar descrição:', t.title);
  if (!newTitle) return;

  showLoading(true);

  try {
    const { error } = await client
      .from('transactions')
      .update({ title: newTitle })
      .eq('id', id);

    if (error) throw error;

    await loadTransactions();

  } catch (error) {
    alert(error.message);
  } finally {
    showLoading(false);
  }
};

// ======================
// LOAD
// ======================
const loadTransactions = async () => {
  try {
    const { data, error } = await client
      .from('transactions')
      .select('id, title, amount, type, created_at, category, installment_number, installment_total, is_recurring')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allTransactions = data || [];

    renderTransactions();
    updateSummary();

  } catch (error) {
    alert(error.message);
  }
};

// ======================
// RENDER
// ======================
const renderTransactions = () => {
  const list = document.getElementById('transactionsList');
  const data = getVisibleTransactions();

  if (!data.length) {
    list.innerHTML = `<div class="empty-state">Nenhuma transação</div>`;
    return;
  }

  list.innerHTML = data.map(t => {
    const sign = t.type === 'income' ? '+' : '-';

    return `
      <div class="transaction-item ${t.type}">
        <div class="transaction-details">
          <div><strong>${escapeHtml(t.title)}</strong></div>
          <div class="text-muted">${formatDate(t.created_at)}</div>

          ${t.category ? `<div class="text-muted">${t.category}</div>` : ''}
          ${t.installment_total ? `<div class="text-muted">${t.installment_number}/${t.installment_total}</div>` : ''}
          ${t.is_recurring ? `<div class="text-muted">🔁 Recorrente</div>` : ''}
        </div>

        <div>${sign} ${formatCurrency(t.amount)}</div>

        <div>
          <button onclick="editTransaction(${t.id})">✏️</button>
          <button onclick="deleteTransaction(${t.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
};

const updateSummary = () => {
  const data = getVisibleTransactions();

  const income = data.filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const expense = data.filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  document.getElementById('totalIncome').textContent = formatCurrency(income);
  document.getElementById('totalExpense').textContent = formatCurrency(expense);
  document.getElementById('balance').textContent = formatCurrency(income - expense);
};

// ======================
// UTIL
// ======================
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// ======================
// EVENTS
// ======================
document.getElementById('loginForm').addEventListener('submit', login);
document.getElementById('transactionForm').addEventListener('submit', addTransaction);

document.getElementById('filterType').addEventListener('change', (e) => {
  currentFilter = e.target.value;
  renderTransactions();
  updateSummary();
});

window.addEventListener('DOMContentLoaded', checkSession);

client.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') showLogin();
});
