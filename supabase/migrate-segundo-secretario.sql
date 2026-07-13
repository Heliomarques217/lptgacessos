-- Adicionar função "Segundo secretário" em bases já existentes (executar uma vez no SQL Editor)
INSERT INTO public.funcoes (nome, ordem) VALUES ('Segundo secretário', 4) ON CONFLICT (nome) DO NOTHING;
UPDATE public.funcoes SET ordem = ordem + 1 WHERE ordem >= 4 AND nome <> 'Segundo secretário';
