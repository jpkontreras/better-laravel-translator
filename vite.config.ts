/// <reference types="vitest" />
import { defineConfig } from 'vite'
import betterLaravelTranslator from './src/vite'

export default defineConfig({
    plugins: [betterLaravelTranslator({
        langPath: 'tests/fixtures/lang',
        additionalLangPaths: ['tests/fixtures/app-modules/**/lang'],
        namespaceModules: true
    })],
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.d.ts',
                '**/*.test.ts',
                '**/*.spec.ts',
                'dist/',
                'vite.config.ts'
            ]
        },
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules', 'dist']
    },
})