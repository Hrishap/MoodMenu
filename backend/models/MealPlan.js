const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  recipeName: {
    type: String,
    required: true
  },
  ingredients: [{
    name: String,
    amount: String,
    unit: String
  }],
  instructions: {
    type: String,
    required: true
  },
  cookingTime: {
    type: Number, // in minutes
    default: 30
  },
  servings: {
    type: Number,
    default: 2
  },
  calories: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  tags: [String],
  nutritionHighlights: String,
  image: String,
  customized: {
    type: Boolean,
    default: false
  },
  originalRecipe: String // Store original AI-generated recipe for reference
});

const DayPlanSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  meals: {
    breakfast: MealSchema,
    lunch: MealSchema,
    dinner: MealSchema,
    snacks: [MealSchema]
  },
  totalCalories: {
    type: Number,
    default: 0
  },
  shoppingList: [{
    ingredient: String,
    amount: String,
    unit: String,
    checked: {
      type: Boolean,
      default: false
    }
  }]
});

const MealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // days
    required: true
  },
  preferences: {
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo', 'mediterranean']
    }],
    cuisinePreferences: [String],
    allergies: [String],
    dislikedIngredients: [String],
    preferredIngredients: [String],
    cookingTime: {
      type: String,
      enum: ['quick', 'moderate', 'extended'], // <30min, 30-60min, >60min
      default: 'moderate'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy'
    },
    calorieTarget: {
      type: Number,
      default: 2000
    },
    mealsPerDay: {
      type: Number,
      min: 1,
      max: 6,
      default: 3
    },
    includeSnacks: {
      type: Boolean,
      default: true
    }
  },
  days: [DayPlanSchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  generatedBy: {
    type: String,
    enum: ['ai', 'manual', 'hybrid'],
    default: 'ai'
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
MealPlanSchema.index({ userId: 1, status: 1 });
MealPlanSchema.index({ userId: 1, startDate: 1 });
MealPlanSchema.index({ createdAt: -1 });

// Virtual for checking if meal plan is current
MealPlanSchema.virtual('isCurrent').get(function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
});

// Method to calculate total shopping list
MealPlanSchema.methods.generateShoppingList = function() {
  const ingredientMap = new Map();
  
  this.days.forEach(day => {
    Object.values(day.meals).forEach(meal => {
      if (meal && meal.ingredients) {
        meal.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          if (ingredientMap.has(key)) {
            // Simple addition for now - could be enhanced with unit conversion
            const existing = ingredientMap.get(key);
            existing.amount = `${existing.amount} + ${ingredient.amount}`;
          } else {
            ingredientMap.set(key, {
              ingredient: ingredient.name,
              amount: ingredient.amount,
              unit: ingredient.unit,
              checked: false
            });
          }
        });
      }
    });
  });
  
  return Array.from(ingredientMap.values());
};

// Method to update daily calories
MealPlanSchema.methods.updateDailyCalories = function() {
  this.days.forEach(day => {
    let totalCalories = 0;
    Object.values(day.meals).forEach(meal => {
      if (meal && meal.calories) {
        totalCalories += meal.calories;
      }
    });
    day.totalCalories = totalCalories;
  });
};

module.exports = mongoose.model('MealPlan', MealPlanSchema);