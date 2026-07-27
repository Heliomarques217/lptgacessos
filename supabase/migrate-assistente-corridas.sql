-- Adicionar função "Assistente de Corridas" em bases já existentes (executar uma vez no SQL Editor)
INSERT INTO public.funcoes (nome, ordem) VALUES ('Assistente de Corridas', 7) ON CONFLICT (nome) DO NOTHING;
UPDATE public.funcoes SET ordem = ordem + 1 WHERE ordem >= 7 AND nome <> 'Assistente de Corridas';
