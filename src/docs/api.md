# Cloud Kitchen API Documentation

Welcome to the Cloud Kitchen Backend API documentation. This project provides a comprehensive set of APIs for managing chefs, customers, meals, categories, and AI-powered kitchen branding.

## Base URL
`http://localhost:3000/api`

---

## 1. Authentication Module (`/auth`)
Handles user registration, login, and session retrieval.

### Register User
Create a new account (Chef, Customer, or Admin). Public registration for the `delivery` role is disabled.

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
Authenticate and receive a JWT token. Delivery users must use this endpoint with `role: "delivery"`.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth Required:** No
- **Mandatory Fields:** `email`, `password`, `role`
- **Request Body Example:**
```json
{
  "email": "delivery@example.com",
  "password": "password123",
  "role": "delivery"
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

### Toggle Block Status (Admin Only)
Toggle the block status of a chef.

- **URL:** `/chefs/:id/toggle-block`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Chef blocked successfully"
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
Create an order from the current cart items. An OTP is automatically generated for the order.

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
      "contactPhone": "...",
      "otp": "123456"
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
- **Mandatory Fields:** `status` (`awaiting_payment`, `preparing`, `out_for_delivery`, `delivered`, `completed`)

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
- **Mandatory Fields:** `amount` - The amount to withdraw.
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

### Get All Customers (Admin Only)
Retrieve a list of all registered customers.

- **URL:** `/users/customers`
- **Method:** `GET`
- **Auth Required:** Yes (Admin role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      "firstName": "...",
      "lastName": "...",
      "email": "...",
      "isBlocked": 0,
      "status": "active"
    }
  ],
  "message": "All customers retrieved successfully"
}
```

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
    "isBlocked": 1,
    "status": "blocked"
  },
  "message": "Customer blocked successfully"
}
```

### Create Delivery User (Admin Only)
Create a new delivery personnel account. Public registration for this role is disabled.

- **URL:** `/users/delivery`
- **Method:** `POST`
- **Auth Required:** Yes (Admin role)
- **Mandatory Fields:** `email`, `password`, `phone`, `firstName`, `lastName`
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": { ... },
  "message": "Delivery user created successfully"
}
```

### Get All Delivery Users (Admin Only)
Retrieve a list of all registered delivery personnel.

- **URL:** `/users/delivery`
- **Method:** `GET`
- **Auth Required:** Yes (Admin role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      "firstName": "...",
      "lastName": "...",
      "email": "...",
      "phone": "...",
      "isFree": true,
      "status": "active"
    }
  ],
  "message": "All delivery personnel retrieved successfully"
}
```

### Delete Delivery User (Admin Only)
Remove a delivery personnel account from the system.

- **URL:** `/users/delivery/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (Admin role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Delivery user deleted successfully"
}
```

---

## 13. Contact Module (`/contact`)
Submit and manage support inquiries and feedback.

### Submit Contact Message
Submit a new inquiry. Automatically captures the sender's ID and role from the authentication token.

- **URL:** `/contact`
- **Method:** `POST`
- **Auth Required:** Yes (Chef or Customer role)
- **Mandatory Fields:** `fullName`, `email`, `subject`, `message`
- **Request Body Example:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "subject": "Question about orders",
  "message": "Hello, I have a question regarding my recent order..."
}
```
- **Success Response:** Returns the created message with `pending` status.

### Get All Messages (Admin Only)
Retrieve all contact messages, sorted with pending messages first.

- **URL:** `/contact`
- **Method:** `GET`
- **Auth Required:** Yes (Admin role)

### Mark Message as Finished (Admin Only)
Update the status of a contact message to `finished`.

- **URL:** `/contact/:id/status`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "finished"
  },
  "message": "Contact message marked as finished"
}
```

---

## 14. Meal Planning Module (`/meal-planning`)
AI-powered meal planning based on user preferences and history.

### Generate 7-Day Meal Plan
Creates a personalized 7-day meal plan based on budget, daily meal frequency, favorite categories, and allergies. The AI analyzes previous orders to learn preferences.

- **URL:** `/meal-planning/generate`
- **Method:** `POST`
- **Auth Required:** Yes (Customer role)
- **Mandatory Fields:** `weeklyBudget`, `mealsPerDay`, `favoriteCategories` (Array of IDs)
- **Optional Fields:** `allergies` (Array of strings)
- **Request Body Example:**
```json
{
  "weeklyBudget": 1000,
  "mealsPerDay": 3,
  "favoriteCategories": ["cat_id_1", "cat_id_2"],
  "allergies": ["peanut", "dairy"]
}
```
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "2026-06-14": {
      "meal1": [ { ... } ],
      "meal2": [ { ... } ],
      "meal3": [ { ... } ]
    }
  },
  "message": "Meal plan generated successfully"
}
```

