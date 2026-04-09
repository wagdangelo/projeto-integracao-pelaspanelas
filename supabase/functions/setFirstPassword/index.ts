import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Update password in Supabase Auth (Supabase automatically applies bcrypt/argon2 hashing)
    // First find the user in auth.users by email
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const user = users.find((u) => u.email === email)
    if (!user) {
      throw new Error('Usuário não encontrado na base de dados de autenticação.')
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password,
    })

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Senha atualizada com sucesso.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
