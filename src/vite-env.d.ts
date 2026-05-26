/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RSVP_API_URL: string;
  readonly VITE_RSVP_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
