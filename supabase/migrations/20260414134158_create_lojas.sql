CREATE TABLE IF NOT EXISTS public.lojas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_fantasia TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    razao_social TEXT,
    telefone TEXT,
    endereco_cep TEXT,
    endereco_rua TEXT,
    endereco_numero TEXT,
    endereco_complemento TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_estado TEXT,
    plataforma TEXT,
    codigo_integracao TEXT,
    senha_integracao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable ALL for authenticated users on lojas" ON public.lojas;
CREATE POLICY "Enable ALL for authenticated users on lojas"
  ON public.lojas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
