'use client';

import { useEffect, useState } from 'react';

interface GitInfo {
  branch: string;
  worktree: string;
  port: number;
  error?: string;
}

export default function DevDashboard() {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openWorktree = (url: string) => {
    window.open(url, '_blank');
  };

  const refreshPage = () => {
    window.location.reload();
  };

  useEffect(() => {
    const fetchGitInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/git-info');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch git info');
        }
        
        setGitInfo(data);
      } catch (err) {
        console.error('Error fetching git info:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch git info');
        // Set default values on error
        setGitInfo({
          branch: 'unknown',
          worktree: 'master',
          port: 3013
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGitInfo();
  }, []);

  // Helper functions for dynamic styling
  const getWorktreeColor = (worktree: string) => {
    switch (worktree) {
      case 'F': return { bg: 'bg-purple-600', border: 'border-purple-500', text: 'text-purple-300' };
      case 'I': return { bg: 'bg-orange-600', border: 'border-orange-500', text: 'text-orange-300' };
      case 'M': return { bg: 'bg-green-600', border: 'border-green-500', text: 'text-green-300' };
      default: return { bg: 'bg-blue-600', border: 'border-blue-500', text: 'text-blue-300' };
    }
  };

  const getCurrentWorktreeInfo = () => {
    if (!gitInfo) return { name: 'Loading...', displayPort: '---' };
    
    const displayNames: Record<string, string> = {
      'F': 'Worktree F',
      'I': 'Worktree I', 
      'M': 'Worktree M',
      'master': 'Master Branch'
    };
    
    return {
      name: displayNames[gitInfo.worktree] || `${gitInfo.branch} Branch`,
      displayPort: gitInfo.port.toString()
    };
  };

  const isCurrentWorktree = (worktreeType: string) => {
    if (!gitInfo) return false;
    return gitInfo.worktree === worktreeType;
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="flex items-center justify-center py-8">
        <div className="max-w-4xl w-full mx-auto p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Dev Dashboard</h1>
            <p className="text-xl text-white/80">Navigation rapide entre worktrees</p>
            <div className="mt-6">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white ${loading ? 'animate-pulse bg-gray-600' : `${getWorktreeColor(gitInfo?.worktree || 'master').bg} ${gitInfo ? 'animate-pulse' : ''}`}`}>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                {loading ? 'Chargement...' : error ? 'Erreur de chargement' : `${getCurrentWorktreeInfo().name} - Port ${getCurrentWorktreeInfo().displayPort}`}
              </span>
            </div>
          </div>

          {/* Worktree Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Worktree F */}
            <div className={`bg-white/10 backdrop-blur-[10px] rounded-2xl p-8 text-center ${
              isCurrentWorktree('F') ? `border-2 ${getWorktreeColor('F').border}` : 'border border-white/20'
            }`}>
              <div className="mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isCurrentWorktree('F') ? `${getWorktreeColor('F').bg} animate-pulse` : 'bg-gray-400'
                }`}>
                  <span className="text-2xl font-bold text-white">F</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Worktree F</h3>
                <p className={`text-sm ${
                  isCurrentWorktree('F') ? getWorktreeColor('F').text : 'text-gray-300'
                }`}>Port 3020</p>
              </div>
              <button 
                className="bg-gray-500/30 cursor-not-allowed w-full py-4 px-6 rounded-xl text-white font-medium" 
                disabled
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                  </svg>
                  Non configuré
                </div>
              </button>
              <p className="text-xs text-gray-400 mt-3">Configure worktree F first</p>
            </div>

            {/* Worktree I */}
            <div className={`bg-white/10 backdrop-blur-[10px] rounded-2xl p-8 text-center ${
              isCurrentWorktree('I') ? `border-2 ${getWorktreeColor('I').border}` : 'border border-white/20'
            }`}>
              <div className="mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isCurrentWorktree('I') ? `${getWorktreeColor('I').bg} animate-pulse` : 'bg-gray-400'
                }`}>
                  <span className="text-2xl font-bold text-white">I</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Worktree I</h3>
                <p className={`text-sm ${
                  isCurrentWorktree('I') ? getWorktreeColor('I').text : 'text-gray-300'
                }`}>Port 3001</p>
              </div>
              <button 
                className="bg-gray-500/30 cursor-not-allowed w-full py-4 px-6 rounded-xl text-white font-medium" 
                disabled
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                  </svg>
                  Non configuré
                </div>
              </button>
              <p className="text-xs text-gray-400 mt-3">Configure worktree I first</p>
            </div>

            {/* Master Branch / Worktree M */}
            <div className={`bg-white/10 backdrop-blur-[10px] rounded-2xl p-8 text-center ${
              isCurrentWorktree('master') || isCurrentWorktree('M') ? `border-2 ${getWorktreeColor(gitInfo?.worktree || 'master').border}` : 'border border-white/20'
            }`}>
              <div className="mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isCurrentWorktree('master') || isCurrentWorktree('M') ? `${getWorktreeColor(gitInfo?.worktree || 'master').bg} animate-pulse` : 'bg-gray-400'
                }`}>
                  <span className="text-2xl font-bold text-white">M</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">{gitInfo?.worktree === 'M' ? 'Worktree M' : 'Master Branch'}</h3>
                <p className={`text-sm ${
                  isCurrentWorktree('master') || isCurrentWorktree('M') ? getWorktreeColor(gitInfo?.worktree || 'master').text : 'text-gray-300'
                }`}>Port {gitInfo?.port || 3013}</p>
              </div>
              <button 
                onClick={() => openWorktree(`http://localhost:${gitInfo?.port || 3013}`)}
                className={`w-full py-4 px-6 rounded-xl text-white font-medium transition-all duration-200 ${
                  isCurrentWorktree('master') || isCurrentWorktree('M') 
                    ? 'hover:shadow-lg' 
                    : 'bg-gray-500/30 cursor-not-allowed'
                }`}
                style={isCurrentWorktree('master') || isCurrentWorktree('M') ? {
                  background: gitInfo?.worktree === 'M' 
                    ? 'linear-gradient(135deg, #16A34A, #15803D)'
                    : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  boxShadow: gitInfo?.worktree === 'M'
                    ? '0 4px 15px rgba(34, 197, 94, 0.3)'
                    : '0 4px 15px rgba(59, 130, 246, 0.3)'
                } : {}}
                disabled={!(isCurrentWorktree('master') || isCurrentWorktree('M'))}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  {isCurrentWorktree('master') || isCurrentWorktree('M') ? 'Ouvrir l\'application' : 'Non configuré'}
                </div>
              </button>
              <p className={`text-xs mt-3 font-medium ${
                isCurrentWorktree('master') || isCurrentWorktree('M')
                  ? `${getWorktreeColor(gitInfo?.worktree || 'master').text} font-medium`
                  : 'text-gray-400'
              }`}>
                {isCurrentWorktree('master') || isCurrentWorktree('M') ? '✓ Actuel et opérationnel' : 'Configure worktree M first'}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-8 bg-red-500/10 backdrop-blur-[10px] border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-red-300 mb-2">Erreur de chargement</h4>
                  <p className="text-red-200 text-sm">{error}</p>
                  <button 
                    onClick={refreshPage}
                    className="mt-4 px-4 py-2 bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-white mb-2">SoliReserve Enhanced</h4>
                <p className="text-gray-300 text-sm">Système de gestion hôtelière moderne</p>
                <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-400">
                  <span>Next.js 14</span>
                  <span>•</span>
                  <span>TypeScript</span>
                  <span>•</span>
                  <span>Supabase</span>
                  <span>•</span>
                  <span>Tailwind CSS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 text-center">
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => openWorktree(`http://localhost:${gitInfo?.port || 3013}`)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Chargement...' : 'Application'}
              </button>
              <button 
                onClick={refreshPage}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}