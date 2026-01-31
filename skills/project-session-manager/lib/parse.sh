#!/bin/bash
# PSM Reference Parser

# Parse a reference string into components
# Supports:
#   omc#123           -> alias=omc, number=123
#   owner/repo#123    -> repo=owner/repo, number=123
#   https://...       -> parsed from URL
#   #123              -> number=123 (use current repo)
#
# Usage: psm_parse_ref "omc#123"
# Returns: type|alias|repo|number|local_path|base
psm_parse_ref() {
    local ref="$1"
    local type=""
    local alias=""
    local repo=""
    local number=""
    local local_path=""
    local base="main"

    # GitHub PR URL
    if [[ "$ref" =~ ^https://github\.com/([^/]+)/([^/]+)/pull/([0-9]+) ]]; then
        repo="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
        number="${BASH_REMATCH[3]}"
        type="pr"
        # Try to find alias for this repo
        alias=$(psm_find_alias_for_repo "$repo")
        if [[ -n "$alias" ]]; then
            IFS='|' read -r _ local_path base <<< "$(psm_get_project "$alias")"
        fi
        echo "pr|${alias:-}|$repo|$number|${local_path:-}|$base"
        return 0
    fi

    # GitHub Issue URL
    if [[ "$ref" =~ ^https://github\.com/([^/]+)/([^/]+)/issues/([0-9]+) ]]; then
        repo="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
        number="${BASH_REMATCH[3]}"
        type="issue"
        alias=$(psm_find_alias_for_repo "$repo")
        if [[ -n "$alias" ]]; then
            IFS='|' read -r _ local_path base <<< "$(psm_get_project "$alias")"
        fi
        echo "issue|${alias:-}|$repo|$number|${local_path:-}|$base"
        return 0
    fi

    # alias#number format (e.g., omc#123)
    if [[ "$ref" =~ ^([a-zA-Z][a-zA-Z0-9_-]*)#([0-9]+)$ ]]; then
        alias="${BASH_REMATCH[1]}"
        number="${BASH_REMATCH[2]}"

        local project_info
        project_info=$(psm_get_project "$alias")
        if [[ $? -eq 0 ]]; then
            IFS='|' read -r repo local_path base <<< "$project_info"
            # Determine type from context (default to issue, caller specifies)
            echo "ref|$alias|$repo|$number|$local_path|$base"
            return 0
        else
            echo "error|Unknown project alias: $alias|||"
            return 1
        fi
    fi

    # owner/repo#number format
    if [[ "$ref" =~ ^([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)#([0-9]+)$ ]]; then
        repo="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
        number="${BASH_REMATCH[3]}"
        alias=$(psm_find_alias_for_repo "$repo")
        if [[ -n "$alias" ]]; then
            IFS='|' read -r _ local_path base <<< "$(psm_get_project "$alias")"
        fi
        echo "ref|${alias:-}|$repo|$number|${local_path:-}|$base"
        return 0
    fi

    # Just #number (use current repo)
    if [[ "$ref" =~ ^#([0-9]+)$ ]]; then
        number="${BASH_REMATCH[1]}"
        # Detect repo from current directory
        if git rev-parse --git-dir > /dev/null 2>&1; then
            local remote_url=$(git remote get-url origin 2>/dev/null)
            if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
                repo="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
                local_path=$(git rev-parse --show-toplevel)
                alias=$(psm_find_alias_for_repo "$repo")
            fi
        fi
        echo "ref|${alias:-}|${repo:-}|$number|${local_path:-}|$base"
        return 0
    fi

    echo "error|Cannot parse reference: $ref|||"
    return 1
}

# Find project alias for a given repo
psm_find_alias_for_repo() {
    local target_repo="$1"
    if [[ ! -f "$PSM_PROJECTS" ]]; then
        return 1
    fi

    jq -r ".aliases | to_entries[] | select(.value.repo == \"$target_repo\") | .key" "$PSM_PROJECTS" | head -1
}

# Sanitize a string for use in filenames/session names
psm_sanitize() {
    local input="$1"
    # Remove path traversal, convert to lowercase, replace spaces with dashes
    echo "$input" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | head -c 30
}

# Generate a slug from title
psm_slugify() {
    local title="$1"
    local max_len="${2:-30}"
    echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | head -c "$max_len"
}
