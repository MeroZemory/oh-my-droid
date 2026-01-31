# OMC Analytics CLI

Command-line interface for Oh-My-ClaudeCode analytics, token tracking, cost reports, and session management.

## Installation

After installing oh-my-droid:

```bash
npm install -g oh-my-droid
```

The `omd-analytics` command will be available globally.

## Commands

### Stats

Show current session statistics including token usage, costs, and top agents.

```bash
omd-analytics stats
omd-analytics stats --json
```

### Cost Reports

Generate cost reports for different time periods.

```bash
omd-analytics cost daily
omd-analytics cost weekly
omd-analytics cost monthly
omd-analytics cost monthly --json
```

### Session History

View historical session data.

```bash
omd-analytics sessions
omd-analytics sessions --limit 20
omd-analytics sessions --json
```

### Agent Usage

Show agent usage breakdown by tokens and cost.

```bash
omd-analytics agents
omd-analytics agents --limit 20
omd-analytics agents --json
```

### Export Data

Export analytics data to JSON or CSV format.

```bash
# Export cost report
omd-analytics export cost json ./cost-report.json
omd-analytics export cost csv ./cost-report.csv --period weekly

# Export session history
omd-analytics export sessions json ./sessions.json
omd-analytics export sessions csv ./sessions.csv

# Export usage patterns
omd-analytics export patterns json ./patterns.json
```

### Cleanup

Remove old logs and orphaned background tasks.

```bash
omd-analytics cleanup
omd-analytics cleanup --retention 60  # Keep 60 days instead of default 30
```

## Data Storage

Analytics data is stored in:
- `~/.omd/analytics/tokens/` - Token usage logs
- `~/.omd/analytics/sessions/` - Session history
- `~/.omd/analytics/metrics/` - Performance metrics

## JSON Output

All commands support `--json` flag for machine-readable output, useful for integration with other tools or scripts.

```bash
# Example: Parse JSON output with jq
omd-analytics stats --json | jq '.stats.totalCost'
omd-analytics agents --json | jq '.topAgents[0].agent'
```

## Examples

### Daily Cost Tracking

```bash
# Check today's cost
omd-analytics cost daily

# Export weekly report
omd-analytics export cost csv weekly-report.csv --period weekly
```

### Session Analysis

```bash
# View recent sessions
omd-analytics sessions --limit 5

# Export all sessions for analysis
omd-analytics export sessions json all-sessions.json
```

### Agent Performance

```bash
# See which agents are most expensive
omd-analytics agents --limit 10

# Export for spreadsheet analysis
omd-analytics export patterns csv agent-patterns.csv
```

### Maintenance

```bash
# Monthly cleanup (keep 90 days of data)
omd-analytics cleanup --retention 90
```
