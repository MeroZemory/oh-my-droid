---
name: deepsearch
description: "Exhaustive multi-strategy codebase search using grep, ripgrep, find, and AST-aware tracing to locate implementations, references, dependencies, and usage patterns for a given symbol, pattern, or concept. Use when you need to find every occurrence of a function, type, config key, or concept across a project — especially when simple text search misses indirect references, re-exports, or dynamic usage."
---

# Deep Search

## Objective

Perform an exhaustive, multi-pass search of the codebase for the specified query, pattern, or concept. Go beyond naive text matching by combining literal search, regex patterns, structural analysis, and dependency tracing to produce a complete map of where and how the target appears.

## Phase 1 — Literal and Regex Search

Start broad. Run parallel searches to catch exact matches, variations, and related terms.

### Exact identifier search

```bash
# Case-sensitive exact match across the project (ripgrep)
rg --word-regexp 'FunctionName' --type-add 'src:*.{ts,tsx,js,jsx,py,go,rs,java}' -t src -n

# If ripgrep is unavailable, fall back to grep
grep -rn --include='*.ts' --include='*.tsx' 'FunctionName' src/
```

### Case-insensitive and partial matches

```bash
# Catch naming-convention variants (camelCase, snake_case, SCREAMING_CASE)
rg -in 'function.name|function_name|FUNCTION_NAME' --glob '!node_modules' --glob '!dist'
```

### Regex pattern search

```bash
# Find all call sites, including method calls and chained usage
rg 'functionName\s*\(' -n --glob '*.{ts,tsx,js,jsx}'

# Find type annotations, generic usage, and interface references
rg ':\s*FunctionName[<\s,\)]' -n --glob '*.{ts,tsx}'

# Find decorators or annotations referencing the target
rg '@FunctionName|@.*FunctionName' -n
```

### File and path search

```bash
# Find files whose name matches the concept
find . -type f \( -name '*function-name*' -o -name '*FunctionName*' \) -not -path '*/node_modules/*'

# Find config or manifest entries
rg 'function.name|functionName' -g '*.{json,yaml,yml,toml,ini,env}'
```

## Phase 2 — Structural and Dependency Tracing

Move beyond text matching to understand the dependency graph around the target.

### Import/export tracing

```bash
# Who imports this symbol?
rg "import.*FunctionName.*from" -n --glob '*.{ts,tsx,js,jsx}'
rg "from\s+['\"].*function-name['\"]" -n --glob '*.{ts,tsx,js,jsx}'

# Who re-exports it? (barrel files, index files)
rg "export.*FunctionName|export \* from.*function-name" -n --glob '*.{ts,tsx,js,jsx}'

# For Python
rg "from\s+\S+\s+import\s+.*FunctionName" -n --glob '*.py'
```

### Reverse dependency walk

For each file that contains the target, ask: "What imports this file?"

```bash
# Extract the module path from the file, then search for imports of that path
rg "from ['\"].*modules/target-module['\"]" -n --glob '*.{ts,tsx,js,jsx}'
```

### Dynamic and indirect references

```bash
# String-based lookups (config keys, event names, route paths)
rg "'function.name'|\"function.name\"|`function.name`" -n

# Object bracket access
rg "\[.*['\"]functionName['\"].*\]" -n

# Reflection, decorators, or registry patterns
rg "register\(.*functionName|resolve\(.*functionName" -n
```

## Phase 3 — Contextual Deep Dive

Read the files identified in Phases 1 and 2 to understand context.

### For each match cluster

1. **Read the surrounding code** (20-30 lines of context) to understand the role of the target at that location.
2. **Check function signatures and type definitions** to understand the contract.
3. **Trace data flow**: Where does the input come from? Where does the output go?
4. **Identify test files**: Search for test files covering the target.

```bash
# Find related test files
find . -type f \( -name '*FunctionName*test*' -o -name '*FunctionName*spec*' -o -name '*test*FunctionName*' \) -not -path '*/node_modules/*'

# Search test content for usage
rg 'FunctionName' --glob '*{test,spec}*.{ts,tsx,js,jsx,py}'
```

### Framework-specific locations to check

- **React/Next.js**: `components/`, `hooks/`, `pages/`, `app/`, `lib/`, `utils/`, `services/`, `store/`, `context/`
- **Express/Fastify**: `routes/`, `middleware/`, `controllers/`, `handlers/`
- **Python/Django**: `views/`, `models/`, `serializers/`, `urls.py`, `tasks/`
- **Go**: Check `cmd/`, `internal/`, `pkg/`, plus any `*_test.go` files
- **Config/infra**: `.env*`, `docker-compose*`, `Dockerfile`, `*.yaml`, `*.toml`, CI workflow files

## Phase 4 — Synthesize and Report

### Output Format

- **Primary Locations** — main implementations with file paths and line numbers
- **Related Files** — dependencies, consumers, and re-exports
- **Usage Patterns** — how the target is used across the codebase (called, extended, composed, configured)
- **Key Insights** — naming conventions, patterns, unexpected coupling, gotchas, dead code

Cite every finding with `file:line` references. Group related findings together.

## Completeness Checkpoint

Before reporting results, verify coverage:

- [ ] Searched for exact name, aliases, and naming-convention variants (camelCase, snake_case, kebab-case)
- [ ] Checked both source code and configuration files (JSON, YAML, TOML, env)
- [ ] Traced imports forward (who uses it) and backward (what it depends on)
- [ ] Searched for dynamic/string-based references (bracket access, registry lookups, event names)
- [ ] Looked in test files for additional usage context
- [ ] Checked framework-specific conventional directories
- [ ] Confirmed no matches were missed in generated/build output directories (dist, build, .next)

If any checklist item is uncovered, go back and run the missing search before finalising the report.
