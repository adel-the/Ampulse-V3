"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Notification } from '../../types';

interface NotificationSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: number) => void;
}

export default function NotificationSystem({ notifications, onRemoveNotification }: NotificationSystemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          className={`${getNotificationVariant(notification.type)} border animate-in slide-in-from-right-2 duration-300`}
        >
          <div className="flex items-start space-x-2">
            {getNotificationIcon(notification.type)}
            <AlertDescription className="flex-1">
              <div className="text-sm font-medium">{notification.message}</div>
              <div className="text-xs opacity-75">{notification.time}</div>
            </AlertDescription>
            <button
              onClick={() => onRemoveNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Alert>
      ))}
    </div>
  );
} 
