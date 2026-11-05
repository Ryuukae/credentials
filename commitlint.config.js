export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (message) => /^(build|ci)\(deps(-dev)?\):/.test(message),
    (message) => /^chore\(release\):/.test(message),
  ],
  rules: {
    'body-max-line-length': [2, 'always', 72],
    'footer-max-line-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 72],
    'type-empty': [2, 'never'],
    'scope-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
  },
};
