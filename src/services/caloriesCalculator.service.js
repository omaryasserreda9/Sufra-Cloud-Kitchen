const { HfInference } = require("@huggingface/inference");

const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function calculateMealCalories(ingredientsString) {
  const response = await client.chatCompletion({
    model: "Qwen/Qwen2.5-7B-Instruct",
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition expert. Parse the ingredient string and return ONLY valid JSON with total calories.",
      },
      {
        role: "user",
        content: `
            Ingredients:
            ${ingredientsString}

            Return ONLY JSON:
            {
            "totalCalories": 0
            }
        `,
      },
    ],
    temperature: 0.2,
    max_tokens: 200,
  });

  const raw = response.choices[0].message.content;

  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");

  return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
}

module.exports = { calculateMealCalories };
