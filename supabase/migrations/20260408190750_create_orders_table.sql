CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  marketplace TEXT NOT NULL,
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_value NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Pendente',
  status TEXT NOT NULL DEFAULT 'Cozinha',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and Gerente can see all, Colaborador sees own" ON public.orders;
CREATE POLICY "Admin and Gerente can see all, Colaborador sees own" ON public.orders
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Gerente')
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Admin and Gerente can insert all, Colaborador inserts own" ON public.orders;
CREATE POLICY "Admin and Gerente can insert all, Colaborador inserts own" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Gerente')
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Admin and Gerente can update all, Colaborador updates own" ON public.orders;
CREATE POLICY "Admin and Gerente can update all, Colaborador updates own" ON public.orders
FOR UPDATE TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Gerente')
  OR user_id = auth.uid()
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Gerente')
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Admin and Gerente can delete all, Colaborador deletes own" ON public.orders;
CREATE POLICY "Admin and Gerente can delete all, Colaborador deletes own" ON public.orders
FOR DELETE TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Gerente')
  OR user_id = auth.uid()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON public.orders;
CREATE TRIGGER update_orders_updated_at_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- Seed data
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.orders (
      order_number, customer_name, customer_phone, customer_address, 
      marketplace, order_date, total_value, payment_status, status, user_id
    ) VALUES 
    ('#1045', 'João Silva', '(11) 98765-4321', 'Rua das Flores, 123 - Apto 42, Centro', 'iFood', NOW() - INTERVAL '12 minutes', 45.9, 'Pago', 'Cozinha', v_user_id),
    ('#1046', 'Maria Oliveira', '(11) 91234-5678', 'Av Paulista, 1000 - Bela Vista', 'Delivery Direto', NOW() - INTERVAL '25 minutes', 112.5, 'Pendente', 'Cozinha', v_user_id),
    ('#1047', 'Carlos Souza', '(11) 99999-8888', 'Rua Augusta, 500 - Consolação', '99Food', NOW() - INTERVAL '45 minutes', 38.0, 'Pago', 'Pedido Pronto', v_user_id),
    ('#1048', 'Ana Clara', '(11) 97777-6666', 'Alameda Santos, 200 - Paraíso', 'Keeta', NOW() - INTERVAL '60 minutes', 89.9, 'Pago', 'Saiu Para Entrega', v_user_id),
    ('#1049', 'Pedro Paulo', '(11) 96666-5555', 'Rua Pamplona, 300 - Jd Paulista', 'iFood', NOW() - INTERVAL '120 minutes', 65.4, 'Pago', 'Entregue', v_user_id),
    ('#1050', 'Juliana Costa', '(11) 95555-4444', 'Rua Oscar Freire, 1500 - Pinheiros', 'Delivery Direto', NOW() - INTERVAL '5 minutes', 150.0, 'Pago', 'Cozinha', v_user_id);
  END IF;
END $$;
