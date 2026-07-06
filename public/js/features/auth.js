import { supabase } from "../supabase.js";
import { state } from "../state.js";
import { clearSensitiveState } from "./guards.js";
import { fetchAdministradorByEmail } from "../data/administradores.js";

let loginInProgress = false;

function setLoginInProgress(value) {
  loginInProgress = value;
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function authErrorMessage(error) {
  const code = error?.code || "";
  const msg = error?.message || "";
  if (code === "invalid_credentials" || msg.includes("Invalid login credentials")) {
    return (
      "Email ou senha incorrectos. O utilizador tem de existir em Supabase → Authentication → Users " +
      "(não basta a tabela administradores). Pede ao admin para criar o acesso ou repor a senha."
    );
  }
  if (code === "email_not_confirmed" || msg.includes("Email not confirmed")) {
    return (
      "Email ainda não confirmado. No Supabase → Authentication → Users, abre o utilizador e confirma o email, " +
      "ou abre o link de confirmação enviado para a caixa de correio."
    );
  }
  return msg || "Não foi possível entrar.";
}

export async function login(email, password) {
  setLoginInProgress(true);
  try {
    const { error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      20000,
      "O servidor demorou demasiado a responder. Verifica a ligação à internet e tenta outra vez."
    );
    if (error) throw new Error(authErrorMessage(error));
    const admin = await withTimeout(
      fetchAdministradorByEmail(email.trim().toLowerCase()),
      15000,
      "Não foi possível verificar o acesso na tabela administradores. Confirma o SQL do Passo 1."
    );
    if (!admin) {
      await supabase.auth.signOut();
      throw new Error(
        "Este utilizador não tem acesso ativo na tabela administradores (email igual e ativo = true)."
      );
    }
    state.sessao = {
      email: admin.email,
      nome: admin.nome,
      tipo: admin.tipo,
      data: new Date().toISOString(),
    };
    return state.sessao;
  } finally {
    setLoginInProgress(false);
  }
}

export async function logout() {
  await supabase.auth.signOut();
  state.sessao = null;
  clearSensitiveState();
}

async function onAuthStateChangeHandler(event, session, onSessionChange) {
  if (event === "SIGNED_OUT" || !session) {
    state.sessao = null;
    clearSensitiveState();
    checkSessionUi();
    if (onSessionChange) onSessionChange();
    return;
  }
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    if (loginInProgress) return;
    const admin = await fetchAdministradorByEmail(session.user.email);
    if (!admin) {
      await supabase.auth.signOut();
      state.sessao = null;
      clearSensitiveState();
    } else {
      state.sessao = {
        email: admin.email,
        nome: admin.nome,
        tipo: admin.tipo,
        data: new Date().toISOString(),
      };
    }
    checkSessionUi();
    if (onSessionChange) onSessionChange();
  }
}

export function setupAuthListener(onSessionChange) {
  supabase.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      void onAuthStateChangeHandler(event, session, onSessionChange);
    }, 0);
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
