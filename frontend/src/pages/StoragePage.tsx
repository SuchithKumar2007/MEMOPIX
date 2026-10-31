import React from 'react';
import { StorageCard } from '../components/StorageCard';
import { useAuth } from '../context/AuthContext';

export const StoragePage: React.FC = () => {
  const { storage, refreshStorage } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Storage Dashboard
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          5 TB (5,000,000,000,000 bytes) private storage quota breakdown and usage metrics
        </p>
      </div>

      <StorageCard storage={storage} onRefresh={refreshStorage} />
    </div>
  );
};
