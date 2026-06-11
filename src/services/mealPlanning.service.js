const Meal = require("../models/Meal");
const Order = require("../models/Order");
const MEAL_STATUS = require("../constants/mealStatus");
const ORDER_STATUS = require("../constants/orderStatus");
const { generateMealPlan } = require("./mealPlanAgent");

/**
 * Generates a meal plan for a customer based on preferences and history.
 */
const getMealPlan = async (customerId, { weeklyBudget, mealsPerDay, favoriteCategories, allergies }) => {
  // 1. Load active meals intersecting with favoriteCategories
  // We use $in to find meals that have at least one of the favorite categories
  const meals = await Meal.find({
    status: MEAL_STATUS.ACTIVE,
    categories: { $in: favoriteCategories }
  }).populate('categories');

  // 2. Exclude meals containing allergy ingredients
  let filteredMeals = meals;
  if (allergies && allergies.length > 0) {
    const allergyLower = allergies.map(a => a.toLowerCase());
    filteredMeals = meals.filter(meal => {
      const ingredients = (meal.ingredients || []).map(i => i.toLowerCase());
      const description = (meal.description || "").toLowerCase();
      const name = (meal.name || "").toLowerCase();
      
      const hasAllergy = allergyLower.some(allergy => 
        ingredients.some(ing => ing.includes(allergy)) || 
        description.includes(allergy) ||
        name.includes(allergy)
      );
      
      return !hasAllergy;
    });
  }

  // 3. Analyze previous orders to determine favorite meals and categories
  const previousOrdersRaw = await Order.find({
    customerId,
    status: ORDER_STATUS.COMPLETED
  }).populate({
    path: 'items.mealId',
    populate: { path: 'categories' }
  });

  const mealFrequency = {};
  const categoryFrequency = {};
  const mealInfo = {};
  const categoryInfo = {};

  previousOrdersRaw.forEach(order => {
    order.items.forEach(item => {
      if (item.mealId) {
        const m = item.mealId;
        const mealId = m._id ? m._id.toString() : m.toString();
        mealFrequency[mealId] = (mealFrequency[mealId] || 0) + 1;
        mealInfo[mealId] = m.name || item.name;
        
        if (m.categories && Array.isArray(m.categories)) {
          m.categories.forEach(cat => {
            const cid = cat._id ? cat._id.toString() : cat.toString();
            categoryFrequency[cid] = (categoryFrequency[cid] || 0) + 1;
            categoryInfo[cid] = cat.name || cid;
          });
        }
      }
    });
  });

  const previousOrdersSummary = {
    topMeals: Object.entries(mealFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => ({ id, name: mealInfo[id] })),
    topCategories: Object.entries(categoryFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => ({ id, name: categoryInfo[id] }))
  };

  // 4. Generate meal plan using AI agent (returns IDs)
  const rawMealPlan = await generateMealPlan({
    weeklyBudget,
    mealsPerDay,
    favoriteCategories,
    allergies,
    previousOrders: previousOrdersSummary,
    availableMeals: filteredMeals
  });

  // 5. Populate and validate
  const availableMealsMap = new Map(filteredMeals.map(m => [m._id.toString(), m]));
  const validatedPlan = {};

  for (const date in rawMealPlan) {
    validatedPlan[date] = {};
    for (let i = 1; i <= mealsPerDay; i++) {
      const mealKey = `meal${i}`;
      const mealIdsInSlot = rawMealPlan[date][mealKey];
      
      if (!Array.isArray(mealIdsInSlot)) {
         validatedPlan[date][mealKey] = [];
         continue;
      }

      const validMeals = mealIdsInSlot
        .map(id => availableMealsMap.get(id?.toString()))
        .filter(m => {
          if (!m) return false;

          // Extra safety check for allergens
          if (allergies && allergies.length > 0) {
             const allergyLower = allergies.map(a => a.toLowerCase());
             const ingredients = (m.ingredients || []).map(ing => ing.toLowerCase());
             const description = (m.description || "").toLowerCase();
             const name = (m.name || "").toLowerCase();
             
             const hasAllergy = allergyLower.some(allergy => 
               ingredients.some(ing => ing.includes(allergy)) || 
               description.includes(allergy) ||
               name.includes(allergy)
             );
             if (hasAllergy) return false;
          }
          return true;
        });

      validatedPlan[date][mealKey] = validMeals;
    }
  }

  return validatedPlan;
};

module.exports = {
  getMealPlan
};
