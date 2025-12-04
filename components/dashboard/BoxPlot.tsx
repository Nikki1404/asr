import React from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Cell, ErrorBar
} from 'recharts';

// Custom shape for the median line in the box plot
const MedianLine = (props: any) => {
    const { cx, cy } = props;
    if (cx === undefined || cy === undefined) return null;
    const barWidth = 40; 
    return (
        <line
            x1={cx - barWidth / 2}
            y1={cy}
            x2={cx + barWidth / 2}
            y2={cy}
            stroke="white"
            strokeWidth={2}
            className="recharts-median-line"
        />
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg text-sm">
        <p className="font-bold text-neutral dark:text-gray-100">{label}</p>
        <p><span className="text-gray-600 dark:text-gray-400">Max:</span> {data.max.toFixed(2)}%</p>
        <p><span className="text-gray-600 dark:text-gray-400">Q3 (75th):</span> {data.q3.toFixed(2)}%</p>
        <p><span className="font-semibold text-neutral dark:text-gray-200">Median:</span> {data.median.toFixed(2)}%</p>
        <p><span className="text-gray-600 dark:text-gray-400">Q1 (25th):</span> {data.q1.toFixed(2)}%</p>
        <p><span className="text-gray-600 dark:text-gray-400">Min:</span> {data.min.toFixed(2)}%</p>
      </div>
    );
  }
  return null;
};

export const WERBoxPlotChart = ({ data, modelColors, allModels, theme }: { data: any[], modelColors: string[], allModels: string[], theme: string }) => {
    const isDark = theme === 'dark';
    const gridColor = isDark ? '#4A5562' : '#e0e0e0';
    const textColor = isDark ? '#CBD5E0' : '#6b7280';
    
    // Prepare data in the format the ErrorBar component expects
    const chartData = data.map(item => ({
        ...item,
        whisker: [item.min, item.max],
        box: [item.q1, item.q3]
    }));

    return (
        <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="model" type="category" stroke={textColor} />
                <YAxis
                    dataKey="median"
                    type="number"
                    label={{ value: 'WER Score (%)', angle: -90, position: 'insideLeft', fill: textColor }}
                    stroke={textColor}
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tickFormatter={(tick) => tick.toFixed(1)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{color: textColor}}/>

                <Scatter name="Models" data={chartData} shape={<MedianLine />}>
                     {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={modelColors[allModels.indexOf(entry.model) % modelColors.length]} />
                    ))}
                    {/* Whisker ErrorBar */}
                    <ErrorBar dataKey="whisker" width={4} strokeWidth={2} stroke="gray" direction="y" />
                    {/* Box ErrorBar */}
                    <ErrorBar dataKey="box" width={40} strokeWidth={20} strokeOpacity={0.7} direction="y" />
                </Scatter>
            </ScatterChart>
        </ResponsiveContainer>
    );
};