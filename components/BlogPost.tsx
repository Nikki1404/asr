
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { BlogPostType } from '../types';
import { generateSummary } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { CalendarIcon, UserIcon, ArrowLeftIcon, SparklesIcon } from './IconComponents';

interface BlogPostProps {
  posts: BlogPostType[];
}

const BlogPost: React.FC<BlogPostProps> = ({ posts }) => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const foundPost = posts.find((p) => p.id === id) || null;
    setPost(foundPost);
    if (foundPost) {
        handleGenerateSummary(foundPost.content);
    }
  }, [id, posts]);

  const handleGenerateSummary = async (content: string) => {
    if (!content) return;
    setIsLoadingSummary(true);
    setError('');
    setSummary('');
    try {
      const result = await generateSummary(content);
      setSummary(result);
    } catch (err) {
      setError('Failed to generate summary.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  if (!post) {
    return <div className="text-center py-12">Post not found.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 lg:p-12">
      <Link to="/blog" className="inline-flex items-center gap-2 text-secondary hover:text-primary dark:text-accent dark:hover:text-secondary mb-6 transition-colors">
        <ArrowLeftIcon className="h-5 w-5" />
        Back to Reports
      </Link>
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral dark:text-gray-100 sm:text-5xl">{post.title}</h1>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1.5" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1.5" />
              <span>By {post.author}</span>
            </div>
          </div>
        </header>

        <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.content }} />
        
        <div className="mt-12 border-t dark:border-gray-700 pt-8">
            <h2 className="text-2xl font-bold text-neutral dark:text-gray-100 mb-4 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-3 text-secondary dark:text-accent" />
              AI-Powered Summary
            </h2>
            
            {isLoadingSummary && (
                <div className="mt-6 p-6 bg-blue-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
                    <LoadingSpinner />
                    <p className="ml-3 text-gray-600 dark:text-gray-300">Generating summary...</p>
                </div>
            )}

            {summary && !isLoadingSummary && (
                <div className="mt-6 p-6 bg-blue-50 dark:bg-gray-900/50 border-l-4 border-secondary dark:border-accent rounded-r-lg">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{summary}</p>
                </div>
            )}
            {error && <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </article>
    </div>
  );
};

export default BlogPost;