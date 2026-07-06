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
    <td data-label="Tipo">${a.tipo || "Administrador"}</td>
    <td data-label="Estado"><span class="badge ${a.ativo ? "" : "off"}">${a.ativo ? "Ativo" : "Inativo"}</span></td>
    <td data-label="Ações"><div class="actions-cell"><button class="${a.ativo ? "btn-warn" : "btn-safe"}" onclick="toggleAdmin('${a.id}')">${a.ativo ? "Desativar" : "Ativar"}</button><button class="btn-danger" onclick="deleteAdmin('${a.id}')">Apagar</button></div></td>
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

function comparePessoas(a, b, field) {
  if (field === "nome") return a.nome.localeCompare(b.nome, "pt");
  if (field === "funcao") return a.funcao.localeCompare(b.funcao, "pt");
  if (field === "codigo") return a.codigo.localeCompare(b.codigo, "pt");
  if (field === "ativo") return (a.ativo === b.ativo ? 0 : a.ativo ? -1 : 1);
  if (field === "numero") {
    const na = parseInt(String(a.numero).replace(/\D/g, ""), 10);
    const nb = parseInt(String(b.numero).replace(/\D/g, ""), 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && String(a.numero) !== "—" && String(b.numero) !== "—") {
      return na - nb;
    }
    return String(a.numero).localeCompare(String(b.numero), "pt", { numeric: true });
  }
  return 0;
}

function getSortedPessoas() {
  const { sort, dir } = state.pessoasTable;
  const list = [...state.pessoas];
  const mul = dir === "asc" ? 1 : -1;
  list.sort((a, b) => comparePessoas(a, b, sort) * mul);
  return list;
}

export function renderPessoas() {
  const tp = document.getElementById("tabelaPessoas");
  if (!tp) return;

  const sorted = getSortedPessoas();
  const { pageSize } = state.pessoasTable;
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  let page = state.pessoasTable.page;
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;
  state.pessoasTable.page = page;

  const start = (page - 1) * pageSize;
  const slice = sorted.slice(start, start + pageSize);

  tp.innerHTML =
    slice
      .map(
        (p) =>
          `<tr><td data-label="Nome"><b>${p.nome}</b></td><td data-label="Função">${p.funcao}</td><td data-label="Nº">${p.numero}</td><td data-label="Código QR">${p.codigo}</td><td data-label="Estado"><span class="badge ${p.ativo ? "" : "off"}">${p.ativo ? "Ativo" : "Concluído"}</span></td><td data-label="QR" class="td-qr"><button type="button" class="btn-sm btn-qr" onclick="viewQRCode('${p.id}')">Ver QR</button></td><td data-label="Ações"><div class="actions-cell actions-cell--compact"><button type="button" class="btn-sm btn-renew" onclick="openRenewCardModal('${p.id}')">Novo cartão</button><button type="button" class="btn-sm ${p.ativo ? "btn-warn" : "btn-safe"}" onclick="toggleStatus('${p.id}')">${p.ativo ? "Concluir" : "Reativar"}</button><button type="button" class="btn-sm btn-danger" onclick="deletePerson('${p.id}')">Apagar</button></div></td></tr>`
      )
      .join("") || `<tr><td colspan="7">Sem pessoas.</td></tr>`;

  const sortLabels = { nome: "Nome", funcao: "Função", numero: "Nº", codigo: "Código QR", ativo: "Estado" };
  const arrow = state.pessoasTable.dir === "asc" ? "▲" : "▼";
  document.querySelectorAll(".pessoas-table .th-sort").forEach((th) => {
    const field = th.dataset.sort;
    const label = sortLabels[field] || field;
    const active = field === state.pessoasTable.sort;
    th.classList.toggle("active", active);
    th.innerHTML = active ? `${label}<span class="sort-arrow">${arrow}</span>` : label;
  });

  const info = document.getElementById("pessoasPageInfo");
  if (info) {
    if (!total) {
      info.textContent = "Nenhuma pessoa registada";
    } else {
      const from = start + 1;
      const to = Math.min(start + pageSize, total);
      info.textContent = `${from}–${to} de ${total} · Página ${page} de ${totalPages}`;
    }
  }

  const prev = document.getElementById("pessoasPrev");
  const next = document.getElementById("pessoasNext");
  if (prev) prev.disabled = page <= 1;
  if (next) next.disabled = page >= totalPages;
}

export function renderFuncoesSelect() {
  const sel = document.getElementById("funcao");
  if (!sel) return;
  const old = sel.value;
  const list = state.funcoes?.length ? state.funcoes : [];
  sel.innerHTML = list.map((nome) => `<option>${nome}</option>`).join("");
  if (old && list.includes(old)) sel.value = old;
}

export function render(showPersonPhotoFn) {
  renderPessoas();
  renderFuncoesSelect();
  const tr = document.getElementById("tabelaRegistos");
  if (tr) {
    tr.innerHTML =
      state.entradas
        .map(
          (r) =>
            `<tr><td data-label="Data/Hora">${r.datahora}</td><td data-label="Evento">${r.evento}</td><td data-label="Nome"><b>${r.nome}</b></td><td data-label="Função">${r.funcao}</td><td data-label="Validado por">${r.operador}</td><td data-label="Ações"><div class="actions-cell">${r.id ? `<button class="btn-danger" onclick="deleteRegisto('${r.id}')">Eliminar</button>` : ""}</div></td></tr>`
        )
        .join("") || "<tr><td colspan='6'>Sem registos.</td></tr>";
  }
  const selFoto = document.getElementById("selectFotoPessoa");
  if (selFoto) {
    const oldFoto = selFoto.value;
    selFoto.innerHTML =
      `<option value="">— Escolhe uma pessoa —</option>` +
      state.pessoas.map((p, i) => `<option value="${i}">${p.nome} - ${p.funcao}</option>`).join("");
    selFoto.value =
      oldFoto !== "" && state.pessoas[Number(oldFoto)] !== undefined ? oldFoto : "";
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
