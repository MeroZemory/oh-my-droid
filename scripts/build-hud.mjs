#!/usr/bin/env node
/**
 * Build the standalone HUD bundle used by tracked-only plugin installs.
 */

import * as esbuild from 'esbuild';
import { mkdir } from 'node:fs/promises';

const outfile = 'bridge/hud.cjs';

await mkdir('bridge', { recursive: true });
await esbuild.build({
  entryPoints: ['src/hud/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile,
  external: ['@tokscale/core'],
});

console.log(`Built ${outfile}`);
