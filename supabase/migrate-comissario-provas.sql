-- Função "Comissário de Provas" (executar uma vez no SQL Editor)

UPDATE public.pessoas
SET funcao = 'Comissário de Provas'
WHERE funcao = 'Comissário de Corridas';

UPDATE public.funcoes
SET nome = 'Comissário de Provas'
WHERE nome = 'Comissário de Corridas';

INSERT INTO public.funcoes (nome, ordem) VALUES ('Comissário de Provas', 8) ON CONFLICT (nome) DO NOTHING;
UPDATE public.funcoes SET ordem = ordem + 1 WHERE ordem >= 8 AND nome <> 'Comissário de Provas';
