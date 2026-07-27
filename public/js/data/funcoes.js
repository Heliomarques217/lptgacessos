import { supabase } from "../supabase.js";

export const FUNCOES_PADRAO = [
  "Presidente Direção",
  "Vice-Presidente",
  "Secretário/a",
  "Segundo secretário",
  "Tesoureiro/a",
  "Staff",
  "Assistente de Corridas",
  "Comissário de Provas",
  "Fotógrafo Oficial",
  "Veterinário/a",
  "Jockey/Driver",
  "Jockey Aprendiz",
  "Proprietário/a",
  "Treinador/a",
  "Sócio/a",
  "Jockey/Driver / Proprietário/a",
  "Jockey/Driver / Treinador/a",
  "Proprietário/a / Treinador/a",
  "Jockey/Driver / Proprietário/a / Treinador/a",
];

function normalizeFuncaoNome(nome) {
  return String(nome || "").trim().toLowerCase();
}

function isSameFuncao(a, b) {
  return normalizeFuncaoNome(a) === normalizeFuncaoNome(b);
}

function isInPadrao(nome) {
  return FUNCOES_PADRAO.some((p) => isSameFuncao(p, nome));
}

export function dedupeFuncoesNomes(names) {
  const seen = new Set();
  const out = [];
  for (const nome of names || []) {
    const key = normalizeFuncaoNome(nome);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const canonical = FUNCOES_PADRAO.find((p) => isSameFuncao(p, nome)) || nome;
    out.push(canonical);
  }
  return out;
}

function mergeWithPadrao(dbNames) {
  const extraInDb = (dbNames || []).filter((n) => !isInPadrao(n));
  return dedupeFuncoesNomes([...FUNCOES_PADRAO, ...extraInDb]);
}

/** Admin: insere na tabela funcoes categorias do código que ainda não existem na BD. */
export async function syncMissingFuncoesFromPadrao() {
  const { data: rows, error } = await supabase.from("funcoes").select("id, nome, ordem");
  if (error) {
    console.warn("Sync funções:", error.message);
    return;
  }
  const have = new Set((rows || []).map((r) => normalizeFuncaoNome(r.nome)));
  const missing = FUNCOES_PADRAO.map((nome, i) => ({ nome, ordem: i + 1 })).filter(
    (x) => !have.has(normalizeFuncaoNome(x.nome))
  );
  if (!missing.length) return;

  for (const { nome, ordem: targetOrdem } of missing) {
    const { data: bumpRows, error: fetchErr } = await supabase
      .from("funcoes")
      .select("id, ordem")
      .gte("ordem", targetOrdem);
    if (fetchErr) {
      console.warn("Sync funções (ler ordem):", fetchErr.message);
      continue;
    }
    for (const row of bumpRows || []) {
      const { error: upErr } = await supabase
        .from("funcoes")
        .update({ ordem: row.ordem + 1 })
        .eq("id", row.id);
      if (upErr) console.warn("Sync funções (ordem):", upErr.message);
    }
    const { error: insErr } = await supabase.from("funcoes").insert({ nome, ordem: targetOrdem });
    if (insErr) console.warn("Sync funções (insert):", insErr.message);
    else have.add(nome);
  }
}

export async function fetchFuncoes() {
  const { data, error } = await supabase
    .from("funcoes")
    .select("nome, ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => row.nome);
}

export async function ensureFuncoes(options = {}) {
  const { syncMissing = false } = options;
  if (syncMissing) {
    await syncMissingFuncoesFromPadrao();
  }
  try {
    const list = await fetchFuncoes();
    if (list.length) return mergeWithPadrao(list);
  } catch (e) {
    console.warn("Não foi possível ler funções do Supabase:", e);
  }
  return dedupeFuncoesNomes([...FUNCOES_PADRAO]);
}
