import { isConfigured } from "./supabase.js";
import { state } from "./state.js";
import { fetchPessoas, insertPessoa, updatePessoa, deletePessoa as removePessoa } from "./data/pessoas.js";
import { ensureCalendarioOficial } from "./data/jornadas.js";
import { fetchEntradas, insertEntrada, findEntrada, deleteEntrada } from "./data/entradas.js";
import {
  fetchAdministradores,
  insertAdministrador,
  updateAdministrador,
  deleteAdministrador,
} from "./data/administradores.js";
import { formatEventText } from "./data/mappers.js";
import { login as authLogin, logout as authLogout, restoreSession, checkSessionUi, setupAuthListener } from "./features/auth.js";
import { requireSession, requireAdmin, isAdmin } from "./features/guards.js";
import { populateEvents, render } from "./ui/render.js";

function uid() {
  return crypto.randomUUID();
}

function generateUniqueCode() {
  let c;
  do {
    c = "LPTG-2026-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  } while (state.pessoas.some((p) => p.codigo === c));
  return c;
}

async function loadAllData() {
  requireSession();
  if (!isConfigured()) {
    alert("Configura SUPABASE_URL e SUPABASE_ANON_KEY em public/js/config.js");
    return;
  }
  state.jornadas = await ensureCalendarioOficial();
  try {
    state.pessoas = await fetchPessoas();
    state.administradores = await fetchAdministradores();
    state.entradas = await fetchEntradas();
  } catch (e) {
    console.error(e);
    throw e;
  }
  populateEvents();
  render(showPersonPhoto);
}

export async function refreshAllFromSupabase() {
  if (!state.sessao) return;
  if (state.fotoTemporaria) return;
  try {
    await loadAllData();
  } catch (e) {
    console.error(e);
  }
}

async function login() {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const senha = document.getElementById("loginPassword").value;
  const erro = document.getElementById("loginError");
  erro.textContent = "";
  try {
    await authLogin(email, senha);
    checkSessionUi();
    await loadAllData();
    render(showPersonPhoto);
  } catch (e) {
    erro.textContent = e.message || "Não foi possível entrar.";
  }
}

async function logout() {
  await authLogout();
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  checkSessionUi();
}

function toggleMobileMenu() {
  document.body.classList.toggle("menu-open");
}

function closeMobileMenu() {
  document.body.classList.remove("menu-open");
}

function resetFotoTab() {
  state.fotoTemporaria = null;
  const sel = document.getElementById("selectFotoPessoa");
  const input = document.getElementById("inputFotoCartao");
  const box = document.getElementById("fotoPreview");
  const info = document.getElementById("fotoPessoaInfo");
  if (sel) sel.value = "";
  if (input) input.value = "";
  if (box) box.innerHTML = "<span>Sem foto associada</span>";
  if (info) info.textContent = "—";
}

function screen(id, btn) {
  if (!state.sessao) {
    alert("Inicia sessão para continuar.");
    return;
  }
  if (id === "admins" && !isAdmin()) {
    alert("Apenas administradores podem aceder a esta página.");
    return;
  }
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("show"));
  document.getElementById(id).classList.add("show");
  document.querySelectorAll(".nav").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  closeMobileMenu();
  if (id === "fotos") resetFotoTab();
  render(showPersonPhoto);
}

function sortPessoas(field) {
  if (state.pessoasTable.sort === field) {
    state.pessoasTable.dir = state.pessoasTable.dir === "asc" ? "desc" : "asc";
  } else {
    state.pessoasTable.sort = field;
    state.pessoasTable.dir = "asc";
  }
  state.pessoasTable.page = 1;
  render(showPersonPhoto);
}

function pessoasPrevPage() {
  if (state.pessoasTable.page > 1) {
    state.pessoasTable.page -= 1;
    render(showPersonPhoto);
  }
}

function pessoasNextPage() {
  const totalPages = Math.max(1, Math.ceil(state.pessoas.length / state.pessoasTable.pageSize));
  if (state.pessoasTable.page < totalPages) {
    state.pessoasTable.page += 1;
    render(showPersonPhoto);
  }
}

