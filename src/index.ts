/**
 * Better Laravel Translator
 * 
 * This package extends laravel-translator with additional features:
 * - Glob pattern support for additional language paths
 * - Module namespacing
 * - Clean output structure without php/json separation
 * - Selective file loading (only translation files)
 * 
 * All runtime translation functions work exactly the same as the original package.
 */

// Re-export all translation functions from the original package
// This ensures 100% API compatibility
export { 
  __,
  trans,
  t,
  trans_choice,
  setLocale,
  getLocale,
  hasTranslation,
  setTranslations
} from './translator'

// Export types
export type { BetterLaravelTranslatorOptions } from './types'