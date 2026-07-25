-- Remove duplicados de "Segundo secretário" (executar uma vez no SQL Editor)
-- Mantém a entrada com menor ordem e unifica pessoas para o nome canónico.

UPDATE public.pessoas
SET funcao = 'Segundo secretário'
WHERE lower(trim(funcao)) = lower('Segundo secretário')
  AND funcao <> 'Segundo secretário';

DELETE FROM public.funcoes dup
USING public.funcoes keep
WHERE lower(trim(dup.nome)) = lower(trim(keep.nome))
  AND lower(trim(dup.nome)) = lower('Segundo secretário')
  AND dup.id <> keep.id
  AND keep.ordem = (
    SELECT MIN(ordem)
    FROM public.funcoes
    WHERE lower(trim(nome)) = lower('Segundo secretário')
  );
