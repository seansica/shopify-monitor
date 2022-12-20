module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    root: true,
    env: {
        browser: true,
        node: true,
    },
    rules: {
        "object-curly-spacing": ["error", "always"],
        "no-multi-spaces": ["error"],
    }
};
