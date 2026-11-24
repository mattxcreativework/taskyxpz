/* ===== Elementos da página ===== */
const campo = document.getElementById("campoTarefa");
const botao = document.getElementById("botaoAdicionar");
const lista = document.getElementById("listaTarefas");
const xpSemana = document.getElementById("xpSemana");
const metaSemana = document.getElementById("metaSemana");
const barraSemana = document.getElementById("barraSemana");
const barraAcessivel = document.getElementById("barraAcessivel");
const nivel = document.getElementById("nivel");
const xpTotal = document.getElementById("xpTotal");

/* ===== Regras do jogo ===== */
const XP_POR_TAREFA = 20;
const META_SEMANA = 100;
const XP_POR_NIVEL = 100;

/* ===== Armazenamento seguro ===== */
// Lê do localStorage sem quebrar o app se o dado estiver corrompido.
function ler(chave, padrao) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave));
    return valor ?? padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem espaço ou modo privado: o app continua funcionando, só não salva.
  }
}

let tarefas = ler("tarefas", []);
let registroXP = ler("registroXP", []);

if (!Array.isArray(tarefas)) tarefas = [];
if (!Array.isArray(registroXP)) registroXP = [];

// Migração: quem já tinha tarefas concluídas antes do registro de XP não perde o progresso.
if (registroXP.length === 0) {
  tarefas
    .filter(t => t.concluida)
    .forEach(t => registroXP.push({ id: t.id, data: t.dataConclusao || Date.now() }));
}

function salvar() {
  gravar("tarefas", tarefas);
  gravar("registroXP", registroXP);
}

/* ===== XP e nível ===== */
// O XP fica num registro separado: excluir uma tarefa concluída não apaga o XP ganho.
function inicioDaSemana() {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diferenca = dia === 0 ? 6 : dia - 1; // semana começa na segunda
  return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diferenca).getTime();
}

function atualizarXP() {
  const inicio = inicioDaSemana();
  const xpDaSemana = registroXP.filter(r => r.data >= inicio).length * XP_POR_TAREFA;
  const total = registroXP.length * XP_POR_TAREFA;
  const porcentagem = Math.min((xpDaSemana / META_SEMANA) * 100, 100);

  xpSemana.textContent = xpDaSemana;
  metaSemana.textContent = META_SEMANA;
  xpTotal.textContent = total;
  nivel.textContent = Math.floor(total / XP_POR_NIVEL) + 1;
  barraSemana.style.width = porcentagem + "%";
  barraAcessivel.setAttribute("aria-valuenow", Math.round(porcentagem));
}

/* ===== Lista de tarefas ===== */
function alternarConclusao(tarefa) {
  tarefa.concluida = !tarefa.concluida;
  tarefa.dataConclusao = tarefa.concluida ? Date.now() : null;

  if (tarefa.concluida) {
    registroXP.push({ id: tarefa.id, data: tarefa.dataConclusao });
  } else {
    registroXP = registroXP.filter(r => r.id !== tarefa.id);
  }

  salvar();
  mostrarTarefas();
}

function excluirTarefa(id) {
  tarefas = tarefas.filter(t => t.id !== id);
  salvar();
  mostrarTarefas();
}

function criarBotao(simbolo, rotulo, classe, aoClicar) {
  const btn = document.createElement("button");
  btn.textContent = simbolo;
  btn.setAttribute("aria-label", rotulo);
  if (classe) btn.className = classe;
  btn.addEventListener("click", aoClicar);
  return btn;
}

function mostrarTarefas() {
  lista.innerHTML = "";

  if (tarefas.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "vazio";
    vazio.textContent = "Nenhuma missão ainda. Crie a primeira e ganhe +" + XP_POR_TAREFA + " XP!";
    lista.appendChild(vazio);
  }

  tarefas.forEach(tarefa => {
    const item = document.createElement("li");
    if (tarefa.concluida) item.classList.add("concluida");

    const texto = document.createElement("span");
    texto.textContent = tarefa.titulo; // textContent evita injeção de HTML (XSS)

    const btnConcluir = criarBotao(
      "✔",
      tarefa.concluida ? "Reabrir tarefa" : "Concluir tarefa",
      "concluir",
      () => alternarConclusao(tarefa)
    );

    const btnExcluir = criarBotao("✕", "Excluir tarefa", "excluir", () => excluirTarefa(tarefa.id));

    item.append(texto, btnConcluir, btnExcluir);
    lista.appendChild(item);
  });

  atualizarXP();
}

function adicionarTarefa() {
  const texto = campo.value.trim();
  if (texto === "") return;

  tarefas.push({
    id: Date.now(),
    titulo: texto,
    concluida: false,
    dataConclusao: null
  });

  salvar();
  mostrarTarefas();
  campo.value = "";
  campo.focus();
}

botao.addEventListener("click", adicionarTarefa);
campo.addEventListener("keydown", (e) => {
  if (e.key === "Enter") adicionarTarefa();
});

/* ===== Temas de cor ===== */
const raiz = document.documentElement;
const botoesTema = document.querySelectorAll(".tema");

function aplicarTema(nome) {
  raiz.dataset.tema = nome;
  botoesTema.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tema === nome)));
}

botoesTema.forEach(b => {
  b.addEventListener("click", () => {
    aplicarTema(b.dataset.tema);
    gravar("tema", b.dataset.tema);
  });
});

aplicarTema(ler("tema", "roxo"));

/* ===== Início ===== */
mostrarTarefas();
