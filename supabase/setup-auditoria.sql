-- Registo de atividade (auditoria): login/logout e ações na app
-- Executar no Supabase → SQL Editor (uma vez).

CREATE TABLE IF NOT EXISTS public.auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  datahora timestamptz NOT NULL DEFAULT now(),
  operador_nome text NOT NULL,
  operador_email text NOT NULL,
  acao text NOT NULL,
  detalhe text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auditoria_datahora_idx ON public.auditoria (datahora DESC);

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_insert_auditoria" ON public.auditoria;
DROP POLICY IF EXISTS "admin_select_auditoria" ON public.auditoria;

-- Qualquer staff autenticado pode registar a sua ação
CREATE POLICY "staff_insert_auditoria" ON public.auditoria
  FOR INSERT TO authenticated WITH CHECK (public.is_lptg_staff());

-- Só administradores veem o histórico
CREATE POLICY "admin_select_auditoria" ON public.auditoria
  FOR SELECT TO authenticated USING (public.is_lptg_admin());
