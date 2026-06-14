const ChefVerificationRequest = require("../models/ChefVerificationRequest");
const Chef = require("../models/Chef");
const ApiError = require("../utils/ApiError");
const VERIFICATION_STATUS = require("../constants/verificationStatus");
const notificationService = require("./notification.service");
const { notificationPresets } = require("../constants/notificationPresets");

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

    const chef = await Chef.findById(chefId).select("firstName lastName kitchenName").lean();
    const chefName =
      chef?.kitchenName || `${chef?.firstName || ""} ${chef?.lastName || ""}`.trim() || "A chef";

    await notificationService.notifyAdmins({
      ...notificationPresets.adminVerificationRequest({
        chefName,
        requestId: request._id,
      }),
      entityType: "ChefVerificationRequest",
      entityId: request._id,
      deduplicationKey: `verification-request:${request._id}:${request.updatedAt.getTime()}`,
      metadata: { chefId },
    });

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

    // If request is approved, update chef verification status
    if (status === VERIFICATION_STATUS.APPROVED) {
      await Chef.findByIdAndUpdate(request.chefId, { isVerified: true });
    } else if (status === VERIFICATION_STATUS.FAILED) {
      // If request failed, ensure chef is not verified
      await Chef.findByIdAndUpdate(request.chefId, { isVerified: false });
    }

    await notificationService.notifyChef(request.chefId, {
      ...notificationPresets.chefVerificationUpdated({
        status,
        requestId: request._id,
      }),
      entityType: "ChefVerificationRequest",
      entityId: request._id,
      deduplicationKey: `verification-status:${request._id}:${status}`,
    });

    return request;
  }
}

module.exports = new ChefVerificationService();
