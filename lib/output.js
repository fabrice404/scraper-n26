const { table } = require('table')

module.exports.show = (account) => {
  console.log(table([
    [account.name, account.balance]
  ]))

  const operations = []
  for (let i = 0; i < account.operations.length; i++) {
    let op = account.operations[i]
    operations.push([op.date, op.name, op.amount, op.reference])
  }
  console.log(table(operations, {
    columns: {
      0: { alignment: 'left' },
      1: { alignment: 'left' },
      2: { alignment: 'right' },
      3: { alignment: 'left' }
    },
    drawHorizontalLine: (index, size) => index === 0 || index === size
  }))
}
