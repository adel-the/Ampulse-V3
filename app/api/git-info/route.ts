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

    // Extract worktree letter from path
    let worktree = 'master';
    let port = 3013; // Default port for master

    // Check if path contains worktree indicators (F, I, M)
    const pathParts = worktreePath.split(/[/\\]/);
    const lastPart = pathParts[pathParts.length - 1];
    
    // Look for worktree patterns like "Ampulse v3 F", "Ampulse v3 I", "Ampulse v3 M"
    const worktreeMatch = lastPart.match(/\s([FIM])$/);
    if (worktreeMatch) {
      worktree = worktreeMatch[1];
      
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
    } else if (branch === 'master') {
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