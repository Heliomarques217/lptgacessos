-- Adicionar função "Fotógrafo Oficial" em bases já existentes (executar uma vez no SQL Editor)
INSERT INTO public.funcoes (nome, ordem) VALUES ('Fotógrafo Oficial', 7) ON CONFLICT (nome) DO NOTHING;
UPDATE public.funcoes SET ordem = ordem + 1 WHERE ordem >= 7 AND nome <> 'Fotógrafo Oficial';
