# Better Laravel Translator - Project Documentation

## Project Overview

This is a complete rewrite of the `laravel-translator-js` package to create `better-laravel-translator`. The original package has critical security vulnerabilities that expose sensitive project data to the browser. This rewrite addresses these issues while adding powerful new features.

## Critical Security Issues Discovered

### 1. **Unfiltered JSON Loading**
The original package loads ALL JSON files in the project, including:
- `composer.json` (exposes PHP dependencies, autoload configs)
- `package.json` (exposes npm dependencies, scripts)
- Any other JSON configuration files

**Evidence**: When inspecting the browser's virtual module, we found composer.json content mixed with translations.

### 2. **No Path Validation**
- No whitelist approach for directories
- No way to exclude sensitive paths
- Potential directory traversal vulnerabilities

### 3. **Poor Data Structure**
- Translations mixed with configuration data
- No clear separation between translation files and other JSON files
- Confusing nested structure with `php` and `json` keys

## Project Goals

1. **Security First**: Completely eliminate exposure of non-translation files
2. **Better Architecture**: Clean, Laravel-compatible translation structure
3. **Enhanced Features**: Glob patterns, module namespacing, better performance
4. **Developer Experience**: TypeScript support, better debugging, clearer errors
5. **Backward Compatibility**: Easy migration path from original package

## Technical Stack

- **Language**: TypeScript
- **Build Tool**: Vite Plugin API
- **Testing**: Vitest
- **File Operations**: Node.js fs, glob
- **Parsing**: PHP parser for .php files, native JSON for .json

## Core Features to Implement

### 1. Secure File Scanner
- Whitelist-based directory scanning
- Strict file pattern matching
- Path validation and sanitization
- Never load config files (composer.json, package.json, etc.)

### 2. Glob Pattern Support
```js
additionalLangPaths: [
    'app-modules/**/lang',     // Recursive module search
    'packages/*/resources/lang' // Package translations
]
```

### 3. Module Namespacing
When `namespaceModules: true`:
```js
{
    "en": {
        "modules": {
            "user": { "messages": { "welcome": "Welcome" } },
            "billing": { "invoices": { "paid": "Paid" } }
        }
    }
}
```

### 4. Clean Output Structure
Remove artificial `php`/`json` separation:
```js
// Instead of: locale.php.file.key or locale.json.key
// We want: locale.file.key
{
    "en": {
        "messages": { "welcome": "Welcome" },
        "validation": { "required": "Required" }
    }
}
```

## Architecture Decisions

### File Detection Algorithm
1. For each configured path (including glob-resolved paths):
   - Check if it's a valid directory
   - Look for locale folders (e.g., `en/`, `es/`)
   - Only process files matching these patterns:
     - PHP: `{locale}/*.php`, `{locale}/**/*.php`
     - JSON: `{locale}.json` (only at lang root)

### Security Implementation
1. **Whitelist Approach**:
   - Only scan explicitly configured directories
   - Default excludes: `node_modules`, `vendor`, `.git`, `storage`
   
2. **File Validation**:
   - Check file extension (.php or .json)
   - Validate file location (must be in locale directory)
   - For JSON: Only accept files named `{locale}.json`

### Module Name Detection
For path `app-modules/user/lang`:
1. Extract module name: `user`
2. For nested: `app-modules/admin/settings/lang` → module: `admin/settings`
3. Use module name for namespacing when enabled

## Configuration API

```typescript
interface BetterLaravelTranslatorOptions {
    // Primary translation directory
    langPath?: string // default: 'lang'
    
    // Additional paths with glob support
    additionalLangPaths?: string[]
    
    // Module namespacing
    namespaceModules?: boolean // default: false
    
    // Security: exclude paths
    excludePaths?: string[] // default: ['node_modules', 'vendor', '.git']
    
    // Only load specific locales
    locales?: string[] // default: all found
    
    // File type filters
    includeJson?: boolean // default: true
    includePhp?: boolean // default: true
    
    // Performance
    cache?: boolean // default: true in production
}
```

## Testing Strategy

### Security Tests (Priority 1)
- Verify composer.json is NEVER loaded
- Verify package.json is NEVER loaded  
- Test directory traversal attempts
- Verify only whitelisted paths are scanned
- Test malicious path patterns

### Feature Tests
- Glob pattern resolution
- Module namespacing on/off
- Multiple language paths
- Locale filtering
- Hot reload functionality