async function addPerson() {
  try {
    requireSession();
  } catch (e) {
    alert(e.message);
    return;
  }
  const nome = document.getElementById("nome").value.trim();
  const funcao = document.getElementById("funcao").value;
  const numero = document.getElementById("numero").value.trim();
  if (!nome) {
    alert("Falta o nome.");
    return;
  }
  try {
    const novaPessoa = await insertPessoa({
      nome,
      funcao,
      numero: numero || "—",
      codigo: generateUniqueCode(),
      ativo: true,
    });
    state.pessoas.push(novaPessoa);
    document.getElementById("nome").value = "";
    document.getElementById("numero").value = "";
    render(showPersonPhoto);
    showNewQRCode(novaPessoa);
  } catch (e) {
    alert("Erro ao guardar pessoa: " + e.message);
  }
}

async function deletePerson(id) {
  try {
    requireSession();
  } catch (e) {
    alert(e.message);
    return;
  }
  if (!confirm("Apagar esta pessoa?")) return;
  try {
    await removePessoa(id);
    state.pessoas = state.pessoas.filter((p) => p.id !== id);
    render(showPersonPhoto);
  } catch (e) {
    alert("Erro ao apagar: " + e.message);
  }
}

async function toggleStatus(id) {
  try {
    requireSession();
  } catch (e) {
    alert(e.message);
    return;
  }
  const p = state.pessoas.find((x) => x.id === id);
  if (!p) return;
  try {
    const updated = await updatePessoa(id, { ativo: !p.ativo });
    Object.assign(p, updated);
    render(showPersonPhoto);
  } catch (e) {
    alert("Erro ao atualizar: " + e.message);
  }
}

function normalizeCodigoQR(raw) {
  const text = String(raw || "").trim();
  const match = text.match(/LPTG-2026-[A-Z0-9]+/i);
  return match ? match[0].toUpperCase() : text;
}

async function validateEntry() {
  try {
    requireSession();
  } catch (e) {
    alert(e.message);
    return;
  }
  const codigo = normalizeCodigoQR(document.getElementById("codigoValidar").value);
  document.getElementById("codigoValidar").value = codigo;
  const evento = document.getElementById("evento").value;
  const operador = document.getElementById("operador").value.trim() || "Não identificado";
  const out = document.getElementById("resultado");
  const p = state.pessoas.find((x) => x.codigo.toLowerCase() === codigo.toLowerCase());

  if (!p) {
    out.className = "glass result no";
    out.innerHTML = "<h3>Cartão inválido</h3><p>Este código não existe na base de dados.</p>";
    return;
  }
  if (!p.ativo) {
    out.className = "glass result no";
    out.innerHTML = `<h3>Cartão inativo</h3><p>${p.nome} está inativo. Não permitir entrada.</p>`;
    return;
  }

  try {
    const usado = await findEntrada(evento, p.codigo);
    if (usado) {
      const mapped = state.entradas.find((r) => r.codigo === p.codigo && r.evento === evento);
      const datahora = mapped?.datahora || (usado.datahora ? new Date(usado.datahora).toLocaleString("pt-PT") : "");
      out.className = "glass result no";
      out.innerHTML = `<h3>Entrada já registada</h3><p><b>${p.nome}</b><br>${p.funcao}<br>Entrada às ${datahora}<br>Validado por ${usado.operador || mapped?.operador || ""}</p>`;
      return;
    }

    const entrada = await insertEntrada({
      evento,
      codigo: p.codigo,
      nome: p.nome,
      funcao: p.funcao,
      operador,
      datahora: new Date().toISOString(),
    });

    state.entradas.unshift(entrada);
    render(showPersonPhoto);
    out.className = "glass result ok";
    out.innerHTML = `<h3>Entrada autorizada</h3><p><b>${p.nome}</b><br>${p.funcao}<br>${p.numero}<br>Validado por ${operador}</p>`;
  } catch (e) {
    if (e.code === "23505" || String(e.message).includes("duplicate")) {
      out.className = "glass result no";
      out.innerHTML = `<h3>Entrada já registada</h3><p><b>${p.nome}</b> já entrou nesta jornada.</p>`;
      return;
    }
    alert("Erro ao registar entrada: " + e.message);
  }
}

async function openQRCamera() {
  const box = document.getElementById("qrReaderBox");
  if (!box) return;
  box.classList.add("show");
  if (state.qrScannerAtivo) return;
  state.qrScanHandled = false;
  try {
    state.qrScanner = new Html5Qrcode("qrReader");
    state.qrScannerAtivo = true;
    await state.qrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        if (state.qrScanHandled) return;
        state.qrScanHandled = true;
        try {
          const codigo = normalizeCodigoQR(decodedText);
          document.getElementById("codigoValidar").value = codigo;
          await closeQRCamera();
          await validateEntry();
        } finally {
          state.qrScanHandled = false;
        }
      },
      () => {}
    );
  } catch (e) {
    state.qrScannerAtivo = false;
    alert("Não consegui abrir a câmara. Confirma se deste permissão ao navegador e se estás em HTTPS.");
  }
}

