import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import type { DashboardDataRow, BlogPostType, AnalysisResult, HeadToHeadAnalysis } from '../types';
import { generateBlogPostFromData, analyzeTranscriptionErrors, generateHeadToHeadAnalysis } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';
import { 
    BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Cell,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { UploadCloudIcon, ChartPieIcon, LightningBoltIcon, TableIcon, SparklesIcon, ChartBarIcon, DocumentTextIcon } from './IconComponents';
import { StatCard } from './dashboard/StatCard';
import { ChartContainer } from './dashboard/ChartContainer';
import { DataTable } from './dashboard/DataTable';
import { AnalysisModal } from './dashboard/AnalysisModal';
import { FilterPanel } from './dashboard/FilterPanel';
import { WERBoxPlotChart } from './dashboard/BoxPlot';
import { average, slugify } from './dashboard/helpers';

interface DashboardUploaderProps {
    onPublish: (post: BlogPostType) => void;
}
interface BlogPostOutput {
  title: string;
  excerpt: string;
  content: string;
}

const calculateBoxPlotStats = (arr: number[]) => {
    if (arr.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    return {
        min: sorted[0],
        q1,
        median,
        q3,
        max: sorted[sorted.length - 1],
    };
};

const DashboardUploader: React.FC<DashboardUploaderProps> = ({ onPublish }) => {
    const [data, setData] = useState<DashboardDataRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [blogPost, setBlogPost] = useState<BlogPostOutput | null>(null);
    const [isGeneratingPost, setIsGeneratingPost] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    
    const [selectedRow, setSelectedRow] = useState<DashboardDataRow | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [modelA, setModelA] = useState<string>('');
    const [modelB, setModelB] = useState<string>('');
    const [comparisonResult, setComparisonResult] = useState<HeadToHeadAnalysis | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [audioLengthRange, setAudioLengthRange] = useState<[number, number]>([0, 0]);
    const [audioLengthFilter, setAudioLengthFilter] = useState<[number, number]>([0, 0]);

    const navigate = useNavigate();
    const { theme } = useTheme();
    
    useEffect(() => {
        if (data.length > 0) {
            const lengths = data.map(d => d['Audio Length']);
            const min = Math.floor(Math.min(...lengths));
            const max = Math.ceil(Math.max(...lengths));
            setAudioLengthRange([min, max]);
            setAudioLengthFilter([min, max]);
        }
    }, [data]);

    const filteredData = useMemo(() => {
        if (data.length === 0) return [];
        return data.filter(row => {
            const modelMatch = selectedModels.length === 0 || selectedModels.includes(row.Model);
            const [minLength, maxLength] = audioLengthFilter;
            const lengthMatch = row['Audio Length'] >= minLength && row['Audio Length'] <= maxLength;
            return modelMatch && lengthMatch;
        });
    }, [data, selectedModels, audioLengthFilter]);


    useEffect(() => {
        const storedData = sessionStorage.getItem('dashboardData');
        const storedFileName = sessionStorage.getItem('dashboardFileName');
        const storedBlogPost = sessionStorage.getItem('generatedBlogPost');
        
        if (storedData && storedFileName) {
          try {
            const parsedData = JSON.parse(storedData);
            setData(parsedData);
            setFileName(storedFileName);
            if (storedBlogPost) {
              setBlogPost(JSON.parse(storedBlogPost));
            }
          } catch (e) {
            console.error("Failed to parse data from session storage", e);
            sessionStorage.clear();
          }
        }
    }, []);
    
    useEffect(() => {
        if (!selectedRow) return;

        let isMounted = true;

        const getAnalysis = async () => {
            setIsAnalyzing(true);
            setAnalysisResult(null);
            try {
                const result = await analyzeTranscriptionErrors(selectedRow.Ground_truth, selectedRow.Transcription);
                if (isMounted) {
                    setAnalysisResult(result);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setAnalysisResult({ summary: "Failed to analyze errors due to an unexpected error.", errors: [] });
                }
            } finally {
                if (isMounted) {
                    setIsAnalyzing(false);
                }
            }
        };
        
        getAnalysis();

        return () => {
            isMounted = false;
        };
    }, [selectedRow]);


    const processFile = useCallback((file: File) => {
        setIsLoading(true);
        setError(null);
        setData([]);
        setBlogPost(null);
        setFileName(file.name);
        setIsPublished(false);
        sessionStorage.removeItem('generatedBlogPost');


        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData: any[] = XLSX.utils.sheet_to_json(ws);

                if (jsonData.length === 0) {
                     throw new Error("The Excel file is empty or formatted incorrectly.");
                }

                const expectedHeaders = ['Audio File Name', 'Audio Length', 'Model', 'Ground_truth', 'Transcription', 'WER Score', 'Inference time (in sec)'];
                const actualHeaders = Object.keys(jsonData[0] || {});
                if (!expectedHeaders.every(header => actualHeaders.includes(header))) {
                    throw new Error(`Invalid file format. Please ensure the Excel file has these columns: ${expectedHeaders.join(', ')}`);
                }

                const parsedData: DashboardDataRow[] = jsonData.reduce((acc: DashboardDataRow[], row, index) => {
                    if (!row || typeof row !== 'object' || Object.keys(row).length === 0) {
                        console.warn(`Skipping empty row at index ${index + 2}.`);
                        return acc;
                    }

                    const audioLength = parseFloat(row['Audio Length']);
                    const werScore = parseFloat(row['WER Score']);
                    const inferenceTime = parseFloat(row['Inference time (in sec)']);
                
                    if (isNaN(audioLength) || isNaN(werScore) || isNaN(inferenceTime) || !row['Audio File Name'] || !row['Model']) {
                        console.warn(`Skipping invalid or incomplete data in row ${index + 2}.`, row);
                        return acc;
                    }
                
                    acc.push({
                      'Audio File Name': String(row['Audio File Name'] ?? ''),
                      'Model': String(row.Model ?? ''),
                      'Ground_truth': String(row.Ground_truth ?? ''),
                      'Transcription': String(row.Transcription ?? ''),
                      'Audio Length': audioLength,
                      'WER Score': werScore,
                      'Inference time (in sec)': inferenceTime,
                    });
                    return acc;
                }, []);
                
                if (parsedData.length === 0 && jsonData.length > 0) {
                    throw new Error("No valid data rows found in the file. Please check that the data is correctly formatted and that numeric columns contain only numbers.");
                }

                setData(parsedData);
                sessionStorage.setItem('dashboardData', JSON.stringify(parsedData));
                sessionStorage.setItem('dashboardFileName', file.name);

            } catch (err: any) {
                setError(err.message || "An error occurred while parsing the file.");
                setFileName(null);
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError("Failed to read the file.");
            setIsLoading(false);
        };
        reader.readAsBinaryString(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.endsWith('.xlsx')) {
            processFile(file);
        } else {
            setError("Invalid file type. Please upload a .xlsx file.");
        }
    };

    const dashboardMetrics = useMemo(() => {
        const sourceData = filteredData;
        if (data.length === 0) return null;

        const werScores = sourceData.map(row => row['WER Score']);
        const inferenceTimes = sourceData.map(row => row['Inference time (in sec)']);
        
        const allModels = [...new Set(data.map(row => row.Model))].sort();
        const modelColors = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#14b8a6', '#d946ef'];

        const modelPerformance = allModels.map(model => {
            const modelData = sourceData.filter(row => row.Model === model);
            if (modelData.length === 0) return null;
            const modelWerScores = modelData.map(row => row['WER Score']);
            const modelInferenceTimes = modelData.map(row => row['Inference time (in sec)']);
            return {
                model,
                avgWer: average(modelWerScores),
                avgInferenceTime: average(modelInferenceTimes),
            };
        }).filter((p): p is NonNullable<typeof p> => p !== null);
        
        const modelsForCharts = modelPerformance.map(p => p.model);

        const mergedWerDistribution = allModels.reduce((acc, model) => {
            const modelData = sourceData.filter(d => d.Model === model);
            const bins = { '0-5%': 0, '5-10%': 0, '10-15%': 0, '15-20%': 0, '20-25%': 0, '25%+': 0 };
            modelData.forEach(row => {
                const wer = row['WER Score'];
                if (wer < 5) bins['0-5%']++;
                else if (wer < 10) bins['5-10%']++;
                else if (wer < 15) bins['10-15%']++;
                else if (wer < 20) bins['15-20%']++;
                else if (wer < 25) bins['20-25%']++;
                else bins['25%+']++;
            });
            Object.keys(bins).forEach(key => {
                if (!acc[key]) acc[key] = { name: key };
                acc[key][model] = bins[key as keyof typeof bins];
            });
            return acc;
        }, {} as { [key: string]: any });
        
        const boxPlotStats = modelsForCharts.map(model => {
            const modelWerScores = sourceData.filter(row => row.Model === model).map(row => row['WER Score']);
            const stats = calculateBoxPlotStats(modelWerScores);
            return {
                model,
                ...stats,
            };
        });

        return {
            summaryStats: {
                totalFiles: sourceData.length,
                avgWer: average(werScores),
                avgInferenceTime: average(inferenceTimes),
            },
            modelPerformance,
            werDistribution: Object.values(mergedWerDistribution),
            boxPlotStats,
            efficiencyData: sourceData.map((row) => ({
                audioLength: row['Audio Length'],
                inferenceTime: row['Inference time (in sec)'],
                wer: row['WER Score'],
                model: row.Model,
            })),
            allModels,
            modelsForCharts,
            modelColors,
        };
    }, [data, filteredData]);
    
    const handleGeneratePost = async () => {
        if (!dashboardMetrics || !fileName) return;

        setIsGeneratingPost(true);
        setBlogPost(null);
        try {
            // Use metrics from unfiltered data for the report
            const allDataMetrics = data.length > 0 ? [...new Set(data.map(row => row.Model))].sort().map(model => {
                const modelData = data.filter(row => row.Model === model);
                return {
                    model,
                    avgWer: average(modelData.map(row => row['WER Score'])),
                    avgInferenceTime: average(modelData.map(row => row['Inference time (in sec)'])),
                };
            }) : [];

            const generatedPost = await generateBlogPostFromData({
                summaryStats: {
                     totalFiles: data.length,
                    avgWer: average(data.map(r => r['WER Score'])),
                    avgInferenceTime: average(data.map(r => r['Inference time (in sec)'])),
                },
                modelPerformance: allDataMetrics,
                fileName,
            });
            setBlogPost(generatedPost);
            sessionStorage.setItem('generatedBlogPost', JSON.stringify(generatedPost));
        } catch (error) {
            console.error("Failed to generate blog post:", error);
            setBlogPost({
                title: "Error",
                excerpt: "Failed to generate AI report.",
                content: "<h2>Error</h2><p>Failed to generate the AI report.</p>"
            });
        } finally {
            setIsGeneratingPost(false);
        }
    };

    const handlePublish = () => {
        if (!blogPost || !dashboardMetrics) return;

        const allDataMetrics = data.length > 0 ? [...new Set(data.map(row => row.Model))].sort().map(model => {
            const modelData = data.filter(row => row.Model === model);
            return {
                model,
                avgWer: average(modelData.map(row => row['WER Score'])),
            };
        }) : [];

        const newPost: BlogPostType = {
            id: `${slugify(blogPost.title)}-${Date.now()}`,
            title: blogPost.title,
            excerpt: blogPost.excerpt,
            content: blogPost.content,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            author: 'AI Analyst',
            modelPerformanceData: allDataMetrics,
        };

        onPublish(newPost);
        setIsPublished(true);
        setTimeout(() => navigate('/blog'), 1500);
    };
    
    const handleResetFilters = () => {
        setSelectedModels([]);
        setAudioLengthFilter(audioLengthRange);
    };

    const resetDashboard = () => {
        setData([]);
        setError(null);
        setFileName(null);
        setBlogPost(null);
        setActiveTab('overview');
        setIsPublished(false);
        setModelA('');
        setModelB('');
        setComparisonResult(null);
        handleResetFilters();
        sessionStorage.removeItem('dashboardData');
        sessionStorage.removeItem('dashboardFileName');
        sessionStorage.removeItem('generatedBlogPost');
    };
    
    const handleAnalyzeRow = (row: DashboardDataRow) => {
        setSelectedRow(row);
    };

    const handleCompareModels = async () => {
        if (!modelA || !modelB || modelA === modelB) return;
        setIsComparing(true);
        setComparisonResult(null);
        try {
            const modelAData = data.filter(d => d.Model === modelA);
            const modelBData = data.filter(d => d.Model === modelB);
            const result = await generateHeadToHeadAnalysis({ name: modelA, data: modelAData }, { name: modelB, data: modelBData });
            setComparisonResult(result);
        } catch (err) {
            console.error(err);
        } finally {
            setIsComparing(false);
        }
    };

    const renderUploader = () => (
         <div className="w-full max-w-2xl mx-auto text-center">
             <h1 className="text-4xl font-bold tracking-tight text-neutral dark:text-gray-100 sm:text-5xl">
                Generate a Dashboard
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Upload your ASR benchmark Excel file to instantly visualize performance metrics.
            </p>
            <div className="mt-8">
                <label 
                    htmlFor="file-upload" 
                    className={`relative cursor-pointer bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed  p-10 flex flex-col items-center justify-center transition-colors ${isDragOver ? 'border-primary bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-secondary'}`}
                    onDragEnter={() => setIsDragOver(true)}
                    onDragLeave={() => setIsDragOver(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <UploadCloudIcon className="h-12 w-12 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-200">
                        Click to upload or drag and drop
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">.XLSX file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx" onChange={handleFileChange} />
                </label>
            </div>
             {error && (
                 <div className="mt-6 text-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 font-semibold">Error</p>
                    <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
            )}
        </div>
    );

    const renderDashboard = () => {
        if (!dashboardMetrics) return null;
        const { summaryStats, modelPerformance, werDistribution, boxPlotStats, efficiencyData, allModels, modelsForCharts, modelColors } = dashboardMetrics;

        const isDark = theme === 'dark';
        const gridColor = isDark ? '#4A5562' : '#e0e0e0';
        const textColor = isDark ? '#CBD5E0' : '#6b7280';
        const tooltipBg = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        const tooltipBorder = isDark ? '#4A5562' : '#d1d5db';

        const tabs = [
            { id: 'overview', label: 'Overview', icon: <ChartPieIcon className="h-5 w-5 mr-2" /> },
            { id: 'performance', label: 'Performance Analysis', icon: <ChartBarIcon className="h-5 w-5 mr-2" /> },
            { id: 'efficiency', label: 'Efficiency Analysis', icon: <LightningBoltIcon className="h-5 w-5 mr-2" /> },
            { id: 'data', label: 'Data Explorer', icon: <TableIcon className="h-5 w-5 mr-2" /> },
            { id: 'report', label: 'Generated Report', icon: <SparklesIcon className="h-5 w-5 mr-2" /> },
        ];
        
        return (
            <>
                <div className="w-full space-y-6">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral dark:text-gray-100">Benchmark Dashboard</h1>
                            <p className="text-gray-600 dark:text-gray-400">Results from: <span className="font-medium text-primary dark:text-accent">{fileName}</span></p>
                        </div>
                        <button onClick={resetDashboard} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-primary shadow-sm transition-colors">Upload New File</button>
                    </div>

                    <FilterPanel
                        allModels={allModels}
                        selectedModels={selectedModels}
                        onModelChange={setSelectedModels}
                        audioLengthRange={audioLengthRange}
                        selectedAudioLength={audioLengthFilter}
                        onAudioLengthChange={setAudioLengthFilter}
                        onReset={handleResetFilters}
                    />

                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-primary text-primary dark:border-accent dark:text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="pt-6">
                        {filteredData.length === 0 && (
                            <div className="text-center py-16">
                                <h2 className="text-2xl font-semibold text-neutral dark:text-gray-200">No Data Matches Your Filters</h2>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Please adjust your filters to see some data.</p>
                            </div>
                        )}
                        {filteredData.length > 0 && activeTab === 'overview' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard title="Total Audio Files" value={summaryStats.totalFiles.toLocaleString()} icon={<DocumentTextIcon className="h-6 w-6"/>} />
                                    <StatCard title="Average WER Score" value={`${summaryStats.avgWer.toFixed(2)}%`} icon={<ChartBarIcon className="h-6 w-6"/>} />
                                    <StatCard title="Average Inference Time" value={`${summaryStats.avgInferenceTime.toFixed(2)}s`} icon={<LightningBoltIcon className="h-6 w-6"/>} />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <ChartContainer title="Average WER Score by Model">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={modelPerformance} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                                                <XAxis dataKey="model" stroke={textColor} />
                                                <YAxis unit="%" stroke={textColor}/>
                                                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} cursor={{fill: isDark ? 'rgba(100,116,139,0.2)' : 'rgba(203,213,225,0.5)'}} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }}/>
                                                <Bar dataKey="avgWer" name="Avg. WER" fill="#3b82f6" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                    <ChartContainer title="Average Inference Time by Model">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={modelPerformance} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                                                <XAxis dataKey="model" stroke={textColor}/>
                                                <YAxis unit="s" stroke={textColor}/>
                                                <Tooltip formatter={(value: number) => `${value.toFixed(2)}s`} cursor={{fill: isDark ? 'rgba(100,116,139,0.2)' : 'rgba(203,213,225,0.5)'}} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }}/>
                                                <Bar dataKey="avgInferenceTime" name="Avg. Inference Time (s)" fill="#22c55e" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </div>
                            </div>
                        )}
                        {filteredData.length > 0 && activeTab === 'performance' && (
                            <div className="space-y-8">
                                <ChartContainer title="WER Score Distribution (Box Plot)" description="Shows the median, quartiles, and range of WER scores for each model.">
                                    <WERBoxPlotChart data={boxPlotStats} theme={theme} allModels={allModels} modelColors={modelColors}/>
                                </ChartContainer>
                                <ChartContainer title="WER Score Distribution by Bins" description="This chart shows how many files fall into different WER score buckets for each model.">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={werDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                            <XAxis dataKey="name" stroke={textColor}/>
                                            <YAxis label={{ value: 'Number of Files', angle: -90, position: 'insideLeft', fill: textColor }} stroke={textColor}/>
                                            <Tooltip cursor={{fill: isDark ? 'rgba(100,116,139,0.2)' : 'rgba(203,213,225,0.5)'}} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }}/>
                                            <Legend wrapperStyle={{color: textColor}}/>
                                            {modelsForCharts.map((model, i) => (
                                                <Bar key={model} dataKey={model} stackId="a" fill={modelColors[allModels.indexOf(model) % modelColors.length]} />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                                    <h3 className="font-semibold text-lg text-neutral dark:text-gray-100 mb-2">Model Showdown: AI Comparison</h3>
                                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select two models to get a detailed head-to-head analysis from our AI.</p>
                                    <div className="flex flex-wrap items-center gap-4 mb-4">
                                        <select value={modelA} onChange={e => setModelA(e.target.value)} className="flex-1 p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600">
                                            <option value="">Select Model 1</option>
                                            {allModels.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <span className="font-bold">vs.</span>
                                        <select value={modelB} onChange={e => setModelB(e.target.value)} className="flex-1 p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600">
                                            <option value="">Select Model 2</option>
                                            {allModels.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <button onClick={handleCompareModels} disabled={!modelA || !modelB || modelA === modelB || isComparing} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                                            {isComparing ? 'Analyzing...' : 'Compare Models'}
                                        </button>
                                    </div>
                                    {isComparing && (
                                        <div className="flex items-center justify-center h-40">
                                            <div role="status" className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary dark:border-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                                            <p className="ml-3 text-gray-600 dark:text-gray-300">Generating comparison...</p>
                                        </div>
                                    )}
                                    {comparisonResult && (
                                        <div className="mt-6 space-y-4 p-4 bg-blue-50 dark:bg-gray-900/50 rounded-lg">
                                            <h4 className="text-xl font-bold text-center text-primary dark:text-accent">Verdict: {comparisonResult.winner}</h4>
                                            <div className="prose prose-lg max-w-none dark:prose-invert">
                                                <p><strong>Executive Summary:</strong> {comparisonResult.summary}</p>
                                                <h5>Accuracy Deep Dive</h5>
                                                <p>{comparisonResult.accuracyAnalysis}</p>
                                                <h5>Speed & Efficiency</h5>
                                                <p>{comparisonResult.speedAnalysis}</p>
                                                <h5>Key Trade-offs</h5>
                                                <p>{comparisonResult.tradeOffs}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                         {filteredData.length > 0 && activeTab === 'efficiency' && (
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                 <ChartContainer title="Inference Time vs. Audio Length">
                                     <ResponsiveContainer width="100%" height={400}>
                                         <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                             <CartesianGrid stroke={gridColor} />
                                             <XAxis type="number" dataKey="audioLength" name="Audio Length" unit="s" stroke={textColor}/>
                                             <YAxis type="number" dataKey="inferenceTime" name="Inference Time" unit="s" stroke={textColor}/>
                                             <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }}/>
                                             <Legend wrapperStyle={{color: textColor}}/>
                                             {modelsForCharts.map((model, i) => (
                                                 <Scatter key={model} name={model} data={efficiencyData.filter(d => d.model === model)} fill={modelColors[allModels.indexOf(model) % modelColors.length]} />
                                             ))}
                                         </ScatterChart>
                                     </ResponsiveContainer>
                                 </ChartContainer>
                                  <ChartContainer title="Avg. WER vs. Avg. Inference Time">
                                     <ResponsiveContainer width="100%" height={400}>
                                         <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                                             <CartesianGrid stroke={gridColor}/>
                                             <XAxis type="number" dataKey="avgInferenceTime" name="Avg. Inference Time" unit="s" stroke={textColor}/>
                                             <YAxis type="number" dataKey="avgWer" name="Avg. WER" unit="%" stroke={textColor}/>
                                             <ZAxis type="category" dataKey="model" name="Model" />
                                             <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }}/>
                                             <Legend wrapperStyle={{color: textColor}}/>
                                             <Scatter name="Models" data={modelPerformance} fill="#8884d8">
                                                {modelPerformance.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={modelColors[allModels.indexOf(entry.model) % modelColors.length]} />
                                                ))}
                                             </Scatter>
                                         </ScatterChart>
                                     </ResponsiveContainer>
                                 </ChartContainer>
                             </div>
                        )}
                        {activeTab === 'data' && <DataTable data={filteredData} onAnalyze={handleAnalyzeRow} />}
                        {activeTab === 'report' && (
                            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md min-h-[400px]">
                                {isGeneratingPost ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div role="status" className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary dark:border-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Generating AI Report...</p>
                                    </div>
                                ) : blogPost ? (
                                    <div className="space-y-6">
                                        <article className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: blogPost.content }} />
                                        <div className="border-t dark:border-gray-700 pt-6 text-center">
                                            {isPublished ? (
                                                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                    ✓ Published successfully! Redirecting...
                                                </div>
                                            ) : (
                                                 <button onClick={handlePublish} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                                                    Publish Report to Blog
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <h2 className="text-xl font-semibold text-neutral dark:text-gray-100">Generate AI-Powered Report</h2>
                                        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">Analyze the key metrics from your uploaded data and generate a comprehensive blog post summarizing the findings.</p>
                                        <button onClick={handleGeneratePost} className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
                                            <SparklesIcon className="h-5 w-5 mr-2" />
                                            Generate AI Report
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                 <AnalysisModal
                    isOpen={!!selectedRow}
                    onClose={() => setSelectedRow(null)}
                    data={selectedRow}
                    result={analysisResult}
                    isLoading={isAnalyzing}
                />
            </>
        );
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center">
                    <div role="status" className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary dark:border-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Processing <span className="font-medium text-neutral dark:text-gray-100">{fileName}</span>...</p>
                </div>
            );
        }
        if (data.length > 0) {
            return renderDashboard();
        }
        return renderUploader();
    };

    return <div className="bg-base-100 dark:bg-neutral p-4 sm:p-6 rounded-lg shadow-xl min-h-[600px] flex items-center justify-center w-full">{renderContent()}</div>;
};

export default DashboardUploader;