#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function main() {
  // Read stdin
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    const data = JSON.parse(input);
    const { processPermissionRequest } = await import('../dist/hooks/permission-handler/index.js');
    const result = await processPermissionRequest(data);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('[permission-handler] Error:', error.message);
    process.exit(0); // Don't block on errors
  }
}

main();
