const axios = require('axios');

class RecipeService {
  constructor() {
    this.apiKey = process.env.SPOONACULAR_API_KEY;
    this.baseUrl = 'https://api.spoonacular.com';
  }

  async searchRecipes(query, number = 5, diet = '', intolerances = '') {
    try {
      const url = `${this.baseUrl}/recipes/complexSearch`;
      
      const params = {
        apiKey: this.apiKey,
        query,
        number,
        addRecipeInformation: true,
        addRecipeNutrition: true,
        fillIngredients: true
      };

      if (diet) params.diet = diet;
      if (intolerances) params.intolerances = intolerances;

      const response = await axios.get(url, { params });
      
      return response.data.results.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        cookingTime: recipe.readyInMinutes,
        servings: recipe.servings,
        ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
        instructions: recipe.instructions || recipe.analyzedInstructions?.[0]?.steps?.map(step => step.step).join(' ') || '',
        nutrition: {
          calories: recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
          protein: recipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
          carbs: recipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
          fat: recipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0
        },
        sourceUrl: recipe.sourceUrl,
        summary: recipe.summary
      }));
    } catch (error) {
      console.error('Recipe search error:', error.response?.data || error.message);
      
      // Fallback to mock data if API fails
      return this.getMockRecipes(query);
    }
  }

  async getRecipeDetails(id) {
    try {
      const url = `${this.baseUrl}/recipes/${id}/information`;
      
      const response = await axios.get(url, {
        params: {
          apiKey: this.apiKey,
          includeNutrition: true
        }
      });

      const recipe = response.data;
      
      return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        cookingTime: recipe.readyInMinutes,
        servings: recipe.servings,
        ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
        instructions: recipe.instructions || recipe.analyzedInstructions?.[0]?.steps?.map(step => step.step).join(' ') || '',
        nutrition: {
          calories: recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
          protein: recipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
          carbs: recipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
          fat: recipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0
        },
        sourceUrl: recipe.sourceUrl,
        summary: recipe.summary
      };
    } catch (error) {
      console.error('Recipe details error:', error.response?.data || error.message);
      throw new Error('Failed to fetch recipe details');
    }
  }

  async getRandomRecipes(number = 1, tags = '') {
    try {
      const url = `${this.baseUrl}/recipes/random`;
      
      const response = await axios.get(url, {
        params: {
          apiKey: this.apiKey,
          number,
          tags
        }
      });

      return response.data.recipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        cookingTime: recipe.readyInMinutes,
        servings: recipe.servings,
        ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
        instructions: recipe.instructions || '',
        sourceUrl: recipe.sourceUrl,
        summary: recipe.summary
      }));
    } catch (error) {
      console.error('Random recipes error:', error.response?.data || error.message);
      return this.getMockRecipes('comfort food');
    }
  }

  // Mock data fallback
  getMockRecipes(query) {
    const moodBasedRecipes = {
      happy: {
        title: 'Sunshine Citrus Salad',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        ingredients: [
          '2 oranges, peeled and segmented',
          '1 grapefruit, peeled and segmented', 
          '2 cups mixed greens',
          '1/4 cup toasted almonds',
          '2 tbsp honey-lime dressing'
        ],
        instructions: 'Combine citrus segments with mixed greens. Top with toasted almonds and drizzle with honey-lime dressing. Serve immediately for a burst of sunshine on your plate!'
      },
      sad: {
        title: 'Comforting Chicken Soup',
        image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&h=300&fit=crop',
        ingredients: [
          '1 whole chicken, cut into pieces',
          '2 carrots, sliced',
          '2 celery stalks, chopped',
          '1 onion, diced',
          '8 cups chicken broth',
          '1 cup egg noodles'
        ],
        instructions: 'Simmer chicken in broth until tender. Remove chicken, shred meat, and return to pot. Add vegetables and noodles. Cook until tender. Season to taste. Serve hot with love.'
      },
      stressed: {
        title: 'Calming Chamomile Tea Cookies',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop',
        ingredients: [
          '2 cups flour',
          '1/2 cup butter, softened',
          '1/3 cup honey',
          '2 tbsp dried chamomile flowers',
          '1 egg',
          '1 tsp vanilla extract'
        ],
        instructions: 'Cream butter and honey. Add egg and vanilla. Mix in flour and chamomile. Roll into balls and bake at 350°F for 12-15 minutes. Perfect with a warm cup of tea.'
      }
    };
  
    // Try to find a mood-specific recipe
    const moodRecipe = moodBasedRecipes[query.toLowerCase()];
    if (moodRecipe) {
      return [{
        id: `mock-${query}`,
        ...moodRecipe,
        cookingTime: 30,
        servings: 4,
        nutrition: {
          calories: 250,
          protein: 8,
          carbs: 35,
          fat: 10
        },
        sourceUrl: '#',
        summary: `A comforting recipe perfect for when you're feeling ${query}.`
      }];
    }
  
    // Default fallback
    return [{
      id: 'mock-default',
      title: `Comfort ${query} Recipe`,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      cookingTime: 30,
      servings: 4,
      ingredients: [
        '2 cups main ingredient of choice',
        '1 cup supporting flavors',
        '1/2 cup aromatic herbs or spices',
        '2 tbsp healthy fats (olive oil, butter)',
        'Salt and pepper to taste'
      ],
      instructions: 'Prepare your ingredients mindfully. Cook with intention and care. Season to taste. Serve with gratitude and enjoy the nourishing experience.',
      nutrition: {
        calories: 250,
        protein: 8,
        carbs: 35,
        fat: 10
      },
      sourceUrl: '#',
      summary: `A nourishing recipe designed to complement your ${query} mood.`
    }];
  }
  
}

module.exports = new RecipeService();