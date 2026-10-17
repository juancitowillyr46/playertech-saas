// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

/** Capas del frontend (ADR-002, docs/architecture/frontend.md): solo los repositorios Supabase usan el SDK y los tipos generados. */
const SUPABASE_IMPORT_RESTRICTION = {
    paths: [
        {
            name: '@supabase/supabase-js',
            message: 'Solo los repositorios Supabase pueden usar el SDK y los tipos generados (ADR-002).'
        }
    ],
    patterns: [
        {
            regex: 'database\\.types$',
            message: 'Solo los repositorios Supabase pueden usar el SDK y los tipos generados (ADR-002).'
        }
    ]
};

module.exports = defineConfig([
    // Las demos de SakaiNG son material de referencia y no se modifican (principio V).
    // database.types.ts lo genera la Supabase CLI (npm run db:types).
    globalIgnores(['dist/', '.angular/', 'node_modules/', 'coverage/', 'src/app/pages/**', 'src/app/core/supabase/database.types.ts']),
    {
        files: ['**/*.ts'],
        extends: [eslint.configs.recommended, tseslint.configs.recommended, tseslint.configs.stylistic, angular.configs.tsRecommended, prettier],
        processor: angular.processInlineTemplates,
        rules: {
            '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
            '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
            'no-restricted-imports': ['error', SUPABASE_IMPORT_RESTRICTION]
        }
    },
    {
        // Infraestructura de Supabase: el único lugar donde se permite el SDK.
        files: ['src/app/core/supabase/**/*.ts', 'src/app/**/supabase-*.ts'],
        rules: {
            'no-restricted-imports': 'off'
        }
    },
    {
        files: ['**/*.spec.ts'],
        rules: {
            // Las pruebas construyen dobles con formas parciales.
            '@typescript-eslint/no-explicit-any': 'off'
        }
    },
    {
        files: ['**/*.html'],
        extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
        rules: {}
    }
]);
