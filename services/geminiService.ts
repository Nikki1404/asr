import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, DashboardDataRow, HeadToHeadAnalysis } from '../types';

// Initialize AI client only if API key is available. This prevents the app from crashing.
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const getApiError = (message: string) => {
  console.error(message);
  // This error will be displayed in the UI.
  return "Error: AI service is not configured. Missing API key.";
}

export const generateSummary = async (reportContent: string): Promise<string> => {
  if (!ai) {
    return getApiError("Gemini API key is not configured.");
  }

  try {
    const plainTextContent = reportContent.replace(/<[^>]*>?/gm, ''); // Strip HTML tags for cleaner processing

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Please summarize the following ASR benchmark report. Focus on the key findings, the models compared, and the main conclusion. Keep the summary concise and easy to understand for a technical audience.\n\nReport:\n${plainTextContent}`,
      config: {
        temperature: 0.5,
        topP: 0.95,
        topK: 64,
      },
    });
    
    return result.text;
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error);
    return "Error: Could not generate summary. Please check the API configuration and try again.";
  }
};

interface BlogGenerationData {
  summaryStats: {
    totalFiles: number;
    avgWer: number;
    avgInferenceTime: number;
  };
  modelPerformance: {
    model: string;
    avgWer: number;
    avgInferenceTime: number;
  }[];
  fileName: string;
}

interface BlogPostOutput {
  title: string;
  excerpt: string;
  content: string;
}

export const generateBlogPostFromData = async (data: BlogGenerationData): Promise<BlogPostOutput> => {
   if (!ai) {
    return {
      title: "Error: AI Service Not Configured",
      excerpt: "The AI service could not be reached because the API key is missing.",
      content: "<h2>Configuration Error</h2><p>The report could not be generated because the connection to the AI service is not configured. Please ensure the API key is set correctly by the application administrator.</p>",
    };
  }

  const { summaryStats, modelPerformance, fileName } = data;

  const bestWerModel = modelPerformance.reduce((prev, current) => (prev.avgWer < current.avgWer ? prev : current));
  const bestInferenceModel = modelPerformance.reduce((prev, current) => (prev.avgInferenceTime < current.avgInferenceTime ? prev : current));
  
  const modelPerformanceDataForPrompt = JSON.stringify(modelPerformance.map(p => ({
    model: p.model,
    'Average WER (%)': p.avgWer.toFixed(2),
    'Average Inference Time (s)': p.avgInferenceTime.toFixed(2),
  })));

  const prompt = `
    Analyze the following ASR benchmark data and generate a comprehensive, visually appealing blog post. The tone should be professional but accessible.

    **Source File:** ${fileName}
    
    **Overall Summary Statistics:**
    - Total Audio Files Analyzed: ${summaryStats.totalFiles}
    - Overall Average Word Error Rate (WER): ${summaryStats.avgWer.toFixed(2)}%
    - Overall Average Inference Time: ${summaryStats.avgInferenceTime.toFixed(2)} seconds
    
    **Key Performers:**
    - Model with Best Accuracy (Lowest WER): ${bestWerModel.model} (${bestWerModel.avgWer.toFixed(2)}% WER)
    - Fastest Model (Lowest Inference Time): ${bestInferenceModel.model} (${bestInferenceModel.avgInferenceTime.toFixed(2)}s)

    **Model Performance Data (JSON format):**
    ${modelPerformanceDataForPrompt}

    Based on all this information, return a JSON object with three fields: "title", "excerpt", and "content".

    - "title": A compelling, short title for the blog post. Example: "ASR Benchmark Results for ${fileName}: A Deep Dive".
    - "excerpt": A one or two-sentence summary of the key findings, perfect for a blog preview card.
    - "content": The full blog post in well-formed HTML. The HTML should be beautifully structured for maximum readability. Follow these specific guidelines:
        1.  **Introduction:** Start with a brief introductory paragraph (<p>) explaining the purpose of the benchmark analysis.
        2.  **Key Takeaways:** Create a section with an <h2> titled "Key Takeaways". Below it, create a visually distinct blockquote using \`<blockquote class="p-4 my-4 border-l-4 border-secondary bg-blue-50 dark:bg-blue-900/50 dark:border-accent">\`. Inside the blockquote, use an unordered list (<ul>) with styled list items (<li>) to highlight 2-3 of the most critical findings (e.g., which model is best for accuracy, which is fastest, and any interesting trade-offs).
        3.  **Detailed Performance Breakdown:** Create a section with an <h2> titled "Detailed Performance Breakdown".
        4.  **Performance Table:** Inside this section, generate a clean, professional HTML table to display the individual model performance data provided above. 
            - The table tag should be: \`<table class="w-full text-left border-collapse my-4">\`.
            - The table header (\`<thead>\`) row should use \`<th class="border-b-2 p-2 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-neutral dark:text-gray-200 font-semibold">\`. The columns should be 'Model', 'Average WER (%)', and 'Average Inference Time (s)'.
            - The table body (\`<tbody>\`) should have one row (\`<tr>\`) for each model. Each cell (\`<td>\`) should have the class "border-b p-2 dark:border-gray-600".
        5.  **Conclusion:** Create a final section with an <h2> titled "Conclusion". Write a paragraph summarizing the results and their implications for users choosing an ASR model.
        6.  Use standard HTML tags like <p>, <h2>, and <strong> for structure and emphasis. Do not include <html> or <body> tags.
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.6,
        topP: 0.95,
        topK: 64,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            excerpt: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["title", "excerpt", "content"],
        },
      },
    });
    
    // The response text is a JSON string, so we parse it.
    return JSON.parse(result.text) as BlogPostOutput;
  } catch (error) {
    console.error("Error generating blog post with Gemini API:", error);
    return {
      title: "Error Generating Report",
      excerpt: "An error occurred while trying to generate the report.",
      content: "<h2>Error Generating Report</h2><p>Could not generate the report due to an API error. Please check the console for details and try again later.</p>",
    };
  }
};

export const analyzeTranscriptionErrors = async (groundTruth: string, transcription: string): Promise<AnalysisResult> => {
  if (!ai) {
    return {
      summary: getApiError("Gemini API key is not configured."),
      errors: [],
    };
  }
  
  const prompt = `
    You are an expert ASR (Automatic Speech Recognition) quality analyst.
    Your task is to compare a "Ground Truth" text with an ASR "Transcription" text.
    Identify all discrepancies and categorize each error as 'Substitution', 'Deletion', or 'Insertion'.
    
    - **Substitution**: A word in the ground truth is replaced by a different word in the transcription.
    - **Deletion**: A word in the ground truth is missing from the transcription.
    - **Insertion**: A word appears in the transcription that is not in the ground truth.

    Provide a concise one-sentence summary of the main error patterns. Then, provide a list of the specific errors you found.

    **Ground Truth:** "${groundTruth}"
    **Transcription:** "${transcription}"

    Return the result as a single JSON object that strictly adheres to the provided schema. Do not include any text outside of the JSON object.
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING,
              description: "A concise, one-sentence summary of the error analysis."
            },
            errors: {
              type: Type.ARRAY,
              description: "A list of all identified transcription errors.",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { 
                    type: Type.STRING,
                    description: "The type of error: 'Substitution', 'Deletion', or 'Insertion'."
                  },
                  ground_truth_segment: { 
                    type: Type.STRING,
                    description: "The word or phrase from the ground truth that was part of the error. Use '---' for insertions."
                  },
                  transcription_segment: {
                    type: Type.STRING,
                    description: "The corresponding word or phrase from the transcription. Use '---' for deletions."
                  },
                },
                required: ["type", "ground_truth_segment", "transcription_segment"]
              }
            }
          },
          required: ["summary", "errors"],
        },
      },
    });

    return JSON.parse(result.text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing transcription with Gemini API:", error);
    // Return a structured error response that matches the expected type
    return {
      summary: "Error: Could not analyze the transcription. The API call failed.",
      errors: [],
    };
  }
};

