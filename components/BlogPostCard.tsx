
import React from 'react';
import type { BlogPostType } from '../types';
import { Link } from 'react-router-dom';
import { CalendarIcon, UserIcon } from './IconComponents';

interface BlogPostCardProps {
  post: BlogPostType;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="flex-1">
          <Link to={`/post/${post.id}`} className="block mt-2">
            <p className="text-2xl font-semibold text-primary hover:text-secondary dark:text-accent dark:hover:text-secondary">{post.title}</p>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-300">{post.excerpt}</p>
          </Link>
        </div>
        <div className="mt-6 flex items-center">
          <div className="flex space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1.5" />
              <time dateTime={post.date}>{post.date}</time>
            </div>
            <span aria-hidden="true">&middot;</span>
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1.5" />
              <span>{post.author}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogPostCard;