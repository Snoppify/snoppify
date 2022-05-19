/**
 * Rules common for both client (Vue) and server (TS)
 */
var commonRules = {
  "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
  "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",
  "no-unused-vars": [
    "warn",
    { vars: "all", args: "after-used", ignoreRestSiblings: true },
  ],
  "linebreak-style": "off", // handled as "auto" by prettier
  "no-underscore-dangle": "off",
  "no-else-return": "off",
  eqeqeq: "warn",
  "prefer-destructuring": ["error", { object: true, array: false }],
  "no-restricted-syntax": "off",
  "no-return-assign": ["error", "except-parens"],
  "import/prefer-default-export": "off",
  "no-plusplus": "off",
  "no-cond-assign": ["error", "except-parens"],
};

module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    "dist/",
    "data/",
    "server-dist/",
    "electron/",
    "electron-dist/",
  ],
  overrides: [
    {
      files: ["server/**/*"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "eslint:recommended",
        "airbnb-base",
        "airbnb-typescript/base",
        "plugin:prettier/recommended",
      ],
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.server.json"],
      },
      rules: Object.assign({}, commonRules, {
        "@typescript-eslint/quotes": [
          "error",
          "double",
          { allowTemplateLiterals: true },
        ],
        "@typescript-eslint/no-use-before-define": ["error", "nofunc"],
        "@typescript-eslint/naming-convention": [
          "error",
          {
            selector: "variable",
            modifiers: ["destructured"],
            format: null,
          },
        ],
      }),
    },
    {
      files: ["src/**/*"],
      parser: "vue-eslint-parser",
      extends: ["eslint:recommended", "plugin:vue/essential", "@vue/prettier"],
      rules: Object.assign({}, commonRules, {
        "vue/multi-word-component-names": "off",
      }),
    },
  ],
};
