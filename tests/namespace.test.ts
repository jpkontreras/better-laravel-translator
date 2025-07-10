import { describe, it, expect } from 'vitest'
import { extractModuleName, applyNamespacing, mergeNamespacedTranslations } from '../src/namespace'
import { sep } from 'path'

describe('Namespace Tests', () => {
  describe('extractModuleName', () => {
    it('should extract simple module names', () => {
      const fullPath = `/project/app-modules/user/lang`
      const basePath = `/project/app-modules/*/lang`
      
      expect(extractModuleName(fullPath, basePath)).toBe('user')
    })
    
    it('should extract nested module names', () => {
      const fullPath = `/project/app-modules/admin/settings/lang`
      const basePath = `/project/app-modules/**/lang`
      
      expect(extractModuleName(fullPath, basePath)).toBe('admin/settings')
    })
    
    it('should handle Windows paths', () => {
      const fullPath = `C:\\project\\app-modules\\user\\lang`
      const basePath = `C:\\project\\app-modules\\*\\lang`
      
      const result = extractModuleName(fullPath, basePath)
      expect(result).toBe('user')
    })
    
    it('should return null for paths without /lang', () => {
      const fullPath = `/project/app-modules/user/resources`
      const basePath = `/project/app-modules/*/resources`
      
      expect(extractModuleName(fullPath, basePath)).toBe(null)
    })
    
    it('should return null for root lang directory', () => {
      const fullPath = `/project/lang`
      const basePath = `/project/lang`
      
      expect(extractModuleName(fullPath, basePath)).toBe(null)
    })
    
    it('should handle complex glob patterns', () => {
      const fullPath = `/project/packages/vendor/package-name/resources/lang`
      const basePath = `/project/packages/*/*/resources/lang`
      
      expect(extractModuleName(fullPath, basePath)).toBe('vendor/package-name/resources')
    })
    
    it('should handle trailing slashes', () => {
      const fullPath = `/project/app-modules/user/lang/`
      const basePath = `/project/app-modules/*/lang/`
      
      expect(extractModuleName(fullPath, basePath)).toBe('user')
    })
    
    it('should return null if path does not match base pattern', () => {
      const fullPath = `/different/path/user/lang`
      const basePath = `/project/app-modules/*/lang`
      
      expect(extractModuleName(fullPath, basePath)).toBe(null)
    })
  })
  
  describe('applyNamespacing', () => {
    const sampleTranslations = {
      messages: { welcome: 'Welcome' },
      auth: { login: 'Login' }
    }
    
    it('should apply namespacing when enabled with module name', () => {
      const result = applyNamespacing(sampleTranslations, 'user', true)
      
      expect(result).toEqual({
        modules: {
          user: sampleTranslations
        }
      })
    })
    
    it('should not apply namespacing when disabled', () => {
      const result = applyNamespacing(sampleTranslations, 'user', false)
      
      expect(result).toEqual(sampleTranslations)
    })
    
    it('should not apply namespacing when module name is null', () => {
      const result = applyNamespacing(sampleTranslations, null, true)
      
      expect(result).toEqual(sampleTranslations)
    })
    
    it('should handle nested module names', () => {
      const result = applyNamespacing(sampleTranslations, 'admin/settings', true)
      
      expect(result).toEqual({
        modules: {
          'admin/settings': sampleTranslations
        }
      })
    })
  })
  
  describe('mergeNamespacedTranslations', () => {
    it('should merge translations without namespacing', () => {
      const existing = {
        en: {
          messages: { welcome: 'Welcome' }
        }
      }
      
      const newTranslations = {
        auth: { login: 'Login' }
      }
      
      const result = mergeNamespacedTranslations(existing, newTranslations, 'en')
      
      expect(result).toEqual({
        en: {
          messages: { welcome: 'Welcome' },
          auth: { login: 'Login' }
        }
      })
    })
    
    it('should merge namespaced translations', () => {
      const existing = {
        en: {
          messages: { welcome: 'Welcome' }
        }
      }
      
      const newTranslations = {
        modules: {
          user: {
            profile: { name: 'Name' }
          }
        }
      }
      
      const result = mergeNamespacedTranslations(existing, newTranslations, 'en')
      
      expect(result).toEqual({
        en: {
          messages: { welcome: 'Welcome' },
          modules: {
            user: {
              profile: { name: 'Name' }
            }
          }
        }
      })
    })
    
    it('should merge multiple modules', () => {
      const existing = {
        en: {
          modules: {
            user: {
              profile: { name: 'Name' }
            }
          }
        }
      }
      
      const newTranslations = {
        modules: {
          billing: {
            invoice: { paid: 'Paid' }
          }
        }
      }
      
      const result = mergeNamespacedTranslations(existing, newTranslations, 'en')
      
      expect(result).toEqual({
        en: {
          modules: {
            user: {
              profile: { name: 'Name' }
            },
            billing: {
              invoice: { paid: 'Paid' }
            }
          }
        }
      })
    })
    
    it('should deep merge within same module', () => {
      const existing = {
        en: {
          modules: {
            user: {
              profile: { name: 'Name' }
            }
          }
        }
      }
      
      const newTranslations = {
        modules: {
          user: {
            profile: { email: 'Email' },
            settings: { theme: 'Theme' }
          }
        }
      }
      
      const result = mergeNamespacedTranslations(existing, newTranslations, 'en')
      
      expect(result).toEqual({
        en: {
          modules: {
            user: {
              profile: { 
                name: 'Name',
                email: 'Email'
              },
              settings: { theme: 'Theme' }
            }
          }
        }
      })
    })
    
    it('should handle new locale', () => {
      const existing = {
        en: { messages: { welcome: 'Welcome' } }
      }
      
      const newTranslations = {
        messages: { welcome: 'Bienvenido' }
      }
      
      const result = mergeNamespacedTranslations(existing, newTranslations, 'es')
      
      expect(result).toEqual({
        en: { messages: { welcome: 'Welcome' } },
        es: { messages: { welcome: 'Bienvenido' } }
      })
    })
    
    it('should handle conflicts by preferring new translations', () => {
      const existing = {
        en: {
          messages: { welcome: 'Old Welcome' }
        }
      }
      
      const newTranslations = {
        messages: { welcome: 'New Welcome' }
      }
      
      const result = mergeNamespacedTranslations(existing, newTranslations, 'en')
      
      expect(result).toEqual({
        en: {
          messages: { welcome: 'New Welcome' }
        }
      })
    })
  })
})