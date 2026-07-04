import { supabase } from "../supabase.js";
import { state } from "../state.js";
import { fetchAdministradorByEmail } from "../data/administradores.js";

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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(authErrorMessage(error));
  const admin = await fetchAdministradorByEmail(email.trim().toLowerCase());
  if (!admin) {
    await supabase.auth.signOut();
    throw new Error("Este utilizador não tem acesso ativo na tabela administradores.");
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
  if (!gate) return;
  if (state.sessao) {
    gate.classList.add("hide");
    const op = document.getElementById("operador");
    if (op) op.value = state.sessao.nome;
  } else {
    gate.classList.remove("hide");
  }
}
