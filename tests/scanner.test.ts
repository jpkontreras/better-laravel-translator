import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { scanDirectory, isValidTranslationFile, validatePath } from '../src/scanner'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'

describe('Scanner Security Tests', () => {
  const testDir = './test-scanner-temp'
  const langDir = join(testDir, 'lang')
  
  beforeEach(() => {
    // Create test directory structure
    mkdirSync(testDir, { recursive: true })
    mkdirSync(langDir, { recursive: true })
  })
  
  afterEach(() => {
    // Clean up
    rmSync(testDir, { recursive: true, force: true })
  })
  
  describe('isValidTranslationFile', () => {
    it('should reject composer.json', () => {
      expect(isValidTranslationFile(join(langDir, 'composer.json'), langDir)).toBe(false)
    })
    
    it('should reject package.json', () => {
      expect(isValidTranslationFile(join(langDir, 'package.json'), langDir)).toBe(false)
    })
    
    it('should reject any JSON file that is not a locale', () => {
      expect(isValidTranslationFile(join(langDir, 'config.json'), langDir)).toBe(false)
      expect(isValidTranslationFile(join(langDir, 'settings.json'), langDir)).toBe(false)
      expect(isValidTranslationFile(join(langDir, 'data.json'), langDir)).toBe(false)
    })
    
    it('should accept valid locale JSON files at root', () => {
      expect(isValidTranslationFile(join(langDir, 'en.json'), langDir)).toBe(true)
      expect(isValidTranslationFile(join(langDir, 'es.json'), langDir)).toBe(true)
      expect(isValidTranslationFile(join(langDir, 'zh_CN.json'), langDir)).toBe(true)
    })
    
    it('should reject JSON files in subdirectories', () => {
      expect(isValidTranslationFile(join(langDir, 'en', 'messages.json'), langDir)).toBe(false)
      expect(isValidTranslationFile(join(langDir, 'subdirectory', 'en.json'), langDir)).toBe(false)
    })
    
    it('should accept PHP files in locale directories', () => {
      expect(isValidTranslationFile(join(langDir, 'en', 'messages.php'), langDir)).toBe(true)
      expect(isValidTranslationFile(join(langDir, 'es', 'auth.php'), langDir)).toBe(true)
      expect(isValidTranslationFile(join(langDir, 'en', 'nested', 'file.php'), langDir)).toBe(true)
    })
    
    it('should reject PHP files not in locale directories', () => {
      expect(isValidTranslationFile(join(langDir, 'config.php'), langDir)).toBe(false)
      expect(isValidTranslationFile(join(langDir, 'wrongfolder', 'file.php'), langDir)).toBe(false)
    })
    
    it('should reject files with invalid locale names', () => {
      expect(isValidTranslationFile(join(langDir, 'english.json'), langDir)).toBe(false)
      expect(isValidTranslationFile(join(langDir, '123', 'file.php'), langDir)).toBe(false)
      expect(isValidTranslationFile(join(langDir, 'EN', 'file.php'), langDir)).toBe(false) // uppercase
    })
  })
  
  describe('scanDirectory', () => {
    it('should never return composer.json or package.json', () => {
      // Create various files including dangerous ones
      writeFileSync(join(langDir, 'composer.json'), '{}')
      writeFileSync(join(langDir, 'package.json'), '{}')
      writeFileSync(join(langDir, 'en.json'), '{}')
      mkdirSync(join(langDir, 'en'), { recursive: true })
      writeFileSync(join(langDir, 'en', 'messages.php'), '<?php return [];')
      
      const files = scanDirectory(langDir)
      
      // Should only find valid translation files
      expect(files).toHaveLength(2) // en.json and en/messages.php
      expect(files.some(f => f.path.endsWith('composer.json'))).toBe(false)
      expect(files.some(f => f.path.endsWith('package.json'))).toBe(false)
    })
    
    it('should not scan directories with invalid locale names', () => {
      mkdirSync(join(langDir, 'node_modules'), { recursive: true })
      mkdirSync(join(langDir, 'vendor'), { recursive: true })
      mkdirSync(join(langDir, 'config'), { recursive: true })
      
      writeFileSync(join(langDir, 'node_modules', 'file.php'), '<?php return [];')
      writeFileSync(join(langDir, 'vendor', 'file.php'), '<?php return [];')
      writeFileSync(join(langDir, 'config', 'file.php'), '<?php return [];')
      
      const files = scanDirectory(langDir)
      
      expect(files).toHaveLength(0)
    })
    
    it('should handle locale filtering', () => {
      // Create files for multiple locales
      writeFileSync(join(langDir, 'en.json'), '{}')
      writeFileSync(join(langDir, 'es.json'), '{}')
      writeFileSync(join(langDir, 'fr.json'), '{}')
      
      const files = scanDirectory(langDir, { locales: ['en', 'es'] })
      
      expect(files).toHaveLength(2)
      expect(files.every(f => f.locale === 'en' || f.locale === 'es')).toBe(true)
    })
    
    it('should handle includeJson and includePhp options', () => {
      writeFileSync(join(langDir, 'en.json'), '{}')
      mkdirSync(join(langDir, 'en'), { recursive: true })
      writeFileSync(join(langDir, 'en', 'messages.php'), '<?php return [];')
      
      const jsonOnly = scanDirectory(langDir, { includePhp: false })
      expect(jsonOnly).toHaveLength(1)
      expect(jsonOnly[0].type).toBe('json')
      
      const phpOnly = scanDirectory(langDir, { includeJson: false })
      expect(phpOnly).toHaveLength(1)
      expect(phpOnly[0].type).toBe('php')
    })
  })
  
  describe('validatePath', () => {
    it('should prevent path traversal attacks', () => {
      const allowedPaths = ['/app/lang']
      
      expect(validatePath('/app/lang/en.json', allowedPaths)).toBe(true)
      expect(validatePath('/app/lang/../../../etc/passwd', allowedPaths)).toBe(false)
      expect(validatePath('/etc/passwd', allowedPaths)).toBe(false)
    })
    
    it('should handle multiple allowed paths', () => {
      const allowedPaths = ['/app/lang', '/modules/user/lang']
      
      expect(validatePath('/app/lang/en.json', allowedPaths)).toBe(true)
      expect(validatePath('/modules/user/lang/en.json', allowedPaths)).toBe(true)
      expect(validatePath('/other/path/en.json', allowedPaths)).toBe(false)
    })
  })
})