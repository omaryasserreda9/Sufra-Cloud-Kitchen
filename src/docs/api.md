# Cloud Kitchen API Documentation

Welcome to the Cloud Kitchen Backend API documentation. This project provides a comprehensive set of APIs for managing chefs, customers, meals, categories, and AI-powered kitchen branding.

## Base URL
`http://localhost:3000/api`

---

## 1. Authentication Module (`/auth`)
Handles user registration, login, and session retrieval.

### Register User
Create a new account (Chef, Customer, or Admin).

- **URL:** `/auth/register`
- **Method:** `POST`
- **Auth Required:** No
- **Mandatory Fields:** `email`, `password`, `role`, `firstName`, `lastName`
- **Optional Fields:** `phone`
- **Roles:** `customer`, `chef`, `admin`
- **Request Body Example:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "chef",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "01234567890"
}
```
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "user": { ... },
    "token": "..."
  },
  "message": "User registered successfully"
}
```

### Login User
Authenticate and receive a JWT token.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth Required:** No
- **Mandatory Fields:** `email`, `password`, `role`
- **Request Body Example:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "chef"
}
```
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": { ... },
    "token": "..."
  },
  "message": "Login successful"
}
```

### Get Current User
Retrieve profile of the authenticated user.

- **URL:** `/auth/me`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Current user retrieved successfully"
}
```

---

## 2. Chef Module (`/chefs`)
Manage chef-specific details, profile updates, and branding.

### Get All Chefs
Retrieve all registered chefs.

- **URL:** `/chefs`
- **Method:** `GET`
- **Auth Required:** No
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "kitchenName": "Mario's Italian Kitchen",
      "isVerified": true
    },
    ...
  ],
  "message": "All chefs retrieved successfully"
}
```

### Get Chef Details
Retrieve details of a specific chef.

- **URL:** `/chefs/:id`
- **Method:** `GET`
- **Auth Required:** No
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "chef@example.com",
    "phone": "01234567890",
    "kitchenName": "Mario's Italian Kitchen",
    "slogan": "The taste of Rome",
    "description": "Authentic homemade pasta and sauces.",
    "isVerified": true,
    "status": "active"
  },
  "message": "Chef details retrieved successfully"
}
```

### Update Profile
Update chef's kitchen details and personal info.

- **URL:** `/chefs/profile`
- **Method:** `PUT`
- **Auth Required:** Yes (Chef role)
- **Optional Fields:** `firstName`, `lastName`, `phone`, `kitchenName`, `slogan`, `description`, `password`
- **Request Body Example:**
```json
{
  "kitchenName": "Mario's Italian Kitchen",
  "slogan": "The taste of Rome",
  "description": "Authentic homemade pasta and sauces."
}
```
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Chef profile updated successfully"
}
```

### Toggle Verification (Admin Only)
Toggle the verification status of a chef.

- **URL:** `/chefs/:id/toggle-verification`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Chef verification status toggled to true"
}
```

### Generate AI Kitchen Branding
Get AI-generated suggestions for kitchen name, slogan, and description.

- **URL:** `/chefs/kitchen-branding`
- **Method:** `POST`
- **Auth Required:** Yes (Chef role)
- **Mandatory Fields:** `cookingStyles` (Array), `signatureDish`, `story`
- **Request Body Example:**
```json
{
  "cookingStyles": ["Italian", "Mediterranean"],
  "signatureDish": "Seafood Risotto",
  "story": "I spent 10 years in coastal Italy learning traditional recipes."
}
```
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "kitchenNames": ["...", "..."],
    "slogans": ["...", "..."],
    "description": "..."
  },
  "message": "Kitchen branding generated successfully"
}
```

---

## 3. Chef Verification Module (`/verification-request`)
Submit and manage identity verification documents.

### Submit Verification Request
Upload documents for admin review. Uses Cloudinary for storage.

- **URL:** `/verification-request`
- **Method:** `POST`
- **Auth Required:** Yes (Chef role)
- **Body Type:** `multipart/form-data`
- **Mandatory Files:** 
  - `nationalIdImage` (1 front image)
  - `nationalIdBackImage` (1 back image)
  - `healthCertificateImage` (1 image)
  - `kitchenImages` (3 to 5 images)
- **Success Response:** Returns the request details with Cloudinary URLs and `pending` status.

### Get Verification Status
Check the status of your verification request.

