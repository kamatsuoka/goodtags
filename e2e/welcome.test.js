describe("welcome", () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  // this test relies on goodtags being newly installed, since
  // welcome screen only shows the first time
  it("should show home tabs stack after tapping the forward button", async () => {
    await element(by.id("welcome_forward_button")).longPress()
    await waitFor(element(by.text("Popular")))
      .toBeVisible()
      .withTimeout(300)
  })
})
