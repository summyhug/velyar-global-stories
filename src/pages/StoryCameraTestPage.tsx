import React from 'react';
import { StoryCameraTest } from '../components/StoryCameraTest';

/**
 * Dedicated test page for StoryCamera plugin
 * Add this route temporarily for testing, then remove it
 */
export const StoryCameraTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            StoryCamera Plugin Testing
          </h1>
          <p className="text-gray-600">
            Test the custom video recording functionality
          </p>
        </div>
        
        <StoryCameraTest />
        
        <div className="mt-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is a test page. Remember to remove it from your routes when testing is complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
