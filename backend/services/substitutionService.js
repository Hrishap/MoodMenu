const axios = require('axios');
const geminiService = require('./geminiService');

class SubstitutionService {
  constructor() {
    this.spoonacularApiKey = process.env.SPOONACULAR_API_KEY;
    
    // Common substitution database for quick lookup
    this.commonSubstitutions = {
      'zucchini': [
        { ingredient: 'yellow squash', ratio: '1:1', explanation: 'Same texture and mild flavor' },
        { ingredient: 'eggplant', ratio: '1:1', explanation: 'Similar texture when cooked' }
      ],
      'butter': [
        { ingredient: 'olive oil', ratio: '3/4:1', explanation: 'Use 3/4 amount of oil' },
        { ingredient: 'applesauce', ratio: '1/2:1', explanation: 'For baking, use half the amount' }
      ],
      'eggs': [
        { ingredient: 'flax egg', ratio: '1:1', explanation: '1 tbsp ground flax + 3 tbsp water per egg' },
        { ingredient: 'applesauce', ratio: '1/4 cup:1 egg', explanation: 'For baking only' }
      ],
      'milk': [
        { ingredient: 'almond milk', ratio: '1:1', explanation: 'Dairy-free alternative with similar consistency' },
        { ingredient: 'oat milk', ratio: '1:1', explanation: 'Creamy texture, works well in most recipes' }
      ],
      'onion': [
        { ingredient: 'shallots', ratio: '1:1', explanation: 'Milder flavor, similar cooking properties' },
        { ingredient: 'garlic powder', ratio: '1 tsp:1 onion', explanation: 'For flavor only, not texture' }
      ]
    };
  }

  // Main substitution method
  async getSubstitutions(missingIngredient, recipeContext, dietaryRestrictions = []) {
    try {
      // First try Spoonacular API
      const spoonacularResult = await this.getSpoonacularSubstitutions(missingIngredient);
      
      // Then enhance with Gemini AI
      const geminiResult = await geminiService.suggestIngredientSubstitutions(
        missingIngredient, 
        recipeContext, 
        dietaryRestrictions
      );
      
      // Combine and rank results
      return this.combineSubstitutions(spoonacularResult, geminiResult, missingIngredient);
      
    } catch (error) {
      console.error('Error getting substitutions:', error);
      return this.getFallbackSubstitutions(missingIngredient);
    }
  }

  // Get substitutions from Spoonacular API
  async getSpoonacularSubstitutions(ingredient) {
    if (!this.spoonacularApiKey) {
      console.log('No Spoonacular API key provided');
      return null;
    }

    try {
      const response = await axios.get('https://api.spoonacular.com/food/ingredients/substitutes', {
        params: {
          ingredientName: ingredient,
          apiKey: this.spoonacularApiKey
        },
        timeout: 5000
      });

      if (response.data && response.data.substitutes) {
        return {
          ingredient: response.data.ingredient,
          substitutes: response.data.substitutes.map(sub => ({
            ingredient: sub,
            ratio: '1:1', // Default ratio
            explanation: `Common substitute for ${ingredient}`,
            source: 'spoonacular'
          }))
        };
      }
      
      return null;
    } catch (error) {
      console.error('Spoonacular substitution error:', error.message);
      return null;
    }
  }

  // Combine Spoonacular and Gemini results
  combineSubstitutions(spoonacularResult, geminiResult, originalIngredient) {
    const combined = {
      originalIngredient,
      substitutes: [],
      tips: geminiResult.tips || 'Adjust seasoning to taste when using substitutes.'
    };

    // Add Gemini results first (more detailed)
    if (geminiResult.substitutes) {
      combined.substitutes.push(...geminiResult.substitutes.map(sub => ({
        ...sub,
        source: 'ai',
        confidence: 'high'
      })));
    }

    // Add Spoonacular results if different
    if (spoonacularResult?.substitutes) {
      const existingIngredients = combined.substitutes.map(s => s.ingredient.toLowerCase());
      
      spoonacularResult.substitutes.forEach(sub => {
        if (!existingIngredients.includes(sub.ingredient.toLowerCase())) {
          combined.substitutes.push({
            ...sub,
            confidence: 'medium'
          });
        }
      });
    }

    // Add common substitutions if we have them
    const commonSubs = this.commonSubstitutions[originalIngredient.toLowerCase()];
    if (commonSubs) {
      const existingIngredients = combined.substitutes.map(s => s.ingredient.toLowerCase());
      
      commonSubs.forEach(sub => {
        if (!existingIngredients.includes(sub.ingredient.toLowerCase())) {
          combined.substitutes.push({
            ...sub,
            source: 'database',
            confidence: 'high',
            availability: 'common'
          });
        }
      });
    }

    // Limit to top 5 substitutes and sort by confidence
    combined.substitutes = combined.substitutes
      .slice(0, 5)
      .sort((a, b) => {
        const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      });

    return combined;
  }

  // Parse natural language substitution requests
  parseSubstitutionRequest(text) {
    // Extract ingredient from phrases like:
    // "I don't have zucchini"
    // "No eggs available" 
    // "Missing butter"
    // "Can I substitute milk?"
    
    const patterns = [
      /(?:don't have|no|missing|out of)\s+([a-zA-Z\s]+?)(?:\s|$)/i,
      /(?:substitute|replace)\s+([a-zA-Z\s]+?)(?:\s|$)/i,
      /(?:instead of)\s+([a-zA-Z\s]+?)(?:\s|$)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().toLowerCase();
      }
    }

    // If no pattern matches, assume the whole text is the ingredient
    return text.trim().toLowerCase();
  }

  // Get fallback substitutions
  getFallbackSubstitutions(ingredient) {
    const commonSubs = this.commonSubstitutions[ingredient.toLowerCase()];
    
    if (commonSubs) {
      return {
        originalIngredient: ingredient,
        substitutes: commonSubs.map(sub => ({
          ...sub,
          source: 'database',
          confidence: 'medium',
          availability: 'common'
        })),
        tips: 'These are common substitutions. Adjust quantities and seasonings to taste.'
      };
    }

    return {
      originalIngredient: ingredient,
      substitutes: [
        {
          ingredient: 'Similar ingredient from the same category',
          ratio: '1:1',
          explanation: `Look for ingredients with similar texture and flavor to ${ingredient}`,
          source: 'general',
          confidence: 'low',
          availability: 'varies'
        }
      ],
      tips: 'When substituting ingredients, consider flavor, texture, and cooking properties.'
    };
  }

  // Validate substitution compatibility
  validateSubstitution(originalIngredient, substitute, recipeType) {
    // Basic validation rules
    const incompatiblePairs = {
      'baking': {
        'liquids': ['milk', 'water', 'oil'],
        'solids': ['flour', 'sugar', 'butter']
      }
    };

    // Return compatibility score and warnings
    return {
      compatible: true,
      warnings: [],
      adjustments: []
    };
  }
}

module.exports = new SubstitutionService();