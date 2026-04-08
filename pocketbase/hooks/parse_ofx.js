routerAdd(
  'POST',
  '/backend/v1/parse-ofx',
  (e) => {
    const body = e.requestInfo().body
    if (!body || !body.ofxContent) {
      throw new BadRequestError('ofxContent is required')
    }

    const content = body.ofxContent

    const bankIdMatch = content.match(/<BANKID>\s*([^<\r\n]+)/i)
    const acctIdMatch = content.match(/<ACCTID>\s*([^<\r\n]+)/i)

    const account = {
      bankId: bankIdMatch ? bankIdMatch[1].trim() : '',
      acctId: acctIdMatch ? acctIdMatch[1].trim() : '',
    }

    const transactions = []
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
    let match

    while ((match = stmtTrnRegex.exec(content)) !== null) {
      const trn = match[1]

      const dtMatch = trn.match(/<DTPOSTED>\s*([^<\r\n]+)/i)
      const amtMatch = trn.match(/<TRNAMT>\s*([^<\r\n]+)/i)
      const nameMatch = trn.match(/<NAME>\s*([^<\r\n]+)/i)
      const memoMatch = trn.match(/<MEMO>\s*([^<\r\n]+)/i)
      const fitidMatch = trn.match(/<FITID>\s*([^<\r\n]+)/i)

      if (dtMatch && amtMatch) {
        const dtRaw = dtMatch[1].trim()
        let dateStr = ''
        if (dtRaw.length >= 8) {
          dateStr = `${dtRaw.substring(0, 4)}-${dtRaw.substring(4, 6)}-${dtRaw.substring(6, 8)} 12:00:00.000Z`
        }

        const amt = parseFloat(amtMatch[1].trim().replace(',', '.'))
        if (isNaN(amt)) continue

        const type = amt >= 0 ? 'entrada' : 'saída'

        let description = nameMatch ? nameMatch[1].trim() : ''
        if (memoMatch && memoMatch[1].trim()) {
          description += description ? ` - ${memoMatch[1].trim()}` : memoMatch[1].trim()
        }
        if (!description) description = 'Transação sem descrição'

        transactions.push({
          fitid: fitidMatch ? fitidMatch[1].trim() : '',
          date: dateStr,
          amount: Math.abs(amt),
          type: type,
          description: description,
        })
      }
    }

    return e.json(200, {
      account,
      transactions,
    })
  },
  $apis.requireAuth(),
)