async function closeQRCamera() {
  const box = document.getElementById("qrReaderBox");
  if (state.qrScanner && state.qrScannerAtivo) {
    try {
      await state.qrScanner.stop();
      await state.qrScanner.clear();
    } catch (e) {}
  }
  state.qrScanner = null;
  state.qrScannerAtivo = false;
  if (box) box.classList.remove("show");
}

function showNewQRCode(p) {
  const qrBox = document.getElementById("novoQrPreview");
  const codeText = document.getElementById("novoCodigoPreview");
  const codeInput = document.getElementById("novoCodigoInput");
  if (!qrBox) return;
  qrBox.innerHTML = "";
  if (window.QRCode) {
    new QRCode(qrBox, { text: p.codigo, width: 172, height: 172 });
  } else {
    qrBox.innerHTML = "<b>QR</b><br>" + p.codigo;
  }
  codeText.textContent = p.codigo;
  codeInput.value = p.codigo;
}

function copyNewCode() {
  const input = document.getElementById("novoCodigoInput");
  if (!input || !input.value) {
    alert("Ainda não existe código QR gerado.");
    return;
  }
  navigator.clipboard.writeText(input.value).then(() => alert("Código copiado: " + input.value));
}

function previewCardPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.fotoTemporaria = reader.result;
    const box = document.getElementById("fotoPreview");
    if (box) box.innerHTML = `<img src="${state.fotoTemporaria}" alt="Foto do cartão">`;
  };
  reader.readAsDataURL(file);
}

function showPersonPhoto(resetPreview = false) {
  const sel = document.getElementById("selectFotoPessoa");
  const box = document.getElementById("fotoPreview");
  const info = document.getElementById("fotoPessoaInfo");
  if (!sel || !box) return;

  if (resetPreview) {
    state.fotoTemporaria = null;
    const input = document.getElementById("inputFotoCartao");
    if (input) input.value = "";
  }

  if (!sel.value) {
    if (!state.fotoTemporaria) {
      box.innerHTML = "<span>Sem foto associada</span>";
    } else {
      box.innerHTML = `<img src="${state.fotoTemporaria}" alt="Foto do cartão">`;
    }
    if (info) info.textContent = "—";
    return;
  }

  const p = state.pessoas[Number(sel.value)];
  if (!p) return;

  if (state.fotoTemporaria) {
    box.innerHTML = `<img src="${state.fotoTemporaria}" alt="Foto do cartão">`;
  } else if (p.fotoCartao) {
    box.innerHTML = `<img src="${p.fotoCartao}" alt="Foto do cartão">`;
  } else {
    box.innerHTML = "<span>Sem foto associada</span>";
  }
  info.textContent = `${p.nome} · ${p.funcao} · ${p.codigo}`;
}

async function saveCardPhoto() {
  const sel = document.getElementById("selectFotoPessoa");
  if (!sel || !sel.value) {
    alert("Escolhe uma pessoa primeiro.");
    return;
  }
  if (!state.fotoTemporaria) {
    alert("Tens de escolher uma foto primeiro.");
    return;
  }
  const p = state.pessoas[Number(sel.value)];
  try {
    const updated = await updatePessoa(p.id, { fotoCartao: state.fotoTemporaria });
    Object.assign(p, updated);
    state.fotoTemporaria = null;
    render(showPersonPhoto);
    alert("Foto associada a: " + p.nome);
  } catch (e) {
    alert("Erro ao guardar foto: " + e.message);
  }
}

async function removeCardPhoto() {
  const sel = document.getElementById("selectFotoPessoa");
  if (!sel || !sel.value) {
    alert("Escolhe uma pessoa primeiro.");
    return;
  }
  const p = state.pessoas[Number(sel.value)];
  if (!p.fotoCartao) {
    alert("Esta pessoa ainda não tem foto associada.");
    return;
  }
  if (!confirm("Remover a foto associada a " + p.nome + "?")) return;
  try {
    const updated = await updatePessoa(p.id, { fotoCartao: "" });
    Object.assign(p, updated);
    state.fotoTemporaria = null;
    render(showPersonPhoto);
  } catch (e) {
    alert("Erro: " + e.message);
  }
}

