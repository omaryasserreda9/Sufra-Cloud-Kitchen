const { HfInference } = require("@huggingface/inference");

const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function analyzeComment(comment) {
  const response = await client.textClassification({
    model: "textdetox/xlmr-large-toxicity-classifier",
    inputs: comment
  });

  return response;
}

module.exports = { analyzeComment };