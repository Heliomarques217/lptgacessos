import { state } from "../state.js";

export function clearSensitiveState() {
  state.pessoas = [];
  state.entradas = [];
  state.administradores = [];
  state.auditoria = [];
  state.auditoriaError = null;
  state.fotoTemporaria = null;
  state.qrPessoaAtual = null;
}

export function isAdmin() {
  const tipo = (state.sessao?.tipo || "").toLowerCase();
  return tipo.includes("administrador");
}

export function requireSession() {
  if (!state.sessao) {
    throw new Error("Sessão expirada ou inexistente. Inicia sessão novamente.");
  }
}

export function requireAdmin(action = "executar esta ação") {
  requireSession();
  if (!isAdmin()) {
    throw new Error(`Apenas administradores podem ${action}.`);
  }
}
