onRecordAfterUpdateSuccess((e) => {
  const newRecord = e.record
  const oldRecord = newRecord.originalCopy()

  if (!oldRecord) {
    e.next()
    return
  }

  const oldBankId = oldRecord.get('bank')
  const oldType = oldRecord.get('type')
  const oldValue = parseFloat(oldRecord.get('value')) || 0
  const oldStatus = oldRecord.get('status')

  const newBankId = newRecord.get('bank')
  const newType = newRecord.get('type')
  const newValue = parseFloat(newRecord.get('value')) || 0
  const newStatus = newRecord.get('status')

  // Calculate the financial impact of the transaction before and after the update
  const oldImpact = oldStatus === 'Liquidado' ? (oldType === 'entrada' ? oldValue : -oldValue) : 0
  const newImpact = newStatus === 'Liquidado' ? (newType === 'entrada' ? newValue : -newValue) : 0

  if (oldImpact === 0 && newImpact === 0 && oldBankId === newBankId) {
    e.next()
    return
  }

  $app.runInTransaction((txApp) => {
    try {
      if (oldBankId === newBankId) {
        // Same bank: apply the difference
        if (oldImpact !== newImpact && oldBankId) {
          const bank = txApp.findRecordById('banks', oldBankId)
          let bal = parseFloat(bank.get('current_balance')) || 0
          bal = bal - oldImpact + newImpact
          bank.set('current_balance', Math.round(bal * 100) / 100)
          txApp.save(bank)
        }
      } else {
        // Bank changed: revert from old bank, apply to new bank
        if (oldImpact !== 0 && oldBankId) {
          const oldBank = txApp.findRecordById('banks', oldBankId)
          let bal = parseFloat(oldBank.get('current_balance')) || 0
          bal = bal - oldImpact
          oldBank.set('current_balance', Math.round(bal * 100) / 100)
          txApp.save(oldBank)
        }
        if (newImpact !== 0 && newBankId) {
          const newBank = txApp.findRecordById('banks', newBankId)
          let bal = parseFloat(newBank.get('current_balance')) || 0
          bal = bal + newImpact
          newBank.set('current_balance', Math.round(bal * 100) / 100)
          txApp.save(newBank)
        }
      }
    } catch (err) {
      console.log('Error updating bank balance on transaction update:', err)
    }
  })

  e.next()
}, 'transactions')