---

## 15. Delivery Module (`/delivery`)
APIs for delivery personnel to manage assignments.

### Get Current Order
Retrieve the active order assigned to the authenticated delivery person.

- **URL:** `/delivery/current-order`
- **Method:** `GET`
- **Auth Required:** Yes (Delivery role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "...",
    "customerId": { ... },
    "items": [ ... ],
    "totalAmount": 100,
    "status": "out_for_delivery",
    "shippingAddress": "...",
    "contactPhone": "..."
  },
  "message": "Current order retrieved successfully"
}
```

### Get Order History
Retrieve a list of all completed orders assigned to the delivery person.

- **URL:** `/delivery/history`
- **Method:** `GET`
- **Auth Required:** Yes (Delivery role)

### Complete Order
Mark an assigned order as completed. This action triggers chef earnings distribution, applies platform commissions, and releases the delivery person. **Customer must provide the order OTP to the delivery person.**

- **URL:** `/delivery/orders/:orderId/complete`
- **Method:** `POST`
- **Auth Required:** Yes (Delivery role)
- **Mandatory Fields:** `otp` (6-digit code from the customer)
- **Request Body Example:**
```json
{
  "otp": "123456"
}
```
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Order marked as completed successfully"
}
```

---

## 16. Admin Delivery Management Module (`/admin`)
APIs for administrators to manage delivery assignments manually.

### Get Delivery Management Data
Retrieve a list of free delivery personnel and unassigned orders.

- **URL:** `/admin/delivery-management`
- **Method:** `GET`
- **Auth Required:** Yes (Admin role)
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "freeDeliveryPersonnel": [ ... ],
    "unassignedOrders": [ ... ]
  },
  "message": "Delivery management data retrieved successfully"
}
```

### Assign Delivery Person
Manually assign a specific delivery person to an unassigned order. This action sends notification emails to both the delivery person and the customer (including the OTP).

- **URL:** `/admin/assign-delivery`
- **Method:** `POST`
- **Auth Required:** Yes (Admin role)
- **Mandatory Fields:** `orderId`, `deliveryId`
- **Request Body Example:**
```json
{
  "orderId": "orderId123",
  "deliveryId": "deliveryId123"
}
```
- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Order assigned to delivery person successfully"
}
```

---

## 17. Notifications Module (`/notifications`)
Durable in-app notifications for admin and chef accounts. Notifications are typed,
prioritized, deduplicated per recipient, and automatically expire after 90 days.

### Notification Events

- **Admin:** chef verification submissions, contact messages/complaints, and withdrawal requests.
- **Chef:** new paid or cash orders, meal reviews, verification/account status changes, and withdrawal decisions.

### List Notifications

- **URL:** `/notifications`
- **Method:** `GET`
- **Auth Required:** Yes (Admin or Chef role)
- **Query Params (Optional):** `page`, `limit` (maximum 100), `unread=true`, `type`

### Get Unread Count

- **URL:** `/notifications/unread-count`
- **Method:** `GET`
- **Auth Required:** Yes (Admin or Chef role)

### Mark One Notification as Read

- **URL:** `/notifications/:id/read`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin or Chef role; notification owner only)

### Mark All Notifications as Read

- **URL:** `/notifications/read-all`
- **Method:** `PATCH`
- **Auth Required:** Yes (Admin or Chef role)

### Delete Notification

- **URL:** `/notifications/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (Admin or Chef role; notification owner only)

### Notification Shape

```json
{
  "_id": "...",
  "type": "chef.order.requested",
  "priority": "urgent",
  "title": "New customer order",
  "body": "You received 2 meal requests worth 350 EGP.",
  "actionPath": "/chef/orders/...",
  "entityType": "Order",
  "entityId": "...",
  "metadata": {},
  "readAt": null,
  "createdAt": "..."
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
