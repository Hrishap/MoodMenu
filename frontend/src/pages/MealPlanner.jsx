import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import MealPlanCard from '../components/MealPlanCard';
import MealPlanForm from '../components/MealPlanForm';
import mealPlannerApi from '../services/mealPlannerApi';

const MealPlanner = () => {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadMealPlans();
  }, [statusFilter, pagination.current]);

  const loadMealPlans = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: 9
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await mealPlannerApi.getMealPlans(params);
      setMealPlans(response.mealPlans);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load meal plans:', error);
      toast.error('Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (formData) => {
    try {
      setIsCreating(true);
      const planData = mealPlannerApi.formatMealPlanForAPI(formData);
      
      const response = await mealPlannerApi.createMealPlan(planData);
      
      toast.success('Meal plan created successfully!');
      setShowCreateForm(false);
      
      // Navigate to the new meal plan
      navigate(`/meal-planner/${response.mealPlan._id}`);
      
    } catch (error) {
      console.error('Failed to create meal plan:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create meal plan';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditPlan = (planId) => {
    const plan = mealPlans.find(p => p._id === planId);
    if (plan) {
      setEditingPlan(plan);
      setShowCreateForm(true);
    }
  };

  const handleUpdatePlan = async (formData) => {
    try {
      setIsCreating(true);
      const updates = {
        name: formData.name,
        description: formData.description,
        preferences: {
          dietaryRestrictions: formData.dietaryRestrictions,
          cuisinePreferences: formData.cuisinePreferences,
          allergies: formData.allergies,
          dislikedIngredients: formData.dislikedIngredients,
          preferredIngredients: formData.preferredIngredients,
          cookingTime: formData.cookingTime,
          difficulty: formData.difficulty,
          calorieTarget: formData.calorieTarget,
          mealsPerDay: formData.mealsPerDay,
          includeSnacks: formData.includeSnacks
        }
      };

      await mealPlannerApi.updateMealPlan(editingPlan._id, updates);
      
      toast.success('Meal plan updated successfully!');
      setShowCreateForm(false);
      setEditingPlan(null);
      loadMealPlans();
      
    } catch (error) {
      console.error('Failed to update meal plan:', error);
      toast.error('Failed to update meal plan');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this meal plan?')) {
      return;
    }

    try {
      await mealPlannerApi.deleteMealPlan(planId);
      toast.success('Meal plan deleted successfully');
      loadMealPlans();
    } catch (error) {
      console.error('Failed to delete meal plan:', error);
      toast.error('Failed to delete meal plan');
    }
  };

  const handleViewPlan = (planId) => {
    navigate(`/meal-planner/${planId}`);
  };

  const handleStartPlan = async (planId) => {
    try {
      await mealPlannerApi.updateMealPlan(planId, { status: 'active' });
      toast.success('Meal plan started!');
      loadMealPlans();
    } catch (error) {
      console.error('Failed to start meal plan:', error);
      toast.error('Failed to start meal plan');
    }
  };

  const filteredPlans = mealPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingPlan(null);
  };

  const handleFormSubmit = (formData) => {
    if (editingPlan) {
      handleUpdatePlan(formData);
    } else {
      handleCreatePlan(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChefHat className="w-8 h-8 mr-3 text-blue-600" />
                AI Meal Planner
              </h1>
              <p className="text-gray-600 mt-1">
                Create personalized meal plans tailored to your preferences
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Meal Plan
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search meal plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading meal plans...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPlans.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'No meal plans found' 
                : 'No meal plans yet'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first AI-powered meal plan to get started!'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Meal Plan
              </button>
            )}
          </div>
        )}

        {/* Meal Plans Grid */}
        {!loading && filteredPlans.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredPlans.map((plan) => (
                <MealPlanCard
                  key={plan._id}
                  mealPlan={plan}
                  onView={handleViewPlan}
                  onEdit={handleEditPlan}
                  onDelete={handleDeletePlan}
                  onStart={handleStartPlan}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: Math.max(1, prev.current - 1) }))}
                  disabled={pagination.current === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {pagination.current} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: Math.min(prev.pages, prev.current + 1) }))}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <MealPlanForm
          initialData={editingPlan}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isCreating}
        />
      )}
    </div>
  );
};

export default MealPlanner;