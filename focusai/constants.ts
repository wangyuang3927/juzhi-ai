import { NewsItem, Profession } from './types';

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Midjourney V6.1 Released',
    tags: ['#Midjourney', '#ImageGeneration', '#Design'],
    summary: 'Midjourney released version 6.1, featuring significantly improved image quality, coherence, and text rendering capabilities. The new model offers 2x faster generation speeds and a new upscaler.',
    impact: 'For designers, this update reduces post-processing time. The improved text rendering allows for direct creation of poster layouts and mockups without needing external tools for typography.',
    prompt: '/imagine prompt: hyper-realistic product photography of a translucent glass perfume bottle on a mossy rock, forest bokeh background, natural lighting, 8k --v 6.1',
    url: 'https://midjourney.com',
    timestamp: '2024-05-15',
  },
  {
    id: '2',
    title: 'Claude 3.5 Sonnet Artifacts',
    tags: ['#Claude', '#Coding', '#Productivity'],
    summary: 'Anthropic launched Claude 3.5 Sonnet with a new "Artifacts" feature. This allows users to generate and view code, documents, and React components side-by-side in a dedicated window.',
    impact: 'Engineers can now visualize UI components instantly. Product Managers can prototype functional dashboards in seconds during meetings, bridging the gap between PRD and MVP faster than ever.',
    prompt: 'Create a React dashboard component for tracking monthly recurring revenue (MRR) with a bar chart and a user breakdown table using Tailwind CSS.',
    url: 'https://anthropic.com',
    timestamp: '2024-06-21',
  },
  {
    id: '3',
    title: 'Sora Video Gen Integration',
    tags: ['#Sora', '#Video', '#ContentCreation'],
    summary: 'OpenAI is beginning to roll out Sora to select creative partners. The new API endpoints suggest capability for consistent character generation across multiple video clips.',
    impact: 'Marketing professionals can generate consistent brand storytelling assets at a fraction of traditional production costs. It enables rapid A/B testing of video ads with slight variations.',
    prompt: 'A cinematic drone shot of a futuristic solarpunk city with hanging gardens, golden hour lighting, 60fps, photorealistic style.',
    url: 'https://openai.com/sora',
    timestamp: '2024-07-10',
  },
  {
    id: '4',
    title: 'Google Gemini 2.5 Flash Update',
    tags: ['#Gemini', '#Multimodal', '#Performance'],
    summary: 'Google updates Gemini 2.5 Flash with lower latency and higher token limits, making it ideal for high-volume data processing tasks and real-time applications.',
    impact: 'Data Analysts can process massive datasets in real-time. Operations teams can automate complex document parsing workflows with higher accuracy and lower cost.',
    prompt: 'Analyze this attached CSV dataset of customer support tickets, categorize them by sentiment, and output a JSON summary of top 3 recurring issues.',
    url: 'https://deepmind.google/technologies/gemini/',
    timestamp: '2024-08-05',
  }
];

export const PROFESSIONS_LIST = Object.values(Profession);
