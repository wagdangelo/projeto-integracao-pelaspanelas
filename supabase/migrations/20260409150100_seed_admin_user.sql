DO $$
DECLARE
  new_user_id uuid;
BEGIN
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
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.funcionarios (id, email, nome, role)
    VALUES (new_user_id::text, 'wagner@pelaspanelas.com.br', 'Admin Wagner', 'Admin')
    ON CONFLICT DO NOTHING;
  ELSE
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'wagner@pelaspanelas.com.br';
    
    IF NOT EXISTS (SELECT 1 FROM public.funcionarios WHERE email = 'wagner@pelaspanelas.com.br') THEN
      INSERT INTO public.funcionarios (id, email, nome, role)
      VALUES (new_user_id::text, 'wagner@pelaspanelas.com.br', 'Admin Wagner', 'Admin')
      ON CONFLICT DO NOTHING;
    ELSE
      UPDATE public.funcionarios SET role = 'Admin' WHERE email = 'wagner@pelaspanelas.com.br';
    END IF;
  END IF;
END $$;
