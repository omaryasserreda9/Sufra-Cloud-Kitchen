const ApiError = require("../utils/ApiError");

class PaymobService {
  constructor() {
    this.apiKey = process.env.PAYMOB_API_KEY;
    this.paymentLoginUrl = process.env.PAYMOB_LOGIN_URL || "https://accept.paymob.com/api/auth/tokens";
    this.paymentApiUrl = process.env.PAYMOB_API_URL || "https://accept.paymob.com/api/ecommerce/orders";
    this.paymentMethods = [process.env.PAYMOB_METHOD_ID_CARD];
  }
  
  // =========================
  // MAIN INIT PAYMENT
  // =========================
  async initializePayment(amount, paymentId, customer) {
    try {
      // =========================
      // Step 1: Validation
      // =========================
      if (!amount || amount <= 0) {
        throw new ApiError(400, "Invalid payment amount");
      }

      // =========================
      // Step 2: prepare data (Laravel $paymentData)
      // =========================
      const amountCents = Math.round(amount * 100);

      const fullName = `${customer.first_name} ${customer.last_name}`;

      const paymentData = {
        full_name: fullName,
        phone_number: this.formatPhone(customer.phone),
        email: customer.email,
        amount_cents: amountCents,
        reference_id: paymentId,
        payment_methods: this.paymentMethods,
        is_live: false,
        description: customer.description || "Payment via platform",
      };

      // =========================
      // Step 3: get access token (LIKE Laravel login_url)
      // =========================
      const accessTokenResponse = await fetch(this.paymentLoginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.apiKey,
          expiration: 999999999999,
        }),
      });

      const tokenData = await accessTokenResponse.json();

      if (!accessTokenResponse.ok) {
        throw new ApiError(
          500,
          `Paymob Auth Failed: ${tokenData.message || accessTokenResponse.statusText}`,
        );
      }

      const token = tokenData.token;

      // =========================
      // Step 4: send payment request (LIKE Laravel api_url)
      // =========================
      const apiResponseRaw = await fetch(this.paymentApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const apiResponse = await apiResponseRaw.json();

      if (!apiResponseRaw.ok) {
        throw new ApiError(
          500,
          `Paymob Payment Failed: ${apiResponse.message || apiResponseRaw.statusText}`,
        );
      }

      // =========================
      // Step 5: return ONLY shorten_url (like Laravel)
      // =========================
      return apiResponse.shorten_url;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Paymob Initialization Error: ${error.message}`);
    }
  }

  // =========================
  // PHONE FORMATTER
  // =========================
  formatPhone(phone) {
    phone = phone.replace(/\D+/g, "");

    if (phone.startsWith("0")) {
      phone = "+20" + phone.substring(1);
    } else if (phone.startsWith("20")) {
      phone = "+" + phone;
    } else if (!phone.startsWith("+20")) {
      phone = "+20" + phone;
    }

    return phone;
  }
}

module.exports = new PaymobService();
