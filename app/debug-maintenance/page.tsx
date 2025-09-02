'use client'

import { useState } from 'react'
import MaintenanceTasksTodoList from '@/components/features/MaintenanceTasksTodoList'
import TaskCreationDebugger from '@/components/debug/TaskCreationDebugger'

// Debug page for testing simplified maintenance tasks approach

const DebugMaintenancePage = () => {
  const [selectedHotelId, setSelectedHotelId] = useState<number>(1)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🔧 Simplified Maintenance Tasks - Instant Updates
        </h1>

        <div className="mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
            <div className="flex items-center gap-4">
              <label className="font-medium">Hotel ID:</label>
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md"
              >
                <option value={1}>Hotel 1</option>
                <option value={2}>Hotel 2</option>
                <option value={3}>Hotel 3</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">✨ New Features to Test:</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li><strong>Instant Task Creation:</strong> Tasks appear immediately when created (no waiting)</li>
            <li><strong>Instant Status Updates:</strong> Click status buttons for immediate feedback</li>
            <li><strong>Instant Deletion:</strong> Tasks disappear immediately when deleted</li>
            <li><strong>Smart Error Handling:</strong> Failed operations are rolled back gracefully</li>
            <li><strong>No Complex Real-time:</strong> Simple optimistic updates with API sync</li>
          </ul>
        </div>

        <TaskCreationDebugger 
          hotelId={selectedHotelId}
          onTaskCreated={(task) => console.log('🎯 Task created from debugger:', task)}
        />

        <MaintenanceTasksTodoList 
          hotelId={selectedHotelId}
          showAddButton={true}
        />
      </div>
    </div>
  )
}

export default DebugMaintenancePage