'use client';

export default function DevDashboard() {
  const openWorktree = (url: string) => {
    window.open(url, '_blank');
  };

  const refreshPage = () => {
    window.location.reload();
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
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-emerald-500 text-white animate-pulse">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Worktree M actuel
              </span>
            </div>
          </div>

          {/* Worktree Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Worktree F */}
            <div className="bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-2xl p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">F</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Worktree F</h3>
                <p className="text-gray-300 text-sm">Port 3020</p>
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
            <div className="bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-2xl p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">I</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Worktree I</h3>
                <p className="text-gray-300 text-sm">Port 3001</p>
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

            {/* Worktree M (Current) */}
            <div className="bg-white/10 backdrop-blur-[10px] border-2 border-emerald-400 rounded-2xl p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
                  <span className="text-2xl font-bold text-white">M</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Worktree M</h3>
                <p className="text-emerald-300 text-sm">Port 3010</p>
              </div>
              <button 
                onClick={() => openWorktree('http://localhost:3010')}
                className="w-full py-4 px-6 rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Ouvrir l&apos;application
                </div>
              </button>
              <p className="text-xs text-emerald-300 mt-3 font-medium">✓ Actuel et opérationnel</p>
            </div>
          </div>

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
                onClick={() => openWorktree('http://localhost:3010')}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Application
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