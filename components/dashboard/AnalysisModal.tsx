import React from 'react';
import type { DashboardDataRow, AnalysisResult } from '../../types';
import { SparklesIcon } from '../IconComponents';

export const AnalysisModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    data: DashboardDataRow | null;
    result: AnalysisResult | null;
    isLoading: boolean;
}> = ({ isOpen, onClose, data, result, isLoading }) => {
    if (!isOpen) return null;

    const getErrorTypeClass = (type: string) => {
        switch (type) {
            case 'Substitution': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Deletion': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'Insertion': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-neutral dark:text-gray-100">Transcription Error Analysis</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&times;</button>
                </header>
                <main className="p-6 space-y-4 overflow-y-auto">
                    {data && (
                        <div className="space-y-2 text-sm">
                            <p><strong className="font-medium text-gray-600 dark:text-gray-300">File:</strong> {data['Audio File Name']}</p>
                            <p><strong className="font-medium text-gray-600 dark:text-gray-300">Model:</strong> {data.Model}</p>
                             <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                <p><strong className="font-semibold text-gray-700 dark:text-gray-200">Ground Truth:</strong> <span className="text-gray-800 dark:text-gray-300">{data.Ground_truth}</span></p>
                                <p><strong className="font-semibold text-gray-700 dark:text-gray-200">Transcription:</strong> <span className="text-gray-800 dark:text-gray-300">{data.Transcription}</span></p>
                            </div>
                        </div>
                    )}
                    <div className="border-t dark:border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold text-neutral dark:text-gray-100 mb-2 flex items-center">
                            <SparklesIcon className="h-5 w-5 mr-2 text-secondary dark:text-accent"/> AI Analysis
                        </h3>
                        {isLoading && (
                             <div className="flex items-center justify-center h-40">
                                <div role="status" className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary dark:border-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                                <p className="ml-3 text-gray-600 dark:text-gray-300">Analyzing errors...</p>
                            </div>
                        )}
                        {result && !isLoading && (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/50 border-l-4 border-secondary dark:border-accent rounded-r-lg">
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{result.summary}</p>
                                </div>
                                {result.errors.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-100 dark:bg-gray-700/50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                                                    <th className="px-4 py-2 text-left font-semibold">Expected (Ground Truth)</th>
                                                    <th className="px-4 py-2 text-left font-semibold">Actual (Transcription)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-gray-700">
                                                {result.errors.map((err, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-2">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getErrorTypeClass(err.type)}`}>{err.type}</span>
                                                        </td>
                                                        <td className="px-4 py-2 font-mono text-red-600 dark:text-red-400">{err.ground_truth_segment}</td>
                                                        <td className="px-4 py-2 font-mono text-green-600 dark:text-green-400">{err.transcription_segment}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">No errors found in the transcription.</p>
                                )}
                            </div>
                        )}
                    </div>
                </main>
                <footer className="p-4 border-t dark:border-gray-700 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-neutral dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Close</button>
                </footer>
            </div>
        </div>
    );
};
