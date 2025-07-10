/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_LOCALE?: string
  readonly VITE_APP_FALLBACK_LOCALE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}