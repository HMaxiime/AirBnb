import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

// Central OpenAPI definition shared by the interactive UI and the JSON spec endpoint.
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airbnb Clone API",
      version: "1.0.0",
      description: "Full-featured REST API for property listings, bookings, users, and authentication with JWT and role-based access control",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Development server",
      },
      {
        url: "https://airbnb-app-pf2j.onrender.com/api/v1",
        description: "Production server",
      }
    ],
    components: {
      // Define the Bearer token security scheme
      // This adds an "Authorize" button to the Swagger UI
      // where you can paste your JWT token once and it's sent with all requests
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /auth/register or /auth/login. Click Authorize to add your token.",
        },
      },
      // Define reusable schemas for all models
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            phone: { type: "string", example: "+1234567890" },
            username: { type: "string", example: "johndoe" },
            role: { type: "string", enum: ["GUEST", "HOST", "ADMIN"], example: "GUEST" },
            avatar: { type: "string", format: "uri", example: "https://res.cloudinary.com/..." },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        UserInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 2, example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            phone: { type: "string", example: "+1234567890" },
            username: { type: "string", example: "johndoe" },
            password: { type: "string", minLength: 8, example: "SecurePass123" },
            role: { type: "string", enum: ["GUEST", "HOST", "ADMIN"], example: "GUEST" },
          },
        },
        Listing: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Cozy Apartment in Downtown" },
            description: { type: "string", example: "A nice and cozy apartment located in the heart of the city." },
            location: { type: "string", example: "New York, NY" },
            price: { type: "number", example: 100.00 },
            guests: { type: "integer", example: 4 },
            type: { type: "string", enum: ["APARTMENT", "HOUSE", "ROOM", "OTHER"], example: "APARTMENT" },
            amenities: { type: "array", items: { type: "string" }, example: ["WiFi", "Kitchen", "Pool"] },
            host: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "John Doe" },
                email: { type: "string", format: "email", example: "john.doe@example.com" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ListingInput: {
          type: "object",
          required: ["title", "description", "location", "price", "guests", "type", "amenities"],
          properties: {
            title: { type: "string", minLength: 5, example: "Cozy Apartment in Downtown" },
            description: { type: "string", minLength: 10, example: "A nice and cozy apartment located in the heart of the city." },
            location: { type: "string", example: "New York, NY" },
            price: { type: "number", minimum: 0.01, example: 100.00 },
            guests: { type: "integer", minimum: 1, example: 4 },
            type: { type: "string", enum: ["APARTMENT", "HOUSE", "ROOM", "OTHER"], example: "APARTMENT" },
            amenities: { type: "array", items: { type: "string" }, example: ["WiFi", "Kitchen", "Pool"] },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            listingId: { type: "integer", example: 1 },
            guestId: { type: "integer", example: 2 },
            checkIn: { type: "string", format: "date-time", example: "2026-06-01T00:00:00Z" },
            checkOut: { type: "string", format: "date-time", example: "2026-06-05T00:00:00Z" },
            totalPrice: { type: "number", example: 500.00 },
            status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED"], example: "PENDING" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        BookingInput: {
          type: "object",
          required: ["listingId", "checkIn", "checkOut", "totalPrice"],
          properties: {
            listingId: { type: "integer", example: 1 },
            checkIn: { type: "string", format: "date-time", example: "2026-06-01T00:00:00Z" },
            checkOut: { type: "string", format: "date-time", example: "2026-06-05T00:00:00Z" },
            totalPrice: { type: "number", minimum: 0.01, example: 500.00 },
          },
        },
      },
    },
  },
  // Tell swagger-jsdoc where to find the JSDoc comments
  // It scans these files for @swagger annotations
  apis: ["./src/routes/v1/*.ts"],};

// Generate the OpenAPI document once at startup.
const swaggerSpec = swaggerJsdoc(options);

// Mount the docs routes on an Express app.
export function setupSwagger(app: Express) {
  // Serve the interactive Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Also expose the raw OpenAPI JSON spec
  // Useful for importing into Postman or generating client SDKs
  app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec);
  });

  console.log("Swagger docs available at http://localhost:3000/api-docs");
}