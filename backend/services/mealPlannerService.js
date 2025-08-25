const geminiService = require('./geminiService');

class MealPlannerService {
  constructor() {
    this.mealTypes = ['breakfast', 'lunch', 'dinner'];
    this.snackTypes = ['snack'];
  }

  /**
   * Generate a complete meal plan using AI
   */
  async generateMealPlan(preferences, duration = 7) {
    try {
      const prompt = this.buildMealPlanPrompt(preferences, duration);
      const response = await geminiService.generateContent(prompt);
      return this.parseMealPlanResponse(response, duration);
    } catch (error) {
      console.error('Meal plan generation error:', error);
      return this.getFallbackMealPlan(preferences, duration);
    }
  }

  /**
   * Generate a single meal based on preferences and meal type
   */
  async generateSingleMeal(mealType, preferences, existingMeals = []) {
    try {
      const prompt = this.buildSingleMealPrompt(mealType, preferences, existingMeals);
      const response = await geminiService.generateContent(prompt);
      return this.parseSingleMealResponse(response, mealType);
    } catch (error) {
      console.error('Single meal generation error:', error);
      return this.getFallbackMeal(mealType, preferences);
    }
  }

  /**
   * Customize an existing meal based on user modifications
   */
  async customizeMeal(originalMeal, modifications, preferences) {
    try {
      const prompt = this.buildMealCustomizationPrompt(originalMeal, modifications, preferences);
      const response = await geminiService.generateContent(prompt);
      return this.parseSingleMealResponse(response, originalMeal.type);
    } catch (error) {
      console.error('Meal customization error:', error);
      return this.getModifiedMeal(originalMeal, modifications);
    }
  }

  /**
   * Generate ingredient substitutions for a meal
   */
  async suggestIngredientSubstitutions(meal, unavailableIngredients, preferences) {
    try {
      const recipeContext = `${meal.recipeName}: ${meal.instructions}`;
      const substitutions = {};
      
      for (const ingredient of unavailableIngredients) {
        const result = await geminiService.suggestIngredientSubstitutions(
          ingredient,
          recipeContext,
          preferences.dietaryRestrictions || []
        );
        substitutions[ingredient] = result;
      }
      
      return substitutions;
    } catch (error) {
      console.error('Substitution generation error:', error);
      return this.getFallbackSubstitutions(unavailableIngredients);
    }
  }

  /**
   * Build comprehensive meal plan prompt
   */
  buildMealPlanPrompt(preferences, duration) {
    let prompt = `Create a ${duration}-day meal plan with the following specifications:

DIETARY REQUIREMENTS:
- Dietary restrictions: ${preferences.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${preferences.allergies?.join(', ') || 'None'}
- Disliked ingredients: ${preferences.dislikedIngredients?.join(', ') || 'None'}
- Preferred ingredients: ${preferences.preferredIngredients?.join(', ') || 'None'}
- Cuisine preferences: ${preferences.cuisinePreferences?.join(', ') || 'Any'}

MEAL PREFERENCES:
- Cooking time preference: ${preferences.cookingTime || 'moderate'} (quick=<30min, moderate=30-60min, extended=>60min)
- Difficulty level: ${preferences.difficulty || 'easy'}
- Target calories per day: ${preferences.calorieTarget || 2000}
- Meals per day: ${preferences.mealsPerDay || 3}
- Include snacks: ${preferences.includeSnacks ? 'Yes' : 'No'}

REQUIREMENTS:
1. Each meal should be unique and varied
2. Balance nutrition across the week
3. Consider ingredient overlap for shopping efficiency
4. Provide clear, simple cooking instructions
5. Include accurate ingredient measurements
6. Estimate cooking times and calories

IMPORTANT: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.

Required JSON format:
{
  "mealPlan": {
    "totalDays": ${duration},
    "averageCaloriesPerDay": 2000,
    "days": [
      {
        "dayNumber": 1,
        "date": "Day 1",
        "meals": {
          "breakfast": {
            "recipeName": "Recipe Name",
            "cookingTime": 20,
            "servings": 2,
            "calories": 400,
            "difficulty": "easy",
            "ingredients": [
              {"name": "ingredient name", "amount": "2", "unit": "cups"},
              {"name": "another ingredient", "amount": "1", "unit": "tbsp"}
            ],
            "instructions": "Step-by-step cooking instructions in simple language",
            "tags": ["breakfast", "quick", "healthy"],
            "nutritionHighlights": "Key nutritional benefits"
          },
          "lunch": {
            "recipeName": "Lunch Recipe Name",
            "cookingTime": 25,
            "servings": 2,
            "calories": 500,
            "difficulty": "easy",
            "ingredients": [
              {"name": "ingredient", "amount": "1", "unit": "cup"}
            ],
            "instructions": "Lunch cooking instructions",
            "tags": ["lunch"],
            "nutritionHighlights": "Lunch nutrition info"
          },
          "dinner": {
            "recipeName": "Dinner Recipe Name",
            "cookingTime": 30,
            "servings": 2,
            "calories": 600,
            "difficulty": "easy",
            "ingredients": [
              {"name": "ingredient", "amount": "2", "unit": "cups"}
            ],
            "instructions": "Dinner cooking instructions",
            "tags": ["dinner"],
            "nutritionHighlights": "Dinner nutrition info"
          }${preferences.includeSnacks ? ',\n          "snacks": [\n            {\n              "recipeName": "Snack Name",\n              "cookingTime": 5,\n              "servings": 1,\n              "calories": 150,\n              "difficulty": "easy",\n              "ingredients": [{"name": "snack ingredient", "amount": "1", "unit": "piece"}],\n              "instructions": "Snack preparation",\n              "tags": ["snack"],\n              "nutritionHighlights": "Snack nutrition"\n            }\n          ]' : ''}
        },
        "totalCalories": 2000
      }
    ]
  },
  "shoppingList": [
    {"ingredient": "ingredient name", "amount": "total amount needed", "unit": "cups"}
  ],
  "nutritionSummary": {
    "averageCaloriesPerDay": 2000,
    "proteinPercentage": 20,
    "carbPercentage": 50,
    "fatPercentage": 30
  },
  "tips": "Meal prep and cooking tips for this plan"
}

Make sure each day has varied, interesting meals that follow the dietary requirements.`;

    return prompt;
  }

