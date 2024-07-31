const waitToNavigate = duration =>
  new Promise(resolve => setTimeout(() => resolve(), duration))

describe("about", () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  // note: these tests are intended to run serially

  it("should show the home screen after tapping the logo button", async () => {
    await element(by.id("welcome_forward_button")).tap()
    await element(by.id("logo_button")).tap()
    await waitFor(element(by.id("home_container")))
      .toBeVisible()
      .withTimeout(1000)
  })

  it("should show the about screen after tapping the about button", async () => {
    await element(by.id("about_button")).tap()
    await waitFor(element(by.id("about_screen")))
      .toBeVisible()
      .withTimeout(1000)
  })
})
