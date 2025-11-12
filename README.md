# Appointment System Backend

A comprehensive backend API for appointment management system with customer management, admin panel, service booking, order processing, payment handling, reservations, and SMS notifications.

## Features

- **Customer Management**: Registration, authentication, profile management
- **Admin Panel**: Multi-role admin system with permissions
- **Service Management**: Create and manage bookable services
- **Package System**: Service packages with discounts
- **Appointment Booking**: Full appointment lifecycle management
- **Order Processing**: Handle service and package orders
- **Payment Integration**: Stripe payment processing
- **Reservation System**: Resource reservation management
- **SMS Notifications**: Twilio integration for SMS alerts
- **File Upload**: Image upload for profiles and services
- **Security**: JWT authentication, rate limiting, input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **SMS Service**: Twilio
- **Payment**: Stripe
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
appointment/
├── config/                 # Database configuration
├── controllers/           # Business logic handlers
├── middleware/           # Custom middleware (auth, upload)
├── models/              # Database models and associations
├── routes/              # API route definitions
├── utils/               # Utility functions (SMS, email)
├── uploads/             # File upload directory
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
├── index.js            # Application entry point
├── package.json        # Dependencies and scripts
└── README.md           # Project documentation
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd appointment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env` file and update with your configuration:
   ```bash
   # Database Configuration
   DB_NAME=appointment_system
   DB_USER=root
   DB_PASS=your_password
   DB_HOST=localhost
   DB_PORT=3306

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # SMS Configuration (Twilio)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Payment Configuration (Stripe)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Set up database**
   - Create MySQL database named `appointment_system`
   - The application will automatically create tables on first run

5. **Start the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/customers/register` - Customer registration
- `POST /api/customers/login` - Customer login
- `POST /api/admins/register` - Admin registration
- `POST /api/admins/login` - Admin login

### Customer Management
- `GET /api/customers/profile` - Get customer profile
- `PUT /api/customers/profile` - Update customer profile
- `GET /api/customers` - Get all customers (Admin only)

### Admin Management
- `GET /api/admins/profile` - Get admin profile
- `PUT /api/admins/profile` - Update admin profile
- `GET /api/admins` - Get all admins (Super Admin only)

### Service Management
- `POST /api/services` - Create service (Admin only)
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `PUT /api/services/:id` - Update service (Admin only)
- `DELETE /api/services/:id` - Delete service (Admin only)

### Package Management
- `POST /api/packages` - Create package (Admin only)
- `GET /api/packages` - Get all packages
- `GET /api/packages/:id` - Get package by ID
- `PUT /api/packages/:id` - Update package (Admin only)
- `DELETE /api/packages/:id` - Delete package (Admin only)

### Appointment Management
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Order Management
- `POST /api/orders` - Create order
- `GET /api/orders` - Get orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order

### Payment Management
- `POST /api/payments` - Process payment
- `GET /api/payments` - Get payments
- `GET /api/payments/:id` - Get payment by ID

### Reservation Management
- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - Get reservations
- `GET /api/reservations/:id` - Get reservation by ID
- `PUT /api/reservations/:id` - Update reservation

### SMS Management
- `POST /api/sms/send` - Send SMS
- `GET /api/sms` - Get SMS history
- `GET /api/sms/:id/status` - Get SMS status

## Database Models

### Core Models
- **Customer**: Customer information and authentication
- **Admin**: Admin users with roles and permissions
- **Service**: Bookable services with pricing and duration
- **Package**: Service packages with discounts
- **Appointment**: Appointment bookings with status tracking
- **Order**: Service and package orders
- **Payment**: Payment processing and tracking
- **Reservation**: Resource reservations
- **SMS**: SMS message tracking and delivery status

### Model Relationships
- Customer → Appointments, Orders, Payments, Reservations, SMS
- Admin → Services, Packages, Appointments (managed)
- Service → Appointments, Orders, Packages (many-to-many)
- Package → Orders, Services (many-to-many)
- Appointment → Customer, Service, Admin, Payment, Reservation
- Order → Customer, Service/Package, Payment
- Payment → Customer, Appointment/Order
- Reservation → Customer, Appointment
- SMS → Customer

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Express Validator for request validation
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **File Upload Security**: File type and size validation

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

### Code Style
- ESLint configuration for code quality
- Prettier for code formatting
- Consistent naming conventions

## Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production database
   - Set up SSL certificates
   - Configure reverse proxy (Nginx)

2. **Database Migration**
   - Run database sync: `sequelize.sync()`
   - Create initial admin user
   - Set up database backups

3. **Process Management**
   - Use PM2 for process management
   - Set up monitoring and logging
   - Configure auto-restart on failure

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
