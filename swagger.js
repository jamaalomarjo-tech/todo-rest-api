const swaggerJsdoc = require('swagger-jsdoc');

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Todo API',
			version: '1.0.0',
			description: 'REST API for managing Todos and Categories'
		},
		servers: [
			{
				url: 'http://localhost:3000'
			}
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT'
				}
			}
		}
	},
	apis: ['./routes/*.js']
};

module.exports = swaggerJsdoc(options);