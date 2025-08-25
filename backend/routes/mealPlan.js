const express = require('express');
const router = express.Router();
const MealPlan = require('../models/MealPlan');
const mealPlannerService = require('../services/mealPlannerService');
const authMiddleware = require('../middleware/auth');

// All meal plan routes require authentication
router.use(authMiddleware);

// Create a new meal plan
router.post('/create', async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      startDate,
      preferences,
      generateWithAI = true
    } = req.body;

    if (!name || !duration || !startDate) {
      return res.status(400).json({ 
        message: 'Name, duration, and start date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + duration - 1);

    let mealPlanData = {
      days: [],
      shoppingList: [],
      tips: ''
    };

    // Generate meal plan with AI if requested
    if (generateWithAI) {
      try {
        mealPlanData = await mealPlannerService.generateMealPlan(preferences, duration);
      } catch (aiError) {
        console.error('AI meal plan generation failed, using fallback:', aiError);
        // Continue with empty meal plan data, user can manually add meals
        mealPlanData = {
          days: Array.from({ length: duration }, (_, i) => ({
            date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000),
            meals: {},
            totalCalories: 0
          })),
          shoppingList: [],
          tips: 'AI generation failed. You can manually add meals to this plan.'
        };
      }
    }

    const mealPlan = new MealPlan({
      userId: req.user.id,
      name,
      description: description || '',
      startDate: start,
      endDate: end,
      duration,
      preferences: preferences || {},
      days: mealPlanData.days.map(day => ({
        date: day.date,
        meals: day.meals,
        totalCalories: day.totalCalories,
        shoppingList: day.shoppingList || []
      })),
      status: 'draft',
      generatedBy: generateWithAI ? 'ai' : 'manual'
    });

    await mealPlan.save();

    res.status(201).json({
      message: 'Meal plan created successfully',
      mealPlan,
      additionalData: {
        shoppingList: mealPlanData.shoppingList,
        tips: mealPlanData.tips,
        nutritionSummary: mealPlanData.nutritionSummary
      }
    });

  } catch (error) {
    console.error('Create meal plan error:', error);
    res.status(500).json({ message: 'Failed to create meal plan' });
  }
});

// Get all meal plans for user
router.get('/list', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };
    if (status) {
      filter.status = status;
    }

    const mealPlans = await MealPlan.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip)
      .select('name description startDate endDate duration status createdAt preferences');

    const total = await MealPlan.countDocuments(filter);

    res.json({
      mealPlans,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({ message: 'Failed to fetch meal plans' });
  }
});

// Get specific meal plan
router.get('/:id', async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    // Generate shopping list if not present
    if (!mealPlan.days.some(day => day.shoppingList && day.shoppingList.length > 0)) {
      const shoppingList = mealPlan.generateShoppingList();
      res.json({ mealPlan, generatedShoppingList: shoppingList });
    } else {
      res.json({ mealPlan });
    }

  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({ message: 'Failed to fetch meal plan' });
  }
});

// Update meal plan
router.put('/:id', async (req, res) => {
  try {
    const { name, description, preferences, status } = req.body;

    const mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    // Update allowed fields
    if (name) mealPlan.name = name;
    if (description !== undefined) mealPlan.description = description;
    if (preferences) mealPlan.preferences = { ...mealPlan.preferences, ...preferences };
    if (status) mealPlan.status = status;

    mealPlan.lastModified = new Date();
    await mealPlan.save();

    res.json({ message: 'Meal plan updated successfully', mealPlan });

  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({ message: 'Failed to update meal plan' });
  }
});

// Delete meal plan
router.delete('/:id', async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    res.json({ message: 'Meal plan deleted successfully' });

  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({ message: 'Failed to delete meal plan' });
  }
});

