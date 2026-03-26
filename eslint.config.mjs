import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...nextVitals,
  {
    ignores: ['.next/', 'src/payload-types.ts'],
  },
]

export default eslintConfig
