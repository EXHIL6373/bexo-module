export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'BEXO College Admin Backend API',
    version: '1.0.0',
    description: 'Production-ready REST API for BEXO College Admin Control Panel with multi-tenant isolation, role-based authorization, and student provisioning lifecycle.',
    contact: {
      name: 'BEXO Enterprise Engineering',
      email: 'engineering@atbexo.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Gateway',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      StandardSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
            },
          },
        },
      },
      StandardError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'integer', example: 403 },
          message: { type: 'string', example: 'Access forbidden: Tenant isolation boundary active.' },
          errors: { type: 'object' },
        },
      },
    },
  },
  paths: {
    '/auth/college-login': {
      post: {
        summary: 'Authenticate college administrator or staff',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authenticated successfully' },
          '401': { description: 'Invalid credentials' },
          '403': { description: 'Corporate admin redirected or institution suspended' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Fetch active user and college profile',
        security: [{ bearerAuth: [] }],
        tags: ['Authentication'],
        responses: { '200': { description: 'Active identity' } },
      },
    },
    '/college/profile': {
      get: {
        summary: 'Fetch authenticated college profile and quota details',
        security: [{ bearerAuth: [] }],
        tags: ['College Profile'],
        responses: { '200': { description: 'Institutional profile' } },
      },
    },
    '/college/students': {
      get: {
        summary: 'List students belonging to authenticated college',
        security: [{ bearerAuth: [] }],
        tags: ['Students'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'department', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Student roster' } },
      },
      post: {
        summary: 'Enroll a single student',
        security: [{ bearerAuth: [] }],
        tags: ['Students'],
        responses: { '201': { description: 'Student enrolled' } },
      },
    },
    '/college/provisioning/jobs': {
      get: {
        summary: 'List provisioning batches',
        security: [{ bearerAuth: [] }],
        tags: ['Provisioning'],
        responses: { '200': { description: 'Provisioning jobs' } },
      },
      post: {
        summary: 'Trigger batch service provisioning',
        security: [{ bearerAuth: [] }],
        tags: ['Provisioning'],
        responses: { '201': { description: 'Job executed' } },
      },
    },
    '/college/staff': {
      get: {
        summary: 'List institutional staff members',
        security: [{ bearerAuth: [] }],
        tags: ['Staff'],
        responses: { '200': { description: 'Staff list' } },
      },
    },
    '/college/requests': {
      get: {
        summary: 'List institutional operational requests',
        security: [{ bearerAuth: [] }],
        tags: ['Requests'],
        responses: { '200': { description: 'Requests list' } },
      },
      post: {
        summary: 'Submit operational request to BEXO Corporate Admin',
        security: [{ bearerAuth: [] }],
        tags: ['Requests'],
        responses: { '201': { description: 'Request submitted' } },
      },
    },
    '/health': {
      get: {
        summary: 'System health and readiness check',
        tags: ['System'],
        responses: { '200': { description: 'Healthy' } },
      },
    },
  },
};
