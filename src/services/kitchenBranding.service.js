const { HfInference } = require("@huggingface/inference");

const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function generateKitchenBranding(data) {
  const response = await client.chatCompletion({
    model: "Qwen/Qwen2.5-7B-Instruct",
    messages: [
      {
        role: "system",
        content:
          "You are a world-class food branding expert. Return ONLY valid JSON."
      },
      {
        role: "user",
        content: `
Cooking Styles: ${data.cookingStyles.join(", ")}
Signature Dish: ${data.signatureDish}
Story: ${data.story}

Return ONLY JSON:
{
  "kitchenName": "",
  "slogan": "",
  "description": ""
}
`
      }
    ],
    max_tokens: 400,
    temperature: 0.8,
  });

  const raw = response.choices[0].message.content;

  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");

  return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
}

module.exports = { generateKitchenBranding };