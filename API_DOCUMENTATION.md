# 🍽️ Meal Planner API Documentation

## Base URL
```
/api/meal-plan
```

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Endpoints

### 📋 Meal Plan Management

#### Create Meal Plan
```http
POST /api/meal-plan/create
```

**Request Body:**
```json
{
  "name": "Weekly Healthy Meals",
  "description": "Balanced meals for the week",
  "duration": 7,
  "startDate": "2025-08-25",
  "preferences": {
    "dietaryRestrictions": ["vegetarian", "gluten-free"],
    "cuisinePreferences": ["Italian", "Mediterranean"],
    "allergies": ["nuts"],
    "dislikedIngredients": ["mushrooms"],
    "preferredIngredients": ["tomatoes", "basil"],
    "cookingTime": "moderate",
    "difficulty": "easy",
    "calorieTarget": 2000,
    "mealsPerDay": 3,
    "includeSnacks": true
  },
  "generateWithAI": true
}
```

**Response:**
```json
{
  "message": "Meal plan created successfully",
  "mealPlan": { /* MealPlan object */ },
  "additionalData": {
    "shoppingList": [/* ingredients */],
    "tips": "Meal prep suggestions...",
    "nutritionSummary": { /* nutrition info */ }
  }
}
```

#### Get All Meal Plans
```http
GET /api/meal-plan/list?status=active&page=1&limit=10
```

**Query Parameters:**
- `status` (optional): `draft`, `active`, `completed`, `archived`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "mealPlans": [/* array of meal plans */],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 25
  }
}
```

#### Get Specific Meal Plan
```http
GET /api/meal-plan/:id
```

**Response:**
```json
{
  "mealPlan": { /* complete meal plan with all days and meals */ },
  "generatedShoppingList": [/* consolidated shopping list */]
}
```

#### Update Meal Plan
```http
PUT /api/meal-plan/:id
```

**Request Body:**
```json
{
  "name": "Updated Plan Name",
  "description": "New description",
  "preferences": { /* updated preferences */ },
  "status": "active"
}
```

#### Delete Meal Plan
```http
DELETE /api/meal-plan/:id
```

### 🍳 Individual Meal Management

#### Update/Regenerate Meal
```http
PUT /api/meal-plan/:id/day/:dayIndex/meal/:mealType
```

**Parameters:**
- `id`: Meal plan ID
- `dayIndex`: Day index (0-based)
- `mealType`: `breakfast`, `lunch`, `dinner`, or `snacks`

**Request Body:**
```json
{
  "meal": { /* meal object for manual update */ },
  "regenerate": true, // to regenerate with AI
  "snackIndex": 0 // required for snacks
}
```

**Response:**
```json
{
  "message": "Meal updated successfully",
  "updatedMeal": { /* new meal data */ },
  "updatedDayCalories": 1850
}
```

#### Customize Meal
```http
POST /api/meal-plan/:id/day/:dayIndex/meal/:mealType/customize
```

**Request Body:**
```json
{
  "modifications": {
    "cookingTime": "quick",
    "servings": 4,
    "replaceIngredients": ["chicken with tofu"],
    "addInstructions": "Make it spicier"
  }
}
```

**Response:**
```json
{
  "message": "Meal customized successfully",
  "customizedMeal": { /* customized meal */ },
  "updatedDayCalories": 1920
}
```

#### Get Ingredient Substitutions
```http
POST /api/meal-plan/:id/day/:dayIndex/meal/:mealType/substitutions
```

**Request Body:**
```json
{
  "unavailableIngredients": ["heavy cream", "parmesan cheese"]
}
```

**Response:**
```json
{
  "substitutions": {
    "heavy cream": {
      "substitutes": [
        {
          "ingredient": "coconut milk",
          "ratio": "1:1",
          "explanation": "Rich, creamy texture",
          "flavorImpact": "Slight coconut flavor",
          "availability": "common"
        }
      ],
      "tips": "Adjust seasoning to taste"
    }
  }
}
```

### 🛒 Shopping List Management

#### Get Shopping List
```http
GET /api/meal-plan/:id/shopping-list
```

**Response:**
```json
{
  "shoppingList": [
    {
      "ingredient": "tomatoes",
      "amount": "6 large",
      "unit": "pieces",
      "checked": false
    }
  ]
}
```

#### Update Shopping List Item
```http
PUT /api/meal-plan/:id/shopping-list/:itemIndex
```

**Request Body:**
```json
{
  "checked": true
}
```

## 📊 Data Models

### MealPlan Object
```json
{
  "_id": "meal_plan_id",
  "userId": "user_id",
  "name": "Weekly Meal Plan",
  "description": "Healthy balanced meals",
  "startDate": "2025-08-25T00:00:00.000Z",
  "endDate": "2025-08-31T00:00:00.000Z",
  "duration": 7,
  "preferences": {
    "dietaryRestrictions": ["vegetarian"],
    "cuisinePreferences": ["Italian"],
    "allergies": ["nuts"],
    "dislikedIngredients": ["mushrooms"],
    "preferredIngredients": ["tomatoes"],
    "cookingTime": "moderate",
    "difficulty": "easy",
    "calorieTarget": 2000,
    "mealsPerDay": 3,
    "includeSnacks": true
  },
  "days": [
    {
      "date": "2025-08-25T00:00:00.000Z",
      "meals": {
        "breakfast": { /* Meal object */ },
        "lunch": { /* Meal object */ },
        "dinner": { /* Meal object */ },
        "snacks": [{ /* Meal object */ }]
      },
      "totalCalories": 2000,
      "shoppingList": [/* ingredients */]
    }
  ],
  "status": "active",
  "generatedBy": "ai",
  "lastModified": "2025-08-25T10:00:00.000Z",
  "createdAt": "2025-08-25T09:00:00.000Z",
  "updatedAt": "2025-08-25T10:00:00.000Z"
}
```

### Meal Object
```json
{
  "type": "breakfast",
  "recipeName": "Avocado Toast with Poached Egg",
  "ingredients": [
    {
      "name": "bread",
      "amount": "2",
      "unit": "slices"
    },
    {
      "name": "avocado",
      "amount": "1",
      "unit": "medium"
    }
  ],
  "instructions": "1. Toast bread. 2. Mash avocado. 3. Poach egg. 4. Assemble and serve.",
  "cookingTime": 15,
  "servings": 2,
  "calories": 350,
  "difficulty": "easy",
  "tags": ["breakfast", "healthy", "quick"],
  "nutritionHighlights": "High in healthy fats and protein",
  "customized": false,
  "modifications": ""
}
```

## 🚫 Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 404 Not Found
```json
{
  "message": "Meal plan not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to generate meal plan"
}
```

## 📝 Usage Examples

### Creating a Keto Meal Plan
```javascript
const response = await fetch('/api/meal-plan/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: "Keto Week",
    duration: 7,
    startDate: "2025-08-25",
    preferences: {
      dietaryRestrictions: ["keto", "low-carb"],
      calorieTarget: 1800,
      cookingTime: "quick",
      difficulty: "easy"
    },
    generateWithAI: true
  })
});
```

### Regenerating a Breakfast
```javascript
const response = await fetch('/api/meal-plan/123/day/0/meal/breakfast', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    regenerate: true
  })
});
```

This API provides comprehensive meal planning functionality with AI-powered generation, customization, and management capabilities.