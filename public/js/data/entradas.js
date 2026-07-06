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
  return mapEntrada(data);
}

export async function deleteEntrada(id) {
  const { error } = await supabase.from("entradas").delete().eq("id", id);
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