function viewQRCode(id) {
  const p = state.pessoas.find((x) => x.id === id);
  if (!p) return;
  state.qrPessoaAtual = p;
  document.getElementById("modalQrNome").textContent = p.nome;
  document.getElementById("modalQrFuncao").textContent = p.funcao + " · " + p.numero;
  document.getElementById("modalQrCodigo").textContent = p.codigo;
  const qrBox = document.getElementById("modalQrImagem");
  qrBox.innerHTML = "";
  if (window.QRCode) {
    new QRCode(qrBox, { text: p.codigo, width: 240, height: 240 });
  } else {
    qrBox.innerHTML = "<b>QR</b><br>" + p.codigo;
  }
  document.getElementById("qrModal").classList.add("show");
}

function closeQRCode() {
  document.getElementById("qrModal").classList.remove("show");
}

function copyModalCode() {
  if (!state.qrPessoaAtual) return;
  navigator.clipboard.writeText(state.qrPessoaAtual.codigo).then(() =>
    alert("Código copiado: " + state.qrPessoaAtual.codigo)
  );
}

function qrCanvasToBlob() {
  return new Promise((resolve, reject) => {
    const box = document.getElementById("modalQrImagem");
    const canvas = box.querySelector("canvas");
    const img = box.querySelector("img");
    if (canvas) {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject()), "image/png");
      return;
    }
    if (img) {
      fetch(img.src).then((r) => r.blob()).then(resolve).catch(reject);
      return;
    }
    reject();
  });
}

async function copyQRImage() {
  try {
    const blob = await qrCanvasToBlob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    alert("Imagem QR copiada.");
  } catch (e) {
    alert("O navegador não permitiu copiar a imagem.");
  }
}

async function downloadQRImage() {
  if (!state.qrPessoaAtual) return;
  try {
    const blob = await qrCanvasToBlob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = state.qrPessoaAtual.codigo + "_qr.png";
    a.click();
  } catch (e) {
    alert("Não consegui descarregar a imagem QR.");
  }
}

async function toggleAdmin(id) {
  try {
    requireAdmin("gerir administradores");
  } catch (e) {
    alert(e.message);
    return;
  }
  const a = state.administradores.find((x) => x.id === id);
  if (!a) return;
  if (state.sessao && a.email === state.sessao.email && a.ativo) {
    alert("Não podes desativar o teu próprio acesso enquanto estás ligado.");
    return;
  }
  try {
    const updated = await updateAdministrador(id, { ativo: !a.ativo });
    Object.assign(a, updated);
    render(showPersonPhoto);
  } catch (e) {
    alert("Erro: " + e.message);
  }
}

async function deleteAdmin(id) {
  try {
    requireAdmin("apagar administradores");
  } catch (e) {
    alert(e.message);
    return;
  }
  const a = state.administradores.find((x) => x.id === id);
  if (!a) return;
  if (state.sessao && a.email === state.sessao.email) {
    alert("Não podes apagar o teu próprio acesso enquanto estás ligado.");
    return;
  }
  if (!confirm("Apagar acesso de " + a.nome + "?")) return;
  try {
    await deleteAdministrador(id);
    state.administradores = state.administradores.filter((x) => x.id !== id);
    render(showPersonPhoto);
  } catch (e) {
    alert("Erro: " + e.message);
  }
}

async function addAdmin() {
  try {
    requireAdmin("adicionar administradores");
  } catch (e) {
    alert(e.message);
    return;
  }
  const nome = document.getElementById("adminNome").value.trim();
  const email = document.getElementById("adminEmail").value.trim().toLowerCase();
  const senha = document.getElementById("adminSenha").value;
  const tipo = document.getElementById("adminTipo").value;

  if (!nome || !email || !senha) {
    alert("Preenche nome, email e senha.");
    return;
  }
  if (state.administradores.some((a) => a.email.toLowerCase() === email)) {
    alert("Já existe um acesso com este email.");
    return;
  }

  try {
    const novo = await insertAdministrador({ nome, email, tipo });
    state.administradores.push(novo);
    document.getElementById("adminNome").value = "";
    document.getElementById("adminEmail").value = "";
    document.getElementById("adminSenha").value = "";
    render(showPersonPhoto);
    alert(
      "Administrador adicionado com sucesso.\n\n" +
        "O email " +
        email +
        " já aparece na lista à direita.\n\n" +
        "Para conseguir entrar na app, falta um passo no Supabase (só uma vez):\n" +
        "1. Abre Supabase → Authentication → Users\n" +
        "2. Clica Add user → Create new user\n" +
        "3. Email: " +
        email +
        "\n4. Password: a mesma que escreveste no formulário\n" +
        "5. Marca Auto Confirm User e guarda\n\n" +
        "Depois disso o login já funciona."
    );
  } catch (e) {
    alert("Erro ao adicionar acesso: " + e.message);
  }
}

