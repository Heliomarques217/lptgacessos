import { supabase } from "../supabase.js";
import { state } from "../state.js";
import { clearSensitiveState } from "./guards.js";
import { fetchAdministradorByEmail } from "../data/administradores.js";

function authErrorMessage(error) {
  const code = error?.code || "";
  const msg = error?.message || "";
  if (code === "invalid_credentials" || msg.includes("Invalid login credentials")) {
    return "Email ou senha incorrectos.";
  }
  if (code === "email_not_confirmed" || msg.includes("Email not confirmed")) {
    return "Email ainda não confirmado no Supabase Auth.";
  }
  return msg || "Não foi possível entrar.";
}

export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(authErrorMessage(error));

  const admin = await fetchAdministradorByEmail(email.trim().toLowerCase());
  if (!admin) {
    await supabase.auth.signOut();
    throw new Error("Este email não está activo na tabela administradores.");
  }

  state.sessao = {
    email: admin.email,
    nome: admin.nome,
    tipo: admin.tipo,
    data: new Date().toISOString(),
  };
  return state.sessao;
}

export async function logout() {
  await supabase.auth.signOut();
  state.sessao = null;
  clearSensitiveState();
}

export function setupAuthListener() {
  supabase.auth.onAuthStateChange((event) => {
    if (event !== "SIGNED_OUT") return;
    state.sessao = null;
    clearSensitiveState();
    checkSessionUi();
  });
}

export async function restoreSession() {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.user?.email) {
    state.sessao = null;
    return null;
  }
  const admin = await fetchAdministradorByEmail(session.user.email);
  if (!admin) {
    await supabase.auth.signOut();
    state.sessao = null;
    return null;
  }
  state.sessao = {
    email: admin.email,
    nome: admin.nome,
    tipo: admin.tipo,
    data: new Date().toISOString(),
  };
  return state.sessao;
}

export function checkSessionUi() {
  const gate = document.getElementById("loginGate");
  const shell = document.getElementById("appShell");
  if (!gate) return;
  if (state.sessao) {
    gate.classList.add("hide");
    if (shell) shell.hidden = false;
    const op = document.getElementById("operador");
    if (op) op.value = state.sessao.nome;
  } else {
    gate.classList.remove("hide");
    if (shell) shell.hidden = true;
  }
  document.querySelectorAll("[data-admin-only]").forEach((el) => {
    const tipo = (state.sessao?.tipo || "").toLowerCase();
    const show = state.sessao && tipo.includes("administrador");
    el.hidden = !show;
  });
}
