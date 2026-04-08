onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const bankId = record.get('bank')
  const type = record.get('type')
  const value = parseFloat(record.get('value')) || 0
  const status = record.get('status')

  // Only apply impact if the transaction is already cleared (Liquidado)
  if (bankId && value && status === 'Liquidado') {
    $app.runInTransaction((txApp) => {
      try {
        const bank = txApp.findRecordById('banks', bankId)
        let currentBalance = parseFloat(bank.get('current_balance')) || 0

        if (type === 'entrada') {
          currentBalance += value
        } else if (type === 'saída') {
          currentBalance -= value
        }

        bank.set('current_balance', Math.round(currentBalance * 100) / 100)
        txApp.save(bank)
      } catch (err) {
        console.log('Error updating bank balance:', err)
      }
    })
  }

  e.next()
}, 'transactions')
