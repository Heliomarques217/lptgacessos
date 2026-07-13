-- Funções / categorias de pessoas (dropdown "Novo registo")
-- Executar no Supabase → SQL Editor (uma vez).

CREATE TABLE IF NOT EXISTS public.funcoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.funcoes (nome, ordem) VALUES
  ('Presidente Direção', 1),
  ('Vice-Presidente', 2),
  ('Secretário/a', 3),
  ('Segundo secretário', 4),
  ('Tesoureiro/a', 5),
  ('Staff', 6),
  ('Veterinário/a', 7),
  ('Jockey/Driver', 8),
  ('Proprietário/a', 9),
  ('Treinador/a', 10),
  ('Sócio/a', 11),
  ('Jockey/Driver / Proprietário/a', 12),
  ('Jockey/Driver / Treinador/a', 13),
  ('Proprietário/a / Treinador/a', 14),
  ('Jockey/Driver / Proprietário/a / Treinador/a', 15)
ON CONFLICT (nome) DO NOTHING;

ALTER TABLE public.funcoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_select_funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "admin_insert_funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "admin_update_funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "admin_delete_funcoes" ON public.funcoes;

CREATE POLICY "staff_select_funcoes" ON public.funcoes
  FOR SELECT TO authenticated USING (public.is_lptg_staff() AND ativo = true);

CREATE POLICY "admin_insert_funcoes" ON public.funcoes
  FOR INSERT TO authenticated WITH CHECK (public.is_lptg_admin());

CREATE POLICY "admin_update_funcoes" ON public.funcoes
  FOR UPDATE TO authenticated USING (public.is_lptg_admin()) WITH CHECK (public.is_lptg_admin());

CREATE POLICY "admin_delete_funcoes" ON public.funcoes
  FOR DELETE TO authenticated USING (public.is_lptg_admin());
