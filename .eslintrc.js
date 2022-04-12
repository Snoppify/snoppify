module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ["dist/", "data/", "server-dist/"],
  extends: [
    "plugin:vue/essential",
    "eslint:recommended",
    "@vue/prettier",
    "airbnb-base",
    "airbnb-typescript/base",
  ],
  parserOptions: {
    project: ["./tsconfig.json", "./tsconfig.server.json"],
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-unused-vars": [
      "warn",
      { vars: "all", args: "after-used", ignoreRestSiblings: false },
    ],
    "vue/multi-word-component-names": "off",
    "@typescript-eslint/quotes": ["error", "double"],
    "linebreak-style": "off", // handled as "auto" by prettier
    "no-underscore-dangle": "off",
  },
  overrides: [
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
    },
  ],
};
