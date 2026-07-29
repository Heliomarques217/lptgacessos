-- Adicionar função "Comissário de Provas" em bases já existentes (executar uma vez no SQL Editor)
INSERT INTO public.funcoes (nome, ordem) VALUES ('Comissário de Provas', 8) ON CONFLICT (nome) DO NOTHING;
UPDATE public.funcoes SET ordem = ordem + 1 WHERE ordem >= 8 AND nome <> 'Comissário de Provas';
