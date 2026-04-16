/**
 * OMD HUD - Team Element
 *
 * Renders team status in the statusline.
 * Follows the same pattern as ralph.ts and autopilot.ts.
 */

import { RESET } from '../colors.js';

// ANSI color codes
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

export interface TeamStateForHud {
  active: boolean;
  teamName: string;
  phase: string;
  totalMembers: number;
  running: number;
  completed: number;
  failed: number;
}

const PHASE_NAMES: Record<string, string> = {
  init: 'Init',
  delegate: 'Assign',
  coordinate: 'Work',
  collect: 'Collect',
  finalize: 'Done',
};

/**
 * Render team status.
 * Returns null if no team is active.
 *
 * Format: [TEAM:api-build] 2/3 done | Work
 */
export function renderTeam(state: TeamStateForHud | null): string | null {
  if (!state?.active) {
    return null;
  }

  const { teamName, phase, totalMembers, running, completed, failed } = state;
  const phaseName = PHASE_NAMES[phase] || phase;

  // Color based on status
  let statusColor: string;
  if (failed > 0) {
    statusColor = RED;
  } else if (completed === totalMembers) {
    statusColor = GREEN;
  } else if (running > 0) {
    statusColor = CYAN;
  } else {
    statusColor = YELLOW;
  }

  const progress = `${statusColor}${completed}/${totalMembers}${RESET}`;

  let output = `${CYAN}[TEAM:${teamName}]${RESET} ${progress} done`;

  if (failed > 0) {
    output += ` ${RED}${failed} failed${RESET}`;
  }

  output += ` | ${phaseName}`;

  return output;
}

/**
 * Render compact team status for minimal displays.
 *
 * Format: T:2/3 or T:Done or T:Fail
 */
export function renderTeamCompact(state: TeamStateForHud | null): string | null {
  if (!state?.active) {
    return null;
  }

  const { totalMembers, completed, failed, phase } = state;

  if (phase === 'finalize' && failed === 0) {
    return `${GREEN}T:Done${RESET}`;
  }

  if (failed > 0) {
    return `${RED}T:${completed}/${totalMembers}!${RESET}`;
  }

  return `${CYAN}T:${completed}/${totalMembers}${RESET}`;
}
