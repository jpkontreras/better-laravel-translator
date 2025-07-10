import { normalize, sep, resolve } from 'path'

export function extractModuleName(
  fullPath: string, 
  basePath: string
): string | null {
  // Normalize paths for consistent handling
  const normalizedFullPath = normalize(fullPath)
  const normalizedBasePath = normalize(basePath)
  
  // Check if the path contains '/lang' or '\lang' (for Windows)
  // Try both separators to handle cross-platform paths
  let langIndex = normalizedFullPath.lastIndexOf(sep + 'lang')
  if (langIndex === -1) {
    // Try with forward slash
    langIndex = normalizedFullPath.lastIndexOf('/lang')
  }
  if (langIndex === -1) {
    // Try with backslash
    langIndex = normalizedFullPath.lastIndexOf('\\lang')
  }
  if (langIndex === -1) {
    return null
  }
  
  // Extract the part before '/lang'
  const beforeLang = normalizedFullPath.substring(0, langIndex)
  
  // Handle glob patterns in base path
  let baseDir = normalizedBasePath
  if (baseDir.includes('*')) {
    // Remove glob patterns to get the base directory
    baseDir = baseDir.split('*')[0].replace(/[/\\]+$/, '')
  }
  
  // If basePath doesn't start with / or drive letter (Windows), make it absolute for comparison
  const isAbsolute = baseDir.startsWith(sep) || baseDir.match(/^[A-Za-z]:/)
  if (!isAbsolute) {
    baseDir = normalize(resolve(baseDir))
  }
  
  // If the full path doesn't start with the base directory, it's not a match
  if (!beforeLang.startsWith(baseDir)) {
    return null
  }
  
  // Extract module path between base and /lang
  const modulePath = beforeLang
    .substring(baseDir.length)
    .replace(/^[/\\]+/, '') // Remove leading slashes
    .replace(/[/\\]+$/, '') // Remove trailing slashes
  
  return modulePath || null
}

export function applyNamespacing(
  translations: Record<string, any>,
  moduleName: string | null,
  namespaceModules: boolean
): Record<string, any> {
  // If namespacing is disabled or there's no module name, return as-is
  if (!namespaceModules || !moduleName) {
    return translations
  }
  
  // Apply namespacing under modules.{moduleName}
  return {
    modules: {
      [moduleName]: translations
    }
  }
}

export function mergeNamespacedTranslations(
  existingTranslations: Record<string, any>,
  newTranslations: Record<string, any>,
  locale: string
): Record<string, any> {
  const result = { ...existingTranslations }
  
  // Ensure locale exists
  if (!result[locale]) {
    result[locale] = {}
  }
  
  // If new translations have modules, merge them
  if (newTranslations.modules) {
    if (!result[locale].modules) {
      result[locale].modules = {}
    }
    
    // Merge each module
    for (const [moduleName, moduleTranslations] of Object.entries(newTranslations.modules)) {
      if (!result[locale].modules[moduleName]) {
        result[locale].modules[moduleName] = {}
      }
      
      // Deep merge module translations
      result[locale].modules[moduleName] = deepMerge(
        result[locale].modules[moduleName],
        moduleTranslations as Record<string, any>
      )
    }
  } else {
    // No modules, merge directly into locale
    result[locale] = deepMerge(result[locale], newTranslations)
  }
  
  return result
}

function deepMerge(target: any, source: any): any {
  // Handle non-object cases
  if (!isObject(target) || !isObject(source)) {
    return source
  }
  
  const result = { ...target }
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (isObject(source[key]) && isObject(target[key])) {
        // Recursively merge objects
        result[key] = deepMerge(target[key], source[key])
      } else {
        // Replace value (source takes precedence)
        result[key] = source[key]
      }
    }
  }
  
  return result
}

function isObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}