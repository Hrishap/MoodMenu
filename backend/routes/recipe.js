const express = require('express');
const router = express.Router();
const recipeService = require('../services/recipeService');
const authMiddleware = require('../middleware/auth');

// All recipe routes require authentication
router.use(authMiddleware);

// Search recipes
router.get('/search', async (req, res) => {
  try {
    const { query, number = 5, diet, intolerances } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const recipes = await recipeService.searchRecipes(query, number, diet, intolerances);
    res.json({ recipes });
  } catch (error) {
    console.error('Recipe search error:', error);
    res.status(500).json({ message: 'Failed to search recipes' });
  }
});

// Get recipe details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.getRecipeDetails(id);
    res.json({ recipe });
  } catch (error) {
    console.error('Recipe details error:', error);
    res.status(500).json({ message: 'Failed to fetch recipe details' });
  }
});

// Get random recipes
router.get('/random/:number?', async (req, res) => {
  try {
    const number = parseInt(req.params.number) || 1;
    const { tags } = req.query;
    
    const recipes = await recipeService.getRandomRecipes(number, tags);
    res.json({ recipes });
  } catch (error) {
    console.error('Random recipes error:', error);
    res.status(500).json({ message: 'Failed to fetch random recipes' });
  }
});

module.exports = router;