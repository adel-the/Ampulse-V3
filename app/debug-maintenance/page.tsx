'use client'

import { useState, useEffect } from 'react'
import { useMaintenanceTasks } from '@/hooks/useSupabase'
import { forceMaintenanceSync, directFetchTasks, customEventSync, storageEventSync, brutaleReload, getSyncLogs, clearSyncLogs } from '@/lib/forceMaintenanceSync'

const DebugMaintenancePage = () => {
  const [logs, setLogs] = useState<string[]>([])
  const [testsRun, setTestsRun] = useState(0)
  const [lastTestTime, setLastTestTime] = useState<string>('')

  // Hook principal à tester
  const { tasks, loading, error, fetchTasks, createTask } = useMaintenanceTasks()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }

  // Test 1: fetchTasks direct
  const testDirectFetch = async () => {
    addLog('🔄 TEST 1: Direct fetchTasks() via forceMaintenanceSync')
    setTestsRun(prev => prev + 1)
    setLastTestTime(new Date().toLocaleTimeString())
    
    try {
      const result = await directFetchTasks({ enableLogging: true })
      addLog(`✅ Result: ${result.success ? 'Success' : 'Failed'} - ${result.message}`)
    } catch (err) {
      addLog(`❌ directFetchTasks() failed: ${err}`)
    }
  }

  // Test 2: Custom event
  const testCustomEvent = async () => {
    addLog('📡 TEST 2: Custom Event via forceMaintenanceSync')
    
    try {
      const result = await customEventSync({ enableLogging: true })
      addLog(`✅ Result: ${result.success ? 'Success' : 'Failed'} - ${result.message}`)
    } catch (err) {
      addLog(`❌ customEventSync() failed: ${err}`)
    }
  }

  // Test 3: Storage event
  const testStorageEvent = async () => {
    addLog('🗃️ TEST 3: Storage Event via forceMaintenanceSync')
    
    try {
      const result = await storageEventSync({ enableLogging: true })
      addLog(`✅ Result: ${result.success ? 'Success' : 'Failed'} - ${result.message}`)
    } catch (err) {
      addLog(`❌ storageEventSync() failed: ${err}`)
    }
  }

  // Test 4: Create task and check sync
  const testCreateAndSync = async () => {
    addLog('🆕 TEST 4: Create task and check sync')
    
    const newTask = {
      titre: `Test Task ${Date.now()}`,
      description: 'Task created for sync testing',
      priorite: 'moyenne' as const,
      statut: 'en_attente' as const
    }

    try {
      await createTask(newTask)
      addLog('✅ Task created')
      
      // Attendre un délai puis vérifier si la liste s'est mise à jour
      setTimeout(() => {
        addLog(`📊 Tasks count after creation: ${tasks.length}`)
      }, 1000)
    } catch (err) {
      addLog(`❌ Failed to create task: ${err}`)
    }
  }

  // Test 5: Window reload brutal
  const testBrutaleReload = async () => {
    addLog('💥 TEST 5: BRUTAL RELOAD via forceMaintenanceSync')
    
    try {
      const result = await brutaleReload({ delay: 2000, enableLogging: true })
      addLog(`✅ Result: ${result.success ? 'Success' : 'Failed'} - ${result.message}`)
    } catch (err) {
      addLog(`❌ brutaleReload() failed: ${err}`)
    }
  }

  // Test 6: Multiple methods combined
  const testAllMethods = async () => {
    addLog('🚀 TEST 6: ALL METHODS via forceMaintenanceSync')
    
    try {
      const results = await forceMaintenanceSync({ 
        method: 'all', 
        enableLogging: true,
        fallbackDelay: 5000 
      })
      
      results.forEach((result, index) => {
        addLog(`📊 Method ${index + 1}: ${result.method} - ${result.success ? 'Success' : 'Failed'} - ${result.message}`)
      })
    } catch (err) {
      addLog(`❌ forceMaintenanceSync() failed: ${err}`)
    }
  }

  // Test 7: Show sync logs
  const showSyncLogs = () => {
    const syncLogs = getSyncLogs()
    addLog(`📋 SYNC LOGS (${syncLogs.length} entries):`)
    syncLogs.forEach(log => addLog(`   ${log}`))
  }

  // Test 8: Clear sync logs
  const clearAllLogs = () => {
    clearSyncLogs()
    setLogs([])
    addLog('🧹 All logs cleared')
  }

  // Écouter les changements de tasks
  useEffect(() => {
    addLog(`📊 Tasks updated: count = ${tasks.length}`)
  }, [tasks])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🔧 Maintenance Tasks Debug Console
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">📊 Current Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tasks Count:</span>
                <span className="font-mono text-lg">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Loading:</span>
                <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                  {loading ? '⏳ Yes' : '✅ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Error:</span>
                <span className={error ? 'text-red-600' : 'text-green-600'}>
                  {error ? '❌ Yes' : '✅ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tests Run:</span>
                <span className="font-mono">{testsRun}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Test:</span>
                <span className="font-mono text-sm">{lastTestTime || 'Never'}</span>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🧪 Test Controls</h2>
            <div className="space-y-3">
              <button
                onClick={testDirectFetch}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                🔄 Test Direct fetchTasks()
              </button>
              
              <button
                onClick={testCustomEvent}
                className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                📡 Test Custom Event
              </button>
              
              <button
                onClick={testStorageEvent}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              >
                🗃️ Test Storage Event
              </button>
              
              <button
                onClick={testCreateAndSync}
                className="w-full px-4 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                🆕 Test Create & Sync
              </button>
              
              <button
                onClick={testAllMethods}
                className="w-full px-4 py-3 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
              >
                🚀 Test All Methods
              </button>
              
              <button
                onClick={testBrutaleReload}
                className="w-full px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                💥 BRUTAL RELOAD
              </button>
              
              <button
                onClick={showSyncLogs}
                className="w-full px-4 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                📋 Show Sync Logs
              </button>
              
              <button
                onClick={clearAllLogs}
                className="w-full px-4 py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                🧹 Clear All Logs
              </button>
            </div>
          </div>

          {/* Event Logs */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">📝 Event Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet... Run some tests!</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Tasks Preview */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">
              📋 Current Tasks ({tasks.length})
            </h2>
            <div className="max-h-32 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  No maintenance tasks found
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div 
                      key={task.id || index}
                      className="p-2 bg-gray-50 rounded text-sm"
                    >
                      <span className="font-medium">
                        {index + 1}. {task.titre || 'Untitled'}
                      </span>
                      <span className="text-gray-500 ml-2">
                        ({task.statut}) - {task.priorite}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugMaintenancePage