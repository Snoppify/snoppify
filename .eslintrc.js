module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ["dist/", "data/", "server-dist/"],
  extends: [
    "eslint:recommended",
    "plugin:vue/essential",
    "@vue/prettier",
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    project: ["./tsconfig.json", "./tsconfig.server.json"],
    extraFileExtensions: [".vue"],
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
    "no-else-return": "off",
  },
  overrides: [
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
    },
    {
      files: ["*.vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
  ],
};
