import React from 'react';

export const ChartContainer: React.FC<{ title: string, children: React.ReactNode, description?: string }> = ({ title, children, description }) => (
     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="font-semibold text-lg text-neutral dark:text-gray-100">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
        {children}
    </div>
);
