import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { env } from './env';
import { version } from '../../../package.json';

// Define base Swagger options
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ProductiTask API',
      version,
      description: 'API documentation for the ProductiTask productivity application',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: env.NODE_ENV === 'production' 
          ? 'https://api.productitask.example.com' 
          : `http://localhost:${env.PORT}`,
        description: env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
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
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'integer',
                  example: 400,
                },
                message: {
                  type: 'string',
                  example: 'Bad Request',
                },
                details: {
                  type: 'object',
                  example: {
                    field: 'email',
                    issue: 'Invalid email format',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found - Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ServerError: {
          description: 'Server Error - Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
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
    tags: [
      { name: 'Auth', description: 'Authentication operations' },
      { name: 'Users', description: 'User operations' },
      { name: 'Tasks', description: 'Task management operations' },
      { name: 'Projects', description: 'Project management operations' },
      { name: 'Meetings', description: 'Meeting management operations' },
      { name: 'Notes', description: 'Note management operations' },
      { name: 'Tags', description: 'Tag management operations' },
    ],
  },
  // Paths to files containing OpenAPI annotations
  apis: [
    './server/src/**/*.ts',
    './shared/schema.ts',
  ],
};

// Generate Swagger specification
const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Configure Swagger UI for the Express application
 */
export function setupSwagger(app: Express): void {
  // Serve Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  }));

  // Endpoint to get the raw Swagger specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`Swagger documentation available at http://localhost:${env.PORT}/api-docs`);
}