// Update specific meal in a day
router.put('/:id/day/:dayIndex/meal/:mealType', async (req, res) => {
  try {
    const { id, dayIndex, mealType } = req.params;
    const { meal, regenerate = false } = req.body;

    const mealPlan = await MealPlan.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    const dayIdx = parseInt(dayIndex);
    if (dayIdx < 0 || dayIdx >= mealPlan.days.length) {
      return res.status(400).json({ message: 'Invalid day index' });
    }

    let updatedMeal = meal;

    // Regenerate meal with AI if requested
    if (regenerate) {
      try {
        const existingMeals = mealPlan.days.flatMap(day => 
          Object.values(day.meals).filter(m => m && m.recipeName)
        );
        
        updatedMeal = await mealPlannerService.generateSingleMeal(
          mealType,
          mealPlan.preferences,
          existingMeals.slice(-5) // Last 5 meals to avoid repetition
        );
      } catch (aiError) {
        console.error('AI meal regeneration failed:', aiError);
        return res.status(500).json({ 
          message: 'Failed to regenerate meal with AI. Please try again or add a meal manually.' 
        });
      }
    }

    // Update the specific meal
    if (mealType === 'snacks') {
      // Handle snacks array
      const snackIndex = req.body.snackIndex || 0;
      if (!mealPlan.days[dayIdx].meals.snacks) {
        mealPlan.days[dayIdx].meals.snacks = [];
      }
      mealPlan.days[dayIdx].meals.snacks[snackIndex] = updatedMeal;
    } else {
      mealPlan.days[dayIdx].meals[mealType] = updatedMeal;
    }

    // Recalculate daily calories
    mealPlan.updateDailyCalories();
    mealPlan.lastModified = new Date();
    
    await mealPlan.save();

    res.json({ 
      message: 'Meal updated successfully', 
      updatedMeal,
      updatedDayCalories: mealPlan.days[dayIdx].totalCalories
    });

  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ message: 'Failed to update meal' });
  }
});

// Customize a specific meal
router.post('/:id/day/:dayIndex/meal/:mealType/customize', async (req, res) => {
  try {
    const { id, dayIndex, mealType } = req.params;
    const { modifications } = req.body;

    const mealPlan = await MealPlan.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    const dayIdx = parseInt(dayIndex);
    if (dayIdx < 0 || dayIdx >= mealPlan.days.length) {
      return res.status(400).json({ message: 'Invalid day index' });
    }

    const originalMeal = mealPlan.days[dayIdx].meals[mealType];
    if (!originalMeal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Customize meal with AI
    const customizedMeal = await mealPlannerService.customizeMeal(
      originalMeal,
      modifications,
      mealPlan.preferences
    );

    // Update the meal
    mealPlan.days[dayIdx].meals[mealType] = customizedMeal;
    mealPlan.updateDailyCalories();
    mealPlan.lastModified = new Date();
    
    await mealPlan.save();

    res.json({ 
      message: 'Meal customized successfully', 
      customizedMeal,
      updatedDayCalories: mealPlan.days[dayIdx].totalCalories
    });

  } catch (error) {
    console.error('Customize meal error:', error);
    res.status(500).json({ message: 'Failed to customize meal' });
  }
});

// Get ingredient substitutions
router.post('/:id/day/:dayIndex/meal/:mealType/substitutions', async (req, res) => {
  try {
    const { id, dayIndex, mealType } = req.params;
    const { unavailableIngredients } = req.body;

    if (!unavailableIngredients || !Array.isArray(unavailableIngredients)) {
      return res.status(400).json({ message: 'Unavailable ingredients array is required' });
    }

    const mealPlan = await MealPlan.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    const dayIdx = parseInt(dayIndex);
    const meal = mealPlan.days[dayIdx]?.meals[mealType];
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    const substitutions = await mealPlannerService.suggestIngredientSubstitutions(
      meal,
      unavailableIngredients,
      mealPlan.preferences
    );

    res.json({ substitutions });

  } catch (error) {
    console.error('Get substitutions error:', error);
    res.status(500).json({ message: 'Failed to get ingredient substitutions' });
  }
});

// Generate shopping list for meal plan
router.get('/:id/shopping-list', async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    const shoppingList = mealPlan.generateShoppingList();
    
    res.json({ shoppingList });

  } catch (error) {
    console.error('Generate shopping list error:', error);
    res.status(500).json({ message: 'Failed to generate shopping list' });
  }
});

// Update shopping list item
router.put('/:id/shopping-list/:itemIndex', async (req, res) => {
  try {
    const { id, itemIndex } = req.params;
    const { checked } = req.body;

    const mealPlan = await MealPlan.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    // For now, we'll store shopping list state in the first day
    // In a more complex implementation, you might want a separate shopping list model
    const idx = parseInt(itemIndex);
    const shoppingList = mealPlan.generateShoppingList();
    
    if (idx >= 0 && idx < shoppingList.length) {
      shoppingList[idx].checked = checked;
      
      // Store updated shopping list in the meal plan
      if (!mealPlan.days[0].shoppingList) {
        mealPlan.days[0].shoppingList = [];
      }
      mealPlan.days[0].shoppingList = shoppingList;
      
      await mealPlan.save();
      
      res.json({ message: 'Shopping list updated', shoppingList });
    } else {
      res.status(400).json({ message: 'Invalid item index' });
    }

  } catch (error) {
    console.error('Update shopping list error:', error);
    res.status(500).json({ message: 'Failed to update shopping list' });
  }
});

module.exports = router;