import React, { useState } from 'react';
import { 
  Clock, 
  Users, 
  ChefHat, 
  Zap, 
  Edit3, 
  RefreshCw, 
  ShoppingCart,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const MealCard = ({ 
  meal, 
  mealType, 
  dayIndex, 
  mealPlanId,
  onEdit, 
  onRegenerate, 
  onCustomize,
  onSubstitute,
  isEditing = false,
  className = '' 
}) => {
  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  if (!meal) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <ChefHat className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No meal planned</p>
        <button
          onClick={() => onRegenerate && onRegenerate()}
          className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          Generate Meal
        </button>
      </div>
    );
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      hard: 'text-red-600 bg-red-100'
    };
    return colors[difficulty] || colors.easy;
  };

  const getMealTypeIcon = (type) => {
    const icons = {
      breakfast: '🥞',
      lunch: '🥗',
      dinner: '🍽️',
      snack: '🍎'
    };
    return icons[type] || '🍽️';
  };

  const formatIngredients = (ingredients) => {
    if (!ingredients || !Array.isArray(ingredients)) return [];
    
    return ingredients.map(ingredient => {
      if (typeof ingredient === 'string') return ingredient;
      if (ingredient.name) {
        return `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name}`.trim();
      }
      return ingredient;
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">{getMealTypeIcon(mealType)}</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {meal.recipeName}
              </h3>
              {meal.customized && (
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Customized
                </span>
              )}
            </div>
            
            {/* Meal Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{meal.cookingTime || 30} min</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{meal.servings || 2} servings</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                <span>{meal.calories || 0} cal</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(meal.difficulty)}`}>
                {meal.difficulty || 'easy'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex space-x-1 ml-2">
              <button
                onClick={() => onCustomize && onCustomize(meal)}
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                title="Customize meal"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onRegenerate && onRegenerate()}
                className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                title="Regenerate meal"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        {meal.tags && meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {meal.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {meal.tags.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{meal.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Nutrition Highlights */}
        {meal.nutritionHighlights && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-green-800 text-sm">
              <span className="font-medium">Nutrition: </span>
              {meal.nutritionHighlights}
            </p>
          </div>
        )}

        {/* Ingredients Section */}
        <div>
          <button
            onClick={() => setShowIngredients(!showIngredients)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-gray-900 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ingredients ({formatIngredients(meal.ingredients).length})
            </h4>
            <span className="text-gray-400">
              {showIngredients ? '−' : '+'}
            </span>
          </button>
          
          {showIngredients && (
            <div className="mt-2 space-y-1">
              {formatIngredients(meal.ingredients).map((ingredient, index) => (
                <div key={index} className="flex items-center text-sm">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{ingredient}</span>
                </div>
              ))}
              
              {formatIngredients(meal.ingredients).length > 0 && onSubstitute && (
                <button
                  onClick={() => onSubstitute(formatIngredients(meal.ingredients))}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Need substitutions?
                </button>
              )}
            </div>
          )}
        </div>

        {/* Instructions Section */}
        <div>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-gray-900 flex items-center">
              <ChefHat className="w-4 h-4 mr-2" />
              Cooking Instructions
            </h4>
            <span className="text-gray-400">
              {showInstructions ? '−' : '+'}
            </span>
          </button>
          
          {showInstructions && (
            <div className="mt-2">
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {meal.instructions}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Customization Info */}
        {meal.customized && meal.modifications && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <p className="text-purple-800 text-sm">
              <span className="font-medium">Customized: </span>
              {meal.modifications}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealCard;