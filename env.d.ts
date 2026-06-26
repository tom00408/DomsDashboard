/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BESTELLUNGEN_KEY: string
  readonly VITE_MTV_ANTRAEGE_KEY: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