async function deleteRegisto(id) {
  try {
    requireSession();
  } catch (e) {
    alert(e.message);
    return;
  }
  const r = state.entradas.find((x) => x.id === id);
  if (!r) return;
  if (!confirm(`Eliminar a entrada de ${r.nome} às ${r.datahora}?`)) return;
  try {
    await deleteEntrada(id);
    state.entradas = state.entradas.filter((x) => x.id !== id);
    render(showPersonPhoto);
  } catch (e) {
    alert("Erro ao eliminar entrada: " + e.message);
  }
}

function exportDatabase() {
  try {
    requireSession();
  } catch (e) {
    alert(e.message);
    return;
  }
  const wb = XLSX.utils.book_new();
  const pessoasSheet = state.pessoas.map((p) => ({
    Nome: p.nome,
    "Função/Categoria": p.funcao,
    "Nº/Referência": p.numero,
    "Código QR": p.codigo,
    Estado: p.ativo ? "Ativo" : "Inativo",
  }));
  const adminsSheet = state.administradores.map((a) => ({
    Nome: a.nome,
    Email: a.email,
    "Tipo de acesso": a.tipo,
    Estado: a.ativo ? "Ativo" : "Inativo",
  }));
  const jornadasSheet = state.jornadas.map((j) => ({
    Jornada: j.jornada,
    Data: j.dataPT,
    Hipódromo: j.hipodromo,
    "Entradas registadas": state.entradas.filter((r) => r.evento === formatEventText(j)).length,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pessoasSheet), "Pessoas");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(adminsSheet), "Administradores");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(jornadasSheet), "Calendário");
  XLSX.writeFile(wb, "base_dados_lptg.xlsx");
}

function exportRecords() {
  try {
    requireSession();
  } catch (e) {
    alert(e.message);
    return;
  }
  const wb = XLSX.utils.book_new();
  const linhas = state.entradas.map((r) => ({
    "Data/Hora": r.datahora,
    "Evento/Jornada": r.evento,
    Nome: r.nome,
    "Função/Categoria": r.funcao,
    "Validado por": r.operador,
    "Código QR": r.codigo,
  }));
  const resumoPorEvento = state.jornadas.map((j) => {
    const entradasEvento = state.entradas.filter((r) => r.evento === formatEventText(j));
    return {
      Jornada: j.jornada,
      Data: j.dataPT,
      Hipódromo: j.hipodromo,
      Entradas: entradasEvento.length,
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Registos");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumoPorEvento), "Resumo por jornada");
  XLSX.writeFile(wb, "registos_entradas_lptg.xlsx");
}

function importDatabase() {
  alert("Importação JSON desactivada. Gere pessoas pela app ou importe CSV no Supabase.");
}

Object.assign(window, {
  login,
  logout,
  toggleMobileMenu,
  closeMobileMenu,
  screen,
  sortPessoas,
  pessoasPrevPage,
  pessoasNextPage,
  addPerson,
  deletePerson,
  toggleStatus,
  validateEntry,
  openQRCamera,
  closeQRCamera,
  showNewQRCode,
  copyNewCode,
  previewCardPhoto,
  showPersonPhoto,
  saveCardPhoto,
  removeCardPhoto,
  viewQRCode,
  closeQRCode,
  copyModalCode,
  copyQRImage,
  downloadQRImage,
  addAdmin,
  toggleAdmin,
  deleteAdmin,
  exportDatabase,
  exportRecords,
  deleteRegisto,
  importDatabase,
  refreshAllFromSupabase,
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshAllFromSupabase();
});
window.addEventListener("focus", refreshAllFromSupabase);

async function init() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      login();
    });
  }

  if (!isConfigured()) {
    document.getElementById("loginError").textContent =
      "Configura public/js/config.js com as credenciais Supabase.";
    checkSessionUi();
    return;
  }
  setupAuthListener();
  await restoreSession();
  checkSessionUi();
  if (state.sessao) {
    try {
      await loadAllData();
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar dados: " + e.message);
    }
  }
  render(showPersonPhoto);
}

init();
