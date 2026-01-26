---
name: learn-about-omd
description: Analyze your OMD usage patterns and get personalized Android development recommendations
---

# Learn About OMD

Analyzes your oh-my-droid usage and provides tailored recommendations to improve your Android development workflow.

## What It Does

1. Reads token tracking from `~/.omd/state/token-tracking.jsonl`
2. Reads session history from `.omd/state/session-history.json`
3. Analyzes Android agent usage patterns
4. Identifies underutilized Android-specific features
5. Recommends configuration changes

## Implementation

### Step 1: Gather Data

```bash
# Check for token tracking data
TOKEN_FILE="$HOME/.omd/state/token-tracking.jsonl"
SESSION_FILE=".omd/state/session-history.json"
CONFIG_FILE="$HOME/.factory/.omd-config.json"

echo "📊 Analyzing OMD Usage..."
echo ""

# Check what data is available
HAS_TOKENS=false
HAS_SESSIONS=false
HAS_CONFIG=false

if [[ -f "$TOKEN_FILE" ]]; then
  HAS_TOKENS=true
  TOKEN_COUNT=$(wc -l < "$TOKEN_FILE")
  echo "Token records found: $TOKEN_COUNT"
fi

if [[ -f "$SESSION_FILE" ]]; then
  HAS_SESSIONS=true
  SESSION_COUNT=$(cat "$SESSION_FILE" | jq '.sessions | length' 2>/dev/null || echo "0")
  echo "Sessions found: $SESSION_COUNT"
fi

if [[ -f "$CONFIG_FILE" ]]; then
  HAS_CONFIG=true
  DEFAULT_MODE=$(cat "$CONFIG_FILE" | jq -r '.defaultExecutionMode // "not set"')
  echo "Default execution mode: $DEFAULT_MODE"
fi
```

### Step 2: Analyze Android Agent Usage (if token data exists)

```bash
if [[ "$HAS_TOKENS" == "true" ]]; then
  echo ""
  echo "TOP ANDROID AGENTS BY USAGE:"
  cat "$TOKEN_FILE" | jq -r '.agentName // "main"' | sort | uniq -c | sort -rn | head -10

  echo ""
  echo "MODEL DISTRIBUTION:"
  cat "$TOKEN_FILE" | jq -r '.modelName' | sort | uniq -c | sort -rn
fi
```

### Step 3: Generate Android-Specific Recommendations

Based on patterns found, output recommendations:

**If high Opus usage (>40%) and no ecomode:**
- "Consider using ecomode for routine Android tasks to save tokens"

**If no layout-designer usage:**
- "Try delegating UI work to layout-designer agent"

**If no gradle-expert usage:**
- "Use gradle-expert for build configuration issues"

**If no test-expert usage:**
- "Use test-expert for Android testing strategies"

**If defaultExecutionMode not set:**
- "Set defaultExecutionMode in /omd-setup for consistent behavior"

### Step 4: Output Report

Format a nice summary with:
- Token summary (total, by model)
- Top Android agents used
- Underutilized Android-specific features
- Personalized recommendations

### Graceful Degradation

If no data found:
```
📊 Limited Usage Data Available

No token tracking found. To enable tracking:
1. Ensure ~/.omd/state/ directory exists
2. Run any OMD command to start tracking

Tip: Run /omd-setup to configure OMD properly.
```

## Example Output

```
📊 Your OMD Usage Analysis

TOKEN SUMMARY:
- Total records: 1,234
- By Model: opus 45%, sonnet 40%, haiku 15%

TOP ANDROID AGENTS:
1. kotlin-expert (234 uses)
2. android-architect (89 uses)
3. layout-designer (67 uses)
4. gradle-expert (45 uses)

UNDERUTILIZED FEATURES:
- ecomode: 0 uses (could save ~30% on routine Android tasks)
- test-expert: 2 uses (improve testing coverage)
- compose-expert: 0 uses (for Jetpack Compose work)

RECOMMENDATIONS:
1. Set defaultExecutionMode: "ecomode" to save tokens
2. Use layout-designer for all UI work
3. Delegate Gradle issues to gradle-expert
4. Try test-expert for comprehensive testing strategies
```

## Android-Specific Insights

The analysis looks for:
- Balance between architecture and implementation agents
- UI/layout work delegation patterns
- Gradle and build configuration usage
- Testing agent utilization
- Lifecycle and debugging patterns