- **URL:** `/verification-request/status`
- **Method:** `GET`
- **Auth Required:** Yes (Chef role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "pending",
    "nationalIdImage": "https://res.cloudinary.com/...",
    "nationalIdBackImage": "https://res.cloudinary.com/...",
    "healthCertificateImage": "https://res.cloudinary.com/...",
    "kitchenImages": ["...", "..."]
  },
  "message": "Verification status retrieved successfully"
}
```

### Get Pending Requests (Admin Only)
Retrieve all pending verification requests for review.

- **URL:** `/verification-request/pending`
- **Method:** `GET`
- **Auth Required:** Yes (Admin role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [ ... ],
  "message": "Pending verification requests retrieved successfully"
}
```

### Update Status (Admin Only)
Approve or fail a verification request.

- **URL:** `/verification-request/:id/status`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin role)
- **Mandatory Fields:** `status` (`pending`, `approved`, `failed`)
- **Request Body Example:**
```json
{ "status": "approved" }
```

---

## 4. Meals Module (`/meals`)
Full CRUD for managing kitchen meals.

### Get All Meals
Retrieve all meals (supports filtering via query params).

- **URL:** `/meals`
- **Method:** `GET`
- **Auth Required:** No
- **Query Params (Optional):** `chefId`, `categories`, `minPrice`, `maxPrice`

### Get Active Meals
Retrieve all active meals, optionally filtered by categories.

- **URL:** `/meals/active`
- **Method:** `GET`
- **Auth Required:** No
- **Query Params (Optional):** `categories` (comma-separated IDs)

### Get Meal By ID
Retrieve details of a specific meal.

- **URL:** `/meals/:id`
- **Method:** `GET`
- **Auth Required:** No

### Create Meal
Add a new meal to the kitchen.

- **URL:** `/meals`
- **Method:** `POST`
- **Auth Required:** Yes (Chef role)
- **Body Type:** `multipart/form-data`
- **Mandatory Fields:** `name`, `description`, `price`, `categories`, `mealImages` (1-3 files)
- **Optional Fields:** `ingredients` (JSON Array or stringified JSON)
- **Request Body Example (Multipart):**
  - `name`: "Spaghetti Carbonara"
  - `description`: "Classic Italian pasta"
  - `price`: 15.99
  - `categories`: `["categoryId1", "categoryId2"]`
  - `ingredients`: `["pasta", "eggs", "pecorino"]`
  - `mealImages`: (Files)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": { ... },
  "message": "Meal created successfully"
}
```

### Update Meal
Update an existing meal.

- **URL:** `/meals/:id`
- **Method:** `PUT`
- **Auth Required:** Yes (Chef owner only)
- **Body Type:** `multipart/form-data`
- **Optional Fields:** All creation fields.

### Delete Meal
Remove a meal from the kitchen.

- **URL:** `/meals/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (Chef owner only)

### Update Meal Status
Toggle meal visibility.

- **URL:** `/meals/:id/status`
- **Method:** `PATCH`
- **Auth Required:** Yes (Chef owner only)
- **Mandatory Fields:** `status` (`active`, `inactive`)

---

## 5. Categories Module (`/categories`)
Manage meal categories (Admin Only for modifications).

### Get Active Categories
Retrieve all active categories for public browsing.

- **URL:** `/categories/active`
- **Method:** `GET`
- **Auth Required:** No

### Get Active Categories with Random Meals
Retrieve all active categories, each including a selection of random active meals.

- **URL:** `/categories/active-with-meals`
- **Method:** `GET`
- **Auth Required:** No
- **Query Params (Optional):** `limit` (Number of random meals per category, Default: 5)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      "name": "Italian",
      "image": "...",
      "meals": [
        {
          "_id": "...",
          "name": "Pasta Carbonara",
          "price": 15,
          "chefId": { "kitchenName": "..." }
        },
        ...
      ]
    }
  ],
  "message": "Active categories with random meals retrieved successfully"
}
```

### Get All Categories (Admin Only)
Retrieve all categories (active and inactive).

- **URL:** `/categories`
- **Method:** `GET`
- **Auth Required:** Yes (Admin role)

### Get Category By ID (Admin Only)
Retrieve a specific category.

- **URL:** `/categories/:id`
- **Method:** `GET`
- **Auth Required:** Yes (Admin role)

### Create Category (Admin Only)
Add a new category.

- **URL:** `/categories`
- **Method:** `POST`
- **Auth Required:** Yes (Admin role)
- **Body Type:** `multipart/form-data`
- **Mandatory Fields:** `name`, `image` (1 file)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": { ... },
  "message": "Category created successfully"
}
```

