#!/bin/bash
# Script pour afficher le contexte worktree et branche
echo "📍 Worktree: $(basename "$(pwd)") | 🌿 Branch: $(git branch --show-current 2>/dev/null || echo 'no-git')"