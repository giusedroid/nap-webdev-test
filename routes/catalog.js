var config = require('../config/config');

const routes = {
    init: function(app){
        app.get('/catalog', (req, res) => {
            res.render('catalog', {
                metadata: {
                    title: 'NAP Tech Test - Giuseppe Battista'
                },
                title: 'NAP Tech Test - Giuseppe Battista',
                layout: 'catalog_wrapper',
                template: 'catalog'
            });
        });
    }
};

module.exports = {
    routes
};