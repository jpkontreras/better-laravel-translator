# Better Laravel Translator

<div align="center">

Enhanced Laravel translation support for Vite with glob patterns and module namespacing.

[![npm version](https://img.shields.io/npm/v/better-laravel-translator.svg)](https://www.npmjs.com/package/better-laravel-translator)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## About

This package builds on the excellent work of [laravel-translator-js](https://github.com/sergix44/laravel-translator-js) by [Sergio Brighenti](https://github.com/sergix44/). We've added several enhancements while maintaining full compatibility with the original API.

### What We've Added

- **Glob Pattern Support**: Use patterns like `app-modules/**/lang` to automatically find translation directories
- **Module Namespacing**: Optional namespacing to organize translations by module
- **Cleaner Output Structure**: Translations without the `php`/`json` separation
- **Selective File Loading**: Only processes files that match Laravel translation patterns

## 📦 Installation

```bash
npm install -D better-laravel-translator
# or
yarn add -D better-laravel-translator
# or
pnpm add -D better-laravel-translator
```

## 🚀 Usage

### Basic Setup

```js
// vite.config.js
import { defineConfig } from 'vite'
import betterLaravelTranslator from 'better-laravel-translator/vite'

export default defineConfig({
    plugins: [
        betterLaravelTranslator({
            langPath: 'lang' // default Laravel path
        })
    ],
})
```

### Using Glob Patterns

```js
betterLaravelTranslator({
    langPath: 'lang',
    additionalLangPaths: [
        'app-modules/**/lang',     // Find all module lang directories
        'packages/*/resources/lang' // Find package translations
    ]
})
```

### Module Namespacing

When you have multiple modules with their own translations:

```js
betterLaravelTranslator({
    langPath: 'lang',
    additionalLangPaths: ['app-modules/**/lang'],
    namespaceModules: true // Enable module namespacing
})
```

This creates a structure like:

```js
{
    "en": {
        // Root translations
        "messages": { "welcome": "Welcome" },
        
        // Module translations
        "modules": {
            "user": {
                "profile": { "name": "Name" }
            },
            "billing": {
                "invoices": { "paid": "Paid" }
            }
        }
    }
}
```

### In Your Application

All the translation functions work exactly as in the original package:

```js
import { __, trans, setLocale } from 'better-laravel-translator'

// Use translations
console.log(__('messages.welcome'))
console.log(trans('validation.required', { attribute: 'email' }))

// With module namespacing
console.log(__('modules.user.profile.name'))

// Change locale
setLocale('es')
```

## 📋 Configuration Options

```typescript
{
    // Primary translation directory (default: 'lang')
    langPath?: string
    
    // Additional paths to scan (supports glob patterns)
    additionalLangPaths?: string[]
    
    // Enable module namespacing (default: false)
    namespaceModules?: boolean
    
    // Only load specific locales (default: all)
    locales?: string[]
    
    // Include JSON translation files (default: true)
    includeJson?: boolean
    
    // Include PHP translation files (default: true)
    includePhp?: boolean
}
```

## 🔧 Vue.js Integration

The Vue plugin works exactly as in the original package:

```js
import { createApp } from 'vue'
import { laravelTranslatorVue } from 'better-laravel-translator/vue'

const app = createApp()
app.use(laravelTranslatorVue)
```

Then in your components:

```vue
<template>
    <div>{{ $t('messages.welcome') }}</div>
</template>
```

## 🌟 Features

### Selective File Loading

Unlike the original package that loads all JSON files, we only load:
- PHP files in locale directories: `lang/en/*.php`
- JSON files named by locale: `lang/en.json`

This means configuration files like `composer.json` or `package.json` are never included in your translation bundle.

### Clean Output Structure

The original package separates PHP and JSON translations:

```js
// Original structure
{
    "en": {
        "php": { "messages": {...} },
        "json": { "Welcome": "Welcome" }
    }
}

// Our structure
{
    "en": {
        "messages": {...},
        "Welcome": "Welcome"
    }
}
```

## 🔄 Migration from Original Package

Migrating is straightforward:

```js
// Before (laravel-translator)
laravelTranslator({
    langPath: 'resources/lang',
    additionalLangPaths: [
        './app-modules/user/lang',
        './app-modules/billing/lang',
        './app-modules/admin/lang'
    ]
})

// After (better-laravel-translator) 
betterLaravelTranslator({
    langPath: 'resources/lang',
    additionalLangPaths: [
        'app-modules/**/lang' // One pattern finds all modules!
    ],
    namespaceModules: true // Optional: prevent conflicts
})
```

The translation functions remain the same:

```js
import { __, trans, setLocale } from 'better-laravel-translator'
// No code changes needed!
```

## 🤝 Credits

This package is built on top of [laravel-translator-js](https://github.com/sergix44/laravel-translator-js) by [Sergio Brighenti](https://github.com/sergix44/). We're grateful for his work that made this package possible.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.