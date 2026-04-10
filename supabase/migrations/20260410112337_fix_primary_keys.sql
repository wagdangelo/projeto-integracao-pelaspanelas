DO $$
BEGIN
    -- Fix 'funcionarios' table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funcionarios'
    ) THEN
        -- Generate valid UUIDs for missing or invalid IDs
        UPDATE public.funcionarios 
        SET id = gen_random_uuid()::text 
        WHERE id IS NULL OR id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

        -- Alter column to UUID
        ALTER TABLE public.funcionarios ALTER COLUMN id TYPE UUID USING id::UUID;
        
        -- Set NOT NULL and DEFAULT
        ALTER TABLE public.funcionarios ALTER COLUMN id SET NOT NULL;
        ALTER TABLE public.funcionarios ALTER COLUMN id SET DEFAULT gen_random_uuid();
        
        -- Add PRIMARY KEY if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' AND table_name = 'funcionarios' AND constraint_type = 'PRIMARY KEY'
        ) THEN
            -- Deduplicate just in case to avoid Primary Key violation
            DELETE FROM public.funcionarios a USING (
                SELECT MIN(ctid) as ctid, id
                FROM public.funcionarios 
                GROUP BY id HAVING COUNT(*) > 1
            ) b
            WHERE a.id = b.id AND a.ctid <> b.ctid;

            ALTER TABLE public.funcionarios ADD PRIMARY KEY (id);
        END IF;
    END IF;

    -- Fix 'pontos' table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pontos'
    ) THEN
        -- Generate valid UUIDs for missing or invalid IDs
        UPDATE public.pontos 
        SET id = gen_random_uuid()::text 
        WHERE id IS NULL OR id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

        -- Alter column to UUID
        ALTER TABLE public.pontos ALTER COLUMN id TYPE UUID USING id::UUID;
        
        -- Set NOT NULL and DEFAULT
        ALTER TABLE public.pontos ALTER COLUMN id SET NOT NULL;
        ALTER TABLE public.pontos ALTER COLUMN id SET DEFAULT gen_random_uuid();
        
        -- Add PRIMARY KEY if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' AND table_name = 'pontos' AND constraint_type = 'PRIMARY KEY'
        ) THEN
            -- Deduplicate just in case to avoid Primary Key violation
            DELETE FROM public.pontos a USING (
                SELECT MIN(ctid) as ctid, id
                FROM public.pontos 
                GROUP BY id HAVING COUNT(*) > 1
            ) b
            WHERE a.id = b.id AND a.ctid <> b.ctid;

            ALTER TABLE public.pontos ADD PRIMARY KEY (id);
        END IF;

        -- Clean invalid funcionario_id
        UPDATE public.pontos 
        SET funcionario_id = NULL 
        WHERE funcionario_id IS NOT NULL AND funcionario_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

        -- Alter column to UUID for foreign key preparation
        ALTER TABLE public.pontos ALTER COLUMN funcionario_id TYPE UUID USING funcionario_id::UUID;
    END IF;
END $$;
