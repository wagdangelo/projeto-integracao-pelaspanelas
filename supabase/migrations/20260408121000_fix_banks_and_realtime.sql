-- Adiciona a coluna current_balance à tabela banks
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0;

-- Adiciona as tabelas ao publication do Supabase Realtime para que as atualizações funcionem
DO $DO$
DECLARE
  t text;
BEGIN
  -- Cria o publication supabase_realtime caso não exista
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Adiciona todas as tabelas do schema public ao realtime de forma segura
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $DO$;
