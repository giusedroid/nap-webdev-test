# NAP Tech Web Dev Test - Giuseppe Battista

Hi NAP team,

thank you for taking my application into account.

## Setup
To run the app 
```
npm install
npm run
```

The application is hosted at `http://localhost:3000/catalog`

## Style

For this project I chose a minimal flat style, borrowing inspiration for the most of it 
from your current website. 
I also chose to display a maximum of four items per catalog page because I wanted
the user attention focused on them. I wanted to get as close as possible to the high street
 shopping experience.

## App 
The structure of the app is the following. Files/modules I added are marked with (*), modified with (M)
```
.
├── app.js
├── config
│   └── config.js
├── fixtures
│   └── products.json
├── node_modules
│   ├── co (*)
│   ├── debug (*)
│   ├── express
│   ├── express-hbs
│   ├── express-params
│   ├── lodash
│   ├── node-fetch (*)
│   └── request
├── package.json
├── public
│   └── css (*)
|       └── bootstrap.css (*)
|       └── catalog.css (*)
│   ├── fonts (*)
│   ├── images
│   └── js (*)
|       └── catalog.js (*)
├── README.md
├── routes
│   ├── catalog.js (*)
│   ├── designers.js (*)
│   ├── landing-page.js
│   ├── product.js
│   ├── product-list.js (M)
│   ├── render.js (*)
│   └── setup-routes.js (M)
├── utilities
│   ├── express.js
│   ├── fsp.js (*)
│   └── render.js (*)
└── views
    ├── catalog.hbs (*)
    ├── index.hbs
    ├── layouts
    │   ├── catalog_wrapper.hbs (*)
    │   └── default.hbs
    └── partials
        ├── catalogHead.hbs (*)
        ├── catalog_scripts.hbs (*)
        ├── designers.hbs (*)
        ├── pageHead.hbs
        ├── product-error.hbs (*)
        ├── product-preview.hbs (*)
        ├── product-show.hbs (*)
        └── scripts.hbs
```
### External Contents 
**Bootstrap CSS** I used Twitter Bootstrap 3 to make the layout responsive.
**CO** is the co-routine module I use to deal with ES6 generators

**Debug** to get logs in debug mode

**node-fetch** is a promise-based implementation of `fetch` method. Works basically like `request`

### Homebrew
**utilities/fsp** wrapper to promisify fs 
**utilities/render** is where server-side rendering happens (Designer list, products preview and details)

### APIs

I slightly modified `/routes/product-list` to allow some basic sorting and filtering.

