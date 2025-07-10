# Better Laravel Translator

<div align="center">

Laravel translation bridge for Vite with glob pattern support and module namespacing.

[![npm version](https://img.shields.io/npm/v/better-laravel-translator.svg)](https://www.npmjs.com/package/better-laravel-translator)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## What's New

This package extends [laravel-translator-js](https://github.com/sergix44/laravel-translator-js) by [Sergio Brighenti](https://github.com/sergix44/) with:

- **Glob Pattern Support**: Use patterns like `app-modules/**/lang` to automatically find translation directories
- **Module Namespacing**: Optional namespacing to organize translations by module
- **Cleaner Output Structure**: Removes the `php`/`json` separation for a flatter structure
- **Selective File Loading**: Only processes files that match Laravel translation patterns

### Improved Translation Structure:
```js
// Original structure mixed all JSON files:
{
  "en": { "php": { "messages": {...} } },
  "composer": { "json": {...} }  // Config files included
}

// Our cleaner structure:
{
  "en": {
    "messages": { "welcome": "Welcome" },
    "validation": { "required": "Required" }
  }
  // Clean, Laravel-style organization
}
```

## Core Features from Original

All the features you know from laravel-translator-js work the same way:
- `__()`, `trans()`, `t()`, `trans_choice()` functions
- `setLocale()` for changing languages
- Vue.js plugin support
- Hot reload in development

For detailed documentation on these features, see the [original package documentation](https://github.com/sergix44/laravel-translator-js).

## 📦 Installation

```bash
npm install -D better-laravel-translator
# or
yarn add -D better-laravel-translator
# or  
pnpm add -D better-laravel-translator
```

## 🚀 Quick Start

### Basic Setup

```js
// vite.config.js
import { defineConfig } from 'vite'
import betterLaravelTranslator from 'better-laravel-translator/vite'

export default defineConfig({
  plugins: [
    betterLaravelTranslator({
      langPath: 'lang' // Your Laravel lang directory
    })
  ]
})
```

### Using Translations

```js
import { __, trans, setLocale } from 'better-laravel-translator'

// Same API as original package
setLocale('es')
__('messages.welcome', { name: 'John' })
trans('validation.required')
```

## Our Additions

### 1. Glob Pattern Support

Automatically discover translation directories:

```js
betterLaravelTranslator({
  additionalLangPaths: [
    'app-modules/**/lang',        // Find all module translations
    'packages/*/resources/lang',  // Include package translations
    'vendor/*/*/lang'
  ]
})
```

**Directory structure:**
```
app-modules/
├── user/
│   └── lang/
│       ├── en/messages.php
│       └── es/messages.php
├── billing/
│   └── lang/
│       └── en/invoices.php
└── admin/
    └── settings/
        └── lang/
            └── en/config.php
```

### 2. Module Namespacing

Organize translations by module to prevent key conflicts:

```js
betterLaravelTranslator({
  additionalLangPaths: ['app-modules/**/lang'],
  namespaceModules: true // Enable namespacing
})
```

**Without namespacing** (default):
```js
__('messages.welcome')  // Could be from any module
__('invoices.paid')     // Hope there's no conflict!
```

**With namespacing**:
```js
__('modules.user.messages.welcome')     // Clearly from user module
__('modules.billing.invoices.paid')     // Clearly from billing module
__('modules.admin/settings.config.app') // Nested modules supported!
```

### 3. Selective File Loading

Control which files are processed:

```js
betterLaravelTranslator({
  // Exclude directories from scanning
  excludePaths: [
    'node_modules',
    'vendor',
    'storage',
    '.git',
    'tests'
  ],
  
  // Only load specific locales
  locales: ['en', 'es', 'fr'],
  
  // Control file types
  includeJson: true,  // Load {locale}.json files
  includePhp: true    // Load PHP translation files
})
```

## 📚 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `langPath` | `string` | `'lang'` | Primary translation directory |
| `additionalLangPaths` | `string[]` | `[]` | Additional paths (supports glob patterns) |
| `namespaceModules` | `boolean` | `false` | Enable module namespacing |
| `excludePaths` | `string[]` | `['node_modules', 'vendor', '.git']` | Paths to exclude from scanning |
| `locales` | `string[]` | `undefined` | Specific locales to load (all if undefined) |
| `includeJson` | `boolean` | `true` | Include JSON translation files |
| `includePhp` | `boolean` | `true` | Include PHP translation files |

## 🔄 Migration from Original Package

### Step 1: Update Configuration

```js
// Old (laravel-translator)
laravelTranslator({
  langPath: 'resources/lang',
  additionalLangPaths: [
    './app-modules/user/lang',
    './app-modules/billing/lang',
    './app-modules/admin/lang'
    // Manually listing each module 😓
  ]
})

// New (better-laravel-translator) 
betterLaravelTranslator({
  langPath: 'resources/lang',
  additionalLangPaths: [
    'app-modules/**/lang' // Automatic discovery! 🎉
  ],
  namespaceModules: true // Avoid conflicts
})
```

### Step 2: Update Imports

```js
// Both packages use the same import names
import { __, trans, setLocale } from 'better-laravel-translator'
// No code changes needed!
```

### Step 3: Check Your Translations

If you enabled `namespaceModules`, update module translation keys:
```js
// Before
__('messages.welcome')

// After (with namespacing)
__('modules.user.messages.welcome')
```

## 🏗️ Project Structure Examples

### Standard Laravel
```
project/
├── lang/
│   ├── en/
│   │   ├── auth.php
│   │   └── validation.php
│   └── es/
│       ├── auth.php
│       └── validation.php
└── vite.config.js
```

### Modular Application
```
project/
├── lang/              # Core translations
├── app-modules/       # Module translations
│   ├── user/
│   │   └── lang/
│   ├── billing/
│   │   └── lang/
│   └── inventory/
│       └── lang/
└── vite.config.js
```

### Multi-Package Setup
```
project/
├── lang/              # Core translations
├── packages/          # Package translations
│   ├── ui-kit/
│   │   └── resources/lang/
│   └── api-client/
│       └── resources/lang/
└── app-modules/       # Module translations
    └── */lang/
```

## Framework Integration

See [laravel-translator-js documentation](https://github.com/sergix44/laravel-translator-js#usage) for Vue.js integration and other framework examples.

## How File Detection Works

The package only loads files that match Laravel's translation patterns:

- **PHP Files**: `{locale}/*.php` or `{locale}/**/*.php` within lang directories
- **JSON Files**: `{locale}.json` at the root of lang directories

Other files are ignored, ensuring only translation content is included.


## Testing

```bash
npm test
```

## Credits

This package stands on the shoulders of [laravel-translator-js](https://github.com/sergix44/laravel-translator-js) by [Sergio Brighenti](https://github.com/sergix44/). We're grateful for his work in bridging Laravel translations to the frontend.

We've enhanced the original concept with features needed for modern, modular Laravel applications:

### What We Added:
- **Glob Patterns**: Automatic module discovery with `app-modules/**/lang`
- **Module Namespacing**: Prevent conflicts in large applications  
- **Selective Loading**: Control over which files are processed
- **TypeScript**: Type definitions for better development experience
- **Cleaner Structure**: Flatter output format without `php`/`json` nesting

## License

MIT License - see [LICENSE](LICENSE) file for details

## FAQ

**Q: Is this a drop-in replacement for laravel-translator-js?**  
A: Mostly yes! The API is the same, but you'll need to update your configuration to use the new options. If you enable module namespacing, you'll need to update your translation keys.

**Q: Does it work without Laravel?**  
A: Yes! As long as you follow Laravel's translation file structure, it works with any backend or even static sites.

**Q: How do glob patterns affect build time?**  
A: Glob patterns are resolved once during build. The resolved paths are cached during development.

**Q: Can I use it with other bundlers?**  
A: Currently, it's Vite-specific, but we're open to PRs for webpack/rollup support!

