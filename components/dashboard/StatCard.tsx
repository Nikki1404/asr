import React from 'react';

export const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-blue-100 dark:bg-blue-900/50 text-primary dark:text-accent p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-neutral dark:text-gray-100">{value}</p>
        </div>
    </div>
);
