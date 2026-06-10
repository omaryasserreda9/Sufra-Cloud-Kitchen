const { HfInference } = require("@huggingface/inference");

const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function calculateMealCalories(ingredientsString) {
  try {
    console.log("=== CALCULATE CALORIES ===");
    console.log("Ingredients:", ingredientsString);

    const response = await client.chatCompletion({
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [
        {
          role: "system",
          content: `
            You are a nutrition expert.

            Estimate calories for the provided ingredients using standard serving sizes when quantities are not specified.

            Return ONLY valid JSON.

            Example:
            Input: Rice, Chicken Breast
            Output:
            {"totalCalories":550}

            Do not return explanations, markdown, or additional text.
            `,
        },
        {
          role: "user",
          content: `
            Ingredients:
            ${ingredientsString}

            Estimate the total calories.

            Return ONLY JSON in this format:
            {
              "totalCalories": number
            }
            `,
        },
      ],
      temperature: 0.2,
      max_tokens: 100,
    });

    const raw = response.choices?.[0]?.message?.content?.trim();

    console.log("RAW AI RESPONSE:", raw);

    if (!raw) {
      throw new Error("Empty response from AI");
    }

    // Extract JSON if model wraps it in text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error(`No JSON found in response: ${raw}`);
    }

    const nutritionData = JSON.parse(jsonMatch[0]);

    console.log("PARSED NUTRITION DATA:", nutritionData);

    return {
      totalCalories: Number(nutritionData.totalCalories) || 0,
    };
  } catch (error) {
    console.error("Calorie calculation error:", error);

    return {
      totalCalories: 0,
    };
  }
}

module.exports = { calculateMealCalories };
