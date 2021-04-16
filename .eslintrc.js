module.exports = {
  extends: [
    "airbnb-base",
    "eslint:recommended",
    "plugin:jest/style",
  ],
  plugins: ["jest"],
  parser: "@babel/eslint-parser",
  env: {
    browser: true,
    node: true,
    "jest/globals": true,
  },
  rules: {
    quotes: ["error", "double"],
    "no-param-reassign": ["error", { props: false }],
  },
};
