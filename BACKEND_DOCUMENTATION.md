# Sufra Cloud Kitchen Backend Documentation

## Overview

Sufra is a Node.js REST API for a multi-chef cloud-kitchen marketplace. It supports three user roles:

- **Customer:** browses meals, manages a cart, places orders, and adds reviews.
- **Chef:** manages meals, processes assigned order items, completes verification, and receives earnings.
- **Admin:** manages categories, chef verification, order statuses, and withdrawal requests.

The backend uses:

- **Express 5** for HTTP routing and middleware
- **MongoDB and Mongoose** for persistence
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Cloudinary** for image storage
- **Multer** for multipart image uploads
- **Paymob** for online payments
- **Hugging Face Inference** for kitchen branding and meal nutrition estimates

## Running the Backend

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run dev
```

Run in production mode:

```bash
npm start
```

The server uses `PORT`, or port `5000` when `PORT` is not configured.

### Environment Variables

Create a `.env` file containing the variables required by the enabled features:

```env
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

HUGGINGFACE_API_KEY=...

PAYMOB_API_KEY=...
PAYMOB_METHOD_ID_CARD=...
PAYMOB_LOGIN_URL=https://accept.paymob.com/api/auth/tokens
PAYMOB_API_URL=https://accept.paymob.com/api/ecommerce/orders
```

The default API base URL is:

```text
http://localhost:5000/api
```

`GET /` is the health-check endpoint.

## Application Startup

The startup flow begins in `src/server.js`:

1. Load environment variables using `dotenv`.
2. Connect to MongoDB through `src/config/database.js`.
3. Start the Express app on the configured port.

`src/app.js` configures the application:

1. Apply security headers with Helmet.
2. Enable CORS.
3. Parse JSON and URL-encoded request bodies.
4. Log requests using Morgan.
5. Mount all API routers.
6. Return a JSON response for unknown routes.
7. Pass errors to the global error middleware.

## Architecture

The backend follows a layered structure:

```text
HTTP Request
    |
    v
Route -> Middleware -> Controller -> Service -> Repository/Model -> MongoDB
    |                       |
    |                       +-> External services such as Cloudinary,
    |                           Paymob, and Hugging Face
    v
