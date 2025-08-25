const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  preferences: {
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo', 'mediterranean']
    }],
    cuisinePreferences: [String],
    allergies: [String],
    // Meal planning specific preferences
    mealPlanning: {
      dislikedIngredients: [String],
      preferredIngredients: [String],
      defaultCookingTime: {
        type: String,
        enum: ['quick', 'moderate', 'extended'],
        default: 'moderate'
      },
      defaultDifficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'easy'
      },
      defaultCalorieTarget: {
        type: Number,
        default: 2000
      },
      defaultMealsPerDay: {
        type: Number,
        min: 1,
        max: 6,
        default: 3
      },
      includeSnacks: {
        type: Boolean,
        default: true
      },
      preferredMealTypes: [{
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack']
      }]
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);