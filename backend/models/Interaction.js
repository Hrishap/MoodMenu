const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mood: {
    type: String,
    required: true,
    trim: true
  },
  context: {
    type: String,
    trim: true
  },
  prompt: {
    type: String,
    required: true
  },
  geminiResponse: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  recipe: {
    id: String,
    title: String,
    image: String,
    ingredients: [String],
    instructions: String,
    cookingTime: Number,
    servings: Number,
    nutrition: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
InteractionSchema.index({ userId: 1, createdAt: -1 });
InteractionSchema.index({ mood: 1 });
InteractionSchema.index({ tags: 1 });

module.exports = mongoose.model('Interaction', InteractionSchema);
