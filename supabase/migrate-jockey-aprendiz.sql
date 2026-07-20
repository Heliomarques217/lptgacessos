-- Adicionar função "Jockey Aprendiz" em bases já existentes (executar uma vez no SQL Editor)
INSERT INTO public.funcoes (nome, ordem) VALUES ('Jockey Aprendiz', 9) ON CONFLICT (nome) DO NOTHING;
UPDATE public.funcoes SET ordem = ordem + 1 WHERE ordem >= 9 AND nome <> 'Jockey Aprendiz';
