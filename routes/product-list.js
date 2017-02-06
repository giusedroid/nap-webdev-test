var config = require('../config/config');

// Mock API using fixture so we're not dependent on network connectivity
var allProducts = require(config.ROOT +'/fixtures/products.json').data;

var parseFilters = function( filter ){
    return filter.split(',');
};

var sorting = {
    price:{
        ascending: (x, y) => x.price.gross > y.price.gross ,
        descending: (x, y) => x.price.gross < y.price.gross
    }
};

var mapping = {
    designer: dsg => x=> x.brand.name.en === dsg ,
    price: (min, max) => x => x.price.gross / x.price.divisor >= min && x.price.gross / x.price.divisor <= max
};

var routes = {
    init: function(app) {

        app.get('/api/products', function (req, res, next) {
            var offset = parseInt(req.query.offset) || 0;
            var limit = parseInt(req.query.limit) || 60;
            var filters = [];

            if(req.query.designer){
                console.log("pushing designer filter");
                console.log(mapping.designer);
                console.log(mapping.designer(req.query.designer));
                filters.push(mapping.designer(req.query.designer));
            }

            if(req.query.price){
                console.log('pushing price filter');
                var criteria = parseFilters( req.query.price);
                filters.push(mapping.price(
                    parseInt(criteria[0]),
                    parseInt(criteria[1])
                ));
                console.log(`[${criteria[0]},${criteria[1]}]`);
            }

            var actualData = allProducts.slice();

            for( var f in filters ){
                actualData = actualData.filter( filters[f] );
            }

           if(req.query.sort){
                var criteria = parseFilters( req.query.sort );
                actualData = actualData.sort(sorting[criteria[0]][criteria[1]]);
            }

            var data = actualData.slice(offset, offset+limit).map(function(product) {
                // Simplify payload - more data available in fixture
                return {
                    id: product.id,
                    name: product.name.en,
                    price: '£' + product.price.gross / product.price.divisor,
                    designer: product.brand.name.en,
                    image: {
                        outfit: '//cache.net-a-porter.com/images/products/'+product.id+'/'+product.id+'_ou_sl.jpg'
                    }
                }
            });

            var total = actualData.length;

            var response = {
                offset: offset,
                limit: limit,
                total: total,
                data
            };

            if (offset > total) {
                return res.type('json').sendStatus(400);
            }

            res.json( response );

        })

    }
};



module.exports = {
    routes: routes
};
