import { supabase } from "../supabase.js";
import { mapJornada } from "./mappers.js";

export async function fetchJornadas() {
  const { data, error } = await supabase
    .from("jornadas")
    .select("*")
    .order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapJornada);
}
