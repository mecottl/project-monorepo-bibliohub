import { readdirSync } from 'node:fs';
import tseslint from 'typescript-eslint';

const features = readdirSync('src/app/features', { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const ban = (group, message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group, message }] }]
});

export default tseslint.config(
  { ignores: ['dist/**', '.angular/**', 'node_modules/**'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: tseslint.parser }
  },
  // Una feature solo importa de core, shared, domain (nunca de otra feature).
  ...features.map((f) => ({
    files: [`src/app/features/${f}/**/*.ts`],
    rules: ban(
      features.filter((o) => o !== f).map((o) => `@features/${o}`).concat(features.filter((o) => o !== f).map((o) => `@features/${o}/**`)),
      'Una feature no puede importar de otra: mueve lo compartido a domain/ o shared/.'
    )
  })),
  // Las capas base no dependen de features.
  {
    files: ['src/app/core/**/*.ts', 'src/app/shared/**/*.ts', 'src/app/domain/**/*.ts'],
    rules: ban(['@features/**', '@layouts/**'], 'core, shared y domain no dependen de features ni layouts.')
  }
);
