import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Smile, Frown, Meh, Heart, Zap, Coffee, Loader } from 'lucide-react';
import MoodInput from '../components/MoodInput';
import RecipeSelector from '../components/RecipeSelector';
import SubstitutionHelper from '../components/SubstitutionHelper';
import api, { testBackendConnection } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [currentRecipes, setCurrentRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubstitutionHelper, setShowSubstitutionHelper] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  const quickMoods = [
    { name: 'Happy', icon: Smile, color: 'text-yellow-500' },
    { name: 'Sad', icon: Frown, color: 'text-blue-500' },
    { name: 'Stressed', icon: Meh, color: 'text-red-500' },
    { name: 'Excited', icon: Zap, color: 'text-orange-500' },
    { name: 'Romantic', icon: Heart, color: 'text-pink-500' },
    { name: 'Tired', icon: Coffee, color: 'text-gray-500' }
  ];

  // Check backend connection on component mount
  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setBackendStatus('checking');
    const isConnected = await testBackendConnection();
    setBackendStatus(isConnected ? 'connected' : 'disconnected');
    
    if (!isConnected) {
      toast.error('Backend server is not running on port 4000. Please start the backend server.', {
        duration: 6000,
      });
    }
  };

  const handleMoodSubmit = async (moodData) => {
    if (backendStatus !== 'connected') {
      toast.error('Cannot submit mood: Backend server is not running on port 4000');
      return;
    }

    setIsLoading(true);
    setCurrentRecipes([]);
    setSelectedRecipe(null);
    
    try {
      console.log('🎭 Submitting mood:', moodData);
      
      const response = await api.post('/mood', moodData);
      console.log('✅ Mood response:', response.data);
      
      const recipes = response.data.interaction?.recipes || [];
      
      if (recipes.length > 0) {
        setCurrentRecipes(recipes);
        toast.success(`${recipes.length} recipe suggestions generated!`);
      } else {
        toast.error('No recipes generated. Please try again.');
      }
    } catch (error) {
      console.error('❌ Mood submission error:', error);
      
      // More specific error handling
      if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please make sure the backend is running on port 4000.');
      } else if (error.response?.status === 404) {
        toast.error('API endpoint not found. Please check the backend routes.');
      } else {
        toast.error('Failed to generate recipe suggestions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickMood = (mood) => {
    if (backendStatus !== 'connected') {
      toast.error('Cannot submit mood: Backend server is not running on port 4000');
      return;
    }
    
    handleMoodSubmit({ mood: mood.toLowerCase() });
  };

  // FIXED: Recipe selection with proper interactionId
  const handleRecipeSelection = async (recipe) => {
    setSelectedRecipe(recipe);
    
    // Record the selection on the backend ONLY if we have interactionId
    if (recipe.interactionId) {
      try {
        console.log('📝 Recording recipe selection:', {
          interactionId: recipe.interactionId,
          selectedRecipeId: recipe.id,
          selectedCategory: recipe.category
        });

        await api.post('/mood/select-recipe', {
          interactionId: recipe.interactionId,
          selectedRecipeId: recipe.id,
          selectedCategory: recipe.category
        });

        console.log('✅ Recipe selection recorded successfully');
      } catch (error) {
        console.error('❌ Failed to record recipe selection:', error);
        // Don't show error to user since this is optional functionality
      }
    } else {
      console.warn('⚠️ No interactionId found for recipe, skipping selection recording');
    }
  };

  // Backend status indicator
  const BackendStatus = () => (
    <div className={`mb-4 p-3 rounded-lg border ${
      backendStatus === 'connected' 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : backendStatus === 'disconnected'
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }`}>
      <div className="flex items-center space-x-2">
        {backendStatus === 'checking' && <Loader className="h-4 w-4 animate-spin" />}
        <div className={`w-2 h-2 rounded-full ${
          backendStatus === 'connected' ? 'bg-green-500' : 
          backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
        }`} />
        <span className="font-medium">
          Backend Status: {
            backendStatus === 'connected' ? 'Connected (Port 4000)' :
            backendStatus === 'disconnected' ? 'Disconnected (Port 4000)' : 'Checking...'
          }
        </span>
        {backendStatus === 'disconnected' && (
          <button 
            onClick={checkBackend}
            className="ml-2 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
      {backendStatus === 'disconnected' && (
        <div className="mt-2 text-sm">
          <p>Please make sure:</p>
          <ul className="list-disc list-inside ml-2">
            <li>Backend server is running: <code>cd backend && npm run dev</code></li>
            <li>Server is running on port 4000</li>
            <li>MongoDB is connected</li>
            <li>Check terminal for any error messages</li>
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Backend Status */}
      <BackendStatus />

      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          How are you feeling today? Let's find the perfect recipes for your mood.
        </p>
      </div>

      {/* Quick Mood Selection */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Mood Selection
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickMoods.map((mood) => (
            <button
              key={mood.name}
              onClick={() => handleQuickMood(mood.name)}
              disabled={isLoading || backendStatus !== 'connected'}
              className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <mood.icon className={`h-8 w-8 mb-2 ${mood.color}`} />
              <span className="text-sm font-medium text-gray-700">
                {mood.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Mood Input */}
      <MoodInput 
        onSubmit={handleMoodSubmit} 
        isLoading={isLoading}
        disabled={backendStatus !== 'connected'}
      />

      {/* Recipe Selector */}
      {currentRecipes.length > 0 && (
        <div className="animate-fade-in">
          <RecipeSelector 
            recipes={currentRecipes}
            onSelectRecipe={handleRecipeSelection}
            selectedRecipe={selectedRecipe}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Substitution Helper */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Need Ingredient Substitutions?
          </h2>
          <button
            onClick={() => setShowSubstitutionHelper(!showSubstitutionHelper)}
            className="btn-secondary text-sm"
            disabled={backendStatus !== 'connected'}
          >
            {showSubstitutionHelper ? 'Hide Helper' : 'Show Helper'}
          </button>
        </div>
        
        {showSubstitutionHelper && (
          <SubstitutionHelper 
            recipeContext={selectedRecipe?.recipeName || 'general cooking'}
          />
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Analyzing your mood and finding the perfect recipes...
          </p>
        </div>
      )}

      {/* Development Debug Info */}
      {import.meta.env.MODE === 'development' && (
        <div className="card bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Backend Status: {backendStatus}</p>
            <p>Current Recipes: {currentRecipes.length}</p>
            <p>Selected Recipe: {selectedRecipe?.recipeName || 'None'}</p>
            <p>API Base URL: {import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}</p>
            <p>Expected Backend: http://localhost:4000</p>
            {currentRecipes.length > 0 && (
              <p>InteractionIds: {currentRecipes.map(r => r.interactionId).join(', ')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
