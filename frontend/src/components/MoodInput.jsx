import React, { useState } from 'react';
import { Send, Loader } from 'lucide-react';

const MoodInput = ({ onSubmit, isLoading, disabled = false }) => {
  const [mood, setMood] = useState('');
  const [context, setContext] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mood.trim() || disabled) return;
    
    onSubmit({
      mood: mood.trim(),
      context: context.trim() || undefined
    });
    
    setMood('');
    setContext('');
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Describe Your Mood
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
            How are you feeling right now? *
          </label>
          <input
            id="mood"
            type="text"
            className="input-primary"
            placeholder="e.g., stressed, happy, tired, excited..."
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            required
            disabled={isLoading || disabled}
          />
        </div>
        
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
            Any additional context? (optional)
          </label>
          <textarea
            id="context"
            rows={3}
            className="input-primary resize-none"
            placeholder="e.g., had a long day at work, celebrating an achievement, feeling under the weather..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={isLoading || disabled}
          />
        </div>

        <button
          type="submit"
          disabled={!mood.trim() || isLoading || disabled}
          className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
        >
          {isLoading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Finding the perfect recipes...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Get Recipe Suggestions</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default MoodInput;