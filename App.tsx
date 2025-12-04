import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import Trends from './components/Trends';
import DashboardUploader from './components/DashboardUploader';
import { INITIAL_BLOG_POSTS } from './constants';
import type { BlogPostType } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

const AppContent: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPostType[]>(() => {
    try {
      const storedPosts = localStorage.getItem('blogPosts');
      return storedPosts ? JSON.parse(storedPosts) : INITIAL_BLOG_POSTS;
    } catch (e) {
      console.error("Failed to parse blog posts from local storage", e);
      return INITIAL_BLOG_POSTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('blogPosts', JSON.stringify(blogPosts));
    } catch (e) {
      console.error("Failed to save blog posts to local storage", e);
    }
  }, [blogPosts]);

  const handlePublishPost = (newPost: BlogPostType) => {
    setBlogPosts(prevPosts => [newPost, ...prevPosts]);
  };

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-base-100 dark:bg-neutral text-neutral dark:text-gray-200 font-sans transition-colors duration-300">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/blog" replace />} />
            <Route path="/blog" element={<BlogList posts={blogPosts} />} />
            <Route path="/post/:id" element={<BlogPost posts={blogPosts} />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/dashboard" element={<DashboardUploader onPublish={handlePublishPost} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
};


export default App;