import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Star, Heart, ExternalLink, MessageCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const RecipeDetail = () => {
  const { interactionId } = useParams();
  const navigate = useNavigate();
  const [interaction, setInteraction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [isRating, setIsRating] = useState(false);

  useEffect(() => {
    fetchInteractionDetails();
  }, [interactionId]);

  const fetchInteractionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/mood/${interactionId}`);
      const data = response.data.interaction;
      setInteraction(data);
      setRating(data.rating || 0);
      setNotes(data.notes || '');
    } catch (error) {
      toast.error('Failed to fetch recipe details');
      console.error('Fetch interaction error:', error);
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) return;
    
    setIsRating(true);
    try {
      await api.put(`/mood/${interactionId}/rate`, {
        rating,
        notes: notes.trim() || undefined
      });
      toast.success('Rating saved successfully!');
      
      // Update local state
      setInteraction(prev => ({
        ...prev,
        rating,
        notes: notes.trim()
      }));
    } catch (error) {
      toast.error('Failed to save rating');
      console.error('Rating error:', error);
    } finally {
      setIsRating(false);
    }
  };

  const extractGeminiContent = (response) => {
    if (typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch {
        return { motivationalNote: response };
      }
    }
    
    if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = response.candidates[0].content.parts[0].text;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return { motivationalNote: text };
      } catch {
        return { motivationalNote: text };
      }
    }
    
    return response || {};
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!interaction) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h2>
        <button
          onClick={() => navigate('/history')}
          className="btn-primary"
        >
          Back to History
        </button>
      </div>
    );
  }

  const { recipe } = interaction;
  const geminiContent = extractGeminiContent(interaction.geminiResponse);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/history')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to History</span>
      </button>

      {/* Recipe Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-6">
          {recipe.image && (
            <div className="lg:w-1/3">
              <img
                src={recipe.image}
                alt={recipe.title || recipe.recipeName}
                className="w-full h-64 lg:h-80 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop';
                }}
              />
            </div>
          )}
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {recipe.title || recipe.recipeName}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  Mood: {interaction.mood}
                </span>
                <span className="text-gray-500">
                  {new Date(interaction.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Recipe Info */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              {recipe.cookingTime && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{recipe.cookingTime} minutes</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}
              {recipe.nutrition?.calories && (
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>{Math.round(recipe.nutrition.calories)} calories</span>
                </div>
              )}
            </div>

            {/* Context */}
            {interaction.context && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Your Context:</h3>
                <p className="text-gray-700 italic">"{interaction.context}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Explanation */}
      {geminiContent && (geminiContent.moodExplanation || geminiContent.motivationalNote) && (
        <div className="card bg-gradient-to-r from-primary-50 to-pink-50">
          <div className="flex items-start space-x-3">
            <MessageCircle className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">
                Why this recipe matches your mood:
              </h3>
              {geminiContent.moodExplanation && (
                <p className="text-gray-700">{geminiContent.moodExplanation}</p>
              )}
              {geminiContent.motivationalNote && (
                <div className="bg-white/60 rounded-md p-3">
                  <p className="text-primary-800 font-medium">
                    💝 {geminiContent.motivationalNote}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ingredients & Instructions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="text-primary-500 mt-2 text-lg">•</span>
                  <span className="text-gray-700">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {recipe.instructions}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nutrition Info */}
      {recipe.nutrition && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nutrition (per serving)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recipe.nutrition.calories && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(recipe.nutrition.calories)}
                </div>
                <div className="text-sm text-blue-800">Calories</div>
              </div>
            )}
            {recipe.nutrition.protein && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(recipe.nutrition.protein)}g
                </div>
                <div className="text-sm text-green-800">Protein</div>
              </div>
            )}
            {recipe.nutrition.carbs && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(recipe.nutrition.carbs)}g
                </div>
                <div className="text-sm text-yellow-800">Carbs</div>
              </div>
            )}
            {recipe.nutrition.fat && (
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(recipe.nutrition.fat)}g
                </div>
                <div className="text-sm text-purple-800">Fat</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Rate This Recipe</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Your rating:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 rounded transition-colors ${
                    star <= rating
                      ? 'text-yellow-400 hover:text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating ? 'fill-current' : ''
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="text-sm text-gray-600">({rating}/5)</span>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional):
            </label>
            <textarea
              rows={3}
              className="input-primary resize-none"
              placeholder="How was this recipe? Any modifications you made?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleRatingSubmit}
            disabled={rating === 0 || isRating}
            className="btn-primary disabled:opacity-50"
          >
            {isRating ? 'Saving...' : 'Save Rating & Notes'}
          </button>
        </div>

        {/* Show current rating if exists */}
        {interaction.rating && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium text-gray-900 mb-2">Your Previous Rating:</h3>
            <div className="flex items-center space-x-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= interaction.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-sm text-gray-600">({interaction.rating}/5)</span>
            </div>
            {interaction.notes && (
              <p className="text-sm text-gray-700 italic">"{interaction.notes}"</p>
            )}
          </div>
        )}
      </div>

      {/* External Link */}
      {recipe.sourceUrl && recipe.sourceUrl !== '#' && (
        <div className="card text-center">
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors text-lg"
          >
            <ExternalLink className="h-5 w-5" />
            <span>View Original Recipe Source</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;