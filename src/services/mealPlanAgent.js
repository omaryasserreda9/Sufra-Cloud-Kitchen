const { HfInference } = require("@huggingface/inference");

const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function generateMealPlan({
  weeklyBudget,
  mealsPerDay,
  favoriteCategories,
  allergies,
  previousOrders,
  availableMeals,
  startDate = new Date(),
  days = 7,
}) {
  const response = await client.chatCompletion({
    model: "Qwen/Qwen2.5-7B-Instruct",
    messages: [
      {
        role: "system",
        content: `
You are an expert meal planning assistant. Return ONLY valid JSON with no markdown, explanations, comments, or extra text.
        `,
      },
      {
        role: "user",
        content: `
Create a ${days}-day meal plan.

User Preferences:
${JSON.stringify(
  {
    weeklyBudget,
    mealsPerDay,
    favoriteCategories,
    allergies,
  },
  null,
  2
)}

Previous Orders:
${JSON.stringify(previousOrders, null, 2)}

Available Meals:
${JSON.stringify(availableMeals, null, 2)}

Rules:
- Use ONLY meals from Available Meals.
- Never invent meals.
- Avoid meals containing allergens.
- Prefer meals matching favoriteCategories.
- Learn customer preferences from Previous Orders.
- Respect weeklyBudget.
- Use actual dates starting from ${startDate.toISOString().split("T")[0]}.
- Create exactly ${days} days.
- Each date must contain meal1, meal2, meal3 ... up to mealsPerDay.
- Every mealX must be an ARRAY.
- Each mealX array should contain one or more COMPLETE meal objects from Available Meals.
- Return ONLY valid JSON.

Expected structure example:

{
  "2026-06-11": {
    "meal1": [{FULL_MEAL_OBJECT}],
    "meal2": [{FULL_MEAL_OBJECT}],
    "meal3": [{FULL_MEAL_OBJECT}]
  },
  "2026-06-12": {
    "meal1": [{FULL_MEAL_OBJECT}],
    "meal2": [{FULL_MEAL_OBJECT}],
    "meal3": [{FULL_MEAL_OBJECT}]
  }
}
`,
      },
    ],
    max_tokens: 4000,
    temperature: 0.7,
  });

  const raw = response.choices[0].message.content.trim();

  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Invalid AI response");
  }

  const jsonString = raw.slice(jsonStart, jsonEnd + 1);

  return JSON.parse(jsonString);
}

module.exports = {
  generateMealPlan,
};