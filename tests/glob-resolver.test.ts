import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resolveGlobPatterns, resolveGlobPatternsWithCache, clearGlobCache } from '../src/glob-resolver'
import { mkdirSync, rmSync } from 'fs'
import { join, resolve } from 'path'

describe('Glob Resolver Tests', () => {
  const testDir = './test-glob-temp'
  
  beforeEach(() => {
    // Create test directory structure
    mkdirSync(testDir, { recursive: true })
    
    // Create module structure
    mkdirSync(join(testDir, 'app-modules', 'user', 'lang'), { recursive: true })
    mkdirSync(join(testDir, 'app-modules', 'billing', 'lang'), { recursive: true })
    mkdirSync(join(testDir, 'app-modules', 'admin', 'lang'), { recursive: true })
    mkdirSync(join(testDir, 'app-modules', 'admin', 'settings', 'lang'), { recursive: true })
    mkdirSync(join(testDir, 'packages', 'core', 'resources', 'lang'), { recursive: true })
    mkdirSync(join(testDir, 'packages', 'ui', 'resources', 'lang'), { recursive: true })
    
    // Create some non-lang directories to ensure they're not matched
    mkdirSync(join(testDir, 'app-modules', 'user', 'src'), { recursive: true })
    mkdirSync(join(testDir, 'node_modules', 'some-package', 'lang'), { recursive: true })
    mkdirSync(join(testDir, 'vendor', 'some-vendor', 'lang'), { recursive: true })
    
    clearGlobCache()
  })
  
  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })
  
  describe('resolveGlobPatterns', () => {
    it('should resolve simple glob patterns', () => {
      const patterns = [join(testDir, 'app-modules', '*', 'lang')]
      const resolved = resolveGlobPatterns(patterns)
      
      expect(resolved).toHaveLength(3)
      expect(resolved.some(p => p.endsWith(join('user', 'lang')))).toBe(true)
      expect(resolved.some(p => p.endsWith(join('billing', 'lang')))).toBe(true)
      expect(resolved.some(p => p.endsWith(join('admin', 'lang')))).toBe(true)
    })
    
    it('should resolve recursive glob patterns', () => {
      const patterns = [join(testDir, 'app-modules', '**', 'lang')]
      const resolved = resolveGlobPatterns(patterns)
      
      expect(resolved).toHaveLength(4) // user, billing, admin, admin/settings
      expect(resolved.some(p => p.endsWith(join('admin', 'settings', 'lang')))).toBe(true)
    })
    
    it('should handle multiple patterns', () => {
      const patterns = [
        join(testDir, 'app-modules', '*', 'lang'),
        join(testDir, 'packages', '*', 'resources', 'lang')
      ]
      const resolved = resolveGlobPatterns(patterns)
      
      expect(resolved.length).toBeGreaterThanOrEqual(5)
    })
    
    it('should exclude default paths (node_modules, vendor, .git)', () => {
      const patterns = [join(testDir, '**', 'lang')]
      const resolved = resolveGlobPatterns(patterns)
      
      expect(resolved.every(p => !p.includes('node_modules'))).toBe(true)
      expect(resolved.every(p => !p.includes('vendor'))).toBe(true)
    })
    
    it('should handle custom exclude paths', () => {
      const patterns = [join(testDir, '**', 'lang')]
      const resolved = resolveGlobPatterns(patterns, {
        excludePaths: ['**/app-modules/**']
      })
      
      expect(resolved.every(p => !p.includes('app-modules'))).toBe(true)
      expect(resolved.some(p => p.includes('packages'))).toBe(true)
    })
    
    it('should handle non-glob patterns (direct paths)', () => {
      const directPath = join(testDir, 'app-modules', 'user', 'lang')
      const patterns = [directPath]
      const resolved = resolveGlobPatterns(patterns)
      
      expect(resolved).toHaveLength(1)
      expect(resolved[0]).toBe(resolve(directPath))
    })
    
    it('should handle non-existent paths gracefully', () => {
      const patterns = [join(testDir, 'non-existent', 'path')]
      const resolved = resolveGlobPatterns(patterns)
      
      expect(resolved).toHaveLength(0)
    })
    
    it('should remove duplicates', () => {
      const patterns = [
        join(testDir, 'app-modules', 'user', 'lang'),
        join(testDir, 'app-modules', '*', 'lang') // This includes 'user' again
      ]
      const resolved = resolveGlobPatterns(patterns)
      
      // Check that each path appears only once
      const unique = [...new Set(resolved)]
      expect(resolved).toHaveLength(unique.length)
    })
    
    it('should return sorted results', () => {
      const patterns = [join(testDir, 'app-modules', '*', 'lang')]
      const resolved = resolveGlobPatterns(patterns)
      
      const sorted = [...resolved].sort()
      expect(resolved).toEqual(sorted)
    })
  })
  
  describe('resolveGlobPatternsWithCache', () => {
    it('should cache results in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const patterns = [join(testDir, 'app-modules', '*', 'lang')]
      
      // First call
      const result1 = resolveGlobPatternsWithCache(patterns)
      
      // Create a new directory that would be matched
      mkdirSync(join(testDir, 'app-modules', 'newmodule', 'lang'), { recursive: true })
      
      // Second call should return cached result
      const result2 = resolveGlobPatternsWithCache(patterns)
      
      expect(result1).toEqual(result2)
      expect(result2.some(p => p.includes('newmodule'))).toBe(false)
      
      // Clear cache and try again
      clearGlobCache()
      const result3 = resolveGlobPatternsWithCache(patterns)
      
      expect(result3.length).toBeGreaterThan(result2.length)
      expect(result3.some(p => p.includes('newmodule'))).toBe(true)
      
      process.env.NODE_ENV = originalEnv
    })
    
    it('should not cache in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const patterns = [join(testDir, 'app-modules', '*', 'lang')]
      
      // First call
      const result1 = resolveGlobPatternsWithCache(patterns, {}, false)
      
      // Create a new directory
      mkdirSync(join(testDir, 'app-modules', 'prodmodule', 'lang'), { recursive: true })
      
      // Second call should see the new directory
      const result2 = resolveGlobPatternsWithCache(patterns, {}, false)
      
      expect(result2.length).toBeGreaterThan(result1.length)
      expect(result2.some(p => p.includes('prodmodule'))).toBe(true)
      
      process.env.NODE_ENV = originalEnv
    })
  })
})