/**
 * Rate Limit Wait Feature
 *
 * Auto-resume Factory Droid sessions when rate limits reset.
 *
 * Usage:
 *   omd wait status         - Show current rate limit status
 *   omd wait daemon start   - Start the background daemon
 *   omd wait daemon stop    - Stop the daemon
 *   omd wait detect         - Scan for blocked Factory Droid sessions
 */

// Type exports
export type {
  RateLimitStatus,
  TmuxPane,
  PaneAnalysisResult,
  BlockedPane,
  DaemonState,
  DaemonConfig,
  ResumeResult,
  DaemonCommand,
  DaemonResponse,
} from './types.js';

// Rate limit monitor exports
export {
  checkRateLimitStatus,
  formatTimeUntilReset,
  formatRateLimitStatus,
} from './rate-limit-monitor.js';

// tmux detector exports
export {
  isTmuxAvailable,
  isInsideTmux,
  listTmuxPanes,
  capturePaneContent,
  analyzePaneContent,
  scanForBlockedPanes,
  sendResumeSequence,
  sendToPane,
  formatBlockedPanesSummary,
} from './tmux-detector.js';

// Daemon exports
export {
  readDaemonState,
  isDaemonRunning,
  startDaemon,
  runDaemonForeground,
  stopDaemon,
  getDaemonStatus,
  detectBlockedPanes,
  formatDaemonState,
} from './daemon.js';
