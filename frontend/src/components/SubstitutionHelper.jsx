import React, { useState } from 'react';
import { Send, Loader, AlertCircle, CheckCircle, Search } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const SubstitutionHelper = ({ recipeContext }) => {
  const [inputText, setInputText] = useState('');
  const [substitutions, setSubstitutions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim()) {
      toast.error('Please tell us which ingredient you need to substitute');
      return;
    }

    setIsLoading(true);
    setSubstitutions(null);

    try {
      const response = await api.post('/mood/substitutions', {
        text: inputText,
        recipeContext
      });

      setSubstitutions(response.data.substitutions);
      toast.success('Substitution suggestions found!');
    } catch (error) {
      toast.error('Failed to get substitution suggestions');
      console.error('Substitution error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    const colors = {
      high: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50', 
      low: 'text-red-600 bg-red-50'
    };
    return colors[confidence] || 'text-gray-600 bg-gray-50';
  };

  const getAvailabilityIcon = (availability) => {
    return availability === 'common' ? CheckCircle : AlertCircle;
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What ingredient do you need to substitute?
          </label>
          <div className="relative">
            <input
              type="text"
              className="input-primary pr-12"
              placeholder="e.g., I don't have zucchini, or just type: eggs"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Try:</span>
          {['eggs', 'butter', 'milk', 'zucchini', 'onion'].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setInputText(example)}
              className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {substitutions && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Substitutions for "{substitutions.originalIngredient}"
            </h3>
          </div>

          {/* Substitution Options */}
          <div className="grid gap-4">
            {substitutions.substitutes?.map((sub, index) => {
              const AvailabilityIcon = getAvailabilityIcon(sub.availability);
              
              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {sub.ingredient}
                      </h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm font-medium text-primary-600">
                          Ratio: {sub.ratio}
                        </span>
                        {sub.confidence && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(sub.confidence)}`}>
                            {sub.confidence} confidence
                          </span>
                        )}
                        {sub.availability && (
                          <div className="flex items-center space-x-1">
                            <AvailabilityIcon className={`h-4 w-4 ${sub.availability === 'common' ? 'text-green-500' : 'text-yellow-500'}`} />
                            <span className="text-xs text-gray-500 capitalize">
                              {sub.availability}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <p className="text-gray-700 mb-3">
                    {sub.explanation}
                  </p>

                  {/* Flavor Impact */}
                  {sub.flavorImpact && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        <strong>Flavor Impact:</strong> {sub.flavorImpact}
                      </p>
                    </div>
                  )}

                  {/* Source Attribution */}
                  {sub.source && (
                    <div className="flex justify-end">
                      <span className="text-xs text-gray-400 capitalize">
                        via {sub.source}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tips */}
          {substitutions.tips && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">💡 Pro Tips:</h4>
              <p className="text-yellow-700 text-sm">
                {substitutions.tips}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding the best substitutions...</p>
        </div>
      )}
    </div>
  );
};

export default SubstitutionHelper;