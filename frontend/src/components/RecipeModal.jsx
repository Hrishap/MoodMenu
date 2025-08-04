import React from 'react';
import { X, Clock, Users, Star, Play, ChefHat } from 'lucide-react';

const RecipeModal = ({ recipe, isOpen, onClose, onStartCooking }) => {
  if (!isOpen || !recipe) return null;

  // FIXED: Improved instruction parsing to show ALL steps
  const formatInstructions = (instructions) => {
    if (!instructions) return [];
    
    let steps = [];
    
    // Try different splitting methods
    if (instructions.includes('Step ')) {
      // Split by "Step X:" pattern
      steps = instructions.split(/Step\s*\d+\s*:/).filter(step => step.trim());
    } else if (/^\d+\./.test(instructions.trim())) {
      // Split by numbered list "1. 2. 3."
      steps = instructions.split(/^\d+\.\s*/m).filter(step => step.trim());
    } else if (instructions.includes('\n')) {
      // Split by line breaks
      steps = instructions.split('\n').filter(step => step.trim());
    } else {
      // Split by sentences ending with period + capital letter
      steps = instructions.split(/\.\s+(?=[A-Z])/).map(step => step.trim() + (step.endsWith('.') ? '' : '.'));
    }
    
    // Clean and filter steps
    steps = steps.map(step => step.trim()).filter(step => step && step.length > 3);
    
    return steps.map((step, index) => ({
      id: index + 1,
      text: step.trim()
    }));
  };

  const instructionSteps = formatInstructions(recipe.instructions);

  // FIXED: Image caching prevention
  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop';
    // Add timestamp to prevent caching
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChefHat className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">{recipe.recipeName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Recipe Image - FIXED: No caching */}
          {recipe.image && (
            <div className="w-full h-64 rounded-lg overflow-hidden">
              <img
                src={getImageUrl(recipe.image)}
                alt={recipe.recipeName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop';
                }}
              />
            </div>
          )}

          {/* Recipe Info Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-primary-600" />
              <div className="text-lg font-semibold text-gray-900">{recipe.cookingTime}min</div>
              <div className="text-sm text-gray-600">Cook Time</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary-600" />
              <div className="text-lg font-semibold text-gray-900">{recipe.servings}</div>
              <div className="text-sm text-gray-600">Servings</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-lg font-semibold text-gray-900">{recipe.difficulty || 'Medium'}</div>
              <div className="text-sm text-gray-600">Difficulty</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{recipe.calories || 'N/A'}</div>
              <div className="text-sm text-gray-600">Calories</div>
            </div>
          </div>

          {/* Mood & Category Info */}
          {(recipe.moodExplanation || recipe.categoryReason) && (
            <div className="space-y-3">
              {recipe.moodExplanation && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">🎭 Mood Match</h3>
                  <p className="text-blue-800">{recipe.moodExplanation}</p>
                </div>
              )}
              {recipe.categoryReason && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">✨ Why This Category</h3>
                  <p className="text-green-800">{recipe.categoryReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🛒 Ingredients ({recipe.ingredients.length} items)</h3>
              <div className="grid md:grid-cols-2 gap-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-700">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions - FIXED: Shows all steps */}
          {instructionSteps.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">👨‍🍳 Instructions ({instructionSteps.length} steps)</h3>
              <div className="space-y-4">
                {instructionSteps.map((step) => (
                  <div key={step.id} className="flex space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {step.id}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-gray-700 leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition Highlights */}
          {recipe.nutritionHighlights && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">🌱 Nutrition Highlights</h3>
              <p className="text-yellow-800">{recipe.nutritionHighlights}</p>
            </div>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🏷️ Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary py-3"
            >
              Close
            </button>
            <button
              onClick={onStartCooking}
              className="flex-1 btn-primary py-3 flex items-center justify-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Start Cooking</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
