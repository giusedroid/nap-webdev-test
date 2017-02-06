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

    const templates = {
        pagination:{
            li: (offset,label,cssClass) => `<li class='${cssClass? cssClass : ''}'><button onclick='javascript:Catalog.render(${offset})'>${label}</button></li>`,
            symbols:{
                first: '<span class="glyphicon glyphicon-fast-backward"></span>',
                last: '<span class="glyphicon glyphicon-fast-forward"></span>',
                next: '<span class="glyphicon glyphicon-step-forward"></span>',
                previous: '<span class="glyphicon glyphicon-step-backward"></span>'
            }
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
            pagination: document.querySelectorAll('.pagination ul')
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
        return this.loadProducts(offset, this.limit, this.filter)
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

        let offsetVector = [-2,-1,0,1,2]
            .map( x => {
                let current = false;
                if( x === 0){
                    current = true;
                }
                let offset = this.limit*x + this.offset;
                let label = Math.floor((offset / this.limit)) + 1; // adding 1 because we don't want page 0
                return { offset, label, current }
            })
            .filter( x => { return x.offset >= 0 })
            .filter( x => { return x.offset <= (this.total - this.limit)});

        return {
            first: 0,
            current: Math.floor(this.offset / this.limit),
            total: Math.floor(this.total / this.limit),
            last: this.total - this.limit,
            offsetVector
        }
    };

    Application.prototype.renderPagination = function(){
        const pages = this.getPages();
        this.$components.pagination.forEach(
            ul => {
                ul.innerHTML = '';

                /*
                    First and Last must always be visible
                    Next is visible only when current offset !== last offset
                    Previous is visible only when current offset !== 0
                    Page numbers in the middle
                 */
                
                // first
                ul.insertAdjacentHTML('beforeend',
                    templates.pagination.li(0, templates.pagination.symbols.first)
                    );
                
                if( this.offset > 0){
                     // previous
                     ul.insertAdjacentHTML('beforeend',
                        templates.pagination.li(this.offset-this.limit, templates.pagination.symbols.previous)
                     );
                }

                pages.offsetVector.forEach(
                    each => ul.insertAdjacentHTML('beforeend',
                                templates.pagination.li( 
                                    each.offset,
                                    each.label,
                                    each.current? 'current' : ''
                                )
                            )
                );

                if( this.offset < this.total - this.limit){
                    // next
                    ul.insertAdjacentHTML('beforeend',
                        templates.pagination.li(this.offset+this.limit, templates.pagination.symbols.next)
                    );
                }

                 // last
                ul.insertAdjacentHTML('beforeend',
                    templates.pagination.li(this.total - this.limit, templates.pagination.symbols.last)
                );
            }
        );

    };

    Application.prototype.render = function(offset){
        this.renderPreview(offset)
            .then(this.renderPagination.bind(this));
    };

    module.Application = Application;

})( app || (app = {}) );


let Catalog;

ready(
    function(){
        Catalog = new app.Application();
        Catalog.render(0);
    }
);