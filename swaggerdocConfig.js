const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Conference Room Booking API',
      version: '1.0.0',
      description: 'API for booking conference rooms'
    }
  },
  // files containing JSDoc annotations for the API
  apis: ['./server.js', './routes/*.js'] 
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = {swaggerSpec};