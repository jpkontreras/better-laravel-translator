import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { exportTranslations } from '../src/exporter'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'

describe('Integration Tests', () => {
  const testDir = './test-integration-temp'
  const mainLangDir = join(testDir, 'lang')
  const modulesDir = join(testDir, 'app-modules')
  
  beforeAll(() => {
    // Create main lang directory with translations
    mkdirSync(join(mainLangDir, 'en'), { recursive: true })
    mkdirSync(join(mainLangDir, 'es'), { recursive: true })
    
    // Create dangerous files that should NEVER be loaded
    writeFileSync(join(mainLangDir, 'composer.json'), JSON.stringify({
      "require": { "laravel/framework": "^10.0" },
      "autoload": { "psr-4": { "App\\": "app/" } }
    }))
    
    writeFileSync(join(mainLangDir, 'package.json'), JSON.stringify({
      "dependencies": { "vue": "^3.0.0" },
      "scripts": { "dev": "vite" }
    }))
    
    // Create valid translation files
    writeFileSync(join(mainLangDir, 'en.json'), JSON.stringify({
      "Welcome": "Welcome to our application",
      "Goodbye": "See you later"
    }))
    
    writeFileSync(join(mainLangDir, 'es.json'), JSON.stringify({
      "Welcome": "Bienvenido a nuestra aplicación",
      "Goodbye": "Hasta luego"
    }))
    
    writeFileSync(join(mainLangDir, 'en', 'auth.php'), `<?php
return [
    'failed' => 'These credentials do not match our records.',
    'password' => 'The provided password is incorrect.',
    'throttle' => 'Too many login attempts.',
];`)
    
    writeFileSync(join(mainLangDir, 'en', 'validation.php'), `<?php
return [
    'required' => 'The :attribute field is required.',
    'email' => 'The :attribute must be a valid email address.',
];`)
    
    // Create module structure
    mkdirSync(join(modulesDir, 'user', 'lang', 'en'), { recursive: true })
    mkdirSync(join(modulesDir, 'billing', 'lang', 'en'), { recursive: true })
    mkdirSync(join(modulesDir, 'admin', 'settings', 'lang', 'en'), { recursive: true })
    
    // Add some config files in modules that should not be loaded
    writeFileSync(join(modulesDir, 'user', 'composer.json'), '{"name": "user-module"}')
    writeFileSync(join(modulesDir, 'user', 'lang', 'config.json'), '{"debug": true}')
    
    // Add module translations
    writeFileSync(join(modulesDir, 'user', 'lang', 'en', 'profile.php'), `<?php
return [
    'name' => 'Name',
    'email' => 'Email Address',
];`)
    
    writeFileSync(join(modulesDir, 'billing', 'lang', 'en', 'invoices.php'), `<?php
return [
    'paid' => 'Paid',
    'pending' => 'Pending',
];`)
    
    // Add nested module translation
    writeFileSync(join(modulesDir, 'admin', 'settings', 'lang', 'en', 'settings.php'), `<?php
return [
    'general' => 'General Settings',
    'advanced' => 'Advanced Settings',
];`)
  })
  
  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true })
  })
  
  describe('Security', () => {
    it('should NEVER load composer.json or package.json', () => {
      const translations = exportTranslations({
        langPath: mainLangDir,
        additionalLangPaths: []
      })
      
      // Check that translations exist
      expect(translations.en).toBeDefined()
      expect(translations.es).toBeDefined()
      
      // Verify no config data leaked
      const stringified = JSON.stringify(translations)
      expect(stringified).not.toContain('laravel/framework')
      expect(stringified).not.toContain('autoload')
      expect(stringified).not.toContain('psr-4')
      expect(stringified).not.toContain('vue')
      expect(stringified).not.toContain('vite')
      expect(stringified).not.toContain('dependencies')
      expect(stringified).not.toContain('scripts')
      expect(stringified).not.toContain('user-module')
      expect(stringified).not.toContain('debug')
    })
  })
  
  describe('Clean Structure', () => {
    it('should merge PHP and JSON translations without php/json separation', () => {
      const translations = exportTranslations({
        langPath: mainLangDir
      })
      
      // Check structure - no 'php' or 'json' keys
      expect(translations.en.php).toBeUndefined()
      expect(translations.en.json).toBeUndefined()
      
      // Check merged content
      expect(translations.en.Welcome).toBe('Welcome to our application')
      expect(translations.en.auth.failed).toBe('These credentials do not match our records.')
      expect(translations.en.validation.required).toBe('The :attribute field is required.')
    })
    
    it('should handle PHP precedence over JSON for conflicting keys', () => {
      // Create a conflicting key
      mkdirSync(join(mainLangDir, 'fr'), { recursive: true })
      writeFileSync(join(mainLangDir, 'fr.json'), JSON.stringify({
        "conflict": "JSON value"
      }))
      writeFileSync(join(mainLangDir, 'fr', 'messages.php'), `<?php
return [
    'conflict' => 'PHP value',
];`)
      
      const translations = exportTranslations({
        langPath: mainLangDir
      })
      
      // PHP should win
      expect(translations.fr.messages.conflict).toBe('PHP value')
      expect(translations.fr.conflict).toBe('JSON value')
    })
  })
  
  describe('Glob Patterns', () => {
    it('should resolve glob patterns in additionalLangPaths', () => {
      const translations = exportTranslations({
        langPath: mainLangDir,
        additionalLangPaths: [join(modulesDir, '*', 'lang')]
      })
      
      // Should find user and billing modules
      expect(Object.keys(translations.en)).toContain('profile')
      expect(Object.keys(translations.en)).toContain('invoices')
    })
    
    it('should resolve recursive glob patterns', () => {
      const translations = exportTranslations({
        langPath: mainLangDir,
        additionalLangPaths: [join(modulesDir, '**', 'lang')]
      })
      
      // Should find all modules including nested ones
      expect(Object.keys(translations.en)).toContain('profile')
      expect(Object.keys(translations.en)).toContain('invoices')
    })
  })
  
  describe('Module Namespacing', () => {
    it('should apply module namespacing when enabled', () => {
      const translations = exportTranslations({
        langPath: mainLangDir,
        additionalLangPaths: [join(modulesDir, '*', 'lang')],
        namespaceModules: true
      })
      
      // Check namespaced structure
      expect(translations.en.modules).toBeDefined()
      expect(translations.en.modules.user).toBeDefined()
      expect(translations.en.modules.user.profile.name).toBe('Name')
      expect(translations.en.modules.billing.invoices.paid).toBe('Paid')
      
      // Root translations should not be namespaced
      expect(translations.en.Welcome).toBe('Welcome to our application')
      expect(translations.en.auth.failed).toBe('These credentials do not match our records.')
    })
    
    it('should handle nested module names', () => {
      const translations = exportTranslations({
        langPath: mainLangDir,
        additionalLangPaths: [join(modulesDir, '**', 'lang')],
        namespaceModules: true
      })
      
      // Check nested module namespace
      expect(translations.en.modules['admin/settings']).toBeDefined()
    })
    
    it('should not namespace when disabled', () => {
      const translations = exportTranslations({
        langPath: mainLangDir,
        additionalLangPaths: [join(modulesDir, '*', 'lang')],
        namespaceModules: false
      })
      
      // Translations should be at root level
      expect(translations.en.modules).toBeUndefined()
      expect(translations.en.profile.name).toBe('Name')
      expect(translations.en.invoices.paid).toBe('Paid')
    })
  })
  
  describe('Locale Filtering', () => {
    it('should only load specified locales', () => {
      const translations = exportTranslations({
        langPath: mainLangDir,
        locales: ['en']
      })
      
      expect(translations.en).toBeDefined()
      expect(translations.es).toBeUndefined()
    })
  })
  
  describe('File Type Filtering', () => {
    it('should respect includeJson option', () => {
      const translations = exportTranslations({
        langPath: mainLangDir,
        includeJson: false
      })
      
      // Should not have JSON translations
      expect(translations.en.Welcome).toBeUndefined()
      expect(translations.en.auth).toBeDefined()
    })
    
    it('should respect includePhp option', () => {
      const translations = exportTranslations({
        langPath: mainLangDir,
        includePhp: false
      })
      
      // Should not have PHP translations
      expect(translations.en.auth).toBeUndefined()
      expect(translations.en.Welcome).toBeDefined()
    })
  })
})