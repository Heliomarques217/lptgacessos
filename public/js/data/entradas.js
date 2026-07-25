import { supabase } from "../supabase.js";
import { mapEntrada } from "./mappers.js";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfTomorrowIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export async function fetchEntradasStats() {
  const [totalRes, hojeRes] = await Promise.all([
    supabase.from("entradas").select("*", { count: "exact", head: true }),
    supabase
      .from("entradas")
      .select("*", { count: "exact", head: true })
      .gte("datahora", startOfTodayIso())
      .lt("datahora", startOfTomorrowIso()),
  ]);
  if (totalRes.error) throw totalRes.error;
  if (hojeRes.error) throw hojeRes.error;
  return {
    total: totalRes.count || 0,
    hoje: hojeRes.count || 0,
  };
}

export async function fetchEntradas() {
  const { data, error } = await supabase
    .from("entradas")
    .select("*")
    .order("datahora", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEntrada);
}

export async function insertEntrada(payload) {
  const { data, error } = await supabase.from("entradas").insert(payload).select("*").single();
  if (error) throw error;
  return mapEntrada(data);
}

export async function deleteEntrada(id) {
  const { error } = await supabase.from("entradas").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllEntradas() {
  const { error } = await supabase.from("entradas").delete().not("id", "is", null);
  if (error) throw error;
}

export async function findEntrada(evento, codigo) {
  const { data, error } = await supabase
    .from("entradas")
    .select("*")
    .eq("evento", evento)
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) throw error;
  return data;
}
