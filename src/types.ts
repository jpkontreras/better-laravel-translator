export interface BetterLaravelTranslatorOptions {
  /**
   * Primary translation directory
   * @default 'lang'
   */
  langPath?: string
  
  /**
   * Additional paths to scan for translations, supports glob patterns
   */
  additionalLangPaths?: string[]
  
  /**
   * Enable module namespacing for translations from additional paths
   * @default false
   */
  namespaceModules?: boolean
  
  /**
   * Paths to exclude when resolving glob patterns
   * Default: node_modules, vendor, .git
   */
  excludePaths?: string[]
  
  /**
   * Only load translations for specific locales
   * @default undefined (loads all found locales)
   */
  locales?: string[]
  
  /**
   * Include JSON translation files
   * @default true
   */
  includeJson?: boolean
  
  /**
   * Include PHP translation files
   * @default true
   */
  includePhp?: boolean
  
  /**
   * Enable caching in development mode
   * @default true in production, false in development
   */
  cache?: boolean
}

/**
 * Re-export types from the original package
 */
export type { VitePluginOptionsInterface } from './vite'