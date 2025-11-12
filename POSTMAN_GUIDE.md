# Postman Collection Guide - Appointment System API

## 📋 Overview

This guide helps you set up and use the Postman collection for testing the Appointment System API endpoints.

## 🚀 Quick Setup

### 1. Import Files
1. Open Postman
2. Click **Import** button
3. Import both files:
   - `postman_collection.json` - API endpoints
   - `postman_environment.json` - Environment variables

### 2. Set Environment
1. Select **"Appointment System Environment"** from the environment dropdown
2. Update the `baseUrl` if your server runs on a different port

## 🔐 Authentication Flow

### Step 1: Register & Login Admin
1. **Register Admin** - Create an admin account
2. **Login Admin** - Get admin token
3. Copy the token from response and set it in environment variable `adminToken`

### Step 2: Register & Login Customer
1. **Register Customer** - Create a customer account
2. **Login Customer** - Get customer token
3. Copy the token from response and set it in environment variable `customerToken`

## 📁 Collection Structure

### 1. **Customer Management**
- `POST /customers/register` - Register new customer
- `POST /customers/login` - Customer login
- `GET /customers/profile` - Get customer profile (requires customer token)
- `PUT /customers/profile` - Update customer profile (requires customer token)
- `GET /customers` - Get all customers (admin only)

### 2. **Admin Management**
- `POST /admins/register` - Register new admin
- `POST /admins/login` - Admin login
- `GET /admins/profile` - Get admin profile (requires admin token)
- `PUT /admins/profile` - Update admin profile (requires admin token)
- `GET /admins` - Get all admins (admin only)
- `DELETE /admins/:id` - Delete admin (admin only)

### 3. **Appointment Management**
- `POST /appointments` - Create appointment (admin only)
- `GET /appointments` - Get all appointments
- `GET /appointments/:id` - Get appointment by ID
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Delete appointment

### 4. **Service Management**
- `POST /services` - Create service (admin only)
- `GET /services` - Get all services
- `GET /services/:id` - Get service by ID
- `PUT /services/:id` - Update service (admin only)
- `DELETE /services/:id` - Delete service (admin only)

### 5. **Order Management**
- `POST /orders` - Create order with file upload (customer only)
- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order by ID
- `PUT /orders/:id` - Update order with file upload
- `DELETE /orders/:id` - Delete order

### 6. **Package Management**
- `POST /packages` - Create package (admin only)
- `GET /packages` - Get all packages
- `GET /packages/:id` - Get package by ID
- `PUT /packages/:id` - Update package (admin only)
- `DELETE /packages/:id` - Delete package (admin only)

### 7. **Payment Management**
- `POST /payments` - Create payment
- `GET /payments` - Get all payments
- `GET /payments/:id` - Get payment by ID
- `PUT /payments/:id` - Update payment status

### 8. **Reservation Management**
- `POST /reservations` - Create reservation
- `GET /reservations` - Get all reservations
- `GET /reservations/:packageId/:orderId` - Get reservation by composite key
- `PUT /reservations/:packageId/:orderId` - Update reservation
- `DELETE /reservations/:packageId/:orderId` - Delete reservation

### 9. **SMS Management**
- `POST /sms/send` - Send SMS (admin only)
- `GET /sms` - Get all SMS messages
- `GET /sms/:id` - Get SMS by ID
- `PUT /sms/:id` - Update SMS (admin only)
- `DELETE /sms/:id` - Delete SMS (admin only)

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:5000/api` |
| `customerToken` | Customer JWT token | `eyJhbGciOiJIUzI1NiIs...` |
| `adminToken` | Admin JWT token | `eyJhbGciOiJIUzI1NiIs...` |
| `customerId` | Sample customer ID | `1` |
| `adminId` | Sample admin ID | `1` |
| `serviceId` | Sample service ID | `1` |
| `orderId` | Sample order ID | `1` |
| `packageId` | Sample package ID | `1` |

## 📝 Sample Data

### Customer Registration
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123",
  "address": "123 Main St, City"
}
```

### Admin Registration
```json
{
  "name": "Admin User",
  "userName": "admin123",
  "password": "admin123"
}
```

### Service Creation
```json
{
  "type": "perDate",
  "costPerDate": 100.50,
  "costPerService": 50.00,
  "description": "Medical consultation service",
  "startDate": "2024-01-01",
  "dateCount": 30
}
```

### Appointment Creation
```json
{
  "customerId": 1,
  "dateTime": "2024-12-01T10:00:00Z",
  "hospitalName": "City Hospital"
}
```

## 🔍 Testing Tips

### 1. **Authentication Required**
- Most endpoints require either customer or admin authentication
- Always set the appropriate token in the environment variables
- Tokens expire based on JWT configuration (default: 7 days)

### 2. **File Upload (Orders)**
- Order creation and update support file uploads
- Use form-data format for file uploads
- Select a file in the `file` field

### 3. **Query Parameters**
- Most GET endpoints support pagination: `?page=1&limit=10`
- Search functionality: `?search=keyword`
- Status filtering: `?status=pending`

### 4. **Error Handling**
- API returns structured error responses
- Check response status codes and error messages
- Validation errors include field-specific messages

### 5. **Composite Keys (Reservations)**
- Reservations use composite keys (packageId + orderId)
- URLs format: `/reservations/:packageId/:orderId`

## 🚨 Common Issues

1. **401 Unauthorized**: Check if token is set and valid
2. **403 Forbidden**: User doesn't have required permissions
3. **404 Not Found**: Resource doesn't exist or wrong ID
4. **422 Validation Error**: Check request body format and required fields
5. **500 Server Error**: Check server logs and database connection

## 📊 Testing Workflow

### Recommended Testing Order:
1. Register Admin → Login Admin
2. Register Customer → Login Customer
3. Create Service (admin)
4. Create Package (admin)
5. Create Appointment (customer)
6. Create Order (customer)
7. Create Payment
8. Create Reservation
9. Send SMS (admin)

## 🔄 Environment Setup for Different Stages

### Development
```
baseUrl: http://localhost:5000/api
```

### Staging
```
baseUrl: https://staging-api.yourapp.com/api
```

### Production
```
baseUrl: https://api.yourapp.com/api
```

## 📞 Support

If you encounter issues:
1. Check server logs
2. Verify database connection
3. Ensure all required environment variables are set
4. Check API documentation for field requirements
