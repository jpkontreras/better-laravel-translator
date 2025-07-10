import { readdirSync, statSync } from 'fs'
import { join, relative, sep } from 'path'
import { glob } from 'glob'

export interface TranslationFile {
  path: string
  locale: string
  type: 'php' | 'json'
}

export interface ScanOptions {
  includeJson?: boolean
  includePhp?: boolean
  locales?: string[]
}

const LOCALE_REGEX = /^[a-z]{2}(_[A-Z]{2})?$/

export function isValidTranslationFile(
  filePath: string,
  langPath: string
): boolean {
  const relativePath = relative(langPath, filePath)
  const parts = relativePath.split(sep)
  
  // Check if it's a JSON file
  if (filePath.endsWith('.json')) {
    // Must be {locale}.json at root level only
    return parts.length === 1 && 
           LOCALE_REGEX.test(parts[0].replace('.json', ''))
  }
  
  // Check if it's a PHP file
  if (filePath.endsWith('.php')) {
    // Must be under a locale directory
    const locale = parts[0]
    return parts.length >= 2 && LOCALE_REGEX.test(locale)
  }
  
  return false
}

export function scanDirectory(
  langPath: string,
  options: ScanOptions = {}
): TranslationFile[] {
  const {
    includeJson = true,
    includePhp = true,
    locales: allowedLocales
  } = options
  
  const files: TranslationFile[] = []
  
  try {
    const entries = readdirSync(langPath)
    
    // Scan for locale directories (for PHP files)
    if (includePhp) {
      const localeDirs = entries
        .filter(entry => {
          const fullPath = join(langPath, entry)
          return statSync(fullPath).isDirectory() && LOCALE_REGEX.test(entry)
        })
        .filter(locale => !allowedLocales || allowedLocales.includes(locale))
      
      for (const locale of localeDirs) {
        const localeDir = join(langPath, locale)
        
        // Find all PHP files in this locale directory
        const phpFiles = glob.sync('**/*.php', { 
          cwd: localeDir,
          absolute: true
        })
        
        files.push(...phpFiles.map(file => ({
          path: file,
          locale,
          type: 'php' as const
        })))
      }
    }
    
    // Scan for JSON files at root level
    if (includeJson) {
      const jsonFiles = entries
        .filter(file => {
          if (!file.endsWith('.json')) return false
          const locale = file.replace('.json', '')
          return LOCALE_REGEX.test(locale) && 
                 (!allowedLocales || allowedLocales.includes(locale))
        })
      
      files.push(...jsonFiles.map(file => ({
        path: join(langPath, file),
        locale: file.replace('.json', ''),
        type: 'json' as const
      })))
    }
    
  } catch (error) {
    // Directory doesn't exist or isn't readable
    console.warn(`Warning: Could not scan directory ${langPath}:`, error instanceof Error ? error.message : String(error))
  }
  
  return files
}

export function validatePath(filePath: string, allowedPaths: string[]): boolean {
  // Resolve to absolute path to prevent traversal attacks
  const resolvedPath = require('path').resolve(filePath)
  
  // Check if the resolved path is within any allowed path
  return allowedPaths.some(allowed => {
    const resolvedAllowed = require('path').resolve(allowed)
    return resolvedPath.startsWith(resolvedAllowed + sep) || 
           resolvedPath === resolvedAllowed
  })
}