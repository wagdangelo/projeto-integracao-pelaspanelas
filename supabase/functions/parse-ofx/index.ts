import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Parser fallback (regex robusto) caso a importação da biblioteca falhe no ambiente Deno
const fallbackParse = (ofxString: string) => {
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
  const transactions = []

  let match
  while ((match = stmtTrnRegex.exec(ofxString)) !== null) {
    const trn = match[1]

    const dtpostedMatch = trn.match(/<DTPOSTED>([^\r\n<]+)/)
    const trnamtMatch = trn.match(/<TRNAMT>([^\r\n<]+)/)
    const fitidMatch = trn.match(/<FITID>([^\r\n<]+)/)
    const nameMatch = trn.match(/<NAME>([^\r\n<]+)/)
    const memoMatch = trn.match(/<MEMO>([^\r\n<]+)/)

    if (trnamtMatch && dtpostedMatch) {
      const amountStr = trnamtMatch[1].trim().replace(',', '.')
      const amount = parseFloat(amountStr)

      const dateStr = dtpostedMatch[1].trim()
      const year = dateStr.substring(0, 4)
      const month = dateStr.substring(4, 6)
      const day = dateStr.substring(6, 8)
      const date = new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString()

      let description = ''
      if (nameMatch) description += nameMatch[1].trim()
      if (memoMatch) {
        const memo = memoMatch[1].trim()
        if (memo && memo !== description) {
          description += (description ? ' - ' : '') + memo
        }
      }

      transactions.push({
        fitid: fitidMatch
          ? fitidMatch[1].trim()
          : `FIT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        date,
        amount,
        type: amount >= 0 ? 'entrada' : 'saída',
        description: description || 'Transação genérica',
      })
    }
  }

  const bankIdMatch = ofxString.match(/<BANKID>([^\r\n<]+)/)
  const acctIdMatch = ofxString.match(/<ACCTID>([^\r\n<]+)/)

  return {
    account: {
      bankId: bankIdMatch ? bankIdMatch[1].trim() : '',
      acctId: acctIdMatch ? acctIdMatch[1].trim() : '',
    },
    transactions,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ofxContent } = await req.json()

    if (!ofxContent) {
      throw new Error('Conteúdo OFX não fornecido.')
    }

    let parsedData

    try {
      // Tentativa de utilizar a biblioteca 'ofxparse' via npm
      const ofxparse = await import('npm:ofxparse')
      const result = ofxparse.default
        ? ofxparse.default.parse(ofxContent)
        : ofxparse.parse(ofxContent)

      // Adaptando o retorno da biblioteca para o formato esperado pelo front-end
      parsedData = {
        account: {
          bankId: result?.account?.bankId || '',
          acctId: result?.account?.acctId || '',
        },
        transactions: (result?.transactions || []).map((t: any) => {
          const amt =
            typeof t.amount === 'number'
              ? t.amount
              : parseFloat((t.amount || '0').replace(',', '.'))
          return {
            fitid:
              t.fitid || t.id || `FIT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
            amount: amt,
            type: amt >= 0 ? 'entrada' : 'saída',
            description: t.description || t.name || t.memo || 'Transação',
          }
        }),
      }

      if (!parsedData.transactions || parsedData.transactions.length === 0) {
        throw new Error('Fallback para regex')
      }
    } catch (err) {
      // Fallback para o parser regex robusto caso a biblioteca não esteja disponível ou falhe
      parsedData = fallbackParse(ofxContent)
    }

    if (!parsedData.transactions || parsedData.transactions.length === 0) {
      throw new Error('Nenhuma transação válida encontrada no arquivo OFX.')
    }

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
