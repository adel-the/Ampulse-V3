#!/bin/bash

# Simple statusline script for Claude Code
# Shows current worktree and git branch

# Check if we're in a git repository
if git rev-parse --git-dir >/dev/null 2>&1; then
    # Get current branch
    branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    
    # Determine worktree based on current path
    current_path=$(pwd)
    if echo "$current_path" | grep -q "Todo"; then
        worktree="Todo"
    else
        worktree="Master"
    fi
    
    # Output statusline
    printf "📍 Worktree: %s | 🌿 Branch: %s" "$worktree" "$branch"
else
    printf "📍 No Git Repository"
fi