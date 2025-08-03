import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Save, Edit3, Calendar, Heart } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    preferences: user?.preferences || {}
  });
  const [stats, setStats] = useState({
    totalInteractions: 0,
    favoriteMode: '',
    averageRating: 0
  });
  const [loading, setLoading] = useState(false);

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 
    'dairy-free', 'nut-free', 'low-carb', 'keto'
  ];

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/mood/history?limit=100');
      const interactions = response.data.interactions;
      
      const moodCounts = {};
      let totalRating = 0;
      let ratedCount = 0;

      interactions.forEach(interaction => {
        moodCounts[interaction.mood] = (moodCounts[interaction.mood] || 0) + 1;
        if (interaction.rating) {
          totalRating += interaction.rating;
          ratedCount++;
        }
      });

      const favoriteMode = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b, ''
      );

      setStats({
        totalInteractions: interactions.length,
        favoriteMode,
        averageRating: ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDietaryChange = (restriction) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        dietaryRestrictions: prev.preferences.dietaryRestrictions?.includes(restriction)
          ? prev.preferences.dietaryRestrictions.filter(r => r !== restriction)
          : [...(prev.preferences.dietaryRestrictions || []), restriction]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.put('/auth/preferences', {
        preferences: formData.preferences
      });
      
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      preferences: user?.preferences || {}
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-10 w-10 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.name}'s Profile
        </h1>
        <p className="text-gray-600">
          Manage your preferences and view your culinary journey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalInteractions}
          </div>
          <div className="text-gray-600">Recipes Explored</div>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 capitalize">
            {stats.favoriteMode || 'N/A'}
          </div>
          <div className="text-gray-600">Favorite Mood</div>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-yellow-600 text-xl">⭐</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.averageRating || 'N/A'}
          </div>
          <div className="text-gray-600">Avg Rating</div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Profile Information
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="input-primary disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled={true}
                className="input-primary disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Since
              </label>
              <div className="input-primary disabled:bg-gray-50 disabled:text-gray-500">
                {new Date(user?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Login
              </label>
              <div className="input-primary disabled:bg-gray-50 disabled:text-gray-500">
                {new Date(user?.lastLogin).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dietary Restrictions
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {dietaryOptions.map((option) => (
                <label
                  key={option}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    isEditing
                      ? 'hover:bg-gray-50'
                      : 'cursor-not-allowed'
                  } ${
                    formData.preferences.dietaryRestrictions?.includes(option)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.preferences.dietaryRestrictions?.includes(option) || false}
                    onChange={() => handleDietaryChange(option)}
                    disabled={!isEditing}
                  />
                  <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                    formData.preferences.dietaryRestrictions?.includes(option)
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {formData.preferences.dietaryRestrictions?.includes(option) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {option.replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center space-x-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Preferences Summary */}
      {!isEditing && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Current Preferences
          </h2>
          
          {formData.preferences.dietaryRestrictions?.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Dietary Restrictions:
              </h3>
              <div className="flex flex-wrap gap-2">
                {formData.preferences.dietaryRestrictions.map((restriction) => (
                  <span
                    key={restriction}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {restriction.replace('-', ' ').charAt(0).toUpperCase() + restriction.replace('-', ' ').slice(1)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              No dietary restrictions set. You can add them by editing your profile.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;