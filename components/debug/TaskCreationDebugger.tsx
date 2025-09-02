"use client";

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/useAuth';
import * as maintenanceApi from '@/lib/api/maintenance';

interface TaskCreationDebuggerProps {
  hotelId: number;
  onTaskCreated?: (task: any) => void;
}

export default function TaskCreationDebugger({ hotelId, onTaskCreated }: TaskCreationDebuggerProps) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [testData, setTestData] = useState({
    titre: 'Test Debug Task',
    description: 'Tâche créée pour le debug',
    priorite: 'moyenne'
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const testDirectAPICall = async () => {
    addLog('🧪 Test direct API call');
    addLog(`📊 Données: ${JSON.stringify(testData)}`);
    
    try {
      const result = await maintenanceApi.createMaintenanceTask(testData, hotelId, user?.id);
      
      if (result.success) {
        addLog('✅ API Success!');
        addLog(`📋 Task created with ID: ${result.data?.id}`);
        if (onTaskCreated) {
          onTaskCreated(result.data);
        }
      } else {
        addLog(`❌ API Error: ${result.error}`);
      }
    } catch (error) {
      addLog(`🔥 Exception: ${error}`);
    }
  };

  const testOptimisticUpdate = () => {
    addLog('🎯 Test optimistic update simulation');
    
    const optimisticTask = {
      id: -Date.now(),
      ...testData,
      hotel_id: hotelId,
      statut: 'en_attente' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_owner_id: user?.id || 'temp-user',
      _isOptimistic: true
    };
    
    addLog(`📊 Optimistic task: ${JSON.stringify(optimisticTask, null, 2)}`);
    
    if (onTaskCreated) {
      onTaskCreated(optimisticTask);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-lg mb-4">🔧 Task Creation Debugger</h3>
      
      {/* Test Data Form */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Input
          value={testData.titre}
          onChange={(e) => setTestData({...testData, titre: e.target.value})}
          placeholder="Titre"
          className="text-sm"
        />
        <Input
          value={testData.description}
          onChange={(e) => setTestData({...testData, description: e.target.value})}
          placeholder="Description"
          className="text-sm"
        />
        <select
          value={testData.priorite}
          onChange={(e) => setTestData({...testData, priorite: e.target.value})}
          className="px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="faible">Faible</option>
          <option value="moyenne">Moyenne</option>
          <option value="haute">Haute</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

      {/* Test Buttons */}
      <div className="flex gap-2 mb-4">
        <Button onClick={testDirectAPICall} size="sm" className="bg-blue-500">
          🌐 Test API Direct
        </Button>
        <Button onClick={testOptimisticUpdate} size="sm" className="bg-green-500">
          🎯 Test Optimistic
        </Button>
        <Button onClick={clearLogs} size="sm" variant="outline">
          🧹 Clear Logs
        </Button>
      </div>

      {/* Logs Display */}
      <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono h-32 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">Logs will appear here...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </div>
  );
}