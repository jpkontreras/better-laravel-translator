import * as path from 'path'
import { exportTranslations } from './exporter'
import { BetterLaravelTranslatorOptions } from './types'
import { clearGlobCache } from './glob-resolver'

// Re-export the original interface for backward compatibility
export interface VitePluginOptionsInterface {
  langPath?: string
  additionalLangPaths?: string[]
}

const VIRTUAL_MODULE_ID = 'virtual-laravel-translations'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export default function betterLaravelTranslator(
  options: string | VitePluginOptionsInterface | BetterLaravelTranslatorOptions = 'lang'
): any {
  // Handle backward compatibility with original API
  let config: BetterLaravelTranslatorOptions
  
  if (typeof options === 'string') {
    config = { langPath: options }
  } else {
    config = options as BetterLaravelTranslatorOptions
  }
  
  // Ensure default values
  config.langPath = config.langPath || 'lang'
  config.additionalLangPaths = config.additionalLangPaths || []
  
  // Add Laravel framework translations path if it exists
  const frameworkLangPath = 'vendor/laravel/framework/src/Illuminate/Translation/lang'
  config.additionalLangPaths = [frameworkLangPath, ...config.additionalLangPaths]
  
  return {
    name: 'better-laravel-translator',
    
    config: () => ({
      optimizeDeps: {
        exclude: [VIRTUAL_MODULE_ID]
      },
      ssr: {
        noExternal: ['laravel-translator', 'better-laravel-translator']
      },
    }),
    
    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
      return null
    },
    
    load(id: string) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const translations = exportTranslations(config)
        return `export default ${JSON.stringify(translations)}`
      }
      return null
    },
    
    handleHotUpdate(ctx: any) {
      // Clear glob cache on hot update
      clearGlobCache()
      
      // Check if the updated file is in any of our translation paths
      const isTranslationFile = checkIfTranslationFile(ctx.file, config)
      
      if (isTranslationFile) {
        // Invalidate the virtual module
        const virtualModule = ctx.server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
        if (virtualModule) {
          ctx.server.moduleGraph.invalidateModule(virtualModule)
        }
        
        // Trigger full reload to update translations
        ctx.server.ws.send({
          type: 'full-reload',
          path: '*'
        })
        
        return []
      }
      
      return
    }
  }
}

function checkIfTranslationFile(
  filePath: string,
  config: BetterLaravelTranslatorOptions
): boolean {
  // Normalize the file path
  const normalizedFile = path.normalize(filePath)
  
  // Check if it's a translation file (PHP or JSON)
  if (!normalizedFile.endsWith('.php') && !normalizedFile.endsWith('.json')) {
    return false
  }
  
  // Check primary lang path
  const primaryPath = path.resolve(config.langPath!)
  if (normalizedFile.startsWith(primaryPath + path.sep)) {
    return true
  }
  
  // Check additional paths (including resolved globs)
  // Note: In development, we might want to cache resolved paths
  // For now, we'll do a simple check against the patterns
  for (const pattern of config.additionalLangPaths || []) {
    // Simple check - if the pattern doesn't contain glob characters,
    // do a direct comparison
    if (!pattern.includes('*') && !pattern.includes('?')) {
      const resolvedPath = path.resolve(pattern)
      if (normalizedFile.startsWith(resolvedPath + path.sep)) {
        return true
      }
    } else {
      // For glob patterns, check if the file path matches the pattern structure
      // This is a simplified check - in production you might want to
      // cache resolved paths during the initial load
      const basePattern = pattern.split('*')[0]
      const resolvedBase = path.resolve(basePattern)
      if (normalizedFile.startsWith(resolvedBase)) {
        return true
      }
    }
  }
  
  return false
}