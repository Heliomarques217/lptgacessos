import { supabase } from "../supabase.js";

export const FUNCOES_PADRAO = [
  "Presidente Direção",
  "Vice-Presidente",
  "Secretário/a",
  "Tesoureiro/a",
  "Staff",
  "Veterinário/a",
  "Jockey/Driver",
  "Proprietário/a",
  "Treinador/a",
  "Sócio/a",
  "Jockey/Driver / Proprietário/a",
  "Jockey/Driver / Treinador/a",
  "Proprietário/a / Treinador/a",
  "Jockey/Driver / Proprietário/a / Treinador/a",
];

export async function fetchFuncoes() {
  const { data, error } = await supabase
    .from("funcoes")
    .select("nome, ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => row.nome);
}

export async function ensureFuncoes() {
  try {
    const list = await fetchFuncoes();
    if (list.length) return list;
  } catch (e) {
    console.warn("Não foi possível ler funções do Supabase:", e);
  }
  return [...FUNCOES_PADRAO];
}
