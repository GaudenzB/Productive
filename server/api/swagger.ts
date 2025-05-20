import swaggerJsdoc from 'swagger-jsdoc';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ProductiTask API',
    version: '1.0.0',
    description: 'API documentation for the ProductiTask application',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'ProductiTask Support',
      url: 'https://productitask.example.com',
      email: 'support@productitask.example.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['error'],
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'An error occurred',
          },
          code: {
            type: 'string',
            example: 'INTERNAL_SERVER_ERROR',
          },
          path: {
            type: 'string',
            example: '/api/tasks',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-20T12:34:56.789Z',
          },
          requestId: {
            type: 'string',
            example: 'req-123456789',
          },
        },
        required: ['status', 'message'],
      },
      ValidationError: {
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              errors: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                },
                example: {
                  title: 'Title is required',
                  priority: 'Invalid priority value',
                },
              },
            },
            required: ['errors'],
          },
        ],
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          username: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
            format: 'password',
          },
        },
        required: ['email', 'password'],
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          username: {
            type: 'string',
            minLength: 3,
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
          },
        },
        required: ['email', 'username', 'password'],
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentication is required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Authentication required',
              code: 'UNAUTHORIZED',
            },
          },
        },
      },
      Forbidden: {
        description: 'User does not have permission to access this resource',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'You do not have permission to access this resource',
              code: 'FORBIDDEN',
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Resource not found',
              code: 'NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationError',
            },
            example: {
              status: 'error',
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              errors: {
                title: 'Title is required',
                priority: 'Invalid priority value',
              },
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'An unexpected error occurred',
              code: 'INTERNAL_SERVER_ERROR',
            },
          },
        },
      },
    },
  },
  security: [
    {
      cookieAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./server/api/**/*.yaml', './server/api/**/*.ts'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;