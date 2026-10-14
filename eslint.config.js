import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Módulos que o núcleo e o servidor nunca podem importar (§3.2, §5.3).
const camadasDeApresentacao = [
  '**/render/**',
  '**/input/**',
  '**/ui/**',
  '**/audio/**',
  '**/editor/**',
  '**/plataforma/**',
  'pixi.js',
  'gsap',
  'howler',
];

export default tseslint.config(
  { ignores: ['dist', 'dist-server', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['**/*.{ts,js}'],
    rules: {
      // Teto de 800 linhas por arquivo (§3.2, §5.3).
      'max-lines': ['error', { max: 800, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    files: [
      'src/core/**/*.ts',
      'src/world/**/*.ts',
      'src/entities/**/*.ts',
      'src/combat/**/*.ts',
      'src/modos/**/*.ts',
      'src/progression/**/*.ts',
      'src/arena/**/*.ts',
      'src/net/**/*.ts',
      'src/save/**/*.ts',
      'src/pesquisa/**/*.ts',
      'server/**/*.ts',
      'shared/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: camadasDeApresentacao,
              message: 'O núcleo e o servidor não importam apresentação (§3.2).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['*.js', 'tools/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
