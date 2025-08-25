import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  ShoppingCart, 
  Edit,
  Download,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

import MealCard from '../components/MealCard';
import mealPlannerApi from '../services/mealPlannerApi';

const MealPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingList, setShoppingList] = useState([]);
  const [loadingShoppingList, setLoadingShoppingList] = useState(false);

  useEffect(() => {
    loadMealPlan();
  }, [id]);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      const response = await mealPlannerApi.getMealPlan(id);
      setMealPlan(response.mealPlan);
      
      // Set active day to today if plan is current
      if (response.mealPlan.status === 'active') {
        const today = new Date();
        const startDate = new Date(response.mealPlan.startDate);
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < response.mealPlan.days.length) {
          setActiveDay(daysDiff);
        }
      }
    } catch (error) {
      console.error('Failed to load meal plan:', error);
      toast.error('Failed to load meal plan');
      navigate('/meal-planner');
    } finally {
      setLoading(false);
    }
  };

  const loadShoppingList = async () => {
    try {
      setLoadingShoppingList(true);
      const response = await mealPlannerApi.getShoppingList(id);
      setShoppingList(response.shoppingList);
    } catch (error) {
      console.error('Failed to load shopping list:', error);
      toast.error('Failed to load shopping list');
    } finally {
      setLoadingShoppingList(false);
    }
  };

  const handleMealRegenerate = async (dayIndex, mealType) => {
    try {
      const response = await mealPlannerApi.regenerateMeal(id, dayIndex, mealType);
      
      // Update the meal plan with the new meal
      setMealPlan(prev => {
        const updated = { ...prev };
        updated.days[dayIndex].meals[mealType] = response.updatedMeal;
        updated.days[dayIndex].totalCalories = response.updatedDayCalories;
        return updated;
      });
      
      toast.success('Meal regenerated successfully!');
    } catch (error) {
      console.error('Failed to regenerate meal:', error);
      toast.error('Failed to regenerate meal');
    }
  };

  const handleMealCustomize = async (dayIndex, mealType, modifications) => {
    try {
      const response = await mealPlannerApi.customizeMeal(id, dayIndex, mealType, modifications);
      
      // Update the meal plan with the customized meal
      setMealPlan(prev => {
        const updated = { ...prev };
        updated.days[dayIndex].meals[mealType] = response.customizedMeal;
        updated.days[dayIndex].totalCalories = response.updatedDayCalories;
        return updated;
      });
      
      toast.success('Meal customized successfully!');
    } catch (error) {
      console.error('Failed to customize meal:', error);
      toast.error('Failed to customize meal');
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await mealPlannerApi.updateMealPlan(id, { status: newStatus });
      setMealPlan(prev => ({ ...prev, status: newStatus }));
      toast.success(`Meal plan ${newStatus}!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const getCurrentDay = () => {
    if (!mealPlan || mealPlan.status !== 'active') return -1;
    
    const today = new Date();
    const startDate = new Date(mealPlan.startDate);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    return daysDiff >= 0 && daysDiff < mealPlan.days.length ? daysDiff : -1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Meal Plan Not Found</h2>
          <p className="text-gray-600 mb-4">The meal plan you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/meal-planner')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Meal Planner
          </button>
        </div>
      </div>
    );
  }

  const currentDay = getCurrentDay();
  const activeData = mealPlan.days[activeDay];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/meal-planner')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{mealPlan.name}</h1>
                {mealPlan.description && (
                  <p className="text-gray-600 mt-1">{mealPlan.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mealPlan.status)}`}>
                {mealPlan.status.charAt(0).toUpperCase() + mealPlan.status.slice(1)}
              </div>
              
              {mealPlan.status === 'draft' && (
                <button
                  onClick={() => handleStatusUpdate('active')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Plan
                </button>
              )}
              
              {mealPlan.status === 'active' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Complete
                </button>
              )}
            </div>
          </div>

          {/* Plan Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{mealPlan.duration} days</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Meals/Day</p>
                  <p className="font-semibold">{mealPlan.preferences?.mealsPerDay || 3}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Daily Calories</p>
                  <p className="font-semibold">{mealPlan.preferences?.calorieTarget || 2000}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className="font-semibold capitalize">{mealPlan.preferences?.difficulty || 'easy'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Day Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Days</h3>
                <button
                  onClick={() => {
                    setShowShoppingList(!showShoppingList);
                    if (!showShoppingList) loadShoppingList();
                  }}
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Shopping List
                </button>
              </div>
              
              <div className="space-y-2">
                {mealPlan.days.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveDay(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeDay === index
                        ? 'bg-blue-600 text-white'
                        : index === currentDay
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Day {index + 1}</p>
                        <p className="text-xs opacity-75">
                          {formatDate(day.date).split(',')[0]}
                        </p>
                      </div>
                      {index === currentDay && (
                        <span className="text-xs bg-current bg-opacity-20 px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1 opacity-75">
                      {day.totalCalories || 0} cal
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Day Content */}
          <div className="lg:w-3/4">
            {activeData && (
              <>
                {/* Day Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Day {activeDay + 1}
                      </h2>
                      <p className="text-gray-600">{formatDate(activeData.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Calories</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {activeData.totalCalories || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-6">
                  {['breakfast', 'lunch', 'dinner'].map(mealType => (
                    <div key={mealType}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize flex items-center">
                        {mealType}
                        {activeData.meals[mealType] && (
                          <span className="ml-2 text-sm text-gray-500 font-normal">
                            ({activeData.meals[mealType].calories || 0} cal)
                          </span>
                        )}
                      </h3>
                      <MealCard
                        meal={activeData.meals[mealType]}
                        mealType={mealType}
                        dayIndex={activeDay}
                        mealPlanId={id}
                        onRegenerate={() => handleMealRegenerate(activeDay, mealType)}
                        onCustomize={(meal) => {
                          // Here you would open a customization modal
                          // For now, we'll just show a toast
                          toast('Customization feature coming soon!', { icon: '🚧' });
                        }}
                      />
                    </div>
                  ))}

                  {/* Snacks */}
                  {activeData.meals.snacks && activeData.meals.snacks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Snacks</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeData.meals.snacks.map((snack, index) => (
                          <MealCard
                            key={index}
                            meal={snack}
                            mealType="snack"
                            dayIndex={activeDay}
                            mealPlanId={id}
                            onRegenerate={() => handleMealRegenerate(activeDay, 'snacks')}
                            className="h-fit"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Shopping List Modal */}
        {showShoppingList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Shopping List
                </h3>
                <button
                  onClick={() => setShowShoppingList(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6">
                {loadingShoppingList ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading shopping list...</p>
                  </div>
                ) : shoppingList.length > 0 ? (
                  <div className="space-y-2">
                    {shoppingList.map((item, index) => (
                      <div key={index} className="flex items-center p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={item.checked || false}
                          onChange={(e) => {
                            // Update shopping list item
                            setShoppingList(prev => 
                              prev.map((listItem, i) => 
                                i === index ? { ...listItem, checked: e.target.checked } : listItem
                              )
                            );
                          }}
                          className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className={`flex-1 ${item.checked ? 'line-through text-gray-500' : ''}`}>
                          <p className="font-medium">{item.ingredient}</p>
                          <p className="text-sm text-gray-600">{item.amount} {item.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No shopping list available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanDetail;