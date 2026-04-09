-- Fix RLS for funcionarios
DROP POLICY IF EXISTS "authenticated_select_funcionarios" ON public.funcionarios;
CREATE POLICY "authenticated_select_funcionarios" ON public.funcionarios
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_funcionarios" ON public.funcionarios;
CREATE POLICY "authenticated_update_funcionarios" ON public.funcionarios
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_insert_funcionarios" ON public.funcionarios;
CREATE POLICY "authenticated_insert_funcionarios" ON public.funcionarios
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_funcionarios" ON public.funcionarios;
CREATE POLICY "authenticated_delete_funcionarios" ON public.funcionarios
  FOR DELETE TO authenticated USING (true);

-- Fix RLS for pontos
DROP POLICY IF EXISTS "authenticated_select_pontos" ON public.pontos;
CREATE POLICY "authenticated_select_pontos" ON public.pontos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_pontos" ON public.pontos;
CREATE POLICY "authenticated_insert_pontos" ON public.pontos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_pontos" ON public.pontos;
CREATE POLICY "authenticated_update_pontos" ON public.pontos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_pontos" ON public.pontos;
CREATE POLICY "authenticated_delete_pontos" ON public.pontos
  FOR DELETE TO authenticated USING (true);
