import React, { useState, useEffect, useRef } from 'react';
import { FilterIcon } from '../IconComponents';

interface FilterPanelProps {
    allModels: string[];
    selectedModels: string[];
    onModelChange: (selected: string[]) => void;
    audioLengthRange: [number, number];
    selectedAudioLength: [number, number];
    onAudioLengthChange: (range: [number, number]) => void;
    onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
    allModels,
    selectedModels,
    onModelChange,
    audioLengthRange,
    selectedAudioLength,
    onAudioLengthChange,
    onReset
}) => {
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsModelDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleModelCheckboxChange = (model: string) => {
        const newSelected = selectedModels.includes(model)
            ? selectedModels.filter(m => m !== model)
            : [...selectedModels, model];
        onModelChange(newSelected);
    };
    
    const handleMinLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Math.min(Number(e.target.value), selectedAudioLength[1] - 1);
        onAudioLengthChange([newMin, selectedAudioLength[1]]);
    };

    const handleMaxLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(Number(e.target.value), selectedAudioLength[0] + 1);
        onAudioLengthChange([selectedAudioLength[0], newMax]);
    };

    const isFiltered = selectedModels.length > 0 || 
        selectedAudioLength[0] > audioLengthRange[0] ||
        selectedAudioLength[1] < audioLengthRange[1];

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-1 lg:col-span-1">
                    <h3 className="font-semibold text-lg flex items-center text-neutral dark:text-gray-100">
                        <FilterIcon className="h-5 w-5 mr-2" />
                        Filter Controls
                    </h3>
                </div>

                {/* Model Filter */}
                <div className="relative md:col-span-1 lg:col-span-1" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Models</label>
                    <button
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                    >
                        <span className="block truncate">
                            {selectedModels.length === 0 ? "All Models" : `${selectedModels.length} selected`}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </span>
                    </button>
                    {isModelDropdownOpen && (
                        <div className="absolute mt-1 w-full rounded-md bg-white dark:bg-gray-700 shadow-lg z-10 max-h-60 overflow-auto">
                            <ul className="py-1">
                                {allModels.map(model => (
                                    <li key={model} className="text-gray-900 dark:text-gray-200 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleModelCheckboxChange(model)}>
                                        <label className="flex items-center font-normal cursor-pointer">
                                            <input type="checkbox" checked={selectedModels.includes(model)} readOnly className="h-4 w-4 border-gray-300 rounded text-secondary focus:ring-secondary" />
                                            <span className="ml-3 block truncate">{model}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Audio Length Filter */}
                <div className="md:col-span-2 lg:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audio Length (seconds)</label>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-mono">{selectedAudioLength[0].toFixed(1)}s</span>
                        <div className="flex-grow">
                             <input
                                type="range"
                                min={audioLengthRange[0]}
                                max={audioLengthRange[1]}
                                value={selectedAudioLength[0]}
                                onChange={handleMinLengthChange}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                             <input
                                type="range"
                                min={audioLengthRange[0]}
                                max={audioLengthRange[1]}
                                value={selectedAudioLength[1]}
                                onChange={handleMaxLengthChange}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer -mt-2"
                            />
                        </div>
                       <span className="text-sm font-mono">{selectedAudioLength[1].toFixed(1)}s</span>
                    </div>
                </div>

                {isFiltered && (
                     <div className="md:col-start-3 lg:col-start-4 flex justify-end">
                        <button onClick={onReset} className="text-sm font-medium text-secondary hover:text-primary dark:text-accent dark:hover:text-secondary">Reset Filters</button>
                    </div>
                )}
            </div>
        </div>
    );
};