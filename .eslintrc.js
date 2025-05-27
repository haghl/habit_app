module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['eslint-plugin-react-compiler'],
  rules: {
    curly: 'off',
    'react-native/no-inline-styles': 'off',
    'react/no-unstable-nested-components': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'no-bitwise': 'off',
    'react-compiler/react-compiler': 'error',
  },
};
