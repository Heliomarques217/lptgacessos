import { state } from "../state.js";
import { formatEventText } from "../data/mappers.js";

export function getNextEvent() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return (
    state.jornadas.find((j) => new Date(j.data + "T00:00:00") >= hoje) ||
    state.jornadas[state.jornadas.length - 1]
  );
}

export function populateEvents() {
  const select = document.getElementById("evento");
  if (!select) return;
  const atual = select.value;
  select.innerHTML = state.jornadas
    .map((j) => {
      const evento = formatEventText(j);
      return `<option value="${evento}">${evento}</option>`;
    })
    .join("");
  const prox = getNextEvent();
  if (prox) select.value = atual || formatEventText(prox);
}

export function updateNextEvent() {
  const el = document.getElementById("nextEventTitle");
  if (!el || !state.jornadas.length) return;
  const j = getNextEvent();
  if (!j) return;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = new Date(j.data + "T00:00:00");
  const dias = Math.max(0, Math.ceil((d - hoje) / 86400000));
  el.textContent = `${j.jornada} · ${j.hipodromo.replace("Hipódromo de ", "").replace("Hipódromo da ", "")}`;
  document.getElementById("nextEventDetails").textContent = `${j.dataPT} · ${j.hipodromo}`;
  document.getElementById("nextEventDays").textContent = dias;
}

export function renderAdmins() {
  const tb = document.getElementById("tabelaAdmins");
  if (!tb) return;
  tb.innerHTML =
    state.administradores
      .map(
        (a) => `<tr>
    <td data-label="Nome"><b>${a.nome}</b></td>
    <td data-label="Email">${a.email}</td>
    <td data-label="Tipo">${a.tipo}</td>
    <td data-label="Estado"><span class="badge ${a.ativo ? "" : "off"}">${a.ativo ? "Ativo" : "Inativo"}</span></td>
    <td data-label="Ações"><div class="actions-cell"><button onclick="toggleAdmin('${a.id}')">${a.ativo ? "Desativar" : "Ativar"}</button><button onclick="deleteAdmin('${a.id}')">Apagar</button></div></td>
  </tr>`
      )
      .join("") || "<tr><td colspan='5'>Sem acessos criados.</td></tr>";
}

export function renderCalendar() {
  const tb = document.getElementById("tabelaCalendario");
  if (!tb) return;
  tb.innerHTML = state.jornadas
    .map((j) => {
      const evento = formatEventText(j);
      const entradas = state.entradas.filter((r) => r.evento === evento).length;
      return `<tr><td data-label="Jornada"><b>${j.jornada}</b></td><td data-label="Data">${j.dataPT}</td><td data-label="Hipódromo">${j.hipodromo}</td><td data-label="Entradas"><span class="badge">${entradas}</span></td></tr>`;
    })
    .join("");
}

export function render(showPersonPhotoFn) {
  const tp = document.getElementById("tabelaPessoas");
  if (tp) {
    tp.innerHTML =
      state.pessoas
        .map(
          (p) => `<tr><td data-label="Nome"><b>${p.nome}</b></td><td data-label="Função">${p.funcao}</td><td data-label="Nº">${p.numero}</td><td data-label="Código QR">${p.codigo}</td><td data-label="QR"><button onclick="viewQRCode('${p.id}')">Ver</button></td><td data-label="Estado"><span class="badge ${p.ativo ? "" : "off"}">${p.ativo ? "Ativo" : "Inativo"}</span></td><td data-label="Ações"><div class="actions-cell"><button onclick="toggleStatus('${p.id}')">${p.ativo ? "Desativar" : "Ativar"}</button><button onclick="deletePerson('${p.id}')">Apagar</button></div></td></tr>`
        )
        .join("") || "<tr><td colspan='6'>Sem pessoas.</td></tr>";
  }
  const tr = document.getElementById("tabelaRegistos");
  if (tr) {
    tr.innerHTML =
      state.entradas
        .map(
          (r) => `<tr><td data-label="Data/Hora">${r.datahora}</td><td data-label="Evento">${r.evento}</td><td data-label="Nome"><b>${r.nome}</b></td><td data-label="Função">${r.funcao}</td><td data-label="Validado por">${r.operador}</td></tr>`
        )
        .join("") || "<tr><td colspan='5'>Sem registos.</td></tr>";
  }
  const selFoto = document.getElementById("selectFotoPessoa");
  if (selFoto) {
    const oldFoto = selFoto.value;
    selFoto.innerHTML = state.pessoas
      .map((p, i) => `<option value="${i}">${p.nome} - ${p.funcao}</option>`)
      .join("");
    selFoto.value = oldFoto || 0;
    if (showPersonPhotoFn) showPersonPhotoFn();
  }
  const hoje = new Date().toLocaleDateString("pt-PT");
  if (document.getElementById("statPessoas")) {
    document.getElementById("statPessoas").textContent = state.pessoas.length;
    document.getElementById("statAtivos").textContent = state.pessoas.filter((p) => p.ativo).length;
    document.getElementById("statEntradas").textContent = state.entradas.length;
    document.getElementById("statHoje").textContent = state.entradas.filter((r) =>
      String(r.datahora).startsWith(hoje)
    ).length;
  }
  renderAdmins();
  renderCalendar();
  updateNextEvent();
}
