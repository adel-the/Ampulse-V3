import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitInfo {
  branch: string;
  worktree: string;
  port: number;
}

export async function GET() {
  try {
    // Get current branch name
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const branch = branchOutput.trim();

    // Get worktree path
    const { stdout: worktreeOutput } = await execAsync('git rev-parse --show-toplevel');
    const worktreePath = worktreeOutput.trim();

    // Extract worktree information from path and branch
    let worktree = 'master';
    let port = 3013; // Default port for master

    // Check if path contains worktree indicators
    const pathParts = worktreePath.split(/[/\\]/);
    const lastPart = pathParts[pathParts.length - 1];
    
    // Look for worktree patterns like "Ampulse v3 F", "Ampulse v3 I", "Ampulse v3 M"
    const traditionalWorktreeMatch = lastPart.match(/\s([FIM])$/);
    if (traditionalWorktreeMatch) {
      worktree = traditionalWorktreeMatch[1];
      
      // Set port based on worktree
      switch (worktree) {
        case 'F':
          port = 3020;
          break;
        case 'I':
          port = 3001;
          break;
        case 'M':
          port = 3010;
          break;
        default:
          port = 3013;
      }
    } 
    // Check for named worktrees like "Todo", "Feature", etc.
    else if (lastPart && lastPart !== 'Ampulse v3' && branch !== 'master' && branch !== 'main') {
      worktree = branch; // Use branch name as worktree name
      
      // Set port based on worktree/branch name patterns
      const branchLower = branch.toLowerCase();
      if (branchLower.includes('todo') || branchLower === 'todo') {
        port = 3010; // Use Todo port range
      } else if (branchLower.includes('feature') || branchLower.startsWith('f')) {
        port = 3020; // Use F worktree port range
      } else if (branchLower.includes('individual') || branchLower.startsWith('i')) {
        port = 3001; // Use I worktree port range  
      } else if (branchLower.includes('maintenance') || branchLower.startsWith('m')) {
        port = 3010; // Use M worktree port range
      } else {
        // For unknown worktrees, use a sensible default
        port = 3010;
      }
    } 
    // Master branch detection
    else if (branch === 'master' || branch === 'main') {
      worktree = 'master';
      port = 3013;
    }

    const gitInfo: GitInfo = {
      branch,
      worktree,
      port
    };

    return NextResponse.json(gitInfo, { status: 200 });

  } catch (error) {
    console.error('Error getting git info:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get git information',
        details: error instanceof Error ? error.message : 'Unknown error',
        branch: 'unknown',
        worktree: 'unknown',
        port: 3013
      },
      { status: 500 }
    );
  }
}