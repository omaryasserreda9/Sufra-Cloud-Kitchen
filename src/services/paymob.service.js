const ApiError = require("../utils/ApiError");

class PaymobService {
  constructor() {
    this.apiKey = process.env.PAYMOB_API_KEY;
    this.integrationId = process.env.PAYMOB_INTEGRATION_ID;
    this.iframeId = process.env.PAYMOB_IFRAME_ID;
    this.baseUrl = "https://accept.paymob.com/api";
  }

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/auth/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: this.apiKey }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(500, `Paymob Authentication Failed: ${data.message || response.statusText}`);
    }
    return data.token;
  }

  async registerOrder(authToken, amountCents, merchantOrderId) {
    const response = await fetch(`${this.baseUrl}/ecommerce/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: amountCents,
        currency: "EGP",
        merchant_order_id: merchantOrderId,
        items: [],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(500, `Paymob Order Registration Failed: ${data.message || response.statusText}`);
    }
    return data.id;
  }

  async generatePaymentKey(authToken, orderId, amountCents, billingData) {
    const response = await fetch(`${this.baseUrl}/acceptance/payment_keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: "NA",
          email: billingData.email || "NA",
          floor: "NA",
          first_name: billingData.firstName || "NA",
          street: billingData.address || "NA",
          building: "NA",
          phone_number: billingData.phone || "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "NA",
          country: "NA",
          last_name: billingData.lastName || "NA",
          state: "NA",
        },
        currency: "EGP",
        integration_id: this.integrationId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(500, `Paymob Payment Key Generation Failed: ${data.message || response.statusText}`);
    }
    return data.token;
  }

  async initializePayment(amount, merchantOrderId, billingData) {
    try {
      const amountCents = Math.round(amount * 100);
      const authToken = await this.authenticate();
      const paymobOrderId = await this.registerOrder(authToken, amountCents, merchantOrderId);
      const paymentKey = await this.generatePaymentKey(authToken, paymobOrderId, amountCents, billingData);

      return `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Paymob Initialization Error: ${error.message}`);
    }
  }
}

module.exports = new PaymobService();
