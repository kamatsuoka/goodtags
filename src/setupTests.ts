import "@testing-library/jest-dom"
import "whatwg-fetch"

// require("jest-fetch-mock").enableMocks()
// Ran into this bug: https://github.com/expo/expo/issues/23591
jest.mock("expo-font")
