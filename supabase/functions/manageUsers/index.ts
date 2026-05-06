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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: profile } = await supabaseAdmin
      .from('funcionarios')
      .select('role')
      .eq('email', user.email)
      .single()

    if (!['Admin', 'Adm', 'Gerente', 'RH'].includes(profile?.role || '')) {
      throw new Error(
        'Acesso negado: Apenas administradores, gerentes ou RH podem gerenciar funcionários.',
      )
    }

    const { action, payload } = await req.json()
    let result

    switch (action) {
      case 'create': {
        const {
          name,
          email,
          password,
          role,
          cpf,
          telefone,
          data_nascimento,
          cargo,
          turno,
          data_admissao,
          salario,
          vale_transporte,
          endereco,
          escala_turnos,
        } = payload

        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: password || 'Password123!',
          email_confirm: true,
          user_metadata: { name },
        })
        if (createError) throw createError

        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('funcionarios')
          .upsert(
            {
              id: authData.user.id,
              email,
              nome: name,
              role: role || 'Colaborador',
              cpf,
              telefone,
              data_nascimento,
              cargo,
              turno,
              data_admissao,
              salario,
              vale_transporte,
              endereco,
              escala_turnos,
            },
            { onConflict: 'email' },
          )
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
        const {
          id,
          name,
          email,
          password,
          role,
          cpf,
          telefone,
          data_nascimento,
          cargo,
          turno,
          data_admissao,
          salario,
          vale_transporte,
          endereco,
          escala_turnos,
        } = payload

        const authUpdates: any = {}
        if (email) authUpdates.email = email
        if (password) authUpdates.password = password

        if (Object.keys(authUpdates).length > 0) {
          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
            id,
            authUpdates,
          )
          if (updateAuthError) {
            if (
              updateAuthError.message.includes('User not found') ||
              updateAuthError.status === 404
            ) {
              console.warn(
                `Aviso: Usuário ${id} não encontrado no auth.users. Atualizando apenas a tabela funcionarios.`,
              )
            } else {
              throw updateAuthError
            }
          }
        }

        const updateDataFunc: any = {}
        if (name !== undefined) updateDataFunc.nome = name
        if (email !== undefined) updateDataFunc.email = email
        if (role !== undefined) updateDataFunc.role = role
        if (cpf !== undefined) updateDataFunc.cpf = cpf
        if (telefone !== undefined) updateDataFunc.telefone = telefone
        if (data_nascimento !== undefined) updateDataFunc.data_nascimento = data_nascimento
        if (cargo !== undefined) updateDataFunc.cargo = cargo
        if (turno !== undefined) updateDataFunc.turno = turno
        if (data_admissao !== undefined) updateDataFunc.data_admissao = data_admissao
        if (salario !== undefined) updateDataFunc.salario = salario
        if (vale_transporte !== undefined) updateDataFunc.vale_transporte = vale_transporte
        if (endereco !== undefined) updateDataFunc.endereco = endereco
        if (escala_turnos !== undefined) updateDataFunc.escala_turnos = escala_turnos

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
