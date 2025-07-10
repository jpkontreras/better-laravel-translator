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

### Automatic Locale Detection

The package automatically detects your locale from Laravel's environment variables. Simply add these to your `.env` file:

```env
# Laravel's locale settings
APP_LOCALE=es
APP_FALLBACK_LOCALE=en

# Make them available to Vite/frontend (required)
VITE_APP_LOCALE="${APP_LOCALE}"
VITE_APP_FALLBACK_LOCALE="${APP_FALLBACK_LOCALE}"
```

That's it! The package will automatically use `es` as the locale. No code changes needed.

### In Your Application

All the translation functions work exactly as in the original package:

```js
import { __, trans, setLocale } from 'better-laravel-translator'

// Translations automatically use VITE_APP_LOCALE from .env
console.log(__('messages.welcome'))  // Shows Spanish translation
console.log(trans('validation.required', { attribute: 'email' }))

// With module namespacing
console.log(__('modules.user.profile.name'))

// You can still manually change locale if needed
setLocale('fr')
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

### Smart Locale Detection

We've added intelligent locale folder discovery that automatically finds your translation directories:

- **Automatic locale detection**: Scans for directories matching locale patterns (`en`, `es`, `fr`, `en_US`, etc.)
- **Laravel-compatible patterns**: Only looks for translation files in the expected locations
- **No manual configuration**: Works out-of-the-box with standard Laravel directory structures

The package uses a locale pattern (`/^[a-z]{2}(_[A-Z]{2})?$/`) to identify valid locale directories, supporting both simple locales like `en` and regional variants like `en_US`.

### Selective File Loading

Unlike the original package that loads all JSON files, we use strict validation to ensure only translation files are loaded:

**PHP Files:**
- Must be inside a valid locale directory (e.g., `lang/en/`, `lang/es_MX/`)
- Can be nested in subdirectories: `lang/en/auth.php`, `lang/en/admin/dashboard.php`
- The locale directory name must match the pattern: `/^[a-z]{2}(_[A-Z]{2})?$/`

**JSON Files:**
- Must be named exactly as `{locale}.json` at the root level
- Examples: `lang/en.json`, `lang/es.json`, `lang/pt_BR.json`
- Cannot be in subdirectories - only at the lang path root

This strict validation means configuration files like `composer.json` or `package.json` are never included in your translation bundle.

#### Directory Structure Examples

**✅ Valid structures that will be loaded:**
```
lang/
├── en/                    # Valid locale directory
│   ├── auth.php          # ✓ Loaded
│   ├── validation.php    # ✓ Loaded
│   └── admin/
│       └── users.php     # ✓ Loaded (nested files supported)
├── es/                   # Valid locale directory
│   └── messages.php      # ✓ Loaded
├── en.json              # ✓ Loaded (locale JSON at root)
└── es.json              # ✓ Loaded
```

**❌ Invalid structures that will be ignored:**
```
lang/
├── composer.json         # ✗ Not a locale-named JSON
├── package.json          # ✗ Not a locale-named JSON
├── config/              # ✗ Not a valid locale name
│   └── app.php          # ✗ Ignored
├── en/
│   ├── en.json          # ✗ JSON files not allowed in locale dirs
│   └── config.json      # ✗ JSON files not allowed in locale dirs
└── translations.json     # ✗ Not a locale-named JSON
```

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