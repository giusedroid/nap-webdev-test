var config = require('../config/config');
const render = require('../utilities/render');

const routes = {
    init: function(app){
        app.get('/api/render/product/:id/preview', (req, res) => {
            render.preview(req.params.id)
                .then( result => res.status(200).send( result ) );
        });
        app.get('/api/render/product/:id/show', (req, res) => {
            render.show(req.params.id)
                .then( result => res.status(200).send( result ) );
        });
    }
};

module.exports = {
    routes
};