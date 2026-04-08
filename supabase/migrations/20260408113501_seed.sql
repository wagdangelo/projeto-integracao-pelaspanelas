DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed Admin User (idempotent: skip if email already exists)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'wagner@pelaspanelas.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'wagner@pelaspanelas.com.br',
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin Wagner"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, role)
    VALUES (new_user_id, 'wagner@pelaspanelas.com.br', 'Admin Wagner', 'Admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Seed initial Payment Methods
  INSERT INTO public.payment_methods (name) VALUES
    ('PIX'),
    ('Cartão de Crédito'),
    ('Boleto'),
    ('Dinheiro')
  ON CONFLICT DO NOTHING;

  -- Seed initial Chart of Accounts categories
  INSERT INTO public.chart_of_accounts (code, name, type, "group") VALUES
    ('1.1', 'Vendas de Produtos', 'Receita', 'Operacional'),
    ('1.2', 'Prestação de Serviços', 'Receita', 'Operacional'),
    ('2.1', 'Fornecedores', 'Despesa', 'Operacional'),
    ('2.2', 'Salários', 'Despesa', 'Pessoas'),
    ('2.3', 'Impostos', 'Despesa', 'Impostos')
  ON CONFLICT DO NOTHING;

END $$;
