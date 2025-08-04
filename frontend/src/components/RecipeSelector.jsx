import React, { useState } from 'react';
import { Clock, Users, Star, Zap, Heart, Leaf, ChefHat, Eye, Play, CheckSquare } from 'lucide-react';
import RecipeModal from './RecipeModal';
import CookingModal from './CookingModal';
import toast from 'react-hot-toast';

const RecipeSelector = ({ recipes, onSelectRecipe, selectedRecipe, isLoading }) => {
  const [viewMode, setViewMode] = useState('cards');
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showCookingModal, setShowCookingModal] = useState(false);
  const [modalRecipe, setModalRecipe] = useState(null);

  const getCategoryIcon = (category) => {
    const icons = {
      comfort: Heart,
      quick: Zap,
      healthy: Leaf
    };
    return icons[category] || ChefHat;
  };

  const getCategoryColor = (category) => {
    const colors = {
      comfort: 'text-red-500 bg-red-50 border-red-200',
      quick: 'text-orange-500 bg-orange-50 border-orange-200',
      healthy: 'text-green-500 bg-green-50 border-green-200'
    };
    return colors[category] || 'text-gray-500 bg-gray-50 border-gray-200';
  };

  const formatCategory = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // FIXED: Image caching prevention
  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  };

  // FIXED: Better instruction preview
  const getInstructionPreview = (instructions) => {
    if (!instructions) return 'No instructions available';
    
    // Get first meaningful instruction
    let firstStep = '';
    if (instructions.includes('Step ')) {
      const steps = instructions.split(/Step\s*\d+\s*:/).filter(step => step.trim());
      firstStep = steps[0]?.trim() || instructions.substring(0, 100);
    } else if (instructions.includes('\n')) {
      const lines = instructions.split('\n').filter(line => line.trim());
      firstStep = lines[0]?.trim() || instructions.substring(0, 100);
    } else {
      firstStep = instructions.substring(0, 100);
    }
    
    return firstStep.length > 100 ? firstStep.substring(0, 100) + '...' : firstStep;
  };

  // Handle View Full Recipe
  const handleViewRecipe = (recipe, e) => {
    e.stopPropagation();
    setModalRecipe(recipe);
    setShowRecipeModal(true);
  };

  // Handle Start Cooking
  const handleStartCooking = (recipe, e) => {
    e.stopPropagation();
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    setModalRecipe(recipe);
    setShowCookingModal(true);
    toast.success(`Starting cooking mode for ${recipe.recipeName}! 👨‍🍳`);
  };

  // Handle cooking completion
  const handleCookingComplete = (cookingData) => {
    const { recipe, completedSteps, totalSteps, notes } = cookingData;
    toast.success(
      `Cooking completed! You finished ${completedSteps}/${totalSteps} steps. 🎉`,
      { duration: 5000 }
    );
    
    console.log('Cooking session completed:', cookingData);
    if (notes) {
      console.log('Cooking notes:', notes);
    }
  };

  if (!recipes || recipes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="card space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Your Mood-Based Recipe Suggestions
            </h2>
            <p className="text-gray-600 mt-1">
              Choose the approach that fits your current needs
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">View:</span>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Recipe Grid/List */}
        <div className={viewMode === 'cards' ? 'grid md:grid-cols-3 gap-6' : 'space-y-4'}>
          {recipes.map((recipe, index) => {
            const CategoryIcon = getCategoryIcon(recipe.category);
            const isSelected = selectedRecipe?.id === recipe.id;
            
            return (
              <div
                key={recipe.id || index}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-50 shadow-lg' 
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                } ${viewMode === 'list' ? 'flex items-center space-x-6' : ''}`}
                onClick={() => onSelectRecipe(recipe)}
              >
                {/* Recipe Image - FIXED: No caching */}
                {recipe.image && (
                  <div className={viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'w-full h-48 mb-4'}>
                    <img
                      src={getImageUrl(recipe.image)}
                      alt={recipe.recipeName}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop';
                      }}
                    />
                  </div>
                )}

                <div className="flex-1 space-y-3">
                  {/* Category Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(recipe.category)}`}>
                      <CategoryIcon className="h-4 w-4 mr-1" />
                      {formatCategory(recipe.category)}
                    </div>
                    
                    {recipe.score && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Star className="h-4 w-4 fill-current text-yellow-400" />
                        <span>{recipe.score}/30</span>
                      </div>
                    )}
                  </div>

                  {/* Recipe Title */}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {recipe.recipeName}
                  </h3>

                  {/* Recipe Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {recipe.cookingTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{recipe.cookingTime}min</span>
                      </div>
                    )}
                    {recipe.servings && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{recipe.servings} servings</span>
                      </div>
                    )}
                    {recipe.calories && (
                      <div className="flex items-center space-x-1">
                        <span>{recipe.calories} cal</span>
                      </div>
                    )}
                  </div>

                  {/* Mood & Category Explanations */}
                  <div className="space-y-2">
                    {recipe.moodExplanation && (
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                        <strong>Mood Match:</strong> {recipe.moodExplanation}
                      </p>
                    )}
                    {recipe.categoryReason && (
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <strong>Why {formatCategory(recipe.category)}:</strong> {recipe.categoryReason}
                      </p>
                    )}
                  </div>

                  {/* Instructions Preview - FIXED */}
                  {recipe.instructions && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">First Step:</h4>
                      <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                        {getInstructionPreview(recipe.instructions)}
                      </p>
                    </div>
                  )}

                  {/* Ingredients Preview */}
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Ingredients:</h4>
                      <div className="text-sm text-gray-600">
                        {recipe.ingredients.slice(0, 3).join(', ')}
                        {recipe.ingredients.length > 3 && ` +${recipe.ingredients.length - 3} more`}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-3">
                    <button 
                      onClick={(e) => handleViewRecipe(recipe, e)}
                      className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center space-x-1 hover:bg-gray-300 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Recipe</span>
                    </button>
                    <button 
                      onClick={(e) => handleStartCooking(recipe, e)}
                      className="flex-1 btn-primary text-sm py-2 flex items-center justify-center space-x-1 hover:bg-primary-600 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Cooking</span>
                    </button>
                  </div>

                  {/* Selection State */}
                  {isSelected && (
                    <div className="flex items-center space-x-2 text-primary-600 font-medium">
                      <CheckSquare className="h-4 w-4" />
                      <span>Selected Recipe</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {recipes.length}
              </div>
              <div className="text-sm text-gray-600">Recipe Options</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.min(...recipes.map(r => r.cookingTime || 999))}min
              </div>
              <div className="text-sm text-gray-600">Fastest Option</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(recipes.reduce((sum, r) => sum + (r.calories || 0), 0) / recipes.length)}
              </div>
              <div className="text-sm text-gray-600">Avg Calories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Modal */}
      {showRecipeModal && modalRecipe && (
        <RecipeModal 
          recipe={modalRecipe}
          isOpen={showRecipeModal}
          onClose={() => {
            setShowRecipeModal(false);
            setModalRecipe(null);
          }}
          onStartCooking={() => {
            setShowRecipeModal(false);
            setShowCookingModal(true);
          }}
        />
      )}

      {/* Cooking Modal */}
      {showCookingModal && modalRecipe && (
        <CookingModal 
          recipe={modalRecipe}
          isOpen={showCookingModal}
          onClose={() => {
            setShowCookingModal(false);
            setModalRecipe(null);
          }}
          onComplete={handleCookingComplete}
        />
      )}
    </>
  );
};

export default RecipeSelector;