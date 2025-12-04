import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import type { BlogPostType } from '../types';

// Helper to generate consistent pseudo-random colors from a string
const generateColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

const Trends: React.FC = () => {
  const { theme } = useTheme();

  const { chartData, modelKeys, modelColors } = useMemo(() => {
    let posts: BlogPostType[] = [];
    try {
      const storedPosts = localStorage.getItem('blogPosts');
      if (storedPosts) {
        posts = JSON.parse(storedPosts);
      }
    } catch (e) {
      console.error("Failed to parse blog posts from local storage", e);
    }

    const dataByDate: { [date: string]: { date: string, [model: string]: any } } = {};

    posts
      .filter(post => post.modelPerformanceData && post.modelPerformanceData.length > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date chronologically
      .forEach(post => {
        const postDate = new Date(post.date).toISOString().split('T')[0]; // Format as YYYY-MM-DD for grouping
        if (!dataByDate[postDate]) {
          dataByDate[postDate] = { date: postDate };
        }
        post.modelPerformanceData!.forEach(perf => {
          // Avoid overwriting if multiple reports on same day for the same model
          if (!(perf.model in dataByDate[postDate])) {
            dataByDate[postDate][perf.model] = perf.avgWer;
          }
        });
      });

    const chartData = Object.values(dataByDate);
    const modelKeys = Array.from(new Set(chartData.flatMap(d => Object.keys(d).filter(k => k !== 'date'))));
    const modelColors: { [key: string]: string } = {};
    modelKeys.forEach(key => {
        modelColors[key] = generateColor(key);
    });

    return { chartData, modelKeys, modelColors };
  }, []);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#4A5562' : '#e0e0e0';
  const textColor = isDark ? '#CBD5E0' : '#6b7280';
  const labelColor = isDark ? '#E2E8F0' : '#374151';
  const tooltipBg = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const tooltipBorder = isDark ? '#4A5562' : '#d1d5db';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral dark:text-gray-100 sm:text-5xl">
          ASR Performance Trends
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Word Error Rate (WER) evolution from your published reports. Lower is better.
        </p>
      </div>
      {chartData.length > 1 ? (
        <>
          <div style={{ width: '100%', height: 450 }}>
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" stroke={textColor} />
                <YAxis
                  label={{ value: 'Word Error Rate (%)', angle: -90, position: 'insideLeft', fill: labelColor }}
                  stroke={textColor}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '0.5rem',
                    color: textColor,
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'WER']}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                {modelKeys.map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={modelColors[key]}
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                    connectNulls // Connect lines over missing data points
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
            <p>This chart dynamically visualizes the performance of ASR models based on the reports you have published. Each line represents a model, tracking its WER over time. This trend analysis helps you understand progress and regressions based on your own benchmark data.</p>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-neutral dark:text-gray-200">Not Enough Data to Display Trends</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Please upload and publish at least two reports on different dates to see performance trends over time.</p>
        </div>
      )}
    </div>
  );
};

export default Trends;