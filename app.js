const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

let all = [];

document.getElementById("loginForm").addEventListener("submit", login);
document.getElementById("transactionForm").addEventListener("submit", addTransaction);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("filterType").addEventListener("change", render);

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete")) {
    deleteTransaction(e.target.dataset.id);
  }
  if (e.target.classList.contains("edit")) {
    editTransaction(e.target.dataset.id);
  }
});

async function login(e) {
  e.preventDefault();

  const email = email.value;
  const password = password.value;

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) return alert(error.message);

  document.getElementById("userEmail").textContent = data.user.email;

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");

  load();
}

async function logout() {
  await client.auth.signOut();
  location.reload();
}

async function addTransaction(e) {
  e.preventDefault();

  const { data: user } = await client.auth.getUser();

  await client.from("transactions").insert({
    user_id: user.user.id,
    title: title.value,
    amount: amount.value,
    type: type.value
  });

  e.target.reset();
  load();
}

async function load() {
  const { data } = await client
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  all = data;
  render();
}

function render() {
  const filter = filterType.value;

  const list = document.getElementById("transactionsList");

  const filtered = filter === "all"
    ? all
    : all.filter(t => t.type === filter);

  list.innerHTML = filtered.map(t => `
    <div class="transaction">
      <span>${t.title}</span>
      <span>${t.amount}</span>
      <div>
        <button class="edit" data-id="${t.id}">Editar</button>
        <button class="delete" data-id="${t.id}">Excluir</button>
      </div>
    </div>
  `).join("");

  update();
}

function update() {
  const income = all.filter(t => t.type === "income").reduce((a,b)=>a+Number(b.amount),0);
  const expense = all.filter(t => t.type === "expense").reduce((a,b)=>a+Number(b.amount),0);

  totalIncome.textContent = income;
  totalExpense.textContent = expense;
  balance.textContent = income - expense;
}

async function deleteTransaction(id) {
  await client.from("transactions").delete().eq("id", id);
  load();
}

async function editTransaction(id) {
  const newTitle = prompt("Novo nome:");
  if (!newTitle) return;

  await client.from("transactions")
    .update({ title: newTitle })
    .eq("id", id);

  load();
}

async function checkSession() {
  const { data } = await client.auth.getSession();

  if (data.session) {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appScreen").classList.remove("hidden");

    document.getElementById("userEmail").textContent = data.session.user.email;

    load();
  }
}

checkSession();
