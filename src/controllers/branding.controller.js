const { generateKitchenBranding } = require("../services/kitchenBranding.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

class BrandingController {
  generateKitchenBrandingController = asyncHandler(async (req, res) => {
    const { cookingStyles, signatureDish, story } = req.body;

    // Validation
    if (!cookingStyles || !signatureDish || !story) {
      throw new ApiError(400, "cookingStyles, signatureDish, and story are all required fields.");
    }

    if (!Array.isArray(cookingStyles) || cookingStyles.length === 0) {
      throw new ApiError(400, "cookingStyles must be a non-empty array.");
    }

    try {
      const brandingResult = await generateKitchenBranding({
        cookingStyles,
        signatureDish,
        story,
      });

      // The service returns a string (STRICT JSON ONLY prompt, but sometimes AI adds wrapper)
      // Attempt to parse it if it's a string, or just send it if it's already an object
      let parsedResult;
      try {
        parsedResult = typeof brandingResult === 'string' ? JSON.parse(brandingResult) : brandingResult;
      } catch (parseError) {
        // Fallback if AI didn't return perfect JSON
        parsedResult = { raw: brandingResult };
      }

      res.status(200).json(
        new ApiResponse(200, parsedResult, "Kitchen branding generated successfully")
      );
    } catch (error) {
      throw new ApiError(500, `AI Branding generation failed: ${error.message}`);
    }
  });
}

module.exports = new BrandingController();
