const Interaction = require('../models/Interaction');
const geminiService = require('../services/geminiService');
const imageService = require('../services/imageService');
const substitutionService = require('../services/substitutionService');

// Submit mood and get MULTIPLE recipe suggestions (FIXED)
exports.submitMood = async (req, res) => {
  try {
    const { mood, context, preferredCategory } = req.body;
    const userId = req.user._id;

    if (!mood) {
      return res.status(400).json({ message: 'Mood is required' });
    }

    // Generate multiple recipes using enhanced Gemini service
    const multipleRecipes = await geminiService.generateMultipleRecipes(
      mood, 
      context, 
      req.user.preferences, 
      3
    );

    // Save interaction to database FIRST to get the ID
    const interaction = new Interaction({
      userId,
      mood,
      context,
      prompt: `Multi-recipe request for mood: ${mood}`,
      geminiResponse: { multipleRecipes: [] }, // Temporary empty array
      recipe: {}, // Temporary empty object
      tags: [mood, 'multi-recipe', 'ai-enhanced'],
      metadata: {
        totalRecipes: multipleRecipes.length,
        categories: multipleRecipes.map(r => r.category),
        preferredCategory
      }
    });

    await interaction.save();

    // Enhance each recipe with images AND interactionId
    const enhancedRecipes = await Promise.all(
      multipleRecipes.map(async (recipe) => {
        // Get image for the recipe
        const imageUrl = await imageService.getRecipeImage(
          recipe.recipeName, 
          recipe.category
        );

        return {
          ...recipe,
          image: imageUrl,
          enhancedAt: new Date().toISOString(),
          interactionId: interaction._id // ADD INTERACTION ID HERE
        };
      })
    );

    // Update the interaction with enhanced recipes
    interaction.geminiResponse = { multipleRecipes: enhancedRecipes };
    interaction.recipe = enhancedRecipes[0]; // Primary recipe for compatibility
    await interaction.save();

    res.json({
      message: 'Multiple mood-based recipes generated successfully',
      interaction: {
        id: interaction._id,
        mood: interaction.mood,
        context: interaction.context,
        recipes: enhancedRecipes,
        totalRecipes: enhancedRecipes.length,
        createdAt: interaction.createdAt
      }
    });
  } catch (error) {
    console.error('Submit mood error:', error);
    res.status(500).json({ 
      message: 'Failed to process mood and generate recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get ingredient substitutions (UNCHANGED)
exports.getIngredientSubstitutions = async (req, res) => {
  try {
    const { ingredient, recipeContext, text } = req.body;
    const userId = req.user._id;

    let targetIngredient = ingredient;

    // If text is provided, parse it to extract ingredient
    if (text && !ingredient) {
      targetIngredient = substitutionService.parseSubstitutionRequest(text);
    }

    if (!targetIngredient) {
      return res.status(400).json({ 
        message: 'Please specify which ingredient you need to substitute' 
      });
    }

    // Get substitutions
    const substitutions = await substitutionService.getSubstitutions(
      targetIngredient,
      recipeContext || 'general cooking',
      req.user.preferences?.dietaryRestrictions || []
    );

    // Log substitution request for analytics
    console.log(`Substitution requested by user ${userId}: ${targetIngredient}`);

    res.json({
      message: 'Substitution suggestions generated',
      substitutions,
      requestedIngredient: targetIngredient,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Substitution error:', error);
    res.status(500).json({ 
      message: 'Failed to get ingredient substitutions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Generate image for recipe (UNCHANGED)
exports.generateRecipeImage = async (req, res) => {
  try {
    const { recipeName, description, recipeId } = req.body;
    const userId = req.user._id;

    if (!recipeName) {
      return res.status(400).json({ message: 'Recipe name is required' });
    }

    // Try Gemini image generation first
    const geminiImage = await geminiService.generateRecipeImage(recipeName, description);
    
    let imageUrl = null;
    
    if (geminiImage.success) {
      // If Gemini generates an image, we'd need to save it and serve it
      // For now, we'll fall back to search-based images
      console.log('Gemini image generated successfully (would save and serve here)');
    }
    
    // Fallback to search-based image
    imageUrl = await imageService.getRecipeImage(recipeName, 'food');

    // Update recipe image in database if recipeId provided
    if (recipeId) {
      await Interaction.findOneAndUpdate(
        { _id: recipeId, userId },
        { 'recipe.image': imageUrl, 'recipe.imageGeneratedAt': new Date() }
      );
    }

    res.json({
      message: 'Recipe image generated',
      imageUrl,
      recipeName,
      generatedAt: new Date().toISOString(),
      method: geminiImage.success ? 'ai-generated' : 'search-based'
    });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate recipe image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Select preferred recipe from multiple options (UNCHANGED)
exports.selectPreferredRecipe = async (req, res) => {
  try {
    const { interactionId, selectedRecipeId, selectedCategory } = req.body;
    const userId = req.user._id;

    if (!interactionId || (!selectedRecipeId && !selectedCategory)) {
      return res.status(400).json({ 
        message: 'Interaction ID and selected recipe/category are required' 
      });
    }

    // Find the interaction
    const interaction = await Interaction.findOne({
      _id: interactionId,
      userId
    });

    if (!interaction) {
      return res.status(404).json({ message: 'Interaction not found' });
    }

    // Extract all recipes from the interaction
    const allRecipes = interaction.geminiResponse?.multipleRecipes || [];
    
    // Find selected recipe by ID or category
    let selectedRecipe = null;
    if (selectedRecipeId) {
      selectedRecipe = allRecipes.find(r => r.id === selectedRecipeId);
    } else if (selectedCategory) {
      selectedRecipe = allRecipes.find(r => r.category === selectedCategory);
    }

    if (!selectedRecipe) {
      return res.status(404).json({ message: 'Selected recipe not found' });
    }

    // Update the interaction with the selected recipe
    interaction.recipe = selectedRecipe;
    interaction.metadata = {
      ...interaction.metadata,
      selectedRecipeId: selectedRecipe.id,
      selectedCategory: selectedRecipe.category,
      selectionTimestamp: new Date()
    };

    await interaction.save();

    res.json({
      message: 'Recipe selection recorded',
      selectedRecipe,
      interaction: {
        id: interaction._id,
        selectedRecipe,
        selectionTimestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Recipe selection error:', error);
    res.status(500).json({ 
      message: 'Failed to record recipe selection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });  
  }
};

// Get user's mood history (ENHANCED)
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category; // NEW: filter by recipe category
    const skip = (page - 1) * limit;

    // Build query
    let query = { userId };
    if (category) {
      query['recipe.category'] = category;
    }

    const interactions = await Interaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('mood context recipe rating notes tags createdAt metadata');

    const total = await Interaction.countDocuments(query);

    // Add analytics
    const analytics = await this.getUserAnalytics(userId);

    res.json({
      interactions,
      analytics, // NEW: user cooking analytics
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to fetch mood history' });
  }
};

// Get single interaction details (ENHANCED)
exports.getInteraction = async (req, res) => {
  try {
    const { interactionId } = req.params;
    const userId = req.user._id;

    const interaction = await Interaction.findOne({
      _id: interactionId,
      userId
    });

    if (!interaction) {
      return res.status(404).json({ message: 'Interaction not found' });
    }

    // Include all recipes if it was a multi-recipe interaction
    const allRecipes = interaction.geminiResponse?.multipleRecipes || [interaction.recipe];

    res.json({ 
      interaction: {
        ...interaction.toObject(),
        allRecipes, // NEW: include all recipe options
        totalRecipes: allRecipes.length
      }
    });
  } catch (error) {
    console.error('Get interaction error:', error);
    res.status(500).json({ message: 'Failed to fetch interaction details' });
  }
};

// Rate an interaction (UNCHANGED)
exports.rateInteraction = async (req, res) => {
  try {
    const { interactionId } = req.params;
    const { rating, notes, selectedRecipeCategory } = req.body; // NEW: track which recipe was rated
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const updateData = { rating, notes };
    if (selectedRecipeCategory) {
      updateData['metadata.ratedCategory'] = selectedRecipeCategory;
    }

    const interaction = await Interaction.findOneAndUpdate(
      { _id: interactionId, userId },
      updateData,
      { new: true }
    );

    if (!interaction) {
      return res.status(404).json({ message: 'Interaction not found' });
    }

    res.json({
      message: 'Rating saved successfully',
      interaction
    });
  } catch (error) {
    console.error('Rate interaction error:', error);
    res.status(500).json({ message: 'Failed to save rating' });
  }
};

// NEW: Get user analytics
exports.getUserAnalytics = async (userId) => {
  try {
    const interactions = await Interaction.find({ userId }).select('mood recipe.category rating createdAt');
    
    // Calculate analytics
    const analytics = {
      totalRecipes: interactions.length,
      averageRating: 0,
      favoriteCategory: null,
      favoriteMood: null,
      categoryBreakdown: {},
      moodBreakdown: {},
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (interactions.length === 0) return analytics;

    // Calculate breakdowns
    let totalRating = 0;
    let ratedCount = 0;

    interactions.forEach(interaction => {
      // Mood breakdown
      const mood = interaction.mood;
      analytics.moodBreakdown[mood] = (analytics.moodBreakdown[mood] || 0) + 1;

      // Category breakdown
      const category = interaction.recipe?.category || 'unknown';
      analytics.categoryBreakdown[category] = (analytics.categoryBreakdown[category] || 0) + 1;

      // Rating breakdown
      if (interaction.rating) {
        analytics.ratingDistribution[interaction.rating]++;
        totalRating += interaction.rating;
        ratedCount++;
      }
    });

    // Calculate averages and favorites
    analytics.averageRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : 0;
    analytics.favoriteCategory = Object.keys(analytics.categoryBreakdown).reduce((a, b) => 
      analytics.categoryBreakdown[a] > analytics.categoryBreakdown[b] ? a : b
    );
    analytics.favoriteMood = Object.keys(analytics.moodBreakdown).reduce((a, b) => 
      analytics.moodBreakdown[a] > analytics.moodBreakdown[b] ? a : b
    );

    return analytics;
  } catch (error) {
    console.error('Error calculating user analytics:', error);
    return {};
  }
};

module.exports = exports;
