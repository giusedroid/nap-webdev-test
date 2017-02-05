var path = require('path');
var rootPath = path.normalize(__dirname + '/../');

module.exports = {
	ROOT: rootPath,
	PORT: 8200,
	URL_BASE: `http://localhost:8200`
};