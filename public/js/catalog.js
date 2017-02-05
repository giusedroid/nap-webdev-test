'use strict';

/* polyfill for $.ready */

function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

let app;

(function( module ){
    const apis = {
        product:{
            byId: id => `http://localhost:8200/api/product/${id}`
        },
        products:{
            all: 'http://localhost:8200/api/products',
            filter: query => `http://localhost:8200/api/products/?${query}`
        },
        render:{
            preview: id => `http://localhost:8200/api/render/product/${id}/preview`,
            show: id => `http://localhost:8200/api/render/product/${id}/show`
        }
    };

    let Application = function () {
        this.filter = {};
        this.offset = 0;
        this.limit = 4;
        this.total = null;

        this.loadComponents();
    };
    
    Application.prototype.loadComponents = function(){
        // run this only when document is ready
        this.$components = {
            preview:{
                mobile: document.querySelectorAll('mobile .product-preview-wrapper'),
                desktop : document.querySelectorAll('desktop .product-preview-wrapper')
            },
            pagination: document.querySelectorAll('.pagination')
        };
        
        
    };

    Application.prototype.parseFilters = function(oFilter){
        /*
            filter object
            {
                price:[0,250],
                sizes:['m','l'],
                designers:['Bulgari','Prada']
            }
         */
        let queryString = '';

        for( filter in oFilter){
            let concat = oFilter[filter].join(',');
            queryString += `${filter}=${concat}&`
        }
        return queryString.slice(0,-1);
    };

    Application.prototype.loadProducts = function(offset, limit, filters){
        let query = `offset=${offset}&limit=${limit}`;

        if( filters && typeof filters === 'object'){
            query += '&';
            query += this.parseFilters(filters);
        }

        return fetch(apis.products.filter( query ))
            .then( data => data.json() )
    };

    Application.prototype.buildProductPipeline = function( res ){
        console.log(res);
        let promises = [];
        for( let product of res.data){
            promises.push(
               fetch( apis.render.preview(product.id) ).then( data => data.text() )
            );
        }
        this.offset = res.offset;
        this.total = res.total;
        return Promise.all( promises );
    };

    Application.prototype.updatePreviewElements = function(html){
        this.$components.preview.mobile.forEach(
            (each, index) =>{
                each.innerHTML = html[index];
            }
        );
        this.$components.preview.desktop.forEach(
            (each, index) =>{
                each.innerHTML = html[index];
            }
        );
        
    };

    Application.prototype.renderPreview = function(offset){
        this.loadProducts(offset, this.limit, this.filter)
            .then( res => this.buildProductPipeline(res) )
            .then( html => this.updatePreviewElements(html) )
    };

    Application.prototype.next = function(){
        let newOffset = this.offset + this.limit;
        let upperLimit = this.total - this.limit;
        this.renderPreview( newOffset < upperLimit ? newOffset:upperLimit );
    };

    Application.prototype.previous = function(){
        let newOffset = this.offset - this.limit;
        console.log(newOffset);
        this.renderPreview( newOffset > 0 ? newOffset : 0 );
    };

    Application.prototype.getPages = function (){
        return {
            current: this.offset / this.total,
            total: this.total / this.limit
        }
    }

    module.Application = Application;

})( app || (app = {}) );


let Catalog;

ready(
    function(){
        Catalog = new app.Application();
        Catalog.renderPreview(0);
    }
);