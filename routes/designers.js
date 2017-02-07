var config = require('../config/config');

// Mock API using fixture so we're not dependent on network connectivity
var allProducts = require(config.ROOT +'/fixtures/products.json').data;

var routes = {
    init: function(app){
        app.get('/api/designers', (req, res) =>{
            res.json(
                {
                    designers: Array.from(new Set(allProducts.map( x => x.brand.name.en))).sort()
                }
            );
        });
    }
}

module.exports ={
    routes
}