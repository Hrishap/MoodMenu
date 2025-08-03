const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const authMiddleware = require('../middleware/auth');

// All mood routes require authentication
router.use(authMiddleware);

// Core mood functionality
router.post('/', moodController.submitMood);
router.get('/history', moodController.getHistory);
router.get('/:interactionId', moodController.getInteraction);
router.put('/:interactionId/rate', moodController.rateInteraction);

// NEW: Enhanced AI features
router.post('/substitutions', moodController.getIngredientSubstitutions);
router.post('/generate-image', moodController.generateRecipeImage);
router.post('/select-recipe', moodController.selectPreferredRecipe);

module.exports = router;