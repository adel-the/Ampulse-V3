'use client'

import { useEffect, useState } from 'react'

interface WorktreeInfo {
  name: string
  displayName: string
}

// Function to detect current worktree/branch
const getWorktreeInfo = async (): Promise<WorktreeInfo> => {
  // Default to master
  let worktreeInfo: WorktreeInfo = { name: 'master', displayName: 'Master' }
  
  try {
    // Try to fetch from git-info API first
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      
      // Only in development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        try {
          const response = await fetch('/api/git-info')
          if (response.ok) {
            const data = await response.json()
            
            // Determine display name based on branch/worktree
            if (data.branch === 'master' || data.worktree === 'master') {
              worktreeInfo = { name: 'master', displayName: 'Master' }
            } else if (data.worktree && data.worktree !== 'master') {
              // Handle single-letter worktrees (F, I, M) differently from named ones
              if (data.worktree.length === 1 && /[FIM]/.test(data.worktree)) {
                worktreeInfo = {
                  name: data.worktree.toLowerCase(),
                  displayName: `Worktree ${data.worktree.toUpperCase()}`
                }
              } else {
                // Named worktrees like "Todo"
                worktreeInfo = {
                  name: data.worktree.toLowerCase(),
                  displayName: data.worktree
                }
              }
            } else if (data.branch) {
              // Fallback to branch name
              worktreeInfo = {
                name: data.branch.toLowerCase(),
                displayName: data.branch
              }
            }
            
            return worktreeInfo
          }
        } catch (error) {
          console.log('Could not fetch git info, trying other methods')
        }
        
        // Fallback to WorktreeIndicator
        const indicator = (window as any).WorktreeIndicator
        if (indicator?.worktree) {
          const worktreeName = indicator.worktree
          worktreeInfo = {
            name: worktreeName.toLowerCase(),
            displayName: `Worktree ${worktreeName}`
          }
        } else {
          // Final fallback: detect from URL port
          const port = window.location.port
          const portNum = parseInt(port)
          if (portNum >= 3010 && portNum <= 3015) {
            // Could be M worktree or Todo worktree - check for further clues
            if (portNum === 3010) {
              // Default to Todo for port 3010 in case git-info fails
              worktreeInfo = { name: 'todo', displayName: 'Todo' }
            } else {
              worktreeInfo = { name: 'm', displayName: 'Worktree M' }
            }
          } else if (portNum >= 3020 && portNum <= 3025) {
            worktreeInfo = { name: 'f', displayName: 'Worktree F' }
          } else if (portNum >= 3001 && portNum <= 3005) {
            worktreeInfo = { name: 'i', displayName: 'Worktree I' }
          }
        }
      }
    }
  } catch (error) {
    console.log('Could not detect worktree, using master as default')
  }
  
  return worktreeInfo
}

export default function DynamicTitle() {
  const [worktreeInfo, setWorktreeInfo] = useState<WorktreeInfo>({ name: 'master', displayName: 'Master' })

  useEffect(() => {
    const updateTitle = async () => {
      const info = await getWorktreeInfo()
      setWorktreeInfo(info)
      
      // Update document title
      const title = `SoliReserve Enhanced - ${info.displayName}`
      if (typeof document !== 'undefined') {
        document.title = title
      }
    }

    // Initial title update
    updateTitle()

    // Update title when worktree indicator is loaded
    const checkWorktreeIndicator = () => {
      if (typeof window !== 'undefined' && (window as any).WorktreeIndicator) {
        updateTitle()
        return true
      }
      return false
    }

    // Check immediately and then periodically until worktree indicator is available
    if (!checkWorktreeIndicator()) {
      const interval = setInterval(() => {
        if (checkWorktreeIndicator()) {
          clearInterval(interval)
        }
      }, 100)

      // Clear interval after 5 seconds to avoid infinite polling
      setTimeout(() => clearInterval(interval), 5000)
    }

    // Listen for navigation changes (for SPA behavior)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateTitle()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // This component doesn't render anything visible
  return null
}