import { supabase } from "../supabase.js";
import { mapEntrada } from "./mappers.js";

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
  return data;
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
