import { supabase } from "../supabase.js";
import { mapJornada } from "./mappers.js";
import { CALENDARIO_LPTG_2026 } from "./calendario2026.js";

function mapSeedJornada(j) {
  return {
    id: String(j.ordem),
    jornada: j.jornada,
    data: j.data,
    dataPT: j.dataPT,
    hipodromo: j.hipodromo,
    ordem: j.ordem,
  };
}

export function getCalendarioLocal() {
  return CALENDARIO_LPTG_2026.map(mapSeedJornada);
}

function mergeWithCalendarioLocal(existing) {
  const merged = new Map(getCalendarioLocal().map((j) => [j.jornada, j]));
  for (const j of existing) merged.set(j.jornada, j);
  return [...merged.values()].sort((a, b) => a.data.localeCompare(b.data));
}

export async function fetchJornadas() {
  const { data, error } = await supabase
    .from("jornadas")
    .select("*")
    .order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapJornada);
}

export async function ensureCalendarioOficial() {
  let existing = [];

  try {
    existing = await fetchJornadas();
  } catch (e) {
    console.warn("Não foi possível ler jornadas do Supabase:", e);
    return getCalendarioLocal();
  }

  const known = new Set(existing.map((j) => j.jornada));
  const missing = CALENDARIO_LPTG_2026.filter((j) => !known.has(j.jornada));
  if (!missing.length) return mergeWithCalendarioLocal(existing);

  const rows = missing.map((j) => ({
    jornada: j.jornada,
    data: j.data,
    data_pt: j.dataPT,
    hipodromo: j.hipodromo,
    ordem: j.ordem,
  }));

  try {
    const { data, error } = await supabase.from("jornadas").insert(rows).select("*");
    if (error) {
      console.warn("Não foi possível gravar jornadas no Supabase:", error.message);
    } else if (data?.length) {
      existing = [...existing, ...data.map(mapJornada)];
    }
  } catch (e) {
    console.warn("Erro ao sincronizar jornadas com Supabase:", e);
  }

  return mergeWithCalendarioLocal(existing);
}
