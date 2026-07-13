import { supabase } from "../supabase.js";
import { mapPessoa } from "./mappers.js";

export async function fetchPessoas() {
  const { data, error } = await supabase
    .from("pessoas")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapPessoa);
}

export async function insertPessoa(pessoa) {
  const row = {
    nome: pessoa.nome,
    funcao: pessoa.funcao,
    numero: pessoa.numero,
    codigo: pessoa.codigo,
    ativo: pessoa.ativo ?? true,
  };
  if (pessoa.fotoCartao) row.foto_cartao = pessoa.fotoCartao;
  const { data, error } = await supabase.from("pessoas").insert(row).select("*").single();
  if (error) throw error;
  return mapPessoa(data);
}

export async function updatePessoa(id, patch) {
  const row = {};
  if (patch.ativo !== undefined) row.ativo = patch.ativo;
  if (patch.funcao !== undefined) row.funcao = patch.funcao;
  if (patch.fotoCartao !== undefined) row.foto_cartao = patch.fotoCartao || null;
  const { data, error } = await supabase.from("pessoas").update(row).eq("id", id).select("*").single();
  if (error) throw error;
  return mapPessoa(data);
}

export async function deletePessoa(id) {
  const { error } = await supabase.from("pessoas").delete().eq("id", id);
  if (error) throw error;
}
