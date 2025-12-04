
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral dark:bg-gray-900 text-white dark:text-gray-300">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm">
          &copy; {new Date().getFullYear()} ASR Benchmark Hub. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;