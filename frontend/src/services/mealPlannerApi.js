import api from './api';

class MealPlannerAPI {
  // Create a new meal plan
  async createMealPlan(mealPlanData) {
    try {
      const response = await api.post('/meal-plan/create', mealPlanData);
      return response.data;
    } catch (error) {
      console.error('Create meal plan error:', error);
      throw error;
    }
  }

  // Get all meal plans for the user
  async getMealPlans(params = {}) {
    try {
      const response = await api.get('/meal-plan/list', { params });
      return response.data;
    } catch (error) {
      console.error('Get meal plans error:', error);
      throw error;
    }
  }

  // Get a specific meal plan
  async getMealPlan(id) {
    try {
      const response = await api.get(`/meal-plan/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get meal plan error:', error);
      throw error;
    }
  }

  // Update meal plan
  async updateMealPlan(id, updates) {
    try {
      const response = await api.put(`/meal-plan/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Update meal plan error:', error);
      throw error;
    }
  }

  // Delete meal plan
  async deleteMealPlan(id) {
    try {
      const response = await api.delete(`/meal-plan/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete meal plan error:', error);
      throw error;
    }
  }

  // Update a specific meal in a day
  async updateMeal(mealPlanId, dayIndex, mealType, mealData, regenerate = false) {
    try {
      const response = await api.put(
        `/meal-plan/${mealPlanId}/day/${dayIndex}/meal/${mealType}`,
        { meal: mealData, regenerate }
      );
      return response.data;
    } catch (error) {
      console.error('Update meal error:', error);
      throw error;
    }
  }

  // Regenerate a specific meal
  async regenerateMeal(mealPlanId, dayIndex, mealType) {
    try {
      const response = await api.put(
        `/meal-plan/${mealPlanId}/day/${dayIndex}/meal/${mealType}`,
        { regenerate: true }
      );
      return response.data;
    } catch (error) {
      console.error('Regenerate meal error:', error);
      throw error;
    }
  }

  // Customize a specific meal
  async customizeMeal(mealPlanId, dayIndex, mealType, modifications) {
    try {
      const response = await api.post(
        `/meal-plan/${mealPlanId}/day/${dayIndex}/meal/${mealType}/customize`,
        { modifications }
      );
      return response.data;
    } catch (error) {
      console.error('Customize meal error:', error);
      throw error;
    }
  }

  // Get ingredient substitutions
  async getIngredientSubstitutions(mealPlanId, dayIndex, mealType, unavailableIngredients) {
    try {
      const response = await api.post(
        `/meal-plan/${mealPlanId}/day/${dayIndex}/meal/${mealType}/substitutions`,
        { unavailableIngredients }
      );
      return response.data;
    } catch (error) {
      console.error('Get substitutions error:', error);
      throw error;
    }
  }

  // Get shopping list for meal plan
  async getShoppingList(mealPlanId) {
    try {
      const response = await api.get(`/meal-plan/${mealPlanId}/shopping-list`);
      return response.data;
    } catch (error) {
      console.error('Get shopping list error:', error);
      throw error;
    }
  }

  // Update shopping list item
  async updateShoppingListItem(mealPlanId, itemIndex, checked) {
    try {
      const response = await api.put(
        `/meal-plan/${mealPlanId}/shopping-list/${itemIndex}`,
        { checked }
      );
      return response.data;
    } catch (error) {
      console.error('Update shopping list item error:', error);
      throw error;
    }
  }

  // Helper method to format meal plan data for API
  formatMealPlanForAPI(formData) {
    return {
      name: formData.name,
      description: formData.description || '',
      duration: parseInt(formData.duration) || 7,
      startDate: formData.startDate,
      preferences: {
        dietaryRestrictions: formData.dietaryRestrictions || [],
        cuisinePreferences: formData.cuisinePreferences || [],
        allergies: formData.allergies || [],
        dislikedIngredients: formData.dislikedIngredients || [],
        preferredIngredients: formData.preferredIngredients || [],
        cookingTime: formData.cookingTime || 'moderate',
        difficulty: formData.difficulty || 'easy',
        calorieTarget: parseInt(formData.calorieTarget) || 2000,
        mealsPerDay: parseInt(formData.mealsPerDay) || 3,
        includeSnacks: formData.includeSnacks !== false
      },
      generateWithAI: formData.generateWithAI !== false
    };
  }

  // Helper method to validate meal plan form data
  validateMealPlanData(formData) {
    const errors = [];

    if (!formData.name || formData.name.trim().length === 0) {
      errors.push('Meal plan name is required');
    }

    if (!formData.startDate) {
      errors.push('Start date is required');
    }

    if (!formData.duration || formData.duration < 1 || formData.duration > 30) {
      errors.push('Duration must be between 1 and 30 days');
    }

    if (formData.calorieTarget && (formData.calorieTarget < 800 || formData.calorieTarget > 5000)) {
      errors.push('Calorie target must be between 800 and 5000');
    }

    if (formData.mealsPerDay && (formData.mealsPerDay < 1 || formData.mealsPerDay > 6)) {
      errors.push('Meals per day must be between 1 and 6');
    }

    return errors;
  }

  // Get default meal plan preferences
  getDefaultPreferences() {
    return {
      dietaryRestrictions: [],
      cuisinePreferences: [],
      allergies: [],
      dislikedIngredients: [],
      preferredIngredients: [],
      cookingTime: 'moderate',
      difficulty: 'easy',
      calorieTarget: 2000,
      mealsPerDay: 3,
      includeSnacks: true
    };
  }

  // Format meal for display
  formatMealForDisplay(meal) {
    if (!meal) return null;

    return {
      ...meal,
      ingredients: meal.ingredients || [],
      tags: meal.tags || [],
      cookingTime: meal.cookingTime || 30,
      servings: meal.servings || 2,
      calories: meal.calories || 0,
      difficulty: meal.difficulty || 'easy'
    };
  }

  // Calculate total calories for a day
  calculateDayCalories(meals) {
    let total = 0;

    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      if (meals[mealType] && meals[mealType].calories) {
        total += meals[mealType].calories;
      }
    });

    if (meals.snacks && Array.isArray(meals.snacks)) {
      meals.snacks.forEach(snack => {
        if (snack.calories) total += snack.calories;
      });
    }

    return total;
  }

  // Get meal type display name
  getMealTypeDisplayName(mealType) {
    const displayNames = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack'
    };
    return displayNames[mealType] || mealType;
  }

  // Get cooking time display text
  getCookingTimeDisplayText(cookingTimePreference) {
    const displayText = {
      quick: 'Quick (< 30 min)',
      moderate: 'Moderate (30-60 min)',
      extended: 'Extended (> 60 min)'
    };
    return displayText[cookingTimePreference] || cookingTimePreference;
  }

  // Get difficulty display text
  getDifficultyDisplayText(difficulty) {
    const displayText = {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard'
    };
    return displayText[difficulty] || difficulty;
  }
}

export default new MealPlannerAPI();