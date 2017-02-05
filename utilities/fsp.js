const fs = require('fs');

const read = function(path, options){
    return new Promise( (resolve, reject) => {
        fs.readFile(path, options, (err, data) =>{
            if(err){
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}

module.exports = {
    read
};