const cheerio = require('cheerio')
const { Builder, By, until } = require('selenium-webdriver')

const driver = new Builder()
  .forBrowser('chrome')
  .build()

exports.downloadAccountBalanceAndOperations = () => {
  console.log('Downloading...')
  return new Promise((resolve, reject) => {
    init().then(() => {
      signIn().then(() => {
        getAccount().then(account => {
          driver.quit()
          resolve(account)
        })
      })
    })
  })
}

const getElement = xpath => {
  driver.wait(until.elementLocated(By.xpath(xpath)))
  return driver.wait(until.elementIsVisible(driver.findElement(By.xpath(xpath))))
}
const getAmountFromText = text => {
  return parseFloat(
    text.replace(/,/g, '')
      .replace(/ /g, '')
      .replace(/\s/g, '')
      .replace(/&nbsp;/g, '')
      .replace(/€/g, '')
      .trim()
  )
}

const init = () => {
  return new Promise((resolve, reject) => {
    // get focus on browser
    console.log('get focus on browser')
    driver.executeScript('alert("hello world !")')
      .then(() => {
        driver.switchTo().alert().accept()

        // launch page
        console.log('launch page')
        driver.get(process.env.URL)
          .then(() => resolve())
      })
  })
}

const signIn = () => {
  return new Promise((resolve, reject) => {
    let loginButton = getElement('//a[contains(@class, "login")]')
    driver.wait(until.elementIsVisible(loginButton))

    // set login & password
    console.log('login & password')
    driver.executeScript((login, pwd) => {
      document.getElementsByName('email')[0].value = login
      document.getElementsByName('password')[0].value = pwd
    }, process.env.LOGIN, process.env.PASSWORD)

    // click connection button
    console.log('click connection button')
    loginButton.click()
      .then(() => {
        resolve()
      })
  })
}

const getAccount = () => {
  return new Promise((resolve, reject) => {
    const operationsElement = getElement('//div[@class = "UIActivities"]')
    driver.wait(until.elementIsVisible(operationsElement))

    const mainElement = getElement('//div[contains(@class, "UISkeleton")]')
    mainElement.getAttribute('innerHTML')
      .then(html => {
        const $ = cheerio.load(html)
        const account = {
          name: 'N26',
          internalId: process.env.ACCOUNT_ID,
          balance: getAmountFromText($('.UIHeader__account-balance').text().replace(/Your balance/g, '')),
          operations: []
        }
        $('.node.activity').each((i, row) => {
          let date = new Date(parseInt($(row).attr('data-timestamp')))
          date = date.getDate().toString().padStart(2, '0') + '/' +
                        (date.getMonth() + 1).toString().padStart(2, '0') + '/' +
                        date.getFullYear().toString()
          account.operations.push({
            date: date,
            name: $(row).find('h4').text(),
            amount: getAmountFromText($(row).find('.expense').text() + $(row).find('.load').text())
          })
        })
        resolve(account)
      })
  })
}