HTTP Response
```

### Folder Responsibilities

| Folder | Responsibility |
|---|---|
| `src/routes` | Defines endpoints and applies authentication, authorization, validation, and upload middleware. |
| `src/controllers` | Reads request data, calls services, and sends API responses. |
| `src/services` | Contains business rules and coordinates workflows. |
| `src/repositories` | Encapsulates common database queries for carts, chefs, meals, orders, and users. |
| `src/models` | Defines MongoDB collections and validation rules using Mongoose schemas. |
| `src/middlewares` | Handles JWT authentication, role checks, uploads, validation, and errors. |
| `src/utils` | Contains shared response, error, token, model resolution, async, and upload helpers. |
| `src/constants` | Defines allowed roles, statuses, payment methods, and financial settings. |
| `src/config` | Configures MongoDB and Cloudinary. |

## Authentication and Authorization

### Registration and Login

Users register through `POST /api/auth/register` and log in through `POST /api/auth/login`.

Each role is stored in a separate MongoDB collection:

- `Customer`
- `Chef`
- `Admin`

The submitted role tells the authentication service which model to use. Passwords are hashed with bcrypt before storage. On successful registration or login, the API returns a signed JWT containing the user's ID and role.

### Protected Requests

Protected endpoints expect:

```http
Authorization: Bearer <jwt-token>
```

The authentication middleware:

1. Extracts the Bearer token.
2. Verifies it using `JWT_SECRET`.
3. Reads the user ID and role from the token.
4. Loads the user from the role-specific collection.
5. Attaches the user to `req.user`.

The role middleware then checks whether the authenticated user's role is allowed to access the endpoint.

## Core Data Models

| Model | Purpose |
|---|---|
| `Customer` | Customer identity, contact information, address, and account status. |
| `Chef` | Chef identity, verification state, kitchen profile, and account status. |
| `Admin` | Administrator identity, permissions, and account status. |
| `Category` | Meal categories with an image and active/inactive state. |
| `Meal` | Chef-owned meal, images, price, categories, ingredients, nutrition, and status. |
| `Cart` | One cart per customer containing meal references and quantities. |
| `Order` | Customer order containing immutable meal snapshots and per-item statuses. |
| `Payment` | Payment method, status, amount, and provider references for an order. |
| `Review` | Customer rating and comment linked to a meal and chef. |
| `ChefVerificationRequest` | Chef identity, certificate, and kitchen images submitted for admin approval. |
| `ChefEarnings` | Gross amount, platform commission, and net earnings per chef per order. |
| `ChefWallet` | Chef's currently available balance. |
| `ChefWithdrawal` | Chef withdrawal request and admin processing details. |

## Main Business Workflows

### 1. Customer Shopping and Checkout

1. The customer browses active meals and categories.
2. The customer adds active meals to their cart.
3. `POST /api/orders/checkout` loads the customer's populated cart.
4. The backend snapshots each meal's name, description, image, chef, unit price, quantity, and subtotal into the order.
5. The backend calculates the total amount.
6. It creates an order:
   - Cash orders begin as `preparing`.
   - Paymob orders begin as `awaiting_payment`.
7. It creates a pending payment record.
8. For Paymob, it initializes payment and returns a Paymob URL.
9. It clears the customer's cart.

Snapshotting protects historical orders from later meal edits or price changes.

### 2. Paymob Payment Flow

1. Checkout creates a pending `Payment`.
2. The Paymob service converts the amount to cents and formats the customer's Egyptian phone number.
3. It authenticates with Paymob.
4. It creates a Paymob payment request using the local payment ID as the reference.
5. The checkout response includes Paymob's shortened payment URL.
6. Paymob sends payment results to `POST /api/payments/paymob/webhook`.
7. A successful confirmation marks the payment as paid and moves an awaiting order into preparation.

### 3. Order Preparation and Completion

Each order item belongs to one chef and moves through:

```text
preparing -> ready -> delivered
```

Chefs can only update their own items, and transitions must happen one step at a time.

The order status is derived from its item statuses:

- Any item still preparing: order is `preparing`
- All items ready or delivered: order is `out_for_delivery`
- All items delivered: order is `completed`

Chef order responses are filtered so a chef sees only their own items.

### 4. Earnings and Settlement

Settlement runs only when:

1. The order is `completed`.
2. Its payment is `paid`.
3. `settlementProcessed` is false.

The settlement service groups order items by chef, then:

1. Calculates each chef's gross earnings.
2. Deducts the platform commission configured in `src/constants/financial.js`.
3. Creates one `ChefEarnings` record per chef and order.
4. Atomically increases each chef's wallet balance by the net amount.
5. Marks the order as settled to prevent duplicate processing.

The current platform commission is **10%**.

### 5. Chef Withdrawals

1. A chef submits a withdrawal request against their available wallet balance.
2. An admin reviews pending requests.
3. Approval rechecks the balance and uses a MongoDB transaction to:
   - Deduct the requested amount from the wallet.
   - Mark the withdrawal as approved.
   - Record the admin and processing time.
4. Rejection updates the request without changing the wallet.

### 6. Chef Verification

1. A chef uploads national ID images, a health certificate, and kitchen images.
2. Multer validates that files are images and limits each file to 5 MB.
3. The controller uploads the image buffers to Cloudinary.
4. The verification request is created or replaced and reset to `pending`.
5. An admin approves or fails the request.
6. Approval sets `Chef.isVerified` to `true`; failure sets it to `false`.

### 7. Meal Creation and AI Nutrition

When a chef creates a meal:

1. Meal images are uploaded to Cloudinary.
2. The meal is saved in MongoDB.
3. A background Hugging Face request estimates nutrition from the ingredients.
4. The meal is updated when the AI response arrives.

The HTTP create-meal response does not wait for nutrition calculation to finish.

### 8. AI Kitchen Branding

Authenticated chefs can submit cooking styles, a signature dish, and their story. The backend sends this information to the Hugging Face `Qwen/Qwen2.5-7B-Instruct` model and returns a generated kitchen name, slogan, and description.

## API Route Map

### Public and Authentication Routes

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/` | Public | Health check |
| `POST` | `/api/auth/register` | Public | Register customer, chef, or admin |
| `POST` | `/api/auth/login` | Public | Log in and receive JWT |
| `GET` | `/api/auth/me` | Authenticated | Get current user |
| `GET` | `/api/chefs` | Public | List chefs |
| `GET` | `/api/chefs/:id` | Public | Get chef details |
| `GET` | `/api/categories/active` | Public | List active categories |
| `GET` | `/api/categories/active-with-meals` | Public | List active categories with meals |
| `GET` | `/api/meals/active` | Public | Browse active meals |
| `GET` | `/api/meals/:id` | Public | Get a meal |
| `POST` | `/api/payments/paymob/webhook` | Public webhook | Receive Paymob callback |

