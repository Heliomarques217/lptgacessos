import { supabase } from "../supabase.js";
import { mapAdministrador } from "./mappers.js";

export async function fetchAdministradores() {
  const { data, error } = await supabase
    .from("administradores")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapAdministrador);
}

export async function fetchAdministradorByEmail(email) {
  const { data, error } = await supabase
    .from("administradores")
    .select("*")
    .ilike("email", email)
    .eq("ativo", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdministrador(data) : null;
}

export async function updateAdministrador(id, patch) {
  const { data, error } = await supabase
    .from("administradores")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapAdministrador(data);
}

export async function deleteAdministrador(id) {
  const { error } = await supabase.from("administradores").delete().eq("id", id);
  if (error) throw error;
}
