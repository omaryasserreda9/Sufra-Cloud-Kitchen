const ChefVerificationRequest = require("../models/ChefVerificationRequest");
const ApiError = require("../utils/ApiError");
const VERIFICATION_STATUS = require("../constants/verificationStatus");

class ChefVerificationService {
  async submitVerificationRequest(
    chefId,
    nationalIdImageUrl,
    nationalIdBackImageUrl,
    healthCertificateImageUrl,
    kitchenImageUrls
  ) {
    // Find existing request
    let request = await ChefVerificationRequest.findOne({ chefId });

    if (request) {
      // Update existing request and reset status to pending
      request.nationalIdImage = nationalIdImageUrl;
      request.nationalIdBackImage = nationalIdBackImageUrl;
      request.healthCertificateImage = healthCertificateImageUrl;
      request.kitchenImages = kitchenImageUrls;
      request.status = VERIFICATION_STATUS.PENDING;
      await request.save();
    } else {
      // Create new request
      request = await ChefVerificationRequest.create({
        chefId,
        nationalIdImage: nationalIdImageUrl,
        nationalIdBackImage: nationalIdBackImageUrl,
        healthCertificateImage: healthCertificateImageUrl,
        kitchenImages: kitchenImageUrls,
        status: VERIFICATION_STATUS.PENDING,
      });
    }

    return request;
  }

  async getPendingRequests() {
    return await ChefVerificationRequest.find({
      status: VERIFICATION_STATUS.PENDING,
    }).populate("chefId", "firstName lastName kitchenName email phone");
  }

  async getVerificationStatus(chefId) {
    const request = await ChefVerificationRequest.findOne({ chefId });
    
    if (!request) {
      throw new ApiError(404, "No verification request found for this chef");
    }

    return request;
  }

  async updateVerificationStatus(requestId, status) {
    if (!Object.values(VERIFICATION_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid verification status");
    }

    const request = await ChefVerificationRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true, runValidators: true }
    );

    if (!request) {
      throw new ApiError(404, "Verification request not found");
    }

    return request;
  }
}

module.exports = new ChefVerificationService();
