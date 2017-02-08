'use strict';

/* mocking $.ready */

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
                desktop : document.querySelectorAll('desktop .product-preview-wrapper'),
                all: document.querySelectorAll('.product-preview-wrapper')
            },
            pagination: document.querySelectorAll('.pagination ul'),
            designers: {
                contents: document.querySelector('desktop .designer-contents '),
                up: document.querySelector('desktop .up button'),
                down: document.querySelector('desktop .down button'),
                clear: document.querySelector('desktop .clear button'),
                ul: document.querySelectorAll('.designer-list')
            },
            sort: document.querySelectorAll('.sort'),
            filterToggle: document.getElementById('mobile-filters'),
            mobile:{
                 group: document.querySelectorAll('mobile .mobile-group'),
                 contents: document.querySelector('mobile .contents'),
                 filters: document.querySelector('mobile .filters'),
                 details: document.querySelector('mobile .prduct-detail')
            },
            desktop:{
                group: document.querySelectorAll('desktop .sm-contents'),
                preview: document.querySelector('desktop .product-preview'),
                detail: document.querySelector('desktop .product-detail')
            },
            show:{
                mobile: document.querySelector('mobile .product-detail'),
                desktop: document.querySelector('desktop .product-detail'),
                all: document.querySelectorAll('.product-detail')
            }
        };
    };

    Application.prototype.clearSort = function(){
        this.$components.sort.forEach( ul => 
            Array.prototype.slice.call(ul.children).forEach( li => li.setAttribute('data-toggle', 'off'))
            );
    }

    Application.prototype.setUpEventListeners = function(){

        this.$components.designers.up.onclick = utils.scroll.bind(this.$components.designers.contents, -20);
        this.$components.designers.down.onclick = utils.scroll.bind(this.$components.designers.contents, 20);
        
        this.$components.designers.clear.onclick = () => {
            this.clearFilters( 'designer');
            let lis = document.querySelectorAll('ul.designer-list li').forEach(
                x => x.setAttribute('data-toggle', 'off')
            );
        };

        this.$components.sort.forEach(ul =>{
            ul.addEventListener('click', (e) => {
                if( e.target.tagName === 'LI'){
                    if(!this.filter.sort){
                        this.filter.sort = [];
                    }

                    let sorting = e.target.getAttribute('data-sort');
                    let lis = document.querySelectorAll(`ul.sort li[data-sort="${sorting}"]`);

                    if( e.target.getAttribute('data-toggle') === 'off'){
                        e.stopPropagation();
                        console.log("Setting sort filter ON");
                        this.clearSort();
                        
                        lis.forEach(x => x.setAttribute('data-toggle', 'on'));
                        this.filter.sort = ['price', sorting ];
                    }else{
                        e.stopPropagation();
                        console.log("Setting sort filter OFF");
                        this.clearSort();
                        lis.forEach(x => x.setAttribute('data-toggle', 'off'));
                        this.clearFilters('sort');
                    }
                    console.log(this.filter);
                    this.renderPreview( 0 ).then(this.renderPagination.bind(this));
                    this.showPreview();
                }
            });
        });

        this.$components.designers.ul.forEach(
            x => {
                x.addEventListener('click', (e) =>{
                if (e.target.tagName === 'LI') {
                    let designer = e.target.getAttribute('data-designer');
                    let lis = document.querySelectorAll(`li[data-designer="${designer}"]`);
                    e.stopPropagation();
                    if(!this.filter.designer){
                        this.filter.designer = [];
                    }
                    if( e.target.getAttribute('data-toggle')==='off'){
                        this.filter.designer.push(designer);
                        lis.forEach( x => x.setAttribute('data-toggle', 'on'));
                    }else{
                        lis.forEach( x => x.setAttribute('data-toggle', 'off'));
                        let index = this.filter.designer.indexOf( e.target.getAttribute('data-designer'));
                        if( index >-1){
                            this.filter.designer.splice(index, 1);
                        }
                    }
                    this.renderPreview( 0 ).then(this.renderPagination.bind(this));
                    this.showPreview();
                }
            });
            }
        );
        

        this.$components.filterToggle.onclick = () => {

            // hide them all
            this.$components.mobile.group.forEach( x => {
                if( ! x.classList.contains('hidden')){
                    x.classList.add('hidden');
                }
            });

            if(this.$components.filterToggle.getAttribute('data-toggle')==='off'){
                this.$components.filterToggle.setAttribute('data-toggle', 'on');
                this.$components.mobile.filters.classList.remove('hidden');
            }else{
                this.$components.filterToggle.setAttribute('data-toggle', 'off');
                this.$components.mobile.contents.classList.remove('hidden');
            }
        };

        const showDesktop = this.$components.preview.desktop;
        const showMobile = this.$components.preview.mobile;

        [showDesktop, showMobile].forEach(
            divs => divs.forEach( div  => { 
                div.addEventListener('click', (e) => {
                    console.log(e);
                    if(e.target.tagName === 'IMG'){
                        e.stopPropagation();
                        this.renderShowProduct(e.target.getAttribute('data-show'));
                        this.$components.mobile.group.forEach( x => {
                            if( ! x.classList.contains('hidden')){
                                x.classList.add('hidden');
                            }
                        });
                        this.$components.desktop.group.forEach( x => {
                            if( ! x.classList.contains('hidden')){
                                x.classList.add('hidden');
                            }
                        });
                        this.$components.show.desktop.classList.remove('hidden');
                        this.$components.show.mobile.classList.remove('hidden');
                    }
                });
            })
        );
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
                each.innerHTML = html[index] ? html[index] : '';
            }
        );
        this.$components.preview.desktop.forEach(
            (each, index) =>{
                each.innerHTML = html[index] ? html[index] : '';
            }
        );
        
    };

    Application.prototype.updateShowElements = function (html){
        this.$components.show.mobile.innerHTML = html;
        this.$components.show.desktop.innerHTML = html;
    }

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
            .filter( x => { return x.offset < (this.total)});

        return {
            first: 0,
            current: Math.floor(this.offset / this.limit),
            total: Math.floor(this.total / this.limit),
            last: this.total,
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

                console.log("[Total - Limit]: ", this.total - this.limit);
                 // last
                 let last = (this.total % this.limit) === 0? this.total - this.limit : this.total - this.total % this.limit;
                ul.insertAdjacentHTML('beforeend',
                    templates.pagination.li(last, templates.pagination.symbols.last)
                );
            }
        );

    };

    Application.prototype.renderShowProduct = function(id){
        return fetch(apis.render.show(id))
                .then( data => data.text())
                .then(html => this.updateShowElements( html )
                );
    }

    Application.prototype.showPreview = function(){
        this.$components.mobile.group.forEach( x => {
            if( ! x.classList.contains('hidden')){
                x.classList.add('hidden');
            }
        });
        this.$components.desktop.group.forEach( x => {
            if( ! x.classList.contains('hidden')){
                x.classList.add('hidden');
            }
        });

        this.$components.mobile.contents.classList.remove('hidden');
        this.$components.desktop.preview.classList.remove('hidden');
        this.$components.filterToggle.setAttribute('data-toggle', 'off');
    }


    Application.prototype.render = function(offset){
        this.renderPreview(offset)
            .then(this.renderPagination.bind(this));
    };

    Application.prototype.renderDesigners = function(){
        return fetch(apis.render.designers)
            .then( res => res.text())
            .then( res => this.$components.designers.ul.forEach(x => x.innerHTML = res))
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