import { supabase } from "../supabase.js";
import { state } from "../state.js";
import { isAdmin } from "../features/guards.js";

export async function fetchAuditoria(limit = 500) {
  const { data, error } = await supabase
    .from("auditoria")
    .select("id, datahora, operador_nome, operador_email, acao, detalhe")
    .order("datahora", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    datahora: formatAuditoriaDatahora(row.datahora),
    operador: row.operador_nome,
    email: row.operador_email,
    acao: row.acao,
    detalhe: row.detalhe || "—",
  }));
}

function formatAuditoriaDatahora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export async function insertAuditoria(acao, detalhe) {
  if (!state.sessao) return;
  const row = {
    operador_nome: state.sessao.nome,
    operador_email: state.sessao.email,
    acao,
    detalhe: detalhe || null,
  };
  const { error } = await supabase.from("auditoria").insert(row);
  if (error) throw error;
}

export function logAtividade(acao, detalhe) {
  insertAuditoria(acao, detalhe)
    .then(() => {
      if (!isAdmin()) return;
      state.auditoria.unshift({
        id: "",
        datahora: formatAuditoriaDatahora(new Date().toISOString()),
        operador: state.sessao.nome,
        email: state.sessao.email,
        acao,
        detalhe: detalhe || "—",
      });
      if (state.auditoria.length > 500) state.auditoria.length = 500;
    })
    .catch((e) => console.warn("Auditoria:", e.message || e));
}

export const ACAO_LABELS = {
  sessao_entrada: "Entrada na app",
  sessao_saida: "Saída da app",
  pessoa_criada: "Pessoa adicionada",
  pessoa_apagada: "Pessoa apagada",
  pessoa_funcao: "Função alterada",
  pessoa_estado: "Estado do cartão",
  cartao_novo: "Novo cartão",
  entrada_validada: "Entrada validada",
  entrada_apagada: "Entrada eliminada",
  admin_criado: "Acesso criado",
  admin_apagado: "Acesso apagado",
  admin_estado: "Estado de acesso",
};

export function labelAcao(acao) {
  return ACAO_LABELS[acao] || acao;
}
