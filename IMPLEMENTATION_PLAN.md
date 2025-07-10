# Better Laravel Translator - Detailed Implementation Plan

## Overview
This document provides a complete technical specification for implementing `better-laravel-translator`. Follow this plan exactly to ensure the package works as designed and promised.

## Project Structure
```
better-laravel-translator/
├── src/
│   ├── index.ts           # Main entry, re-exports original functions
│   ├── vite.ts            # Vite plugin with our enhancements
│   ├── exporter.ts        # Enhanced translation exporter
│   ├── scanner.ts         # New: Secure file scanner
│   ├── glob-resolver.ts   # New: Glob pattern resolver
│   ├── namespace.ts       # New: Module namespacing logic
│   └── types.ts           # TypeScript definitions
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Feature 1: Glob Pattern Support

### Specification
- Accept glob patterns in `additionalLangPaths` configuration
- Resolve patterns like `app-modules/**/lang` to actual directory paths
- Resolution happens once at build time, not runtime
- Cache resolved paths during development for performance

### Implementation Details
```typescript
// glob-resolver.ts
import { glob } from 'glob'
import path from 'path'

export function resolveGlobPatterns(patterns: string[]): string[] {
  const resolved: string[] = []
  
  for (const pattern of patterns) {
    // Important: Use sync for build-time resolution
    const matches = glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/vendor/**'],
      absolute: true
    })
    
    resolved.push(...matches)
  }
  
  // Remove duplicates
  return [...new Set(resolved)]
}
```

### Edge Cases
1. **Invalid patterns**: Return empty array, don't throw
2. **No matches**: Valid scenario, return empty array
3. **Circular symlinks**: glob handles this, but set max depth
4. **Performance**: For large codebases, cache results in development

### Testing Requirements
- Test with nested patterns: `modules/**/lang`, `modules/*/lang`
- Test with no matches
- Test with overlapping patterns that resolve to same directories
- Test performance with 100+ directories

## Feature 2: Module Namespacing

### Specification
When `namespaceModules: true`:
- Extract module name from path between configured base and `/lang`
- Nest translations under `modules.{moduleName}.{translations}`
- Support nested modules: `admin/settings` becomes `modules['admin/settings']`

### Implementation Details
```typescript
// namespace.ts
export function extractModuleName(
  fullPath: string, 
  basePath: string
): string | null {
  // Example: fullPath = "/project/app-modules/user/lang"
  //          basePath = "/project/app-modules/**/lang"
  
  const normalized = path.normalize(fullPath)
  const parts = normalized.split('/lang')
  
  if (parts.length < 2) return null
  
  const beforeLang = parts[0]
  const baseDir = basePath.split('*')[0].replace(/\/$/, '')
  
  const modulePath = beforeLang.replace(baseDir + '/', '')
  return modulePath || null
}

export function applyNamespacing(
  translations: Record<string, any>,
  moduleName: string,
  namespaceModules: boolean
): Record<string, any> {
  if (!namespaceModules) return translations
  
  return {
    modules: {
      [moduleName]: translations
    }
  }
}
```

### Edge Cases
1. **Root lang directory**: No module name, don't namespace
2. **Multiple asterisks**: `app/*/*/lang` - use full path as module name
3. **Windows paths**: Normalize separators
4. **Special characters in module names**: Keep as-is, let user handle

### Testing Requirements
- Test extraction with various glob patterns
- Test nested modules (`admin/settings/lang`)
- Test with and without namespacing enabled
- Test module name conflicts

## Feature 3: Cleaner Output Structure

### Specification
- Remove the `php` and `json` separation in output
- Merge both sources at the same level
- PHP files take precedence over JSON in case of conflicts

### Implementation Details
```typescript
// exporter.ts
export function mergeTranslations(
  phpTranslations: Record<string, any>,
  jsonTranslations: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = {}
  
  // First add JSON translations
  for (const locale in jsonTranslations) {
    merged[locale] = { ...jsonTranslations[locale] }
  }
  
  // Then overlay PHP translations (they take precedence)
  for (const locale in phpTranslations) {
    if (!merged[locale]) merged[locale] = {}
    
    // Deep merge PHP translations
    merged[locale] = deepMerge(merged[locale], phpTranslations[locale])
  }
  
  return merged
}
```

### Edge Cases
1. **Key conflicts**: PHP wins over JSON
2. **Deep nesting**: Preserve structure, merge at all levels
3. **Array values**: Replace entirely, don't merge arrays
4. **Empty files**: Skip them

### Testing Requirements
- Test PHP/JSON conflict resolution
- Test deep merging of nested structures
- Test empty file handling
- Test array value handling

## Feature 4: Selective File Loading

### Specification
- ONLY load files matching Laravel translation patterns
- PHP: `{locale}/*.php` and `{locale}/**/*.php`
- JSON: `{locale}.json` at lang root only
- Never load `composer.json`, `package.json`, or other config files

### Implementation Details
```typescript
// scanner.ts
export function isValidTranslationFile(
  filePath: string,
  langPath: string
): boolean {
  const relative = path.relative(langPath, filePath)
  const parts = relative.split(path.sep)
  
  // Check if it's a JSON file
  if (filePath.endsWith('.json')) {
    // Must be {locale}.json at root
    return parts.length === 1 && 
           /^[a-z]{2}(_[A-Z]{2})?\.json$/.test(parts[0])
  }
  
  // Check if it's a PHP file
  if (filePath.endsWith('.php')) {
    // Must be under a locale directory
    const locale = parts[0]
    return /^[a-z]{2}(_[A-Z]{2})?$/.test(locale)
  }
  
  return false
}

export function scanDirectory(
  langPath: string,
  options: ScanOptions
): TranslationFile[] {
  const files: TranslationFile[] = []
  
  // CRITICAL: Only look for locale directories
  const localeDirs = fs.readdirSync(langPath)
    .filter(dir => /^[a-z]{2}(_[A-Z]{2})?$/.test(dir))
  
  // Scan PHP files in locale directories
  for (const locale of localeDirs) {
    const localeDir = path.join(langPath, locale)
    if (!fs.statSync(localeDir).isDirectory()) continue
    
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
  
  // Check for JSON files at root
  const jsonFiles = fs.readdirSync(langPath)
    .filter(file => file.endsWith('.json'))
    .filter(file => /^[a-z]{2}(_[A-Z]{2})?\.json$/.test(file))
  
  files.push(...jsonFiles.map(file => ({
    path: path.join(langPath, file),
    locale: file.replace('.json', ''),
    type: 'json' as const
  })))
  
  return files
}
```

### Security Considerations
1. **Path traversal**: Always use `path.resolve` and check boundaries
2. **Symlink attacks**: Use `realpath` to resolve actual locations
3. **File validation**: Strict regex for locale names
4. **Never glob at root**: Always scan within lang directories

### Testing Requirements
- Test rejection of `composer.json`, `package.json`
- Test acceptance of valid translation files
- Test path traversal attempts
- Test symlink handling
- Test invalid locale names

## Integration with Original Package

### What We Inherit (Don't Reimplement)
1. **Translation Functions**: 
   ```typescript
   // index.ts - just re-export
   export { __, trans, t, trans_choice, setLocale } from 'laravel-translator'
   ```

2. **Vue Plugin**: Use as-is from original package

3. **Runtime behavior**: All translation lookups work identically

### What We Override
Only the Vite plugin and build-time translation loading:
```typescript
// vite.ts
import originalPlugin from 'laravel-translator/vite'
import { ourEnhancedExporter } from './exporter'

export default function betterLaravelTranslator(options) {
  // Resolve globs
  const resolvedPaths = resolveGlobPatterns(options.additionalLangPaths || [])
  
  // Create enhanced options
  const enhancedOptions = {
    ...options,
    additionalLangPaths: resolvedPaths
  }
  
  // Override the exporter
  const plugin = originalPlugin(enhancedOptions)
  plugin.load = function(id) {
    if (id === VIRTUAL_MODULE_ID) {
      return ourEnhancedExporter(enhancedOptions)
    }
  }
  
  return plugin
}
```

## Configuration Interface
```typescript
interface BetterLaravelTranslatorOptions {
  // From original
  langPath?: string // default: 'lang'
  
  // Enhanced to support globs
  additionalLangPaths?: string[]
  
  // New options
  namespaceModules?: boolean // default: false
  excludePaths?: string[] // default: ['node_modules', 'vendor', '.git']
  locales?: string[] // default: undefined (all)
  includeJson?: boolean // default: true
  includePhp?: boolean // default: true
}
```

## Error Handling

### Build Errors
1. **Invalid glob pattern**: Log warning, continue with other paths
2. **Missing directory**: Log debug message, skip silently
3. **File read errors**: Log warning, skip file
4. **Invalid PHP syntax**: Log error with file name, skip file

### User Errors
1. **No translations found**: Log helpful message suggesting to check paths
2. **Circular dependencies**: Not possible with our architecture
3. **Memory issues**: Implement streaming for large translation sets

## Performance Considerations

1. **Glob Resolution**: 
   - Cache results in development
   - Use `glob.sync` for simplicity (build-time only)
   - Limit depth to prevent excessive scanning

2. **File Reading**:
   - Read files in parallel where possible
   - Stream large files if needed
   - Cache parsed PHP files in development

3. **Build Output**:
   - Minimize the output JavaScript
   - Use efficient data structures
   - Consider splitting by locale for large projects

## Testing Strategy

### Unit Tests
1. **scanner.ts**: File validation logic
2. **glob-resolver.ts**: Pattern resolution
3. **namespace.ts**: Module name extraction
4. **exporter.ts**: Translation merging

### Integration Tests
1. **Full build process**: With various configurations
2. **Hot reload**: Ensure changes are detected
3. **Error scenarios**: Missing files, invalid syntax
4. **Large projects**: Performance testing

### Security Tests
1. **Attempt to load config files**: Must fail
2. **Path traversal attempts**: Must fail
3. **Symlink attacks**: Must be handled safely
4. **Invalid file names**: Must be rejected

## Implementation Order

1. **Phase 1**: File Scanner (security foundation)
   - Implement strict file validation
   - Test extensively for security

2. **Phase 2**: Glob Resolver
   - Basic glob pattern support
   - Path resolution and caching

3. **Phase 3**: Clean Structure
   - Remove php/json separation
   - Implement proper merging

4. **Phase 4**: Module Namespacing
   - Module name extraction
   - Optional namespacing logic

5. **Phase 5**: Integration
   - Wire everything into Vite plugin
   - Ensure backward compatibility

## Non-Goals (Do NOT Implement)

1. **Custom translation functions**: Use original package's functions
2. **Runtime glob resolution**: Only at build time
3. **New file formats**: Only PHP and JSON
4. **Performance optimizations**: Focus on correctness first
5. **Custom locale detection**: Use original package's logic
6. **Modified Vue plugin**: Use as-is from original

## Success Criteria

1. **Security**: No config files in browser bundle
2. **Compatibility**: Existing projects work with minimal changes
3. **Features**: All promised features work as documented
4. **Performance**: No worse than original package
5. **Developer Experience**: Clear errors, good debugging

## Common Pitfalls to Avoid

1. **Don't over-engineer**: Keep it simple
2. **Don't break compatibility**: Same API as original
3. **Don't make performance claims**: We don't measure it
4. **Don't add features not in spec**: Stick to the plan
5. **Don't forget Windows**: Test path handling on Windows

## Final Notes

- This package extends, not replaces, the original
- Security through selectivity, not complexity
- Focus on developer experience with glob patterns
- Keep the implementation clean and maintainable
- Test thoroughly, especially security aspects