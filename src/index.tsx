import React from 'react';
import { createRoot } from 'react-dom/client';
import { init } from '@bigstrider/transcodes-sdk';

import App from './App';

const TRANCODES_PROJECT_ID = 'ca30425a3c52e2bfa6603a64';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

async function bootstrap() {
  try {
    await init(TRANCODES_PROJECT_ID);
  } catch (err) {
    console.error('[Transcodes] Failed to initialize SDK:', err);
  }
  root.render(<App />);
}

bootstrap();
