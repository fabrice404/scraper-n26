module.exports.save = (account) => {
  if (process.env.PG_HOST != null) {
    console.log('Saving...')
    const knex = require('knex')({
      client: 'postgresql',
      connection: {
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PWD,
        database: process.env.PG_DB
      }
    })

    // save balance
    knex('account_downloaded')
      .returning('id')
      .insert({
        accountId: account.internalId,
        balance: account.balance
      }).then(ids => {
        // save operations
        let operationsSaved = 0
        let insertPromises = []
        for (let i = 0; i < account.operations.length; i++) {
          insertPromises.push(
            new Promise((resolve, reject) => {
              let operation = account.operations[i]
              knex('operation_downloaded')
                .select()
                .from('operation_downloaded')
                .whereRaw('LOWER(reference) = LOWER(?)', operation.reference)
                .andWhere('date', operation.date)
                .andWhere('amount', operation.amount)
                .andWhere('accountId', account.internalId)
                .then(rows => {
                  if (rows.length === 0) {
                    knex('operation_downloaded')
                      .returning('id')
                      .insert({
                        date: operation.date,
                        name: operation.name,
                        amount: operation.amount,
                        accountId: account.internalId,
                        reference: operation.reference
                      })
                      .then(ids => {
                        operationsSaved += ids.length
                        resolve()
                      })
                  } else {
                    resolve()
                  }
                })
            })
          )
        }
        Promise.all(insertPromises).then(() => {
          console.log(`${account.name}: ${operationsSaved} new operation(s) saved in database.`)
          knex.destroy()
        })
      })

  }
}
