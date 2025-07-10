import { expect, test } from "vitest"
import { exportTranslations } from "../src/exporter"

test('exports with clean structure - no php/json separation', async () => {
    const trans = exportTranslations('./tests/fixtures/lang')

    // Check that we have the clean structure
    expect(trans.en).toBeDefined()
    expect(trans.en.php).toBeUndefined() // No php key
    expect(trans.en.json).toBeUndefined() // No json key
    
    // Check merged content at root level
    expect(trans.en.auth?.failed).toBe("These credentials do not match our records.")
    expect(trans.en["Welcome!"]).toBe("Wecome!") // JSON translations at root
})

test('maintains nested structure for PHP files', async () => {
    const trans = exportTranslations('./tests/fixtures/lang')

    // PHP file structure is preserved
    expect(trans.en.domain?.user?.first_name).toBe("First name")
    expect(trans.en.nested?.cars?.car?.is_electric).toBe("Electric")
})

test('handles multiple locales', async () => {
    const trans = exportTranslations('./tests/fixtures/lang')

    expect(Object.keys(trans)).toContain('en')
    expect(Object.keys(trans)).toContain('es')
    expect(Object.keys(trans)).toContain('fr')
    expect(Object.keys(trans)).toContain('pt')
})

test('locale filtering works', async () => {
    const trans = exportTranslations({
        langPath: './tests/fixtures/lang',
        locales: ['en', 'es']
    })

    expect(Object.keys(trans)).toEqual(['en', 'es'])
    expect(trans.fr).toBeUndefined()
    expect(trans.pt).toBeUndefined()
})

test('file type filtering works', async () => {
    const transJsonOnly = exportTranslations({
        langPath: './tests/fixtures/lang',
        includePhp: false
    })

    expect(transJsonOnly.en["Welcome!"]).toBe("Wecome!")
    expect(transJsonOnly.en.auth).toBeUndefined() // PHP files not loaded

    const transPhpOnly = exportTranslations({
        langPath: './tests/fixtures/lang',
        includeJson: false
    })

    expect(transPhpOnly.en["Welcome!"]).toBeUndefined() // JSON files not loaded
    expect(transPhpOnly.en.auth?.failed).toBe("These credentials do not match our records.")
})