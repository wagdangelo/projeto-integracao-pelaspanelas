// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      banks: {
        Row: {
          account_digit: string | null
          account_number: string | null
          agency: string | null
          bank_code: string | null
          created_at: string | null
          current_balance: number | null
          id: string
          initial_balance: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          account_digit?: string | null
          account_number?: string | null
          agency?: string | null
          bank_code?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          account_digit?: string | null
          account_number?: string | null
          agency?: string | null
          bank_code?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          code: string | null
          created_at: string | null
          group: string
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          group: string
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          group?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          birth_date: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          favorecido_type: string | null
          gender: string | null
          id: string
          name: string
          phone: string | null
          registration_date: string | null
          tax_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          birth_date?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          favorecido_type?: string | null
          gender?: string | null
          id?: string
          name: string
          phone?: string | null
          registration_date?: string | null
          tax_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          birth_date?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          favorecido_type?: string | null
          gender?: string | null
          id?: string
          name?: string
          phone?: string | null
          registration_date?: string | null
          tax_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      entities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      entregas_lojas: {
        Row: {
          created_at: string | null
          data: string
          faturamento: number | null
          id: string
          loja: string
          quantidade: number | null
          turno: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          faturamento?: number | null
          id?: string
          loja: string
          quantidade?: number | null
          turno: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          faturamento?: number | null
          id?: string
          loja?: string
          quantidade?: number | null
          turno?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string | null
          cpf: string | null
          criado_em: string | null
          data_admissao: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          escala_turnos: Json | null
          foto_url: string | null
          id: string | null
          nome: string | null
          role: string | null
          salario: string | null
          telefone: string | null
          turno: string | null
          vale_transporte: string | null
        }
        Insert: {
          cargo?: string | null
          cpf?: string | null
          criado_em?: string | null
          data_admissao?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          escala_turnos?: Json | null
          foto_url?: string | null
          id?: string | null
          nome?: string | null
          role?: string | null
          salario?: string | null
          telefone?: string | null
          turno?: string | null
          vale_transporte?: string | null
        }
        Update: {
          cargo?: string | null
          cpf?: string | null
          criado_em?: string | null
          data_admissao?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          escala_turnos?: Json | null
          foto_url?: string | null
          id?: string | null
          nome?: string | null
          role?: string | null
          salario?: string | null
          telefone?: string | null
          turno?: string | null
          vale_transporte?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          marketplace: string
          order_date: string
          order_number: string
          payment_status: string
          status: string
          total_value: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          marketplace: string
          order_date?: string
          order_number: string
          payment_status?: string
          status?: string
          total_value?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          marketplace?: string
          order_date?: string
          order_number?: string
          payment_status?: string
          status?: string
          total_value?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payees: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pontos: {
        Row: {
          criado_em: string | null
          data_hora: string | null
          foto_url: string | null
          funcionario_id: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          tipo_ponto: string | null
          wifi_conectado: boolean | null
        }
        Insert: {
          criado_em?: string | null
          data_hora?: string | null
          foto_url?: string | null
          funcionario_id?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          tipo_ponto?: string | null
          wifi_conectado?: boolean | null
        }
        Update: {
          criado_em?: string | null
          data_hora?: string | null
          foto_url?: string | null
          funcionario_id?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          tipo_ponto?: string | null
          wifi_conectado?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          bank: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          launch_date: string
          payee: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          account_id?: string | null
          bank?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          launch_date: string
          payee?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          account_id?: string | null
          bank?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          launch_date?: string
          payee?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'chart_of_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_bank_fkey'
            columns: ['bank']
            isOneToOne: false
            referencedRelation: 'banks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_payee_fkey'
            columns: ['payee']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_payment_method_fkey'
            columns: ['payment_method']
            isOneToOne: false
            referencedRelation: 'payment_methods'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: banks
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   account_number: text (nullable)
//   bank_code: text (nullable)
//   agency: text (nullable)
//   account_digit: text (nullable)
//   initial_balance: numeric (nullable, default: 0)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   current_balance: numeric (nullable)
// Table: chart_of_accounts
//   id: uuid (not null, default: gen_random_uuid())
//   code: text (nullable)
//   name: text (not null)
//   type: text (not null)
//   group: text (not null)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: clients
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   type: text (nullable)
//   favorecido_type: text (nullable)
//   created_by: uuid (nullable)
//   tax_id: text (nullable)
//   email: text (nullable)
//   phone: text (nullable)
//   birth_date: text (nullable)
//   gender: text (nullable)
//   address_street: text (nullable)
//   address_number: text (nullable)
//   address_complement: text (nullable)
//   address_city: text (nullable)
//   address_state: text (nullable)
//   address_zip_code: text (nullable)
//   registration_date: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: entities
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   type: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: entregas_lojas
//   id: uuid (not null, default: gen_random_uuid())
//   data: text (not null)
//   turno: text (not null)
//   loja: text (not null)
//   quantidade: numeric (nullable, default: 0)
//   faturamento: numeric (nullable, default: 0)
//   user_id: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: funcionarios
//   id: text (nullable)
//   nome: text (nullable)
//   email: text (nullable)
//   criado_em: timestamp with time zone (nullable)
//   cpf: text (nullable)
//   telefone: text (nullable)
//   endereco: text (nullable)
//   cargo: text (nullable)
//   turno: text (nullable)
//   data_admissao: text (nullable)
//   foto_url: text (nullable)
//   role: text (nullable)
//   data_nascimento: text (nullable)
//   salario: text (nullable)
//   vale_transporte: text (nullable)
//   escala_turnos: jsonb (nullable)
// Table: orders
//   id: uuid (not null, default: gen_random_uuid())
//   order_number: text (not null)
//   customer_name: text (not null)
//   customer_phone: text (nullable)
//   customer_address: text (nullable)
//   marketplace: text (not null)
//   order_date: timestamp with time zone (not null, default: now())
//   total_value: numeric (not null, default: 0)
//   payment_status: text (not null, default: 'Pendente'::text)
//   status: text (not null, default: 'Cozinha'::text)
//   user_id: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: payees
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   type: text (nullable)
//   email: text (nullable)
//   phone: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: payment_methods
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: pontos
//   id: text (nullable)
//   funcionario_id: text (nullable)
//   tipo_ponto: text (nullable)
//   data_hora: timestamp with time zone (nullable)
//   latitude: double precision (nullable)
//   longitude: double precision (nullable)
//   foto_url: text (nullable)
//   wifi_conectado: boolean (nullable)
//   criado_em: timestamp with time zone (nullable)
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   name: text (nullable)
//   role: text (nullable, default: 'User'::text)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: transaction_categories
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   transaction_type: text (not null)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: transactions
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   launch_date: text (not null)
//   description: text (not null)
//   value: numeric (not null)
//   type: text (not null)
//   bank: uuid (nullable)
//   due_date: text (nullable)
//   payment_date: text (nullable)
//   payment_method: uuid (nullable)
//   account_id: uuid (nullable)
//   payee: uuid (nullable)
//   status: text (not null, default: 'Pendente'::text)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())

// --- CONSTRAINTS ---
// Table: banks
//   PRIMARY KEY banks_pkey: PRIMARY KEY (id)
// Table: chart_of_accounts
//   PRIMARY KEY chart_of_accounts_pkey: PRIMARY KEY (id)
// Table: clients
//   FOREIGN KEY clients_created_by_fkey: FOREIGN KEY (created_by) REFERENCES auth.users(id)
//   PRIMARY KEY clients_pkey: PRIMARY KEY (id)
// Table: entities
//   PRIMARY KEY entities_pkey: PRIMARY KEY (id)
// Table: entregas_lojas
//   PRIMARY KEY entregas_lojas_pkey: PRIMARY KEY (id)
//   FOREIGN KEY entregas_lojas_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: funcionarios
//   UNIQUE funcionarios_email_key: UNIQUE (email)
// Table: orders
//   PRIMARY KEY orders_pkey: PRIMARY KEY (id)
//   FOREIGN KEY orders_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: payees
//   PRIMARY KEY payees_pkey: PRIMARY KEY (id)
// Table: payment_methods
//   PRIMARY KEY payment_methods_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: transaction_categories
//   PRIMARY KEY transaction_categories_pkey: PRIMARY KEY (id)
// Table: transactions
//   FOREIGN KEY transactions_account_id_fkey: FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
//   FOREIGN KEY transactions_bank_fkey: FOREIGN KEY (bank) REFERENCES banks(id)
//   FOREIGN KEY transactions_payee_fkey: FOREIGN KEY (payee) REFERENCES clients(id)
//   FOREIGN KEY transactions_payment_method_fkey: FOREIGN KEY (payment_method) REFERENCES payment_methods(id)
//   PRIMARY KEY transactions_pkey: PRIMARY KEY (id)
//   FOREIGN KEY transactions_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: banks
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: chart_of_accounts
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: clients
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: entities
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: entregas_lojas
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: funcionarios
//   Policy "authenticated_delete_funcionarios" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_funcionarios" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_funcionarios" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_funcionarios" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: orders
//   Policy "Admin and Gerente can delete all, Colaborador deletes own" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((( SELECT profiles.role    FROM profiles   WHERE (profiles.id = auth.uid())) = ANY (ARRAY['Admin'::text, 'Gerente'::text])) OR (user_id = auth.uid()))
//   Policy "Admin and Gerente can insert all, Colaborador inserts own" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((( SELECT profiles.role    FROM profiles   WHERE (profiles.id = auth.uid())) = ANY (ARRAY['Admin'::text, 'Gerente'::text])) OR (user_id = auth.uid()))
//   Policy "Admin and Gerente can see all, Colaborador sees own" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((( SELECT profiles.role    FROM profiles   WHERE (profiles.id = auth.uid())) = ANY (ARRAY['Admin'::text, 'Gerente'::text])) OR (user_id = auth.uid()))
//   Policy "Admin and Gerente can update all, Colaborador updates own" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((( SELECT profiles.role    FROM profiles   WHERE (profiles.id = auth.uid())) = ANY (ARRAY['Admin'::text, 'Gerente'::text])) OR (user_id = auth.uid()))
//     WITH CHECK: ((( SELECT profiles.role    FROM profiles   WHERE (profiles.id = auth.uid())) = ANY (ARRAY['Admin'::text, 'Gerente'::text])) OR (user_id = auth.uid()))
// Table: payees
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: payment_methods
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: pontos
//   Policy "authenticated_delete_pontos" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_pontos" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_pontos" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_pontos" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: profiles
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: transaction_categories
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: transactions
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true

// --- DATABASE FUNCTIONS ---
// FUNCTION rls_auto_enable()
//   CREATE OR REPLACE FUNCTION public.rls_auto_enable()
//    RETURNS event_trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'pg_catalog'
//   AS $function$
//   DECLARE
//     cmd record;
//   BEGIN
//     FOR cmd IN
//       SELECT *
//       FROM pg_event_trigger_ddl_commands()
//       WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
//         AND object_type IN ('table','partitioned table')
//     LOOP
//        IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
//         BEGIN
//           EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
//           RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
//         EXCEPTION
//           WHEN OTHERS THEN
//             RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
//         END;
//        ELSE
//           RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
//        END IF;
//     END LOOP;
//   END;
//   $function$
//
// FUNCTION update_orders_updated_at()
//   CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: orders
//   update_orders_updated_at_trigger: CREATE TRIGGER update_orders_updated_at_trigger BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at()

// --- INDEXES ---
// Table: funcionarios
//   CREATE UNIQUE INDEX funcionarios_email_key ON public.funcionarios USING btree (email)
