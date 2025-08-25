# 🍽️ Add Highly Customizable AI Meal Planner Feature

## 📋 Summary

This PR introduces a comprehensive AI-powered meal planner that allows users to create personalized meal plans based on their preferences, dietary restrictions, and lifestyle needs. The feature leverages the existing Gemini AI integration to generate intelligent, customized meal suggestions with detailed recipes and cooking instructions.

## ✨ Features Added

### 🎯 Core Functionality
- **AI-Powered Meal Plan Generation**: Creates complete weekly/monthly meal plans using Gemini AI
- **Highly Customizable Preferences**: Support for dietary restrictions, cuisine preferences, allergies, and ingredient preferences
- **Individual Meal Management**: Regenerate, customize, or manually edit specific meals
- **Smart Shopping Lists**: Auto-generated consolidated shopping lists from meal plans
- **Ingredient Substitutions**: AI-powered ingredient substitution suggestions

### 🔧 Technical Features
- **Robust JSON Parsing**: Advanced error handling for AI response parsing with multiple fallback strategies
- **Real-time Updates**: Live calorie tracking and meal plan modifications
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Status Management**: Draft, active, completed, and archived meal plan states

## 🏗️ Architecture

### Backend Components
- **`MealPlan` Model**: Comprehensive schema for meal plans, daily meals, and shopping lists
- **`mealPlannerService`**: AI integration service with advanced JSON parsing and error handling
- **Meal Plan API Routes**: Full CRUD operations with meal customization endpoints
- **Enhanced User Model**: Extended with meal planning preferences

### Frontend Components
- **`MealPlanner` Page**: Main dashboard for managing meal plans
- **`MealPlanDetail` Page**: Detailed view with day-by-day navigation
- **`MealPlanForm`**: Comprehensive form for creating/editing meal plans
- **`MealCard` & `MealPlanCard`**: Interactive meal and plan display components
- **`mealPlannerApi`**: Complete API integration service

## 📊 Changes Summary

```
13 files changed, 3,368 insertions(+), 4 deletions(-)
```

### New Files Created
- `backend/models/MealPlan.js` (209 lines)
- `backend/services/mealPlannerService.js` (665 lines)
- `backend/routes/mealPlan.js` (431 lines)
- `frontend/src/pages/MealPlanner.jsx` (315 lines)
- `frontend/src/pages/MealPlanDetail.jsx` (460 lines)
- `frontend/src/components/MealPlanForm.jsx` (511 lines)
- `frontend/src/components/MealPlanCard.jsx` (183 lines)
- `frontend/src/components/MealCard.jsx` (244 lines)
- `frontend/src/services/mealPlannerApi.js` (272 lines)

### Modified Files
- Extended `User.js` model with meal planning preferences
- Updated navigation in `Navbar.jsx` and routing in `App.jsx`
- Added meal plan routes to `server.js`

## 🎨 User Interface

### Meal Planner Dashboard
- Grid layout showing all meal plans with status indicators
- Search and filter functionality
- Quick actions for viewing, editing, starting, and deleting plans

### Meal Plan Detail View
- Day-by-day navigation with current day highlighting
- Expandable meal cards showing ingredients and instructions
- Shopping list integration with checkable items
- Real-time meal regeneration and customization

### Meal Plan Creation Form
- Multi-step form with comprehensive preference settings
- Dietary restrictions, cuisine preferences, and allergies
- Preferred/disliked ingredients management
- Cooking time and difficulty preferences
- Calorie targets and meal frequency settings

## 🤖 AI Integration

### Enhanced Gemini Service
- **Structured Prompts**: Detailed prompts for consistent meal plan generation
- **JSON Parsing**: Robust parsing with multiple fallback strategies
- **Error Handling**: Graceful degradation when AI generation fails
- **Content Validation**: Ensures all generated content meets requirements

### AI Capabilities
- Generates complete meal plans (1-30 days)
- Creates balanced nutrition across comfort, quick, and healthy categories
- Suggests ingredient substitutions based on availability
- Customizes meals based on user modifications
- Avoids repetition by considering recent meal history

## 🔒 Data Model

### MealPlan Schema
```javascript
{
  userId: ObjectId,
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  duration: Number,
  preferences: {
    dietaryRestrictions: [String],
    cuisinePreferences: [String],
    allergies: [String],
    dislikedIngredients: [String],
    preferredIngredients: [String],
    cookingTime: String,
    difficulty: String,
    calorieTarget: Number,
    mealsPerDay: Number,
    includeSnacks: Boolean
  },
  days: [{
    date: Date,
    meals: {
      breakfast: MealSchema,
      lunch: MealSchema,
      dinner: MealSchema,
      snacks: [MealSchema]
    },
    totalCalories: Number,
    shoppingList: [IngredientSchema]
  }],
  status: String // draft, active, completed, archived
}
```

## 🛡️ Error Handling & Reliability

### Robust JSON Parsing
- Multiple extraction patterns for AI responses
- Automatic cleaning of markdown formatting and comments
- Fallback to safe default data if parsing fails
- Comprehensive error logging for debugging

### API Error Handling
- Graceful handling of AI generation failures
- Meaningful error messages for users
- Fallback meal data when AI is unavailable
- Prevents server crashes from malformed responses

## 🧪 Testing Considerations

### Manual Testing Completed
- ✅ Meal plan creation with various preferences
- ✅ Individual meal regeneration and customization
- ✅ Shopping list generation and management
- ✅ Error handling with malformed AI responses
- ✅ Mobile responsiveness and UI interactions

### Recommended Testing
- [ ] Load testing with multiple concurrent meal plan generations
- [ ] Edge case testing with extreme dietary restrictions
- [ ] Integration testing with different AI response formats
- [ ] Performance testing with large meal plans (30+ days)

## 🚀 Deployment Notes

### Environment Variables Required
No new environment variables needed - uses existing `GEMINI_API_KEY`

### Database Migrations
- New `MealPlan` collection will be created automatically
- `User` model extended with backward compatibility

### Dependencies
All required dependencies are already included in the existing `package.json` files.

## 📱 Usage Instructions

1. **Create a Meal Plan**:
   - Navigate to "Meal Planner" in the navigation
   - Click "New Meal Plan"
   - Set preferences and let AI generate the plan

2. **Customize Your Plan**:
   - View individual days and meals
   - Regenerate meals you don't like
   - Get ingredient substitution suggestions

3. **Shopping & Cooking**:
   - Generate consolidated shopping lists
   - Check off items as you shop
   - Follow step-by-step cooking instructions

## 🔄 Future Enhancements

- [ ] Meal plan templates for common dietary patterns
- [ ] Integration with grocery delivery services
- [ ] Nutritional analysis and macro tracking
- [ ] Social sharing of favorite meal plans
- [ ] Recipe rating and feedback system
- [ ] Integration with fitness apps for calorie synchronization

## 📝 Breaking Changes

None - this is a purely additive feature that doesn't modify existing functionality.

## 🤝 Collaboration

This feature was implemented with comprehensive error handling, user experience considerations, and follows the existing codebase patterns and conventions.

---

**Ready for Review** ✅

This PR adds a production-ready, highly customizable AI meal planner that significantly enhances the MoodMenu application's value proposition by extending beyond mood-based recipes to comprehensive meal planning.