export const generateHeadToHeadAnalysis = async (modelA: { name: string, data: DashboardDataRow[] }, modelB: { name: string, data: DashboardDataRow[] }): Promise<HeadToHeadAnalysis> => {
   if (!ai) {
    return {
      winner: "Error",
      summary: getApiError("Could not generate analysis: Gemini API key is not configured."),
      accuracyAnalysis: "",
      speedAnalysis: "",
      tradeOffs: "",
    };
  }
  
  const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  const getStats = (data: DashboardDataRow[]) => ({
      avgWer: average(data.map(d => d['WER Score'])).toFixed(2),
      avgInference: average(data.map(d => d['Inference time (in sec)'])).toFixed(2),
      sampleCount: data.length
  });

  const statsA = getStats(modelA.data);
  const statsB = getStats(modelB.data);

  const prompt = `
    You are a professional ASR data analyst. Compare two ASR models, "${modelA.name}" and "${modelB.name}", based on the provided summary statistics. Provide a detailed, qualitative analysis.

    **Model A: ${modelA.name}**
    - Average WER: ${statsA.avgWer}%
    - Average Inference Time: ${statsA.avgInference}s
    - Number of Samples: ${statsA.sampleCount}

    **Model B: ${modelB.name}**
    - Average WER: ${statsB.avgWer}%
    - Average Inference Time: ${statsB.avgInference}s
    - Number of Samples: ${statsB.sampleCount}

    Your analysis should be returned as a single JSON object. The analysis must be impartial and based only on the data provided.

    The JSON object must contain the following fields:
    1.  "winner": A string declaring the overall winner. If it's a close call, state "It's a tie" or name the model that has a slight edge and why.
    2.  "summary": A concise, one-paragraph summary of the comparison, acting as an executive summary.
    3.  "accuracyAnalysis": A paragraph analyzing which model is more accurate (lower WER is better) and the significance of the difference.
    4.  "speedAnalysis": A paragraph analyzing which model is faster (lower inference time is better) and the significance of the difference.
    5.  "tradeOffs": A paragraph discussing the trade-offs. For example, "Model A is more accurate but slower, making it ideal for..." or "Model B offers a great balance of speed and accuracy."
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING },
            summary: { type: Type.STRING },
            accuracyAnalysis: { type: Type.STRING },
            speedAnalysis: { type: Type.STRING },
            tradeOffs: { type: Type.STRING },
          },
          required: ["winner", "summary", "accuracyAnalysis", "speedAnalysis", "tradeOffs"],
        },
      },
    });
    
    return JSON.parse(result.text) as HeadToHeadAnalysis;

  } catch (error) {
    console.error("Error generating head-to-head analysis with Gemini API:", error);
    return {
      winner: "Error",
      summary: "Could not generate the analysis due to an API error. Please check the console and try again.",
      accuracyAnalysis: "",
      speedAnalysis: "",
      tradeOffs: "",
    };
  }
};