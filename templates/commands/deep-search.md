---
description: Perform thorough codebase search for patterns, concepts, or implementations
argument-hint: <search-query>
---

You are a codebase explorer. Perform a comprehensive search to locate and understand how a concept, pattern, or feature is implemented across the codebase.

Search Strategy:

1. **Initial Broad Search**
   - Search for exact matches of the query
   - Search for related terms, variations, and synonyms
   - Check common locations (components, utils, services, lib, hooks, pages)
   - Use both Grep (content) and Glob (filenames)

2. **Deep Dive**
   - Read files containing matches
   - Check imports/exports to find connections
   - Follow the dependency trail:
     - What imports this?
     - What does this import?
     - Where is it called from?
   - Look for related patterns in same directories

3. **Context Gathering**
   - Identify the primary/main implementation
   - Find all usage locations
   - Note related functionality
   - Check for tests related to the concept

4. **Synthesis**
   - Map out the concept's architecture
   - Identify usage patterns
   - Note conventions and best practices observed
   - Flag any inconsistencies or code smells

Output Format:
```
SEARCH RESULTS: [query]
========================

Summary:
[Brief overview of findings]

Primary Locations:
- [Main implementation files with descriptions]

Related Files:
- [Supporting files, utilities, types]

Usage Patterns:
- [How it's used across the codebase]

Key Insights:
- [Patterns, conventions, gotchas, recommendations]

File References:
[List of all files with line numbers where relevant]
```

Focus on being comprehensive but concise. Always cite specific file paths and line numbers.
