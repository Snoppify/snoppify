module.exports = {
    root: true,
    env: {
        node: true,
        jest: true,
    },
    extends: ["plugin:vue/essential", "eslint:recommended", "@vue/prettier"],
    rules: {
        "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
        "no-unused-vars": [
            "warn",
            { vars: "all", args: "after-used", ignoreRestSiblings: false },
        ],
        "vue/multi-word-component-names": "off",
    },
    overrides: [
        {
            files: ["*.ts"],
            parser: "@typescript-eslint/parser",
            plugins: ["@typescript-eslint"],
        },
    ],
};
