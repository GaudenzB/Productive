import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

/**
 * Set up API documentation and versioning for the application
 */
export function setupApiDocumentation(app: Express): void {
  // Serve the Swagger UI for API documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'alpha',
    },
  }));
  
  // Serve the raw OpenAPI specs in JSON format
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Redirect root API path to documentation
  app.get('/api', (req, res) => {
    res.redirect('/api/docs');
  });

  // Log API documentation URL
  console.log(`🔗 API Documentation available at: /api/docs`);
}

/**
 * Setup API versioning middleware
 * This adds support for version headers and path-based versioning
 */
export function setupApiVersioning(app: Express): void {
  // API version middleware
  app.use('/api', (req, res, next) => {
    // Get API version from various sources (in order of precedence)
    const versionFromPath = req.path.match(/^\/v(\d+)\//); // e.g., /api/v1/tasks
    const versionFromHeader = req.headers['accept-version'];
    const versionFromQuery = req.query.version;
    
    // Set the API version
    let apiVersion = '1'; // Default version
    
    if (versionFromPath && versionFromPath[1]) {
      apiVersion = versionFromPath[1];
    } else if (versionFromHeader) {
      apiVersion = String(versionFromHeader);
    } else if (versionFromQuery) {
      apiVersion = String(versionFromQuery);
    }
    
    // Attach API version to the request for handlers to use
    req.apiVersion = apiVersion;
    
    // Add version to response headers for API introspection
    res.setHeader('X-API-Version', apiVersion);
    
    next();
  });
}

// Declaration merging to add apiVersion to Express Request
declare global {
  namespace Express {
    interface Request {
      apiVersion: string;
    }
  }
}