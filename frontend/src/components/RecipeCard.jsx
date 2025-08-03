import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Star, Heart, ExternalLink, Eye } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const RecipeCard = ({ recipe, geminiResponse, mood, interactionId }) => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [isRating, setIsRating] = useState(false);

  if (!recipe) return null;

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

  const geminiContent = extractGeminiContent(geminiResponse);

  const handleRatingSubmit = async () => {
    if (!interactionId || rating === 0) return;
    
    setIsRating(true);
    try {
      await api.put(`/mood/${interactionId}/rate`, {
        rating,
        notes: notes.trim() || undefined
      });
      toast.success('Rating saved successfully!');
    } catch (error) {
      toast.error('Failed to save rating');
      console.error('Rating error:', error);
    } finally {
      setIsRating(false);
    }
  };

  const handleViewFullRecipe = () => {
    if (interactionId) {
      navigate(`/recipe/${interactionId}`);
    }
  };

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {recipe.title || recipe.recipeName}
          </h2>
          {mood && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              Mood: {mood}
            </div>
          )}
        </div>
        {recipe.image && (
          <img
            src={recipe.image}
            alt={recipe.title || recipe.recipeName}
            className="w-24 h-24 rounded-lg object-cover ml-4"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop';
            }}
          />
        )}
      </div>

      {/* Recipe Info */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {recipe.cookingTime && (
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{recipe.cookingTime} mins</span>
          </div>
        )}
        {recipe.servings && (
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{recipe.servings} servings</span>
          </div>
        )}
        {recipe.nutrition?.calories && (
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span>{Math.round(recipe.nutrition.calories)} calories</span>
          </div>
        )}
      </div>

      {/* Gemini AI Explanation */}
      {geminiContent && (geminiContent.moodExplanation || geminiContent.motivationalNote) && (
        <div className="bg-gradient-to-r from-primary-50 to-pink-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            🤖 Why this recipe matches your mood:
          </h3>
          {geminiContent.moodExplanation && (
            <p className="text-gray-700 mb-3">{geminiContent.moodExplanation}</p>
          )}
          {geminiContent.motivationalNote && (
            <div className="bg-white/60 rounded-md p-3">
              <p className="text-primary-800 font-medium">
                💝 {geminiContent.motivationalNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ingredients Preview */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recipe.ingredients.slice(0, 6).map((ingredient, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-primary-500 mt-1">•</span>
                <span className="text-gray-700 text-sm">{ingredient}</span>
              </div>
            ))}
            {recipe.ingredients.length > 6 && (
              <div className="text-gray-500 text-sm italic">
                +{recipe.ingredients.length - 6} more ingredients...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions Preview */}
      {recipe.instructions && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed line-clamp-3">
              {recipe.instructions}
            </p>
          </div>
        </div>
      )}

      {/* Quick Rating */}
      {interactionId && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Quick rate:</span>
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
                      className={`h-5 w-5 ${
                        star <= rating ? 'fill-current' : ''
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleRatingSubmit}
              disabled={rating === 0 || isRating}
              className="btn-primary text-sm px-3 py-1 disabled:opacity-50"
            >
              {isRating ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        {interactionId && (
          <button
            onClick={handleViewFullRecipe}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>View Full Recipe</span>
          </button>
        )}
        
        {recipe.sourceUrl && recipe.sourceUrl !== '#' && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Original Source</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;