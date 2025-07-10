import {choose} from "./pluralizer";

export interface Config {
    locale: string
    fallbackLocale: string
    translations: Record<string, any>
}

export const translator = (key: string, replace: Record<string, any>, pluralize: boolean, config: Config) => {
    const locale = config?.locale?.toLowerCase() ?? 'en'
    const fallbackLocale = config?.fallbackLocale?.toLowerCase()

    // Check if the key is a translation key
    let translation = getTranslation(key, locale, config.translations)

    // If not, check if the key is a translation key in the fallback locale
    if (!translation && fallbackLocale) {
        translation = getTranslation(key, fallbackLocale, config.translations)
    }

    return translate(translation ?? key, replace, locale, pluralize) as string
}

const getTranslation = (key: string, locale: string, translations: Record<string, any>) => {
    // With our new structure, translations are directly under locale
    // without php/json separation
    try {
        const localeTranslations = translations[locale]
        if (!localeTranslations) return null
        
        return key
            .split('.')
            .reduce((t: any, i: string) => t && t[i] || null, localeTranslations)
    } catch (e) {
        return null
    }
}

const translate = (translation: string | object, replace: Record<string, any> = {}, locale: string, shouldPluralize: boolean = false) => {
    if (shouldPluralize && typeof translation === 'string') {
        translation = choose(translation, replace['count'], locale);
    }

    if (typeof translation !== 'string') {
        return translation
    }

    Object.keys(replace).forEach(key => {
        const value = replace[key]?.toString()

        translation = (translation as string)
            .replace(':' + key, value)
            .replace(':' + key.charAt(0).toUpperCase() + key.slice(1), value.charAt(0).toUpperCase() + value.slice(1))
            .replace(':' + key.toUpperCase(), value.toUpperCase())
    })

    return translation
}

// Create a singleton config object
let currentConfig: Config = {
    locale: 'en',
    fallbackLocale: 'en',
    translations: {}
}

// Export the translation functions with the same API as original package
export const __ = (key: string, replace: Record<string, any> = {}) => {
    return translator(key, replace, false, currentConfig)
}

export const trans = (key: string, replace: Record<string, any> = {}) => {
    return translator(key, replace, false, currentConfig)
}

export const t = (key: string, replace: Record<string, any> = {}) => {
    return translator(key, replace, false, currentConfig)
}

export const trans_choice = (key: string, count: number, replace: Record<string, any> = {}) => {
    return translator(key, { ...replace, count }, true, currentConfig)
}

export const setLocale = (locale: string, fallbackLocale?: string) => {
    currentConfig.locale = locale
    if (fallbackLocale) {
        currentConfig.fallbackLocale = fallbackLocale
    }
}

export const getLocale = () => {
    return currentConfig.locale
}

export const hasTranslation = (key: string) => {
    const translation = getTranslation(key, currentConfig.locale, currentConfig.translations)
    return translation !== null
}

// Load translations from virtual module
try {
    // @ts-ignore
    import('virtual-laravel-translations').then(module => {
        currentConfig.translations = module.default
    }).catch(() => {
        // In test environment, we might not have virtual module
    })
} catch (e) {
    // Silent fail for environments where dynamic import is not available
}

// Export function to manually set translations (useful for tests)
export const setTranslations = (translations: Record<string, any>) => {
    currentConfig.translations = translations
}
