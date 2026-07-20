-- Corrigir tabela jornadas: chave primária (permite editar no Table Editor)
-- Executar no Supabase → SQL Editor (uma vez).

ALTER TABLE public.jornadas
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

UPDATE public.jornadas SET id = gen_random_uuid() WHERE id IS NULL;

ALTER TABLE public.jornadas ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.jornadas'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.jornadas ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Exemplo: alterar data de uma jornada (ajusta os valores)
-- UPDATE public.jornadas
-- SET data = '2026-07-13', data_pt = '13-07-2026'
-- WHERE jornada = 'Jornada 9';
