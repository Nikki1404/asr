
import type { BlogPostType, TrendDataPoint } from './types';

export const INITIAL_BLOG_POSTS: BlogPostType[] = [
  {
    id: 'q3-2024-benchmark',
    title: 'Q3 2024 ASR Benchmark: The Rise of End-to-End Models',
    date: 'October 5, 2024',
    author: 'Dr. Evelyn Reed',
    excerpt: 'Our latest quarterly benchmark reveals significant gains in accuracy for end-to-end ASR models, challenging the dominance of traditional hybrid systems. We tested three leading providers on our standard noisy environment dataset.',
    content: `
      <h2>Introduction</h2>
      <p>The third quarter of 2024 has been a pivotal period for Automatic Speech Recognition technology. In this report, we delve into the performance of the latest models from three major ASR providers: Alpha, Beta, and Gamma. Our focus was on performance in high-noise environments, a common challenge in real-world applications.</p>
      
      <h3>Methodology</h3>
      <p>We utilized the widely-recognized "CitySounds" dataset, which comprises 100 hours of audio recorded in bustling urban environments. The primary metric for our evaluation is the Word Error Rate (WER), where a lower percentage indicates higher accuracy.</p>
      
      <h3>Results Overview</h3>
      <p>The results were compelling. Model Alpha, a newcomer leveraging a novel transformer architecture, showcased a remarkable reduction in WER compared to its previous versions. Model Beta remains a strong contender, offering a balanced performance, while Model Gamma, a veteran in the field, shows steady but slower improvement.</p>
      
      <table class="w-full text-left border-collapse my-4">
        <thead>
          <tr>
            <th class="border-b-2 p-2 bg-gray-200 dark:bg-gray-700 dark:border-gray-600">Model</th>
            <th class="border-b-2 p-2 bg-gray-200 dark:bg-gray-700 dark:border-gray-600">Word Error Rate (WER)</th>
            <th class="border-b-2 p-2 bg-gray-200 dark:bg-gray-700 dark:border-gray-600">Dataset</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="border-b p-2 dark:border-gray-600">Model Alpha v3.0</td><td class="border-b p-2 dark:border-gray-600">8.2%</td><td class="border-b p-2 dark:border-gray-600">CitySounds</td></tr>
          <tr><td class="border-b p-2 dark:border-gray-600">Model Beta Pro</td><td class="border-b p-2 dark:border-gray-600">9.5%</td><td class="border-b p-2 dark:border-gray-600">CitySounds</td></tr>
          <tr><td class="border-b p-2 dark:border-gray-600">Model Gamma Enterprise</td><td class="border-b p-2 dark:border-gray-600">10.1%</td><td class="border-b p-2 dark:border-gray-600">CitySounds</td></tr>
        </tbody>
      </table>

      <h3>Conclusion</h3>
      <p>The rapid advancements in end-to-end models, exemplified by Model Alpha, suggest a paradigm shift in the ASR landscape. While established models like Gamma provide reliability, the pace of innovation from newer architectures is undeniable. We anticipate even greater competition in the coming quarters.</p>
    `,
    benchmarkData: [
      { model: 'Model Alpha v3.0', wer: 8.2, dataset: 'CitySounds' },
      { model: 'Model Beta Pro', wer: 9.5, dataset: 'CitySounds' },
      { model: 'Model Gamma Enterprise', wer: 10.1, dataset: 'CitySounds' },
    ],
  },
  {
    id: 'q2-2024-benchmark',
    title: 'Q2 2024 Report: ASR Performance in Telephony',
    date: 'July 12, 2024',
    author: 'John Metric',
    excerpt: 'This quarter, we focused on ASR performance for telephony use cases, analyzing accuracy on 8kHz audio streams. The results highlight the specialized tuning required for low-bandwidth audio.',
    content: `
      <h2>Telephony ASR Deep Dive</h2>
      <p>For Q2 2024, our benchmark shifted to the critical domain of telephony. Transcribing phone calls accurately presents unique challenges, primarily due to the 8kHz sampling rate and various codecs used in telecommunication networks. We evaluated the same set of providers on the "CallCenter-8k" dataset.</p>
      
      <h3>Key Findings</h3>
      <p>Model Gamma, with its long history in telecom, showed its strength in this area, outperforming the others. Model Beta's telephony-specific fine-tuning also yielded impressive results. Model Alpha, while dominant in high-fidelity audio, showed a noticeable drop in performance, indicating a need for better optimization for low-bandwidth scenarios.</p>

      <table class="w-full text-left border-collapse my-4">
        <thead>
          <tr>
            <th class="border-b-2 p-2 bg-gray-200 dark:bg-gray-700 dark:border-gray-600">Model</th>
            <th class="border-b-2 p-2 bg-gray-200 dark:bg-gray-700 dark:border-gray-600">Word Error Rate (WER)</th>
            <th class="border-b-2 p-2 bg-gray-200 dark:bg-gray-700 dark:border-gray-600">Dataset</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="border-b p-2 dark:border-gray-600">Model Alpha v2.5</td><td class="border-b p-2 dark:border-gray-600">14.5%</td><td class="border-b p-2 dark:border-gray-600">CallCenter-8k</td></tr>
          <tr><td class="border-b p-2 dark:border-gray-600">Model Beta Pro</td><td class="border-b p-2 dark:border-gray-600">12.1%</td><td class="border-b p-2 dark:border-gray-600">CallCenter-8k</td></tr>
          <tr><td class="border-b p-2 dark:border-gray-600">Model Gamma Enterprise</td><td class="border-b p-2 dark:border-gray-600">11.8%</td><td class="border-b p-2 dark:border-gray-600">CallCenter-8k</td></tr>
        </tbody>
      </table>

      <h3>Analysis</h3>
      <p>The data suggests that a one-size-fits-all model is not yet a reality. Providers that offer specialized models or fine-tuning for specific audio domains, like telephony, currently hold an advantage in those areas. This specialization is crucial for enterprise applications relying on call transcription.</p>
    `,
    benchmarkData: [
      { model: 'Model Alpha v2.5', wer: 14.5, dataset: 'CallCenter-8k' },
      { model: 'Model Beta Pro', wer: 12.1, dataset: 'CallCenter-8k' },
      { model: 'Model Gamma Enterprise', wer: 11.8, dataset: 'CallCenter-8k' },
    ],
  },
];

export const TREND_DATA: TrendDataPoint[] = [
  { name: 'Q4 2023', 'Model Alpha': 11.5, 'Model Beta': 12.8, 'Model Gamma': 12.2 },
  { name: 'Q1 2024', 'Model Alpha': 10.8, 'Model Beta': 12.5, 'Model Gamma': 11.9 },
  { name: 'Q2 2024', 'Model Alpha': 9.9, 'Model Beta': 11.0, 'Model Gamma': 11.5 },
  { name: 'Q3 2024', 'Model Alpha': 8.2, 'Model Beta': 9.5, 'Model Gamma': 10.1 },
];