### Customer Routes

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/cart` | Get or create cart |
| `POST` | `/api/cart/items` | Add a meal to cart |
| `PATCH` | `/api/cart/items/:mealId` | Update quantity |
| `DELETE` | `/api/cart/items/:mealId` | Remove an item |
| `DELETE` | `/api/cart` | Clear cart |
| `POST` | `/api/orders/checkout` | Create order and payment |
| `GET` | `/api/orders/my-orders` | Get customer's orders |
| `GET` | `/api/orders/:id` | Get owned order |
| `POST` | `/api/reviews` | Add a meal review |

### Chef Routes

| Method | Endpoint | Purpose |
|---|---|---|
| `PUT` | `/api/chefs/profile` | Update chef profile |
| `POST` | `/api/chefs/kitchen-branding` | Generate AI branding |
| `POST` | `/api/verification-request` | Submit verification files |
| `GET` | `/api/verification-request/status` | Get verification status |
| `GET` | `/api/meals` | Get chef/admin meal list |
| `POST` | `/api/meals` | Create meal |
| `PUT` | `/api/meals/:id` | Update owned meal |
| `DELETE` | `/api/meals/:id` | Delete owned meal |
| `PATCH` | `/api/meals/:id/status` | Change owned meal status |
| `GET` | `/api/orders/chef/orders` | Get orders containing chef's meals |
| `GET` | `/api/orders/:id` | Get relevant order items |
| `PATCH` | `/api/orders/:id/items/status` | Update owned order item |
| `PATCH` | `/api/orders/:id/status` | Update order status |
| `GET` | `/api/settlement/wallet` | Get wallet balance |
| `GET` | `/api/settlement/earnings` | Get earnings history |
| `POST` | `/api/withdrawals/request` | Request withdrawal |
| `GET` | `/api/withdrawals/history` | Get withdrawal history |

### Admin Routes

| Method | Endpoint | Purpose |
|---|---|---|
| `PATCH` | `/api/chefs/:id/toggle-verification` | Toggle chef verification |
| `GET` | `/api/categories` | List all categories |
| `POST` | `/api/categories` | Create category |
| `GET` | `/api/categories/:id` | Get category |
| `PUT` | `/api/categories/:id` | Update category |
| `DELETE` | `/api/categories/:id` | Delete category |
| `PATCH` | `/api/categories/:id/status` | Change category status |
| `GET` | `/api/verification-request/pending` | List pending verification requests |
| `PATCH` | `/api/verification-request/:id/status` | Approve or fail verification |
| `GET` | `/api/orders/:id` | Get any order |
| `PATCH` | `/api/orders/:id/status` | Update order status |
| `GET` | `/api/withdrawals/requests` | List withdrawal requests |
| `PATCH` | `/api/withdrawals/:id/approve` | Approve withdrawal |
| `PATCH` | `/api/withdrawals/:id/reject` | Reject withdrawal |

## Status Values

| Domain | Allowed Values |
|---|---|
| Roles | `customer`, `chef`, `admin` |
| Meal | `active`, `inactive` |
| Verification | `pending`, `approved`, `failed` |
| Order item | `preparing`, `ready`, `delivered` |
| Order | `awaiting_payment`, `preparing`, `out_for_delivery`, `delivered`, `completed` |
| Payment method | `cash`, `paymob` |
| Payment status | `pending`, `paid`, `failed`, `refunded`, `cancelled` |
| Withdrawal | `pending`, `approved`, `rejected`, `completed` |

## Request Validation, Uploads, and Errors

- Route-level validation checks required request fields.
- Multer stores uploaded images in memory before Cloudinary upload.
- Only `image/*` MIME types are accepted.
- Each uploaded image is limited to 5 MB.
- Services throw `ApiError` with an HTTP status and message.
- Async controllers pass errors to the global error middleware.

Error responses use this general shape:

```json
{
  "success": false,
  "message": "Error explanation",
  "errors": []
}
```

Successful controllers generally use `ApiResponse`, which contains:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

## Current Implementation Notes

- `src/app.js` calls `connectDB()`, while `src/server.js` also waits for `connectDB()`. The connection helper caches the connection, so duplicate physical connections are avoided, but startup connection handling is split between two files.
- Registration queries for an existing user but currently does not explicitly reject that user before attempting creation. MongoDB unique indexes provide the final duplicate protection.
- Users are separated by role collection, so the same email may exist in different role collections.
- A withdrawal request does not reserve funds immediately. The balance is checked again during admin approval.
- Paymob webhook verification and authenticity rules should be reviewed before production deployment.
- The order schema derives order status from item statuses during save. Direct status updates and item-based updates should be tested carefully when changing order logic.
- AI nutrition and branding depend on external model output being valid JSON; failures are logged or returned as errors.
- There is currently no automated test script defined in `package.json`.

## Source Reference

Detailed request and response examples are also available in:

```text
src/docs/api.md
```
