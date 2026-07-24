import { state } from "../state.js";
import { formatEventText, isJornadaAtiva } from "../data/mappers.js";
import { FUNCOES_PADRAO } from "../data/funcoes.js";
import { labelAcao } from "../data/auditoria.js";

export function getNextEvent() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const activas = state.jornadas.filter(isJornadaAtiva);
  return (
    activas.find((j) => new Date(j.data + "T00:00:00") >= hoje) ||
    activas[activas.length - 1]
  );
}

function jornadasActivas() {
  return state.jornadas.filter(isJornadaAtiva);
}

const VALIDAR_EVENTO_KEY = "lptg_validar_evento";

function findJornadaByEventoText(evento) {
  return state.jornadas.find((j) => formatEventText(j) === evento);
}

function syncValidarToSidebar(evento) {
  const sidebar = document.getElementById("evento");
  if (sidebar && evento) sidebar.value = evento;
}

function updateValidarHint(j) {
  const hint = document.getElementById("validarEventoHint");
  if (!hint) return;
  hint.textContent = j
    ? `A validar entradas em ${j.hipodromo}`
    : "Escolhe a jornada onde estás a validar entradas";
}

export function getValidarEvento() {
  const val = document.getElementById("validarEvento")?.value;
  if (val) return val;
  return document.getElementById("evento")?.value || "";
}

export function populateValidarEventos() {
  const sel = document.getElementById("validarEvento");
  if (!sel || !state.jornadas.length) return;

  let saved = sessionStorage.getItem(VALIDAR_EVENTO_KEY);
  if (!saved) {
    const hip = sessionStorage.getItem("lptg_validar_hipodromo");
    const jornada = sessionStorage.getItem("lptg_validar_jornada");
    if (hip && jornada) {
      const j = state.jornadas.find((x) => x.hipodromo === hip && x.jornada === jornada);
      if (j) saved = formatEventText(j);
    }
  }

  sel.innerHTML =
    `<option value="">— Selecionar jornada —</option>` +
    jornadasActivas()
      .map((j) => {
        const evento = formatEventText(j);
        return `<option value="${evento}">${evento}</option>`;
      })
      .join("");

  const prox = getNextEvent();
  const savedJ = saved ? findJornadaByEventoText(saved) : null;
  const defaultVal =
    (savedJ && isJornadaAtiva(savedJ) && saved) || (prox && formatEventText(prox)) || "";

  if (defaultVal) {
    sel.value = defaultVal;
    sessionStorage.setItem(VALIDAR_EVENTO_KEY, defaultVal);
    syncValidarToSidebar(defaultVal);
    updateValidarHint(findJornadaByEventoText(defaultVal));
  } else {
    updateValidarHint(null);
  }
}

export function onValidarEventoChange() {
  const evento = document.getElementById("validarEvento")?.value || "";
  if (evento) {
    sessionStorage.setItem(VALIDAR_EVENTO_KEY, evento);
    syncValidarToSidebar(evento);
    updateValidarHint(findJornadaByEventoText(evento));
  } else {
    sessionStorage.removeItem(VALIDAR_EVENTO_KEY);
    updateValidarHint(null);
  }
}

