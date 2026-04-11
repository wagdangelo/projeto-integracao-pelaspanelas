CREATE OR REPLACE FUNCTION public.recalculate_bank_balance_func()
RETURNS trigger AS $$
DECLARE
  v_bank_id uuid;
  v_initial numeric;
  v_entradas numeric;
  v_saidas numeric;
  v_new_balance numeric;
BEGIN
  -- Identify the bank_id for the current operation
  IF TG_OP = 'DELETE' THEN
    v_bank_id := OLD.bank;
  ELSE
    v_bank_id := NEW.bank;
  END IF;

  IF v_bank_id IS NOT NULL THEN
    SELECT initial_balance INTO v_initial FROM public.banks WHERE id = v_bank_id;
    
    SELECT COALESCE(SUM(value), 0) INTO v_entradas 
    FROM public.transactions 
    WHERE bank = v_bank_id AND lower(type) = 'entrada' AND lower(status) = 'liquidado';
    
    SELECT COALESCE(SUM(ABS(value)), 0) INTO v_saidas 
    FROM public.transactions 
    WHERE bank = v_bank_id AND lower(type) IN ('saída', 'saida') AND lower(status) = 'liquidado';
    
    v_new_balance := COALESCE(v_initial, 0) + v_entradas - v_saidas;
    
    UPDATE public.banks SET current_balance = v_new_balance WHERE id = v_bank_id;
  END IF;

  -- If it's an UPDATE and the bank changed, we also need to recalculate the old bank
  IF TG_OP = 'UPDATE' AND OLD.bank IS DISTINCT FROM NEW.bank AND OLD.bank IS NOT NULL THEN
    SELECT initial_balance INTO v_initial FROM public.banks WHERE id = OLD.bank;
    
    SELECT COALESCE(SUM(value), 0) INTO v_entradas 
    FROM public.transactions 
    WHERE bank = OLD.bank AND lower(type) = 'entrada' AND lower(status) = 'liquidado';
    
    SELECT COALESCE(SUM(ABS(value)), 0) INTO v_saidas 
    FROM public.transactions 
    WHERE bank = OLD.bank AND lower(type) IN ('saída', 'saida') AND lower(status) = 'liquidado';
    
    v_new_balance := COALESCE(v_initial, 0) + v_entradas - v_saidas;
    
    UPDATE public.banks SET current_balance = v_new_balance WHERE id = OLD.bank;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_bank_balance_trigger ON public.transactions;

CREATE TRIGGER update_bank_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.recalculate_bank_balance_func();
