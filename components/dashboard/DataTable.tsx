import React, { useState, useMemo } from 'react';
import type { DashboardDataRow } from '../../types';
import { ArrowLeftIcon, ArrowRightIcon, BeakerIcon } from '../IconComponents';

export const DataTable: React.FC<{ data: DashboardDataRow[]; onAnalyze: (row: DashboardDataRow) => void }> = ({ data, onAnalyze }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof DashboardDataRow; direction: 'asc' | 'desc' } | null>(null);
    const ITEMS_PER_PAGE = 10;

    const sortedData = useMemo(() => {
        let sortableData = [...data];
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                const key = sortConfig.key as keyof DashboardDataRow;
                if (a[key] < b[key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[key] > b[key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, sortedData]);

    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

    const requestSort = (key: keyof DashboardDataRow | 'actions') => {
        if (key === 'actions') return;
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const headers: { key: keyof DashboardDataRow | 'actions'; label: string }[] = [
        { key: 'Audio File Name', label: 'Audio File' },
        { key: 'Model', label: 'Model' },
        { key: 'WER Score', label: 'WER (%)' },
        { key: 'Inference time (in sec)', label: 'Inference (s)' },
        { key: 'Audio Length', label: 'Length (s)' },
        { key: 'actions', label: 'Analyze' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            {headers.map(({key, label}) => (
                                <th key={key} scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${key !== 'actions' ? 'cursor-pointer' : ''}`} onClick={() => requestSort(key)}>
                                    {label}
                                    {sortConfig?.key === key && (<span>{sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}</span>)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{row['Audio File Name']}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row.Model}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row['WER Score'].toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row['Inference time (in sec)'].toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row['Audio Length'].toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <button
                                        onClick={() => onAnalyze(row)}
                                        className="text-secondary hover:text-primary dark:text-accent dark:hover:text-secondary p-1 rounded-full transition-colors"
                                        title="Analyze Transcription Errors"
                                    >
                                        <BeakerIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={headers.length} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No data available for the current filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
             {totalPages > 1 && (
                <div className="py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Previous
                    </button>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                        Next <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </button>
                </div>
            )}
        </div>
    );
};
