# building and contributing to goodtags

# build

## basics

This is a react native application. If you're not already set up to build react native cli applications,
head to the [react native environment setup](https://reactnative.dev/docs/environment-setup) and follow
the instructions under the **React Native CLI Quickstart** tab.

## yarn

- install a [modern version of yarn](https://yarnpkg.com/getting-started/install)
- `yarn install`

## link fonts

- `npm install -g npx`
- `npx react-native-asset`

## start the metro bundler

- `yarn start`

## launch goodtags in an android emulator

- `yarn android`

## launch goodtags in an ios simulator

- `yarn ios`

# test

- `yarn test`

# contribute

- create a fork
- submit a PR
- make sure unit tests pasts
- if you add anything that has a logic element, be sure to add tests for that logic
- other unit tests are always welcome
