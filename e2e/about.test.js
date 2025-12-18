const waitToNavigate = duration => new Promise(resolve => setTimeout(() => resolve(), duration))

describe('about', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  // note: these tests are intended to run serially

  it('should show the home screen after tapping the forward button', async () => {
    await element(by.id('welcome_forward_button')).tap()
    await waitFor(element(by.text('popular')))
      .toBeVisible()
      .withTimeout(3000)
  })

  it('should show the about screen after tapping the about button', async () => {
    await element(by.id('about_button')).tap()
    await waitFor(element(by.id('about_screen')))
      .toBeVisible()
      .withTimeout(2000)
    // tap back button using the icon-button id from react-native-paper
    await element(by.id('icon-button')).tap()
    await waitFor(element(by.text('popular')))
      .toBeVisible()
      .withTimeout(2000)
  })
})