### Integration Tests
- Vite build process
- Development server
- Production builds
- Framework integrations (Vue, React, Svelte)

## Implementation Phases

### Phase 1: Core Security (MUST COMPLETE FIRST)
1. Create secure file scanner
2. Implement path validation
3. Add file type filtering
4. Write security tests

### Phase 2: Enhanced Features
1. Add glob pattern support
2. Implement module namespacing
3. Create clean output structure
4. Add configuration options

### Phase 3: Developer Experience
1. TypeScript definitions
2. Better error messages
3. Debug mode
4. Migration guide

### Phase 4: Testing & Documentation
1. Comprehensive test suite
2. Performance benchmarks
3. Documentation site
4. Example projects

## Development Guidelines

### Code Standards
- Use TypeScript with strict mode
- Follow ESLint rules
- 100% test coverage for security features
- Clear error messages

### Security Principles
1. **Fail Secure**: If unsure, don't load the file
2. **Explicit Configuration**: No magic or assumptions
3. **Validate Everything**: All paths, all files
4. **Clear Boundaries**: Translation files only

### Performance Considerations
- Cache glob resolutions
- Efficient file reading
- Minimal memory footprint
- Fast hot reload

## Migration Guide Notes

From original package:
```js
// Before
laravelTranslator({
    langPath: 'resources/lang',
    additionalLangPaths: ['./app-modules/menu/lang']
})

// After  
betterLaravelTranslator({
    langPath: 'resources/lang',
    additionalLangPaths: ['app-modules/**/lang'], // Glob support!
    namespaceModules: true // Avoid conflicts
})
```

## Known Issues in Original Package

1. **All JSON files loaded**: composer.json, package.json exposed to browser
2. **No glob support**: Must manually list each module path
3. **Poor structure**: Artificial php/json separation
4. **No exclusions**: Can't prevent loading from certain directories
5. **Security risk**: Sensitive configuration exposed to frontend

## Success Criteria

1. **Zero Security Vulnerabilities**: No config files exposed
2. **Better Developer Experience**: Glob patterns, namespacing
3. **Performance**: Equal or better than original
4. **Compatibility**: Easy migration, same API where possible
5. **Testing**: Comprehensive security test suite

## Important Commands

```bash
# Development
npm run dev

# Testing
npm test
npm run test:security  # Run security tests only
npm run test:coverage  # Check coverage

# Building
npm run build

# Type checking
npm run typecheck
```

## Resources

- Original package: https://github.com/sergix44/laravel-translator-js
- Laravel localization: https://laravel.com/docs/localization
- Vite plugin API: https://vitejs.dev/guide/api-plugin.html

## Project Boundaries and Communication Guidelines

### README Tone and Positioning
After user feedback, we've adjusted our approach:
1. **Respectful tone**: We're building on Sergio Brighenti's excellent work, not replacing it
2. **Focus on additions**: Only highlight what we've added, not what was "wrong"
3. **No hype words**: Avoid "powerful", "full safety", "blazing fast", etc.
4. **Factual descriptions**: State what features do without overselling

### Feature Boundaries
**What we ARE building:**
1. **Glob Pattern Support**: Resolve patterns like `app-modules/**/lang` at build time
2. **Module Namespacing**: Optional organization of translations under module names
3. **Cleaner Structure**: Remove `php`/`json` nesting for flatter output
4. **Selective File Loading**: Only load files matching Laravel patterns

**What we ARE NOT building:**
1. **New translation functions**: We use the same API (`__()`, `trans()`, etc.)
2. **Custom locale management**: `setLocale()` works exactly as before
3. **Framework integrations**: Vue plugin works as is from original
4. **Performance optimizations**: We don't claim to be faster
5. **New file formats**: Only PHP and JSON as Laravel supports

### What to Defer to Original Package
- Basic usage and API documentation
- Vue.js integration details  
- Translation function signatures
- Locale management
- Any feature we didn't explicitly change

### Security Messaging
- State that we only load translation files, not all JSON files
- Don't use alarming language about "vulnerabilities"
- Focus on "selective file loading" as a feature, not a security fix

### Implementation Priorities
1. **Security through selectivity**: Only load what's needed
2. **Developer experience**: Glob patterns and namespacing
3. **Compatibility**: Same API as original package
4. **Clarity**: Clean, understandable output structure