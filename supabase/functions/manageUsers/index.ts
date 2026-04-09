import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    // Get caller user and verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Create admin client to perform privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check if the caller is an Admin
    const { data: profile } = await supabaseAdmin
      .from('funcionarios')
      .select('role')
      .eq('email', user.email)
      .single()

    if (profile?.role !== 'Admin' && profile?.role !== 'Adm') {
      throw new Error('Acesso negado: Apenas administradores podem gerenciar usuários.')
    }

    const { action, payload } = await req.json()
    let result

    switch (action) {
      case 'create': {
        const { name, email, role } = payload

        // Create user in auth.users
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'Password123!', // Senha padrão inicial
          email_confirm: true,
          user_metadata: { name },
        })
        if (createError) throw createError

        // Upsert into public.funcionarios
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('funcionarios')
          .upsert({ email, nome: name, role: role || 'Cozinha' }, { onConflict: 'email' })
          .select()
          .single()

        if (profileError) throw profileError
        result = { ...profileData, name: profileData.nome }
        break
      }
      case 'read': {
        const { id } = payload || {}
        if (id) {
          const { data, error } = await supabaseAdmin
            .from('funcionarios')
            .select('*')
            .eq('id', id)
            .single()
          if (error) throw error
          result = { ...data, name: data.nome }
        } else {
          const { data, error } = await supabaseAdmin
            .from('funcionarios')
            .select('*')
            .order('nome', { ascending: true })
          if (error) throw error
          result = data.map((item: any) => ({ ...item, name: item.nome }))
        }
        break
      }
      case 'update': {
        const { id, name, email, role } = payload
        const updateData: any = {}

        if (name) updateData.name = name
        if (email) updateData.email = email
        if (role) updateData.role = role

        // Update email in auth.users if changed
        if (email) {
          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            email,
          })
          if (updateAuthError) throw updateAuthError
        }

        // Update public.funcionarios
        const updateDataFunc: any = {}
        if (name) updateDataFunc.nome = name
        if (email) updateDataFunc.email = email
        if (role) updateDataFunc.role = role

        const { data, error } = await supabaseAdmin
          .from('funcionarios')
          .update(updateDataFunc)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        result = { ...data, name: data.nome }
        break
      }
      case 'delete': {
        const { id } = payload

        const { data: funcData } = await supabaseAdmin
          .from('funcionarios')
          .select('email')
          .eq('id', id)
          .single()
        if (funcData?.email) {
          const { data: users } = await supabaseAdmin.auth.admin.listUsers()
          const authUser = users.users.find((u) => u.email === funcData.email)
          if (authUser) {
            await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          }
        }

        const { error } = await supabaseAdmin.from('funcionarios').delete().eq('id', id)
        if (error) throw error
        result = { deletedId: id }
        break
      }
      default:
        throw new Error('Ação inválida.')
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Operação realizada com sucesso.',
        data: result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
