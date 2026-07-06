-- LPTG Access — Row Level Security
-- Executar no Supabase → SQL Editor (uma vez).
-- Bloqueia leitura/escrita anónima; só staff autenticado na tabela administradores.

-- Funções auxiliares (SECURITY DEFINER = não dependem das policies das tabelas)
CREATE OR REPLACE FUNCTION public.is_lptg_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.administradores a
    WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND a.ativo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_lptg_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.administradores a
    WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND a.ativo = true
      AND lower(coalesce(a.tipo, '')) LIKE '%administrador%'
  );
$$;

REVOKE ALL ON FUNCTION public.is_lptg_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_lptg_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_lptg_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lptg_admin() TO authenticated;

-- Ativar RLS
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jornadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas (re-execução segura)
DROP POLICY IF EXISTS "staff_select_pessoas" ON public.pessoas;
DROP POLICY IF EXISTS "staff_insert_pessoas" ON public.pessoas;
DROP POLICY IF EXISTS "staff_update_pessoas" ON public.pessoas;
DROP POLICY IF EXISTS "staff_delete_pessoas" ON public.pessoas;

DROP POLICY IF EXISTS "staff_select_jornadas" ON public.jornadas;
DROP POLICY IF EXISTS "staff_insert_jornadas" ON public.jornadas;
DROP POLICY IF EXISTS "staff_update_jornadas" ON public.jornadas;
DROP POLICY IF EXISTS "staff_delete_jornadas" ON public.jornadas;

DROP POLICY IF EXISTS "staff_select_entradas" ON public.entradas;
DROP POLICY IF EXISTS "staff_insert_entradas" ON public.entradas;
DROP POLICY IF EXISTS "staff_delete_entradas" ON public.entradas;

DROP POLICY IF EXISTS "staff_select_administradores" ON public.administradores;
DROP POLICY IF EXISTS "admin_insert_administradores" ON public.administradores;
DROP POLICY IF EXISTS "admin_update_administradores" ON public.administradores;
DROP POLICY IF EXISTS "admin_delete_administradores" ON public.administradores;

-- Pessoas: staff autenticado
CREATE POLICY "staff_select_pessoas" ON public.pessoas
  FOR SELECT TO authenticated USING (public.is_lptg_staff());
CREATE POLICY "staff_insert_pessoas" ON public.pessoas
  FOR INSERT TO authenticated WITH CHECK (public.is_lptg_staff());
CREATE POLICY "staff_update_pessoas" ON public.pessoas
  FOR UPDATE TO authenticated USING (public.is_lptg_staff()) WITH CHECK (public.is_lptg_staff());
CREATE POLICY "staff_delete_pessoas" ON public.pessoas
  FOR DELETE TO authenticated USING (public.is_lptg_staff());

-- Jornadas: leitura para staff; escrita só administradores
CREATE POLICY "staff_select_jornadas" ON public.jornadas
  FOR SELECT TO authenticated USING (public.is_lptg_staff());
CREATE POLICY "staff_insert_jornadas" ON public.jornadas
  FOR INSERT TO authenticated WITH CHECK (public.is_lptg_admin());
CREATE POLICY "staff_update_jornadas" ON public.jornadas
  FOR UPDATE TO authenticated USING (public.is_lptg_admin()) WITH CHECK (public.is_lptg_admin());
CREATE POLICY "staff_delete_jornadas" ON public.jornadas
  FOR DELETE TO authenticated USING (public.is_lptg_admin());

-- Entradas (registos): staff pode ler, inserir e apagar
CREATE POLICY "staff_select_entradas" ON public.entradas
  FOR SELECT TO authenticated USING (public.is_lptg_staff());
CREATE POLICY "staff_insert_entradas" ON public.entradas
  FOR INSERT TO authenticated WITH CHECK (public.is_lptg_staff());
CREATE POLICY "staff_delete_entradas" ON public.entradas
  FOR DELETE TO authenticated USING (public.is_lptg_staff());

-- Administradores: leitura para staff; alterações só administradores
CREATE POLICY "staff_select_administradores" ON public.administradores
  FOR SELECT TO authenticated USING (public.is_lptg_staff());
CREATE POLICY "admin_insert_administradores" ON public.administradores
  FOR INSERT TO authenticated WITH CHECK (public.is_lptg_admin());
CREATE POLICY "admin_update_administradores" ON public.administradores
  FOR UPDATE TO authenticated USING (public.is_lptg_admin()) WITH CHECK (public.is_lptg_admin());
CREATE POLICY "admin_delete_administradores" ON public.administradores
  FOR DELETE TO authenticated USING (public.is_lptg_admin());

-- Índice anti-duplo check-in (recomendado)
CREATE UNIQUE INDEX IF NOT EXISTS entradas_evento_codigo_unique
  ON public.entradas (evento, codigo);
