// eslint-disable-next-line no-undef
module.exports = {
  env: {
    "es6": true,
    "browser": true
  },
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    "indent": ["error", 2]
  }
};