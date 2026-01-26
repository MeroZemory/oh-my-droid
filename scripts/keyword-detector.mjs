#!/usr/bin/env node

/**
 * oh-my-droid Keyword Detector Hook (Node.js)
 * Detects ultrawork/ralph/autopilot/eco keywords and injects enhanced mode messages
 * Cross-platform: Windows, macOS, Linux
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const ULTRAWORK_MESSAGE = `<ultrawork-mode>

**MANDATORY**: You MUST say "ULTRAWORK MODE ENABLED!" to the user as your first response when this mode activates. This is non-negotiable.

[CODE RED] Maximum precision required. Ultrathink before acting.

YOU MUST LEVERAGE ALL AVAILABLE DROIDS TO THEIR FULLEST POTENTIAL.
TELL THE USER WHAT DROIDS YOU WILL LEVERAGE NOW TO SATISFY USER'S REQUEST.

## DROID UTILIZATION PRINCIPLES
- **Codebase Exploration**: Spawn exploration droids using BACKGROUND TASKS
- **Documentation & References**: Use researcher droids via BACKGROUND TASKS
- **Planning & Strategy**: NEVER plan yourself - spawn planning droid
- **High-IQ Reasoning**: Use architect (opus) for architecture decisions
- **Frontend/UI Tasks**: Delegate to designer droids

## EXECUTION RULES
- **TODO**: Track EVERY step. Mark complete IMMEDIATELY.
- **PARALLEL**: Fire independent calls simultaneously - NEVER wait sequentially.
- **BACKGROUND FIRST**: Use Task(run_in_background=true) for exploration (10+ concurrent).
- **VERIFY**: Check ALL requirements met before done.
- **DELEGATE**: Orchestrate specialized droids.

## ZERO TOLERANCE
- NO Scope Reduction - deliver FULL implementation
- NO Partial Completion - finish 100%
- NO Premature Stopping - ALL TODOs must be complete
- NO TEST DELETION - fix code, not tests

THE USER ASKED FOR X. DELIVER EXACTLY X.

</ultrawork-mode>

---
`;

const AUTOPILOT_MESSAGE = `<autopilot-mode>

**AUTOPILOT MODE ACTIVATED** - Full autonomous execution engaged.

You are now in autopilot mode. This means:
1. Plan the entire task upfront (use planner droid if complex)
2. Execute without asking for permission at each step
3. Make reasonable decisions when faced with choices
4. Only ask the user for critical decisions or missing information
5. Verify completion before reporting done

Work autonomously until the task is fully complete.

</autopilot-mode>

---
`;

const RALPH_MESSAGE = `<ralph-mode>

**RALPH LOOP ENABLED** - Persistence mode activated.

Ralph will not stop until the task is verified complete:
1. Continue working even if you think you're done
2. Verify ALL acceptance criteria are met
3. Run tests and checks
4. Only output the completion promise when 100% done
5. If verification fails, iterate and fix issues

No premature stopping. The work is done when it's DONE.

</ralph-mode>

---
`;

const ECO_MESSAGE = `<eco-mode>

**ECO MODE ENABLED** - Token-efficient operation activated.

Optimize for token efficiency:
1. Use LOW-tier droids (Haiku) for simple tasks
2. Use MEDIUM-tier droids (Sonnet) only when needed
3. Use HIGH-tier droids (Opus) only for complex reasoning
4. Prefer direct tool usage over droid spawning for simple operations
5. Be concise in responses while maintaining quality

Balance quality with cost-effectiveness.

</eco-mode>

---
`;

const SEARCH_MESSAGE = `<search-mode>
MAXIMIZE SEARCH EFFORT. Launch multiple background droids IN PARALLEL:
- explore droids (codebase patterns, file structures)
- researcher droids (remote repos, official docs, GitHub examples)
Plus direct tools: Grep, Glob
NEVER stop at first result - be exhaustive.
</search-mode>

---
`;

const ANALYZE_MESSAGE = `<analyze-mode>
ANALYSIS MODE. Gather context before diving deep:

CONTEXT GATHERING (parallel):
- 1-2 explore droids (codebase patterns, implementations)
- 1-2 researcher droids (if external library involved)
- Direct tools: Grep, Glob, LSP for targeted searches

IF COMPLEX (architecture, multi-system, debugging after 2+ failures):
- Consult architect droid (opus) for strategic guidance

SYNTHESIZE findings before proceeding.
</analyze-mode>

---
`;

// Read all stdin
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Extract prompt from various JSON structures
function extractPrompt(input) {
  try {
    const data = JSON.parse(input);
    if (data.prompt) return data.prompt;
    if (data.message?.content) return data.message.content;
    if (Array.isArray(data.parts)) {
      return data.parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join(' ');
    }
    return '';
  } catch {
    // Fallback: try to extract with regex
    const match = input.match(/"(?:prompt|content|text)"\s*:\s*"([^"]+)"/);
    return match ? match[1] : '';
  }
}

// Remove code blocks to prevent false positives
function removeCodeBlocks(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');
}

// Create ultrawork state file
function activateUltraworkState(directory, prompt) {
  const state = {
    active: true,
    started_at: new Date().toISOString(),
    original_prompt: prompt,
    reinforcement_count: 0,
    last_checked_at: new Date().toISOString()
  };

  // Write to local .omd directory
  const localDir = join(directory, '.omd');
  if (!existsSync(localDir)) {
    try { mkdirSync(localDir, { recursive: true }); } catch {}
  }
  try { writeFileSync(join(localDir, 'ultrawork-state.json'), JSON.stringify(state, null, 2)); } catch {}

  // Write to global .factory/omd directory
  const globalDir = join(homedir(), '.factory', 'omd');
  if (!existsSync(globalDir)) {
    try { mkdirSync(globalDir, { recursive: true }); } catch {}
  }
  try { writeFileSync(join(globalDir, 'ultrawork-state.json'), JSON.stringify(state, null, 2)); } catch {}
}

// Create autopilot state file
function activateAutopilotState(directory, prompt) {
  const state = {
    active: true,
    started_at: new Date().toISOString(),
    original_prompt: prompt
  };

  const localDir = join(directory, '.omd');
  if (!existsSync(localDir)) {
    try { mkdirSync(localDir, { recursive: true }); } catch {}
  }
  try { writeFileSync(join(localDir, 'autopilot-state.json'), JSON.stringify(state, null, 2)); } catch {}
}

// Create ralph state file
function activateRalphState(directory, prompt) {
  const state = {
    active: true,
    started_at: new Date().toISOString(),
    prompt: prompt,
    iteration: 0,
    max_iterations: 100,
    completion_promise: 'RALPH_VERIFIED_COMPLETE'
  };

  const localDir = join(directory, '.omd');
  if (!existsSync(localDir)) {
    try { mkdirSync(localDir, { recursive: true }); } catch {}
  }
  try { writeFileSync(join(localDir, 'ralph-state.json'), JSON.stringify(state, null, 2)); } catch {}
}

// Create eco mode state file
function activateEcoState(directory, prompt) {
  const state = {
    active: true,
    started_at: new Date().toISOString(),
    original_prompt: prompt
  };

  const localDir = join(directory, '.omd');
  if (!existsSync(localDir)) {
    try { mkdirSync(localDir, { recursive: true }); } catch {}
  }
  try { writeFileSync(join(localDir, 'eco-state.json'), JSON.stringify(state, null, 2)); } catch {}
}

// Main
async function main() {
  try {
    const input = await readStdin();
    if (!input.trim()) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    let data = {};
    try { data = JSON.parse(input); } catch {}
    const directory = data.directory || process.cwd();

    const prompt = extractPrompt(input);
    if (!prompt) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    const cleanPrompt = removeCodeBlocks(prompt).toLowerCase();

    // Check for ultrawork keywords (highest priority for execution mode)
    if (/\b(ultrawork|ulw|uw)\b/.test(cleanPrompt)) {
      activateUltraworkState(directory, prompt);
      console.log(JSON.stringify({ continue: true, message: ULTRAWORK_MESSAGE }));
      return;
    }

    // Check for autopilot keywords
    if (/\b(autopilot|auto-pilot)\b/.test(cleanPrompt)) {
      activateAutopilotState(directory, prompt);
      console.log(JSON.stringify({ continue: true, message: AUTOPILOT_MESSAGE }));
      return;
    }

    // Check for ralph keywords
    if (/\b(ralph|ralph-loop|ralphloop)\b/.test(cleanPrompt)) {
      activateRalphState(directory, prompt);
      console.log(JSON.stringify({ continue: true, message: RALPH_MESSAGE }));
      return;
    }

    // Check for eco mode keywords
    if (/\b(eco|ecomode|eco-mode|economical)\b/.test(cleanPrompt)) {
      activateEcoState(directory, prompt);
      console.log(JSON.stringify({ continue: true, message: ECO_MESSAGE }));
      return;
    }

    // Check for search keywords
    if (/\b(search|find|locate|lookup|explore|discover|scan|grep|query|browse|detect|trace|seek|track|pinpoint|hunt)\b|where\s+is|show\s+me|list\s+all/.test(cleanPrompt)) {
      console.log(JSON.stringify({ continue: true, message: SEARCH_MESSAGE }));
      return;
    }

    // Check for analyze keywords
    if (/\b(analyze|analyse|investigate|examine|research|study|deep.?dive|inspect|audit|evaluate|assess|review|diagnose|scrutinize|dissect|debug|comprehend|interpret|breakdown|understand)\b|why\s+is|how\s+does|how\s+to/.test(cleanPrompt)) {
      console.log(JSON.stringify({ continue: true, message: ANALYZE_MESSAGE }));
      return;
    }

    // No keywords detected
    console.log(JSON.stringify({ continue: true }));
  } catch (error) {
    // On any error, allow continuation
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
