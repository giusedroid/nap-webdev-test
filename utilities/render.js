'use strict';

const fetch = require('node-fetch');
const co = require('co');
const config = require('../config/config');
const fsp = require(config.ROOT + '/utilities/fsp');
const hbs = require('express-hbs');
const debug = require('debug')('render');

const templates = {
        preview:'product-preview',
        show: 'product-show',
        error: 'product-error'
};

const renderGen = function * (template, resource){
    debug('Loading resource ', resource);
    let rResource = yield fetch(`${config.URL_BASE}/api/product/${resource}`);
    rResource = yield rResource.json();
    rResource.class = template;
    debug('Loaded Resource : ', rResource);
    if(rResource.error){
        debug('ERROR : resource ${{resource}} not found. Defaulting to error template');
        template = templates.error;
    }
    const templateURI = `${config.ROOT}/views/partials/${template}.hbs`;
    debug('Loading template ' + template);
    const rTemplate = yield fsp.read(templateURI);
    debug('Template loaded ', rTemplate.toString());
    const result = hbs.compile(rTemplate.toString())(rResource);
    debug('Result: ', result);
    return result;
};

const renderDesignerGen = function * (){
    debug('Loading designers');
    let rDesigners = yield fetch(`${config.URL_BASE}/api/designers`);
    rDesigners = yield rDesigners.json();
    const templateURI = `${config.ROOT}/views/partials/designers.hbs`;
    const rTemplate = yield fsp.read(templateURI);
    const result = hbs.compile(rTemplate.toString())(rDesigners);
    return result;
};

const preview = resource => co( renderGen(templates.preview, resource) );
const show = resource => co( renderGen(templates.show, resource) );
const designers = () => co( renderDesignerGen() );

module.exports = {
        preview,
        show,
        designers
};
