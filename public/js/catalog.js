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
            show: id => `http://localhost:8200/api/render/product/${id}/show`,
            designers: `http://localhost:8200/api/render/designers`
        }
    };

    const templates = {
        pagination:{
            li: (offset,label,cssClass) => `<li class='${cssClass? cssClass : ''}'><button onclick='javascript:Catalog.render(${offset})'>${label}</button></li>`,
            symbols:{
                first: '&lt;&lt',
                last: '&gt;&gt;',
                next: '&gt;',
                previous: '&lt;'
            }
        }
    };

    const utils = {
        scroll: function(dScroll){
            console.log(this.scrollTop);
            this.scrollTop += dScroll;
        }
    };

    let Application = function () {
        this.filter = {
            sort:['price','ascending']
        };
        this.offset = 0;
        this.limit = 4;
        this.total = null;

        this.loadComponents();
        this.setUpEventListeners();
    };
    
    Application.prototype.loadComponents = function(){
        // run this only when document is ready
        this.$components = {
            preview:{
                mobile: document.querySelectorAll('mobile .product-preview-wrapper'),
                desktop : document.querySelectorAll('desktop .product-preview-wrapper')
            },
            pagination: document.querySelectorAll('.pagination ul'),
            designers: {
                contents: document.querySelector('desktop .designer-contents '),
                up: document.querySelector('desktop .up button'),
                down: document.querySelector('desktop .down button'),
                clear: document.querySelector('desktop .clear button'),
                ul: document.getElementById('designer-list')
            }
        };
    };

    Application.prototype.setUpEventListeners = function(){

        this.$components.designers.up.onclick = utils.scroll.bind(this.$components.designers.contents, -20);
        this.$components.designers.down.onclick = utils.scroll.bind(this.$components.designers.contents, 20);
        
        this.$components.designers.clear.onclick = () => {
            this.clearFilters( 'designer');
            let lis = Array.prototype.slice.call( Catalog.$components.designers.ul.children);
            console.log( lis );
            for( let i in lis ){
               
                    lis[i].setAttribute('data-toggle', 'off');

                //console.log( Catalog.$components.designers.ul.children[li].getAttribute('data-toggle'));
            }
        };

        this.$components.designers.ul.addEventListener('click', (e) =>{
            if (e.target.tagName === 'LI') {
                e.stopPropagation();
                if(!this.filter.designer){
                    this.filter.designer = [];
                }
                if( e.target.getAttribute('data-toggle')==='off'){
                    this.filter.designer.push(e.target.getAttribute('data-designer'));
                    e.target.setAttribute('data-toggle', 'on');
                }else{
                    e.target.setAttribute('data-toggle','off');
                    let index = this.filter.designer.indexOf( e.target.getAttribute('data-designer'));
                    if( index >-1){
                        this.filter.designer.splice(index, 1);
                    }
                }
                
                console.log( this.filter );
                this.renderPreview( 0 ).then(this.renderPagination.bind(this));
            }
        });
    }

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

        for( let filter in oFilter){
            let concat = oFilter[filter].map( x => escape(x.replace(/\.|\+|\-|\ |\&|\,/g, '')) ).join(',');
            queryString += `${filter}=${concat}&`
        }
        console.log(queryString);
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

    Application.prototype.clearFilters = function( target ){
        if(!target){
            this.filter = {};
        }else{
            delete this.filter[ target ];
        }

        this.render(0);

    }

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

    Application.prototype.renderDesigners = function(){
        return fetch(apis.render.designers)
            .then( res => res.text())
            .then( res => this.$components.designers.ul.innerHTML = res)
    };

    module.Application = Application;

})( app || (app = {}) );


let Catalog;

ready(
    function(){
        Catalog = new app.Application();
        Catalog.render(0);
        Catalog.renderDesigners();
    }
);