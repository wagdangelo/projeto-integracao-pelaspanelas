DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'funcionarios_email_key'
  ) THEN
    ALTER TABLE public.funcionarios
    ADD CONSTRAINT funcionarios_email_key UNIQUE (email);
  END IF;
END $$;