export function populateEvents() {
  const select = document.getElementById("evento");
  if (!select) return;
  const atual = select.value;
  select.innerHTML = jornadasActivas()
    .map((j) => {
      const evento = formatEventText(j);
      return `<option value="${evento}">${evento}</option>`;
    })
    .join("");
  const prox = getNextEvent();
  if (prox) select.value = atual || formatEventText(prox);
  populateValidarEventos();
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

export function renderJornadasAnuladas() {
  const panel = document.getElementById("jornadasAnuladasPanel");
  const list = document.getElementById("jornadasAnuladasList");
  if (!panel || !list) return;
  const anuladas = state.jornadas.filter((j) => j.anulada);
  if (!anuladas.length) {
    panel.hidden = true;
    list.innerHTML = "";
    return;
  }
  panel.hidden = false;
  list.innerHTML = anuladas
    .map(
      (j) =>
        `<li><b>${j.jornada}</b> · ${j.dataPT} · ${j.hipodromo} <span class="badge off">Anulada</span></li>`
    )
    .join("");
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
      const estado = j.anulada
        ? `<span class="badge off">Anulada</span>`
        : `<span class="badge">Agendada</span>`;
      const rowClass = j.anulada ? " class=\"jornada-anulada\"" : "";
      return `<tr${rowClass}><td data-label="Jornada"><b>${j.jornada}</b></td><td data-label="Data">${j.dataPT}</td><td data-label="Hipódromo">${j.hipodromo}</td><td data-label="Estado">${estado}</td><td data-label="Entradas"><span class="badge">${entradas}</span></td></tr>`;
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

function funcoesOptionsHtml(current) {
  const list = state.funcoes?.length ? state.funcoes : FUNCOES_PADRAO;
  const names = current && !list.includes(current) ? [current, ...list] : list;
  return names
    .map((nome) => `<option${nome === current ? " selected" : ""}>${nome}</option>`)
    .join("");
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
          `<tr><td data-label="Nome" title="${p.nome}"><b>${p.nome}</b></td><td data-label="Função"><select class="funcao-select" title="${p.funcao}" onchange="updatePersonFuncao('${p.id}', this)">${funcoesOptionsHtml(p.funcao)}</select></td><td data-label="Nº">${p.numero}</td><td data-label="Código QR" title="${p.codigo}">${p.codigo}</td><td data-label="Estado"><span class="badge ${p.ativo ? "" : "off"}">${p.ativo ? "Ativo" : "Concluído"}</span></td><td data-label="QR" class="td-qr"><button type="button" class="btn-sm btn-qr" onclick="viewQRCode('${p.id}')">Ver QR</button></td><td data-label="Ações"><div class="actions-cell actions-cell--compact"><button type="button" class="btn-sm btn-renew" onclick="openRenewCardModal('${p.id}')">Novo cartão</button><button type="button" class="btn-sm ${p.ativo ? "btn-warn" : "btn-safe"}" onclick="toggleStatus('${p.id}')">${p.ativo ? "Concluir" : "Reativar"}</button><button type="button" class="btn-sm btn-danger" onclick="deletePerson('${p.id}')">Apagar</button></div></td></tr>`
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

function auditRowHtml(r) {
  return `<tr><td data-label="Data/Hora">${r.datahora}</td><td data-label="Utilizador"><b>${r.operador}</b></td><td data-label="Ação">${labelAcao(r.acao)}</td><td data-label="Detalhe">${r.detalhe}</td></tr>`;
}

export function renderAuditoria() {
  const list = state.auditoria || [];
  const err = state.auditoriaError;
  const empty = err
    ? `<tr><td colspan="4">${err}</td></tr>`
    : "<tr><td colspan='4'>Sem eventos registados ainda.</td></tr>";
  const full = document.getElementById("tabelaAtividade");
  if (full) {
    full.innerHTML = list.length ? list.map(auditRowHtml).join("") : empty;
  }
}

function pessoaTemFotoCartao(p) {
  return Boolean(p.fotoCartao && String(p.fotoCartao).trim());
}

function buildFotoPessoaSelectHtml() {
  const comFoto = [];
  const semFoto = [];
  state.pessoas.forEach((p, i) => {
    const label = `${p.nome} - ${p.funcao}`;
    const cls = pessoaTemFotoCartao(p) ? "foto-opt--com" : "foto-opt--sem";
    const opt = `<option class="${cls}" value="${i}">${label}</option>`;
    if (pessoaTemFotoCartao(p)) comFoto.push(opt);
    else semFoto.push(opt);
  });
  let html = `<option value="">— Escolhe uma pessoa —</option>`;
  if (comFoto.length) {
    html += `<optgroup label="Com foto (${comFoto.length})">${comFoto.join("")}</optgroup>`;
  }
  if (semFoto.length) {
    html += `<optgroup label="Sem foto (${semFoto.length})">${semFoto.join("")}</optgroup>`;
  }
  return html;
}

export function syncFotoPessoaSelectStyle() {
  const sel = document.getElementById("selectFotoPessoa");
  if (!sel) return;
  sel.classList.remove("select-foto--sem", "select-foto--com");
  if (sel.value === "") return;
  const p = state.pessoas[Number(sel.value)];
  if (!p) return;
  sel.classList.add(pessoaTemFotoCartao(p) ? "select-foto--com" : "select-foto--sem");
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
        .join("") || "<tr><td colspan='6'>Sem entradas registadas.</td></tr>";
  }
  const selFoto = document.getElementById("selectFotoPessoa");
  if (selFoto) {
    const oldFoto = selFoto.value;
    selFoto.innerHTML = buildFotoPessoaSelectHtml();
    selFoto.value =
      oldFoto !== "" && state.pessoas[Number(oldFoto)] !== undefined ? oldFoto : "";
    syncFotoPessoaSelectStyle();
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
  renderAuditoria();
  renderAdmins();
  renderCalendar();
  updateNextEvent();
  renderJornadasAnuladas();
}
