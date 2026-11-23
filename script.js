const campo = document.getElementById("campoTarefa");
const botao = document.getElementById("botaoAdicionar");
const lista = document.getElementById("listaTarefas");
const xpSemana = document.getElementById("xpSemana");
const barraSemana = document.getElementById("barraSemana");

const XP_POR_TAREFA = 20;
const META_SEMANA = 100;

let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

function inicioDaSemana() {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diferenca = dia === 0 ? 6 : dia - 1;
  return new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate() - diferenca
  ).getTime();
}

function atualizarXP() {
  const inicio = inicioDaSemana();
  const xp = tarefas
    .filter(t => t.concluida && t.dataConclusao >= inicio)
    .reduce(soma => soma + XP_POR_TAREFA, 0);

  xpSemana.textContent = xp;
  const porcentagem = Math.min((xp / META_SEMANA) * 100, 100);
  barraSemana.style.width = porcentagem + "%";
}

function mostrarTarefas() {
  lista.innerHTML = "";

  tarefas.forEach(tarefa => {
    const item = document.createElement("li");
    if (tarefa.concluida) item.classList.add("concluida");

    const texto = document.createElement("span");
    texto.textContent = tarefa.titulo;

    const btnConcluir = document.createElement("button");
    btnConcluir.textContent = "✔";
    btnConcluir.addEventListener("click", () => {
      tarefa.concluida = !tarefa.concluida;
      tarefa.dataConclusao = tarefa.concluida ? Date.now() : null;
      salvar();
      mostrarTarefas();
    });

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "🗑";
    btnExcluir.addEventListener("click", () => {
      tarefas = tarefas.filter(t => t.id !== tarefa.id);
      salvar();
      mostrarTarefas();
    });

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
}

botao.addEventListener("click", adicionarTarefa);
mostrarTarefas();