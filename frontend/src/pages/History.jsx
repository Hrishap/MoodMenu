import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Star, Search, Eye, ArrowRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const History = () => {
  const navigate = useNavigate();
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/mood/history?page=${page}&limit=10`);
      setInteractions(response.data.interactions);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch history');
      console.error('History fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewRecipe = (interactionId) => {
    navigate(`/recipe/${interactionId}`);
  };

  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch = !searchTerm || 
      interaction.mood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.recipe?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMood = !selectedMood || interaction.mood === selectedMood;
    
    return matchesSearch && matchesMood;
  });

  const uniqueMoods = [...new Set(interactions.map(i => i.mood))];

  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400 text-sm">Not rated</span>;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-32 bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Mood & Recipe History
        </h1>
        <p className="text-gray-600">
          Track your culinary journey and rediscover favorite recipes
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by mood or recipe name..."
                className="input-primary pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              className="input-primary"
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
            >
              <option value="">All moods</option>
              {uniqueMoods.map(mood => (
                <option key={mood} value={mood}>
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">
            {pagination.total}
          </div>
          <div className="text-gray-600">Total Recipes</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">
            {uniqueMoods.length}
          </div>
          <div className="text-gray-600">Different Moods</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">
            {interactions.filter(i => i.rating >= 4).length}
          </div>
          <div className="text-gray-600">Highly Rated</div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredInteractions.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No interactions found
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedMood
                ? 'Try adjusting your filters'
                : 'Start exploring recipes to build your history'}
            </p>
          </div>
        ) : (
          filteredInteractions.map((interaction) => (
            <div 
              key={interaction._id} 
              className="card hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary-500"
              onClick={() => handleViewRecipe(interaction._id)}
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Recipe Image */}
                {interaction.recipe?.image && (
                  <div className="md:w-32 md:h-32 w-full h-48 flex-shrink-0">
                    <img
                      src={interaction.recipe.image}
                      alt={interaction.recipe.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop';
                      }}
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {interaction.recipe?.title || 'Recipe Suggestion'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {interaction.mood}
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(interaction.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end space-y-2">
                      {renderStars(interaction.rating)}
                      {interaction.recipe?.cookingTime && (
                        <span className="text-sm text-gray-600">
                          {interaction.recipe.cookingTime} mins
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Context Preview */}
                  {interaction.context && (
                    <p className="text-gray-600 text-sm italic line-clamp-2">
                      "{interaction.context}"
                    </p>
                  )}

                  {/* Recipe Preview */}
                  {interaction.recipe?.ingredients && interaction.recipe.ingredients.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Ingredients: </span>
                      <span className="line-clamp-1">
                        {interaction.recipe.ingredients.slice(0, 3).join(', ')}
                        {interaction.recipe.ingredients.length > 3 && '...'}
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-wrap gap-2">
                      {interaction.tags && interaction.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRecipe(interaction._id);
                      }}
                      className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Recipe</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => fetchHistory(pagination.current - 1)}
            disabled={pagination.current === 1}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm bg-primary-50 border border-primary-200 rounded-md">
            Page {pagination.current} of {pagination.pages}
          </span>
          
          <button
            onClick={() => fetchHistory(pagination.current + 1)}
            disabled={pagination.current === pagination.pages}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default History;