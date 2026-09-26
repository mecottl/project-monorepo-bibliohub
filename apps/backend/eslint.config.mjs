// @ts-check
import { readdirSync } from 'node:fs';
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const modulos = readdirSync('src/modules', { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const restringir = (group, message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group, message }] }],
});

// Superficie que un módulo expone a los demás: entities/, services/ y su *.module.
const internos = (m) => ['controllers', 'dto', 'interfaces', 'strategies'].map((c) => `@modules/${m}/${c}/**`);

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  // Un módulo no importa controllers/dto/interfaces de otro ni sale de su carpeta con rutas relativas.
  ...modulos.map((m) => ({
    files: [`src/modules/${m}/**/*.ts`],
    rules: restringir(
      ['../../*', ...modulos.filter((o) => o !== m).flatMap(internos)],
      'Entre módulos solo se importan entities/, services/ y el *.module (por alias @modules); usa alias, no rutas relativas.',
    ),
  })),
  // common e infra no dependen de la lógica de los módulos (solo de sus entidades).
  {
    files: ['src/common/**/*.ts', 'src/infra/**/*.ts'],
    rules: restringir(
      ['@modules/*/controllers/**', '@modules/*/services/**', '@modules/*/dto/**', '@modules/*/*.module'],
      'common e infra no dependen de servicios ni controllers de los módulos.',
    ),
  },
);