### Update Category (Admin Only)
Update an existing category.

- **URL:** `/categories/:id`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin role)
- **Body Type:** `multipart/form-data`
- **Optional Fields:** `name`, `image`

### Delete Category (Admin Only)
Remove a category.

- **URL:** `/categories/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (Admin role)

### Update Category Status (Admin Only)
Change visibility of a category.

- **URL:** `/categories/:id/status`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin role)
- **Mandatory Fields:** `status` (`active`, `inactive`)

---

## 6. Cart Module (`/cart`)
Manage customer shopping cart.

### Get Current Cart
Retrieve the items in the customer's cart.

- **URL:** `/cart`
- **Method:** `GET`
- **Auth Required:** Yes (Customer role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "...",
    "customerId": "...",
    "items": [
      {
        "mealId": {
          "_id": "...",
          "name": "...",
          "price": 10,
          "chefId": { ... }
        },
        "quantity": 2
      }
    ]
  },
  "message": "Cart retrieved successfully"
}
```

### Add Item to Cart
Add a meal to the cart. If the meal is already in the cart, its quantity is increased.

- **URL:** `/cart/items`
- **Method:** `POST`
- **Auth Required:** Yes (Customer role)
- **Mandatory Fields:** `mealId`
- **Optional Fields:** `quantity` (Default: 1)
- **Request Body Example:**
```json
{
  "mealId": "mealId123",
  "quantity": 2
}
```

### Update Item Quantity
Update the quantity of a meal already in the cart.

- **URL:** `/cart/items/:mealId`
- **Method:** `PATCH`
- **Auth Required:** Yes (Customer role)
- **Mandatory Fields:** `quantity`
- **Request Body Example:**
```json
{
  "quantity": 5
}
```

### Remove Item from Cart
Remove a specific meal from the cart.

- **URL:** `/cart/items/:mealId`
- **Method:** `DELETE`
- **Auth Required:** Yes (Customer role)

### Clear Cart
Remove all items from the cart.

- **URL:** `/cart`
- **Method:** `DELETE`
- **Auth Required:** Yes (Customer role)

---

## 7. Orders Module (`/orders`)
Manage customer orders and checkout.

### Checkout
Create an order from the current cart items.

- **URL:** `/orders/checkout`
- **Method:** `POST`
- **Auth Required:** Yes (Customer role)
- **Mandatory Fields:** `paymentMethod` (`cash`, `paymob`)
- **Optional Fields:** `shippingAddress`, `contactPhone` (Uses profile defaults if not provided)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "order": {
      "_id": "...",
      "customerId": "...",
      "items": [...],
      "totalAmount": 31.98,
      "status": "awaiting_payment",
      "shippingAddress": "...",
      "contactPhone": "..."
    },
    "payment": {
      "_id": "...",
      "paymentMethod": "paymob",
      "paymentStatus": "pending"
    },
    "paymobUrl": "https://accept.paymob.com/..." (Only if paymentMethod is paymob)
  },
  "message": "Order placed successfully"
}
```

### Get My Orders
Retrieve all orders for the authenticated customer. Includes full item snapshots and statuses.

- **URL:** `/orders/my-orders`
- **Method:** `GET`
- **Auth Required:** Yes (Customer role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      "items": [
        {
          "name": "Spaghetti Carbonara",
          "description": "Classic Italian pasta",
          "image": "https://res.cloudinary.com/...",
          "unitPrice": 15.99,
          "quantity": 2,
          "subtotal": 31.98,
          "status": "preparing"
        }
      ],
      "totalAmount": 31.98,
      "status": "preparing",
      "createdAt": "..."
    }
  ],
  "message": "Orders retrieved successfully"
}
```

### Get Chef Orders
Retrieve all orders containing items from the authenticated chef. Only items belonging to the chef are returned.

- **URL:** `/orders/chef/orders`
- **Method:** `GET`
- **Auth Required:** Yes (Chef role)

### Get Order Details
Retrieve details of a specific order.

- **URL:** `/orders/:id`
- **Method:** `GET`
- **Auth Required:** Yes (Relevant Customer, Chef, or Admin)

