/// <reference types="vite/client" />

declare const __DEV_SESSION_ID__: string;

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
