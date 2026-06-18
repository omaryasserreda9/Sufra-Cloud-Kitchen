const chefVerificationService = require("../services/chefVerification.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const {
  uploadSingleImage,
  uploadMultipleImages,
} = require("../utils/cloudinaryUpload");

class ChefVerificationController {
  _formatRequestResponse = (req, verificationRequest) => {
    const requestObj = verificationRequest.toObject();
    return {
      ...requestObj,
      nationalIdImage: requestObj.nationalIdImage,
      nationalIdBackImage: requestObj.nationalIdBackImage,
      healthCertificateImage: requestObj.healthCertificateImage,
      kitchenImages: requestObj.kitchenImages,
    };
  };

  submitRequest = asyncHandler(async (req, res) => {
    const chefId = req.user._id;
    const { kitchenAddress } = req.body;

    const nationalIdImageFile = req.files?.nationalIdImage?.[0];
    const nationalIdBackImageFile = req.files?.nationalIdBackImage?.[0];
    const healthCertificateImageFile = req.files?.healthCertificateImage?.[0];
    const kitchenImageFiles = req.files?.kitchenImages;

    if (
      !nationalIdImageFile ||
      !nationalIdBackImageFile ||
      !healthCertificateImageFile ||
      !kitchenImageFiles ||
      kitchenImageFiles.length < 3 ||
      kitchenImageFiles.length > 5 ||
      !kitchenAddress
    ) {
      throw new ApiError(
        400,
        "National ID (front & back), Health Certificate, 3-5 kitchen images, and kitchen address are required"
      );
    }

    const [
      nationalIdImageUrl,
      nationalIdBackImageUrl,
      healthCertificateImageUrl,
      kitchenImageUrls,
    ] = await Promise.all([
      uploadSingleImage(nationalIdImageFile, "cloudkitchen/chef-verifications"),
      uploadSingleImage(
        nationalIdBackImageFile,
        "cloudkitchen/chef-verifications"
      ),
      uploadSingleImage(
        healthCertificateImageFile,
        "cloudkitchen/chef-verifications"
      ),
      uploadMultipleImages(kitchenImageFiles, "cloudkitchen/chef-verifications"),
    ]);

    const request = await chefVerificationService.submitVerificationRequest(
      chefId,
      nationalIdImageUrl,
      nationalIdBackImageUrl,
      healthCertificateImageUrl,
      kitchenImageUrls,
      kitchenAddress
    );

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          this._formatRequestResponse(req, request),
          "Verification request submitted successfully"
        )
      );
  });

  getPendingRequests = asyncHandler(async (req, res) => {
    const requests = await chefVerificationService.getPendingRequests();
    const formattedRequests = requests.map((reqObj) =>
      this._formatRequestResponse(req, reqObj)
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formattedRequests,
          "Pending verification requests retrieved successfully"
        )
      );
  });

  getStatus = asyncHandler(async (req, res) => {
    const chefId = req.user._id;
    const request = await chefVerificationService.getVerificationStatus(chefId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          this._formatRequestResponse(req, request),
          "Verification status retrieved successfully"
        )
      );
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const request = await chefVerificationService.updateVerificationStatus(
      id,
      status
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          this._formatRequestResponse(req, request),
          "Verification status updated successfully"
        )
      );
  });
}

module.exports = new ChefVerificationController();
