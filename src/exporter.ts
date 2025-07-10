import { readFileSync } from 'fs'
import { basename, join, relative } from 'path'
import { Engine } from 'php-parser'
import { scanDirectory, TranslationFile, ScanOptions } from './scanner'
import { resolveGlobPatternsWithCache } from './glob-resolver'
import { extractModuleName, applyNamespacing, mergeNamespacedTranslations } from './namespace'
import { BetterLaravelTranslatorOptions } from './types'

const phpEngine = new Engine({})

export function exportTranslations(pathOrOptions: string | BetterLaravelTranslatorOptions): Record<string, any> {
  // Handle backward compatibility - if string, use as langPath
  const options: BetterLaravelTranslatorOptions = typeof pathOrOptions === 'string' 
    ? { langPath: pathOrOptions }
    : pathOrOptions

  const {
    langPath = 'lang',
    additionalLangPaths = [],
    namespaceModules = false,
    excludePaths,
    locales,
    includeJson = true,
    includePhp = true
  } = options
  
  // Collect all paths to scan
  const pathsToScan: Array<{ path: string; pattern?: string }> = [
    { path: langPath }
  ]
  
  // Resolve glob patterns in additional paths
  if (additionalLangPaths.length > 0) {
    // Track which pattern resolved to which paths for module naming
    additionalLangPaths.forEach(pattern => {
      const resolved = resolveGlobPatternsWithCache([pattern], { excludePaths })
      resolved.forEach(path => {
        pathsToScan.push({ path, pattern })
      })
    })
  }
  
  // Scan all directories for translation files
  const scanOptions: ScanOptions = {
    includeJson,
    includePhp,
    locales
  }
  
  const allTranslationFiles: Array<TranslationFile & { basePath: string; pattern?: string }> = []
  
  for (const { path, pattern } of pathsToScan) {
    const files = scanDirectory(path, scanOptions)
    allTranslationFiles.push(...files.map(file => ({
      ...file,
      basePath: path,
      pattern
    })))
  }
  
  // Process all translation files
  let translations: Record<string, any> = {}
  
  for (const file of allTranslationFiles) {
    const content = loadTranslationFile(file)
    if (!content) continue
    
    // Extract module name if using additional paths with namespacing
    let moduleName: string | null = null
    if (namespaceModules && file.pattern) {
      moduleName = extractModuleName(file.basePath, file.pattern)
    }
    
    // Build the translation structure for this file
    const fileTranslations = buildFileTranslations(file, content)
    
    // Apply namespacing if needed
    const namespacedTranslations = applyNamespacing(
      fileTranslations,
      moduleName,
      namespaceModules
    )
    
    // Merge into main translations object
    translations = mergeNamespacedTranslations(
      translations,
      namespacedTranslations,
      file.locale
    )
  }
  
  return translations
}

function loadTranslationFile(file: TranslationFile & { basePath: string }): any {
  try {
    const content = readFileSync(file.path, 'utf-8')
    
    if (file.type === 'json') {
      return JSON.parse(content)
    } else {
      return parsePhpFile(content, basename(file.path))
    }
  } catch (error) {
    console.warn(`Warning: Failed to load translation file ${file.path}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

function parsePhpFile(content: string, filename: string): any {
  try {
    const ast = phpEngine.parseCode(content, filename)
    const returnStatement = ast.children.find((child: any) => child.kind === 'return') as any
    
    if (!returnStatement?.expr || returnStatement.expr.kind !== 'array') {
      return null
    }
    
    return parsePhpExpression(returnStatement.expr)
  } catch (error) {
    console.warn(`Warning: Failed to parse PHP file ${filename}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

function parsePhpExpression(expr: any): any {
  switch (expr.kind) {
    case 'string':
      return expr.value
      
    case 'number':
      return expr.value
      
    case 'boolean':
      return expr.value
      
    case 'array':
      const items = expr.items.map((item: any) => parsePhpExpression(item))
      
      // Check if it's an associative array
      if (expr.items.every((item: any) => item.key !== null)) {
        return items.reduce((acc: any, val: any) => Object.assign({}, acc, val), {})
      }
      
      return items
      
    case 'bin':
      // Handle string concatenation
      if (expr.type === '.') {
        return parsePhpExpression(expr.left) + parsePhpExpression(expr.right)
      }
      return null
      
    default:
      // Handle array items with keys
      if (expr.key) {
        return { [parsePhpExpression(expr.key)]: parsePhpExpression(expr.value) }
      }
      
      // Handle other value types
      if (expr.value !== undefined) {
        return parsePhpExpression(expr.value)
      }
      
      return null
  }
}

function buildFileTranslations(
  file: TranslationFile & { basePath: string },
  content: any
): Record<string, any> {
  if (file.type === 'json') {
    // JSON files go directly under the locale
    return content
  }
  
  // PHP files need to be organized by their path structure
  // Get the path relative to the locale directory
  const localePath = join(file.basePath, file.locale)
  const relativePath = relative(localePath, file.path)
    .replace(/\.php$/, '') // Remove extension
  
  // If it's just a filename (no subdirectories), return content directly
  if (!relativePath.includes('/') && !relativePath.includes('\\')) {
    return { [relativePath]: content }
  }
  
  // Build nested structure based on file path
  const parts = relativePath.split(/[/\\]/)
  const fileName = parts[parts.length - 1]
  const directories = parts.slice(0, -1)
  
  let result: any = {}
  let current = result
  
  // Build nested structure for directories
  for (const dir of directories) {
    current[dir] = {}
    current = current[dir]
  }
  
  // Set the file content
  current[fileName] = content
  
  return result
}