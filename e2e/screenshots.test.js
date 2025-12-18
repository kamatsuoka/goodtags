// automated screenshot generation for app stores
// run with: yarn e2e:screenshots:ios or yarn e2e:screenshots:android

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('app-store-screenshots', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  it('01-welcome-screen', async () => {
    await waitFor(element(by.id('welcome_forward_button')))
      .toBeVisible()
      .withTimeout(1000)
    await device.takeScreenshot('01-welcome-screen')
  })

  it('02-home-screen', async () => {
    await element(by.id('welcome_forward_button')).tap()
    await waitFor(element(by.text('popular')))
      .toBeVisible()
      .withTimeout(2000)
    await device.takeScreenshot('02-home-screen')
  })

  it('03-popular-tags', async () => {
    await element(by.label('popular')).tap()
    await waitFor(element(by.text('popular')))
      .toBeVisible()
      .withTimeout(2000)
    await wait(1000) // let list load
    await device.takeScreenshot('03-popular-tags')
  })

  it('04-search-form', async () => {
    // navigate to search tab
    await element(by.label('search, tab, 2 of 4')).tap()
    await wait(500)
    await device.takeScreenshot('04-search-form')
  })
})
