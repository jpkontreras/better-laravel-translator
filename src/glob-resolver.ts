import { glob } from 'glob'
import { statSync } from 'fs'
import { resolve } from 'path'

export interface GlobResolverOptions {
  excludePaths?: string[]
  maxDepth?: number
}

const DEFAULT_EXCLUDES = ['**/node_modules/**', '**/vendor/**', '**/.git/**']

export function resolveGlobPatterns(
  patterns: string[],
  options: GlobResolverOptions = {}
): string[] {
  const {
    excludePaths = DEFAULT_EXCLUDES,
    maxDepth = 10
  } = options
  
  const resolved: string[] = []
  
  for (const pattern of patterns) {
    try {
      // If pattern doesn't contain glob characters, check if it's a directory
      if (!containsGlobCharacters(pattern)) {
        try {
          const stats = statSync(pattern)
          if (stats.isDirectory()) {
            resolved.push(resolve(pattern))
          }
        } catch {
          // Directory doesn't exist, skip it
          console.debug(`Path does not exist: ${pattern}`)
        }
        continue
      }
      
      // Resolve glob pattern
      const matches = glob.sync(pattern, {
        ignore: excludePaths,
        absolute: true,
        maxDepth
      })
      
      // Filter to ensure we only get directories
      const directories = matches.filter(match => {
        try {
          return statSync(match).isDirectory()
        } catch {
          return false
        }
      })
      
      resolved.push(...directories)
      
    } catch (error) {
      console.warn(`Warning: Invalid glob pattern "${pattern}":`, error instanceof Error ? error.message : String(error))
    }
  }
  
  // Remove duplicates and sort for consistent output
  return [...new Set(resolved)].sort()
}

function containsGlobCharacters(pattern: string): boolean {
  return /[*?{}[\]()]/.test(pattern)
}

// Cache for development mode
const globCache = new Map<string, string[]>()

export function resolveGlobPatternsWithCache(
  patterns: string[],
  options: GlobResolverOptions = {},
  useCache = process.env.NODE_ENV === 'development'
): string[] {
  const cacheKey = JSON.stringify({ patterns, options })
  
  if (useCache && globCache.has(cacheKey)) {
    return globCache.get(cacheKey)!
  }
  
  const result = resolveGlobPatterns(patterns, options)
  
  if (useCache) {
    globCache.set(cacheKey, result)
  }
  
  return result
}

export function clearGlobCache(): void {
  globCache.clear()
}