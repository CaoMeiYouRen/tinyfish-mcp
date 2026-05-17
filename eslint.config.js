import { defineConfig, globalIgnores } from 'eslint/config'
import cmyr from 'eslint-config-cmyr'
import tseslint from 'typescript-eslint'
import { __WARN__, createLanguageOptions } from 'eslint-config-cmyr/utils'

export default defineConfig([
    globalIgnores([
        '*.config.ts',
    ]),
    cmyr,
    {
        rules: {
            'no-console': 0,
        },
    },
    {
        files: ['**/*.{js,cjs,mjs,jsx,ts,tsx,mts,cts}'],
        languageOptions: {
            globals: {
                Bun: true,
            },
        },
    },
    {
        ignores: [
            'dist',
            'node_modules',
            'coverage',
            'build',
            'public',
            '.vercel',
            '.wrangler',
            '.husky',
            'test',
            'scripts',
            'api',
        ],
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        extends: [
        ],
        plugins: {
            tseslint,
        },
        languageOptions: createLanguageOptions({}, {
            projectService: {
                defaultProject: 'tsconfig.json',
            },
            tsconfigRootDir: process.cwd(),
        }),
        rules: {
            '@typescript-eslint/no-require-imports': 0,
            '@typescript-eslint/no-deprecated': [1], // 禁止使用已废弃的 API
        },
    },
])
