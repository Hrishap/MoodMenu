const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const authMiddleware = require('../middleware/auth');

// All Gemini routes require authentication
router.use(authMiddleware);

// Generate content
router.post('/generate', async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.5-flash' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const response = await geminiService.generateContent(prompt, model);
    res.json({ response });
  } catch (error) {
    console.error('Gemini generate error:', error);
    res.status(500).json({ message: 'Failed to generate content' });
  }
});

// Generate recipe variation
router.post('/recipe-variation', async (req, res) => {
  try {
    const { baseRecipe, mood, preferences } = req.body;
    
    if (!baseRecipe || !mood) {
      return res.status(400).json({ message: 'Base recipe and mood are required' });
    }

    const response = await geminiService.generateRecipeVariation(baseRecipe, mood, preferences);
    res.json({ response });
  } catch (error) {
    console.error('Recipe variation error:', error);
    res.status(500).json({ message: 'Failed to generate recipe variation' });
  }
});

module.exports = router;