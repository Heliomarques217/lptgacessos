-- Jornadas anuladas: campo boolean + marcar Jornada 11 (Rio Frio)
-- Correr no Supabase → SQL Editor (como administrador)

ALTER TABLE public.jornadas
  ADD COLUMN IF NOT EXISTS anulada boolean NOT NULL DEFAULT false;

UPDATE public.jornadas
SET anulada = true
WHERE jornada = 'Jornada 11'
  AND hipodromo ILIKE '%Rio Frio%';

-- Verificar
-- SELECT jornada, data, data_pt, hipodromo, anulada FROM public.jornadas ORDER BY ordem;
