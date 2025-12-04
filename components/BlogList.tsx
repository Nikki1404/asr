
import React from 'react';
import BlogPostCard from './BlogPostCard';
import type { BlogPostType } from '../types';

interface BlogListProps {
  posts: BlogPostType[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral dark:text-gray-100 sm:text-5xl">
          ASR Benchmarking Reports
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Our latest findings and analysis on ASR model performance.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default BlogList;