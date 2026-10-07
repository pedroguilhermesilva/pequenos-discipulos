import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      // Pre-existing patterns in legacy UI components; new code should avoid setState-in-effect.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default eslintConfig;
