const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(path.join(__dirname, '../../swagger.yaml'));

const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true
    },
    customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #3b4151; }
    `,
    customSiteTitle: "Todo Realtime API Documentation",
    customfavIcon: "/favicon.ico"
};

module.exports = {
    swaggerUi,
    swaggerDocument,
    swaggerOptions
};
