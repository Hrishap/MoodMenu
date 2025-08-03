const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    
    // Different models for different tasks
    this.models = {
      text: 'gemini-1.5-flash',
      imageGeneration: 'gemini-2.0-flash-preview-image-generation' // For image generation
    };
  }

  // Original content generation (enhanced)
  async generateContent(prompt, model = this.models.text) {
    try {
      const url = `${this.baseUrl}/models/${model}:generateContent`;
      
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          key: this.apiKey
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message);
      throw new Error('Failed to generate content from Gemini API');
    }
  }

  // NEW: Generate multiple recipe suggestions with ranking
  async generateMultipleRecipes(mood, context, preferences, count = 3) {
    const prompt = this.buildMultiRecipePrompt(mood, context, preferences, count);
    
    try {
      const response = await this.generateContent(prompt);
      return this.parseMultipleRecipes(response);
    } catch (error) {
      console.error('Multi-recipe generation error:', error);
      return this.getFallbackMultipleRecipes(mood);
    }
  }

  // NEW: Generate recipe image using Gemini 2.0 Flash
  async generateRecipeImage(recipeName, description) {
    try {
      const imagePrompt = `Create a high-quality, appetizing photograph of ${recipeName}. 
      ${description ? `The dish should look ${description}.` : ''} 
      Style: Professional food photography, well-lit, appetizing presentation, restaurant quality, 
      clean background, focus on the food. Make it look delicious and inviting.`;

      const response = await this.generateContent(imagePrompt, this.models.imageGeneration);
      
      // Extract image data from response
      if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const imageData = response.candidates[0].content.parts[0].inlineData;
        return {
          success: true,
          imageData: imageData.data,
          mimeType: imageData.mimeType
        };
      }
      
      return { success: false, error: 'No image generated' };
    } catch (error) {
      console.error('Image generation error:', error);
      return { success: false, error: error.message };
    }
  }

  // NEW: Ingredient substitution suggestions
  async suggestIngredientSubstitutions(missingIngredient, recipeContext, dietaryRestrictions = []) {
    const prompt = `I'm cooking and I don't have "${missingIngredient}". 

Recipe context: ${recipeContext}
Dietary restrictions: ${dietaryRestrictions.join(', ') || 'None'}

Please suggest 3-5 suitable substitutes with explanations. Consider:
- Flavor profile compatibility
- Texture similarity  
- Cooking behavior
- Quantity adjustments needed
- Availability in typical kitchens

Format as JSON:
{
  "substitutes": [
    {
      "ingredient": "substitute name",
      "ratio": "1:1 or specific ratio",
      "explanation": "why this works",
      "flavorImpact": "how it changes the taste",
      "availability": "common/uncommon"
    }
  ],
  "tips": "additional cooking tips for substitutions"
}`;

    try {
      const response = await this.generateContent(prompt);
      return this.parseSubstitutionResponse(response);
    } catch (error) {
      console.error('Substitution generation error:', error);
      return this.getFallbackSubstitutions(missingIngredient);
    }
  }

  // Enhanced prompt builder for multiple recipes
  buildMultiRecipePrompt(mood, context, preferences, count = 3) {
    let prompt = `I am feeling ${mood}.`;
    
    if (context) {
      prompt += ` Context: ${context}.`;
    }

    if (preferences?.dietaryRestrictions?.length > 0) {
      prompt += ` I follow these dietary restrictions: ${preferences.dietaryRestrictions.join(', ')}.`;
    }

    prompt += `

Please suggest ${count} different recipes that match my mood, each optimized for a different approach:

1. COMFORT recipe: Rich, indulgent, emotionally satisfying, higher calories, familiar flavors
2. QUICK recipe: Under 30 minutes, minimal prep, simple ingredients, one-pot if possible  
3. HEALTHY recipe: Nutrient-dense, balanced macros, lighter, fresh ingredients

For each recipe, respond in this EXACT JSON format:
{
  "recipes": [
    {
      "category": "comfort|quick|healthy",
      "recipeName": "Exact recipe name",
      "cookingTime": 30,
      "servings": 2,
      "difficulty": "easy|medium|hard",
      "calories": 400,
      "ingredients": [
        "2 cups ingredient with measurements",
        "1 tbsp another ingredient"
      ],
      "instructions": "Step 1: Do this. Step 2: Do that. Keep concise but complete.",
      "moodExplanation": "Why this recipe matches the ${mood} mood",
      "categoryReason": "Why this fits the comfort/quick/healthy category",
      "tags": ["tag1", "tag2"],
      "nutritionHighlights": "Key nutritional benefits or indulgent aspects"
    }
  ]
}

Make sure each recipe is distinctly different and truly optimized for its category.`;

    return prompt;
  }

  // Parse multiple recipe response
  parseMultipleRecipes(geminiResponse) {
    try {
      const responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!responseText) {
        return this.getFallbackMultipleRecipes('general');
      }

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure we have 3 recipes with proper categories
        if (parsed.recipes && Array.isArray(parsed.recipes)) {
          return parsed.recipes.map((recipe, index) => ({
            ...recipe,
            id: `recipe_${index + 1}`,
            image: this.getDefaultImageForCategory(recipe.category),
            score: this.calculateRecipeScore(recipe)
          }));
        }
      }

      // Fallback parsing
      return this.getFallbackMultipleRecipes('general');
      
    } catch (error) {
      console.error('Error parsing multiple recipes:', error);
      return this.getFallbackMultipleRecipes('general');
    }
  }

  // Parse substitution response
  parseSubstitutionResponse(geminiResponse) {
    try {
      const responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback parsing
      return {
        substitutes: [
          {
            ingredient: "Similar ingredient",
            ratio: "1:1",
            explanation: "General substitute based on category",
            flavorImpact: "Minimal change expected",
            availability: "common"
          }
        ],
        tips: "Adjust seasoning to taste when using substitutes."
      };
      
    } catch (error) {
      console.error('Error parsing substitution response:', error);
      return this.getFallbackSubstitutions('ingredient');
    }
  }

  // Calculate recipe scoring for ranking
  calculateRecipeScore(recipe) {
    let score = 0;
    
    // Time scoring (quicker = higher score for quick category)
    if (recipe.category === 'quick') {
      score += recipe.cookingTime <= 20 ? 10 : recipe.cookingTime <= 30 ? 8 : 5;
    }
    
    // Calorie scoring (higher = better for comfort, lower = better for healthy)
    if (recipe.category === 'comfort') {
      score += recipe.calories >= 500 ? 10 : recipe.calories >= 350 ? 7 : 4;
    } else if (recipe.category === 'healthy') {
      score += recipe.calories <= 300 ? 10 : recipe.calories <= 450 ? 7 : 4;
    }
    
    // Difficulty scoring (easier = better)
    const difficultyScore = { easy: 10, medium: 7, hard: 4 };
    score += difficultyScore[recipe.difficulty] || 5;
    
    return Math.min(score, 30); // Cap at 30
  }

  // Default images for categories
  getDefaultImageForCategory(category) {
    const defaultImages = {
      comfort: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop',
      quick: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', 
      healthy: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop'
    };
    
    return defaultImages[category] || defaultImages.comfort;
  }

  // Fallback multiple recipes
  getFallbackMultipleRecipes(mood) {
    return [
      {
        id: 'recipe_1',
        category: 'comfort',
        recipeName: 'Comfort Pasta Bowl',
        cookingTime: 25,
        servings: 2,
        difficulty: 'easy',
        calories: 450,
        ingredients: ['2 cups pasta', '1 cup cheese sauce', 'herbs to taste'],
        instructions: 'Cook pasta, mix with cheese sauce, season and serve hot.',
        moodExplanation: `Perfect comfort food for when you're feeling ${mood}`,
        categoryReason: 'Rich, cheesy, and emotionally satisfying',
        tags: ['pasta', 'comfort', 'cheese'],
        nutritionHighlights: 'High in carbs and protein for comfort',
        image: this.getDefaultImageForCategory('comfort'),
        score: 25
      },
      {
        id: 'recipe_2', 
        category: 'quick',
        recipeName: 'Quick Stir-Fry',
        cookingTime: 15,
        servings: 2,
        difficulty: 'easy',
        calories: 300,
        ingredients: ['2 cups vegetables', '2 tbsp oil', '1 tbsp soy sauce'],
        instructions: 'Heat oil, add vegetables, stir-fry for 10 minutes with sauce.',
        moodExplanation: `Fast and satisfying for your ${mood} mood`,
        categoryReason: 'Ready in 15 minutes with minimal prep',
        tags: ['stir-fry', 'quick', 'vegetables'],
        nutritionHighlights: 'High in fiber and vitamins',
        image: this.getDefaultImageForCategory('quick'),
        score: 28
      },
      {
        id: 'recipe_3',
        category: 'healthy',  
        recipeName: 'Fresh Garden Salad',
        cookingTime: 10,
        servings: 2,
        difficulty: 'easy',
        calories: 200,
        ingredients: ['4 cups mixed greens', '1 cup vegetables', '2 tbsp dressing'],
        instructions: 'Combine greens and vegetables, drizzle with dressing, toss and serve.',
        moodExplanation: `Light and refreshing to balance your ${mood} feelings`,
        categoryReason: 'Nutrient-dense with fresh, clean flavors',
        tags: ['salad', 'healthy', 'fresh'],
        nutritionHighlights: 'High in vitamins, low in calories',
        image: this.getDefaultImageForCategory('healthy'),
        score: 26
      }
    ];
  }

  // Fallback substitutions
  getFallbackSubstitutions(ingredient) {
    return {
      substitutes: [
        {
          ingredient: "Similar alternative",
          ratio: "1:1",
          explanation: `A common substitute that works well in place of ${ingredient}`,
          flavorImpact: "Minimal change to overall flavor",
          availability: "common"
        }
      ],
      tips: "Taste as you go and adjust seasonings when using substitutes."
    };
  }
}

module.exports = new GeminiService();