### Update Order Status
Change the status of an order.

- **URL:** `/orders/:id/status`
- **Method:** `PATCH`
- **Auth Required:** Yes (Chef or Admin role)
- **Mandatory Fields:** `status` (`awaiting_payment`, `preparing`, `out_for_delivery`, `completed`)

### Update Order Item Status
Change the status of a specific item in an order.

- **URL:** `/orders/:id/items/status`
- **Method:** `PATCH`
- **Auth Required:** Yes (Chef role)
- **Mandatory Fields:** `mealId`, `status` (`preparing`, `ready`, `delivered`)

---

## 8. Settlement Module (`/settlement`)
Financial features for chefs to track earnings and wallet.

### Get Chef Wallet
Retrieve the current balance of the chef.

- **URL:** `/settlement/wallet`
- **Method:** `GET`
- **Auth Required:** Yes (Chef role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "chefId": "...",
    "availableBalance": 150.50
  },
  "message": "Wallet retrieved successfully"
}
```

### Get Earnings History
Retrieve all earnings records for the chef.

- **URL:** `/settlement/earnings`
- **Method:** `GET`
- **Auth Required:** Yes (Chef role)

---

## 9. Withdrawals Module (`/withdrawals`)
Manage payout requests for chefs.

### Request Withdrawal
Submit a request to withdraw funds from the wallet.

- **URL:** `/withdrawals/request`
- **Method:** `POST`
- **Auth Required:** Yes (Chef role)
- **Mandatory Fields:** `amount`
- **Optional Fields:** `notes`

### Get Withdrawal History (Chef)
Retrieve personal withdrawal history.

- **URL:** `/withdrawals/history`
- **Method:** `GET`
- **Auth Required:** Yes (Chef role)

### Get All Withdrawal Requests (Admin Only)
List all withdrawal requests.

- **URL:** `/withdrawals/requests`
- **Method:** `GET`
- **Auth Required:** Yes (Admin role)
- **Query Params (Optional):** `status` (`pending`, `approved`, `rejected`, `completed`)

### Approve Withdrawal (Admin Only)
Approve a withdrawal request and deduct funds from the chef's wallet.

- **URL:** `/withdrawals/:id/approve`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin role)
- **Optional Fields:** `notes`

### Reject Withdrawal (Admin Only)
Reject a withdrawal request.

- **URL:** `/withdrawals/:id/reject`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin role)
- **Optional Fields:** `notes`

---

## 10. Payments Module (`/payments`)
Payment-related webhooks and integrations.

### Paymob Webhook
Automated callback for Paymob transaction confirmation.

- **URL:** `/payments/paymob/webhook`
- **Method:** `POST`
- **Auth Required:** No (External)
- **Description:** This endpoint is called by Paymob to confirm successful transactions. It automatically updates the payment status and order state.

---

## 11. Reviews Module (`/reviews`)
Manage customer reviews for meals.

### Add Review
Submit a review for a meal.

- **URL:** `/reviews`
- **Method:** `POST`
- **Auth Required:** Yes (Customer role)
- **Mandatory Fields:** `mealId`, `rating` (1-5), `comment`
- **Request Body Example:**
```json
{
  "mealId": "mealId123",
  "rating": 5,
  "comment": "Delicious food! Highly recommended."
}
```
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "_id": "...",
    "customerId": "...",
    "mealId": "...",
    "chefId": "...",
    "rating": 5,
    "comment": "Delicious food! Highly recommended.",
    "createdAt": "..."
  },
  "message": "Review added successfully"
}
```

---

## 12. User Module (`/users`)
Manage user accounts and status (Admin Only for modifications).

### Toggle Customer Block Status (Admin Only)
Toggle the block status of a customer. When a customer is blocked, they will be unable to log in or access protected routes.

- **URL:** `/users/customers/:id/toggle-block`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "...",
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "isBlocked": 1,
    "status": "blocked",
    ...
  },
  "message": "Customer blocked successfully"
}
```

---

## Common Error Responses

### 400 Bad Request
Missing fields or validation error.
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Missing required fields",
  "errors": [...]
}
```

### 401 Unauthorized
Invalid or missing token.
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Not authorized, token missing"
}
```

### 403 Forbidden
Role mismatch or ownership violation.
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Access denied"
}
```

### 404 Not Found
Resource does not exist.
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
Unexpected server error.
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Something went wrong"
}
```
