import React, { useEffect, useState } from 'react';

interface PickupNotification {
  id: string;
  itemName: string;
  count: number;
  timestamp: number;
}

export const PickupNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<PickupNotification[]>([]);

  useEffect(() => {
    const handlePickup = (event: CustomEvent<{ itemName: string; count: number }>) => {
      const { itemName, count } = event.detail;
      const id = `pickup-${Date.now()}-${Math.random()}`;
      
      setNotifications(prev => [
        { id, itemName, count, timestamp: Date.now() },
        ...prev
      ]);

      // Remove notification after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 3000);
    };

    window.addEventListener('pickup-item', handlePickup as EventListener);
    return () => window.removeEventListener('pickup-item', handlePickup as EventListener);
  }, []);

  const getItemIcon = (itemName: string): string => {
    switch (itemName) {
      case 'Stick': return '🪵';
      case 'Stone': return '🪨';
      case 'Mud': return '🟫';
      case 'Wood': return '🪵';
      default: return '📦';
    }
  };

  const getItemColor = (itemName: string): string => {
    switch (itemName) {
      case 'Stick': return 'text-amber-600';
      case 'Stone': return 'text-gray-400';
      case 'Mud': return 'text-amber-800';
      case 'Wood': return 'text-amber-700';
      default: return 'text-white';
    }
  };

  return (
    <div className="fixed left-4 top-1/4 flex flex-col gap-2 z-50 pointer-events-none">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 shadow-xl flex items-center gap-3"
          style={{
            animation: 'slideInLeft 0.3s ease-out, fadeOut 0.5s ease-in 2.5s forwards'
          }}
        >
          <span className="text-2xl">{getItemIcon(notification.itemName)}</span>
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${getItemColor(notification.itemName)}`}>
              {notification.itemName}
            </span>
            <span className="text-xs text-white/70">
              +{notification.count}
            </span>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
