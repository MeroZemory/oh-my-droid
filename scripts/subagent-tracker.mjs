#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function main() {
  const action = process.argv[2]; // 'start' or 'stop'

  // Read stdin
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    const data = JSON.parse(input);
    const { processSubagentStart, processSubagentStop } = await import('../dist/hooks/subagent-tracker/index.js');

    let result;
    if (action === 'start') {
      result = await processSubagentStart(data);
    } else if (action === 'stop') {
      result = await processSubagentStop(data);
    } else {
      console.error(`[subagent-tracker] Unknown action: ${action}`);
      process.exit(0);
    }

    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('[subagent-tracker] Error:', error.message);
    process.exit(0); // Don't block on errors
  }
}

main();
