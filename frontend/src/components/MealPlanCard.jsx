import React from 'react';
import { Calendar, Clock, Users, ChefHat, Trash2, Edit, Play } from 'lucide-react';

const MealPlanCard = ({ 
  mealPlan, 
  onView, 
  onEdit, 
  onDelete, 
  onStart,
  className = '' 
}) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.draft;
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: '📝',
      active: '🍽️',
      completed: '✅',
      archived: '📦'
    };
    return icons[status] || icons.draft;
  };

  const isCurrentPlan = () => {
    const now = new Date();
    const start = new Date(mealPlan.startDate);
    const end = new Date(mealPlan.endDate);
    return now >= start && now <= end;
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const end = new Date(mealPlan.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {mealPlan.name}
          </h3>
          {mealPlan.description && (
            <p className="text-gray-600 text-sm mb-2">
              {mealPlan.description}
            </p>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mealPlan.status)}`}>
          <span className="mr-1">{getStatusIcon(mealPlan.status)}</span>
          {mealPlan.status.charAt(0).toUpperCase() + mealPlan.status.slice(1)}
        </div>
      </div>

      {/* Plan Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{formatDate(mealPlan.startDate)} - {formatDate(mealPlan.endDate)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{mealPlan.duration} days</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2" />
          <span>{mealPlan.preferences?.mealsPerDay || 3} meals/day</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ChefHat className="w-4 h-4 mr-2" />
          <span>{mealPlan.preferences?.difficulty || 'easy'}</span>
        </div>
      </div>

      {/* Current Status Info */}
      {isCurrentPlan() && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <p className="text-green-800 text-sm font-medium">
            🍽️ Currently Active
          </p>
          <p className="text-green-600 text-xs">
            {getDaysRemaining() > 0 
              ? `${getDaysRemaining()} days remaining`
              : 'Ends today'
            }
          </p>
        </div>
      )}

      {/* Preferences Tags */}
      {mealPlan.preferences?.dietaryRestrictions?.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {mealPlan.preferences.dietaryRestrictions.slice(0, 3).map((restriction, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {restriction}
              </span>
            ))}
            {mealPlan.preferences.dietaryRestrictions.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{mealPlan.preferences.dietaryRestrictions.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => onView(mealPlan._id)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            View Plan
          </button>
          
          {mealPlan.status === 'draft' && (
            <button
              onClick={() => onStart(mealPlan._id)}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <Play className="w-3 h-3 mr-1" />
              Start
            </button>
          )}
        </div>

        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(mealPlan._id)}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit meal plan"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(mealPlan._id)}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete meal plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generated by AI indicator */}
      {mealPlan.generatedBy === 'ai' && (
        <div className="mt-3 flex items-center justify-center">
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            🤖 AI Generated
          </span>
        </div>
      )}
    </div>
  );
};

export default MealPlanCard;