  /**
   * Build single meal prompt
   */
  buildSingleMealPrompt(mealType, preferences, existingMeals = []) {
    let prompt = `Generate a ${mealType} recipe with these specifications:

DIETARY REQUIREMENTS:
- Dietary restrictions: ${preferences.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${preferences.allergies?.join(', ') || 'None'}
- Disliked ingredients: ${preferences.dislikedIngredients?.join(', ') || 'None'}
- Preferred ingredients: ${preferences.preferredIngredients?.join(', ') || 'None'}

MEAL PREFERENCES:
- Cooking time: ${preferences.cookingTime || 'moderate'}
- Difficulty: ${preferences.difficulty || 'easy'}
- Target calories: ${this.getCalorieTargetForMeal(mealType, preferences.calorieTarget)}

${existingMeals.length > 0 ? `AVOID REPETITION - Don't use these recent meals as inspiration: ${existingMeals.map(m => m.recipeName).join(', ')}` : ''}

IMPORTANT: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.

Required JSON format:
{
  "meal": {
    "type": "${mealType}",
    "recipeName": "Specific recipe name",
    "cookingTime": 25,
    "servings": 2,
    "calories": 400,
    "difficulty": "easy",
    "ingredients": [
      {"name": "ingredient name", "amount": "2", "unit": "cups"}
    ],
    "instructions": "Clear, step-by-step cooking instructions in simple language",
    "tags": ["${mealType}", "other", "relevant", "tags"],
    "nutritionHighlights": "Key nutritional benefits or characteristics"
  }
}`;

    return prompt;
  }

  /**
   * Build meal customization prompt
   */
  buildMealCustomizationPrompt(originalMeal, modifications, preferences) {
    let prompt = `Customize this existing recipe based on user modifications:

ORIGINAL RECIPE:
- Name: ${originalMeal.recipeName}
- Ingredients: ${originalMeal.ingredients?.map(i => `${i.amount} ${i.unit} ${i.name}`).join(', ')}
- Instructions: ${originalMeal.instructions}
- Cooking time: ${originalMeal.cookingTime} minutes
- Calories: ${originalMeal.calories}

USER MODIFICATIONS:
${Object.entries(modifications).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

DIETARY REQUIREMENTS:
- Dietary restrictions: ${preferences.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${preferences.allergies?.join(', ') || 'None'}

Please modify the recipe to incorporate the user's changes while maintaining:
1. Nutritional balance
2. Cooking feasibility
3. Flavor harmony
4. Appropriate cooking times and methods

IMPORTANT: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.

Required JSON format:
{
  "customizedMeal": {
    "type": "${originalMeal.type}",
    "recipeName": "Updated recipe name",
    "cookingTime": 25,
    "servings": 2,
    "calories": 400,
    "difficulty": "easy",
    "ingredients": [
      {"name": "ingredient name", "amount": "2", "unit": "cups"}
    ],
    "instructions": "Updated step-by-step cooking instructions",
    "tags": ["${originalMeal.type}", "customized"],
    "nutritionHighlights": "Updated nutritional information",
    "customized": true,
    "modifications": "Summary of what was changed from original"
  }
}`;

    return prompt;
  }

  /**
   * Parse meal plan response from AI
   */
  parseMealPlanResponse(geminiResponse, duration) {
    try {
      const responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!responseText) {
        return this.getFallbackMealPlan({}, duration);
      }

      // Try to extract and clean JSON
      let jsonText = this.extractAndCleanJSON(responseText);
      
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        
        if (parsed.mealPlan && parsed.mealPlan.days) {
          // Process and validate the meal plan
          return this.processMealPlan(parsed.mealPlan, parsed.shoppingList, parsed.tips);
        }
      }

      return this.getFallbackMealPlan({}, duration);
      
    } catch (error) {
      console.error('Error parsing meal plan response:', error);
      console.error('Raw response text:', geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text);
      return this.getFallbackMealPlan({}, duration);
    }
  }

  /**
   * Parse single meal response from AI
   */
  parseSingleMealResponse(geminiResponse, mealType) {
    try {
      const responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Try to extract and clean JSON
      let jsonText = this.extractAndCleanJSON(responseText);
      
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        
        if (parsed.meal || parsed.customizedMeal) {
          const meal = parsed.meal || parsed.customizedMeal;
          return this.processSingleMeal(meal);
        }
      }

      return this.getFallbackMeal(mealType, {});
      
    } catch (error) {
      console.error('Error parsing single meal response:', error);
      console.error('Raw response text:', geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text);
      return this.getFallbackMeal(mealType, {});
    }
  }

  /**
   * Process and validate meal plan data
   */
  processMealPlan(mealPlan, shoppingList = [], tips = '') {
    try {
      const processedDays = mealPlan.days?.map((day, index) => ({
        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000),
        meals: this.processDayMeals(day.meals || {}),
        totalCalories: day.totalCalories || this.calculateDayCalories(day.meals || {})
      })) || [];

      return {
        days: processedDays,
        shoppingList: Array.isArray(shoppingList) ? shoppingList : [],
        nutritionSummary: mealPlan.nutritionSummary || {
          averageCaloriesPerDay: 2000,
          proteinPercentage: 20,
          carbPercentage: 50,
          fatPercentage: 30
        },
        tips: tips || 'Follow the recipes as provided and adjust seasoning to taste.'
      };
    } catch (error) {
      console.error('Error processing meal plan:', error);
      return this.getFallbackMealPlan({}, mealPlan.totalDays || 7);
    }
  }

  /**
   * Process meals for a single day
   */
  processDayMeals(meals) {
    const processedMeals = {};
    
    try {
      ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
        if (meals[mealType]) {
          processedMeals[mealType] = this.processSingleMeal(meals[mealType]);
        }
      });
      
      if (meals.snacks && Array.isArray(meals.snacks)) {
        processedMeals.snacks = meals.snacks.map(snack => this.processSingleMeal(snack));
      }
      
      return processedMeals;
    } catch (error) {
      console.error('Error processing day meals:', error);
      return {};
    }
  }

  /**
   * Process and validate single meal data
   */
  processSingleMeal(meal) {
    try {
      if (!meal || typeof meal !== 'object') {
        return this.getFallbackMeal('meal', {});
      }

      return {
        type: meal.type || 'meal',
        recipeName: meal.recipeName || 'Unnamed Recipe',
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
        instructions: meal.instructions || 'No instructions provided',
        cookingTime: parseInt(meal.cookingTime) || 30,
        servings: parseInt(meal.servings) || 2,
        calories: parseInt(meal.calories) || 0,
        difficulty: meal.difficulty || 'easy',
        tags: Array.isArray(meal.tags) ? meal.tags : [],
        nutritionHighlights: meal.nutritionHighlights || '',
        customized: Boolean(meal.customized),
        modifications: meal.modifications || ''
      };
    } catch (error) {
      console.error('Error processing single meal:', error);
      return this.getFallbackMeal('meal', {});
    }
  }

  /**
   * Calculate total calories for a day
   */
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

  /**
   * Get calorie target for specific meal type
   */
  getCalorieTargetForMeal(mealType, dailyTarget = 2000) {
    const calorieDistribution = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.35,
      snack: 0.05
    };
    
    return Math.round(dailyTarget * (calorieDistribution[mealType] || 0.3));
  }

  /**
   * Generate fallback meal plan
   */
  getFallbackMealPlan(preferences, duration) {
    const days = [];
    
    for (let i = 0; i < duration; i++) {
      days.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        meals: {
          breakfast: this.getFallbackMeal('breakfast', preferences),
          lunch: this.getFallbackMeal('lunch', preferences),
          dinner: this.getFallbackMeal('dinner', preferences),
          snacks: preferences.includeSnacks ? [this.getFallbackMeal('snack', preferences)] : []
        },
        totalCalories: preferences.calorieTarget || 2000
      });
    }
    
    return {
      days,
      shoppingList: [],
      nutritionSummary: {
        averageCaloriesPerDay: preferences.calorieTarget || 2000
      },
      tips: 'This is a basic meal plan. Customize it based on your preferences.'
    };
  }

  /**
   * Generate fallback meal
   */
  getFallbackMeal(mealType, preferences) {
    const fallbackMeals = {
      breakfast: {
        recipeName: 'Simple Oatmeal Bowl',
        ingredients: [
          { name: 'oats', amount: '1', unit: 'cup' },
          { name: 'milk', amount: '1', unit: 'cup' },
          { name: 'honey', amount: '1', unit: 'tbsp' }
        ],
        instructions: 'Combine oats and milk in a pot. Cook for 5 minutes, stirring occasionally. Add honey to taste.',
        cookingTime: 10,
        calories: 300
      },
      lunch: {
        recipeName: 'Quick Sandwich',
        ingredients: [
          { name: 'bread', amount: '2', unit: 'slices' },
          { name: 'cheese', amount: '2', unit: 'slices' },
          { name: 'lettuce', amount: '2', unit: 'leaves' }
        ],
        instructions: 'Layer cheese and lettuce between bread slices. Serve immediately.',
        cookingTime: 5,
        calories: 400
      },
      dinner: {
        recipeName: 'Simple Pasta',
        ingredients: [
          { name: 'pasta', amount: '2', unit: 'cups' },
          { name: 'tomato sauce', amount: '1', unit: 'cup' },
          { name: 'cheese', amount: '1/4', unit: 'cup' }
        ],
        instructions: 'Cook pasta according to package directions. Drain and mix with sauce. Top with cheese.',
        cookingTime: 20,
        calories: 500
      },
      snack: {
        recipeName: 'Fruit and Nuts',
        ingredients: [
          { name: 'apple', amount: '1', unit: 'medium' },
          { name: 'almonds', amount: '1/4', unit: 'cup' }
        ],
        instructions: 'Slice apple and serve with almonds.',
        cookingTime: 2,
        calories: 200
      }
    };

    const baseMeal = fallbackMeals[mealType] || fallbackMeals.lunch;
    
    return {
      type: mealType,
      ...baseMeal,
      servings: 2,
      difficulty: 'easy',
      tags: [mealType, 'simple', 'quick'],
      nutritionHighlights: 'Basic nutrition',
      customized: false
    };
  }

  /**
   * Get modified meal with basic changes
   */
  getModifiedMeal(originalMeal, modifications) {
    const modified = { ...originalMeal };
    
    // Apply simple modifications
    if (modifications.cookingTime) {
      modified.cookingTime = parseInt(modifications.cookingTime) || modified.cookingTime;
    }
    
    if (modifications.servings) {
      modified.servings = parseInt(modifications.servings) || modified.servings;
    }
    
    if (modifications.recipeName) {
      modified.recipeName = modifications.recipeName;
    }
    
    modified.customized = true;
    modified.modifications = Object.keys(modifications).join(', ') + ' modified';
    
    return modified;
  }

  /**
   * Get fallback substitutions
   */
  getFallbackSubstitutions(unavailableIngredients) {
    const substitutions = {};
    
    unavailableIngredients.forEach(ingredient => {
      substitutions[ingredient] = {
        substitutes: [{
          ingredient: 'Similar ingredient',
          ratio: '1:1',
          explanation: `A common substitute for ${ingredient}`,
          flavorImpact: 'Minimal change',
          availability: 'common'
        }],
        tips: 'Adjust to taste when substituting ingredients.'
      };
    });
    
    return substitutions;
  }

  /**
   * Extract and clean JSON from AI response text
   */
  extractAndCleanJSON(responseText) {
    try {
      // First, try to find JSON block using multiple patterns
      let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        jsonMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
      }
      if (!jsonMatch) {
        jsonMatch = responseText.match(/\{[\s\S]*\}/);
      }
      
      if (!jsonMatch) {
        return null;
      }

      let jsonText = jsonMatch[1] || jsonMatch[0];
      
      // Clean up common JSON formatting issues
      jsonText = jsonText
        .replace(/```json|```/g, '') // Remove markdown code blocks
        .replace(/^\s*json\s*/i, '') // Remove leading 'json' word
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* comments */
        .replace(/\/\/.*$/gm, '') // Remove // comments
        .replace(/,\s*}/g, '}') // Remove trailing commas before }
        .replace(/,\s*]/g, ']') // Remove trailing commas before ]
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();

      // Fix fraction values in JSON (convert 1/2 to "0.5" or "1/2" as string)
      jsonText = jsonText.replace(/"amount":\s*(\d+)\/(\d+)/g, '"amount": "$1/$2"');
      jsonText = jsonText.replace(/"amount":\s*(\d+\.\d+)\/(\d+)/g, '"amount": "$1/$2"');
      
      // Try to fix common issues with property names
      jsonText = jsonText.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted property names
      
      // Check if JSON is truncated and try to fix it
      jsonText = this.fixTruncatedJSON(jsonText);
      
      // Try to parse and return
      JSON.parse(jsonText); // Test if it's valid
      return jsonText;
      
    } catch (error) {
      console.error('JSON cleaning failed:', error);
      const textToLog = jsonText || jsonMatch?.[1] || jsonMatch?.[0] || 'No JSON text found';
      console.error('Problematic JSON text:', textToLog.substring(0, 500) + '...');
      
      // Last resort: try to extract just the innermost JSON object
      try {
        const lines = responseText.split('\n');
        let jsonLines = [];
        let inJson = false;
        let braceCount = 0;
        
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            inJson = true;
            braceCount = 0;
          }
          
          if (inJson) {
            jsonLines.push(line);
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            
            if (braceCount === 0 && line.includes('}')) {
              break;
            }
          }
        }
        
        if (jsonLines.length > 0) {
          const attemptJson = jsonLines.join('\n');
          JSON.parse(attemptJson); // Test if it's valid
          return attemptJson;
        }
      } catch (lastError) {
        console.error('Last resort JSON extraction failed:', lastError);
      }
      
      return null;
    }
  }

  /**
   * Fix truncated JSON by completing incomplete structures
   */
  fixTruncatedJSON(jsonText) {
    try {
      // Count braces and brackets to see if JSON is complete
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;
      const openBrackets = (jsonText.match(/\[/g) || []).length;
      const closeBrackets = (jsonText.match(/\]/g) || []).length;

      let fixedJson = jsonText;

      // If JSON ends abruptly, try to close it properly
      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        // Remove incomplete last line if it exists
        const lines = fixedJson.split('\n');
        const lastLine = lines[lines.length - 1];
        
        // If last line is incomplete (no closing quote or comma/brace), remove it
        if (lastLine && !lastLine.trim().match(/["}]$/)) {
          lines.pop();
          fixedJson = lines.join('\n');
        }

        // Close missing brackets and braces
        const missingCloseBrackets = openBrackets - closeBrackets;
        const missingCloseBraces = openBraces - closeBraces;

        for (let i = 0; i < missingCloseBrackets; i++) {
          fixedJson += ']';
        }
        for (let i = 0; i < missingCloseBraces; i++) {
          fixedJson += '}';
        }
      }

      return fixedJson;
    } catch (error) {
      console.error('Error fixing truncated JSON:', error);
      return jsonText;
    }
  }
}

module.exports = new MealPlannerService();