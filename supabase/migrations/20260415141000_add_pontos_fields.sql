DO $$
BEGIN
    ALTER TABLE public.pontos 
    ADD COLUMN IF NOT EXISTS status_validacao TEXT DEFAULT 'dentro_tolerancia',
    ADD COLUMN IF NOT EXISTS data DATE,
    ADD COLUMN IF NOT EXISTS horario TEXT;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pontos_funcionario_id_fkey'
    ) THEN
        ALTER TABLE public.pontos
        ADD CONSTRAINT pontos_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;
    END IF;
END $$;
