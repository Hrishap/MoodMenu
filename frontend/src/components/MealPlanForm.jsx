import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Calendar, Clock, ChefHat, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const MealPlanForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 7,
    startDate: new Date().toISOString().split('T')[0],
    dietaryRestrictions: [],
    cuisinePreferences: [],
    allergies: [],
    dislikedIngredients: [],
    preferredIngredients: [],
    cookingTime: 'moderate',
    difficulty: 'easy',
    calorieTarget: 2000,
    mealsPerDay: 3,
    includeSnacks: true,
    generateWithAI: true
  });

  const [newIngredient, setNewIngredient] = useState('');
  const [ingredientType, setIngredientType] = useState('preferred'); // 'preferred' or 'disliked'
  const [newCuisine, setNewCuisine] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        startDate: initialData.startDate 
          ? new Date(initialData.startDate).toISOString().split('T')[0]
          : formData.startDate,
        ...initialData.preferences
      });
    }
  }, [initialData]);

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
    'nut-free', 'low-carb', 'keto', 'paleo', 'mediterranean'
  ];

  const cuisineOptions = [
    'Italian', 'Mexican', 'Asian', 'Mediterranean', 'Indian', 
    'American', 'French', 'Thai', 'Japanese', 'Greek'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      const field = ingredientType === 'preferred' ? 'preferredIngredients' : 'dislikedIngredients';
      handleArrayToggle(field, newIngredient.trim());
      setNewIngredient('');
    }
  };

  const removeIngredient = (field, ingredient) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== ingredient)
    }));
  };

  const addCuisine = () => {
    if (newCuisine.trim() && !formData.cuisinePreferences.includes(newCuisine.trim())) {
      setFormData(prev => ({
        ...prev,
        cuisinePreferences: [...prev.cuisinePreferences, newCuisine.trim()]
      }));
      setNewCuisine('');
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a meal plan name');
      return;
    }

    if (formData.duration < 1 || formData.duration > 30) {
      toast.error('Duration must be between 1 and 30 days');
      return;
    }

    if (formData.calorieTarget < 800 || formData.calorieTarget > 5000) {
      toast.error('Calorie target must be between 800 and 5000');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Meal Plan' : 'Create New Meal Plan'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Plan Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Weekly Healthy Meals"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description of your meal plan goals..."
            />
          </div>

          {/* Plan Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Daily Calories
              </label>
              <input
                type="number"
                min="800"
                max="5000"
                step="50"
                value={formData.calorieTarget}
                onChange={(e) => handleInputChange('calorieTarget', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meals per Day
              </label>
              <select
                value={formData.mealsPerDay}
                onChange={(e) => handleInputChange('mealsPerDay', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 meal</option>
                <option value={2}>2 meals</option>
                <option value={3}>3 meals</option>
                <option value={4}>4 meals</option>
                <option value={5}>5 meals</option>
                <option value={6}>6 meals</option>
              </select>
            </div>
          </div>

          {/* Cooking Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Cooking Time Preference
              </label>
              <select
                value={formData.cookingTime}
                onChange={(e) => handleInputChange('cookingTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="quick">Quick (&lt; 30 min)</option>
                <option value="moderate">Moderate (30-60 min)</option>
                <option value="extended">Extended (&gt; 60 min)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ChefHat className="w-4 h-4 inline mr-1" />
                Difficulty Level
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dietary Restrictions
            </label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleArrayToggle('dietaryRestrictions', option)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.dietaryRestrictions.includes(option)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Cuisine Preferences
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {cuisineOptions.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => handleArrayToggle('cuisinePreferences', cuisine)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.cuisinePreferences.includes(cuisine)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCuisine}
                onChange={(e) => setNewCuisine(e.target.value)}
                placeholder="Add custom cuisine..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCuisine())}
              />
              <button
                type="button"
                onClick={addCuisine}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ingredient Preferences
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preferred Ingredients */}
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2">Preferred Ingredients</h4>
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.preferredIngredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center"
                    >
                      {ingredient}
                      <button
                        type="button"
                        onClick={() => removeIngredient('preferredIngredients', ingredient)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Disliked Ingredients */}
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2">Disliked Ingredients</h4>
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.dislikedIngredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center"
                    >
                      {ingredient}
                      <button
                        type="button"
                        onClick={() => removeIngredient('dislikedIngredients', ingredient)}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <select
                value={ingredientType}
                onChange={(e) => setIngredientType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="preferred">Preferred</option>
                <option value="disliked">Disliked</option>
              </select>
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add ingredient..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              />
              <button
                type="button"
                onClick={addIngredient}
                className={`px-3 py-2 rounded-md transition-colors ${
                  ingredientType === 'preferred' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Allergies
            </label>
            <div className="flex flex-wrap gap-1 mb-3">
              {formData.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeIngredient('allergies', allergy)}
                    className="ml-1 text-red-600 hover:text-red-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
              />
              <button
                type="button"
                onClick={addAllergy}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeSnacks}
                onChange={(e) => handleInputChange('includeSnacks', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include snacks</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.generateWithAI}
                onChange={(e) => handleInputChange('generateWithAI', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Generate with AI</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : (initialData ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MealPlanForm;