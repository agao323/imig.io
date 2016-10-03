var models = require('../models');

module.exports = {
    popular: function(callback) {

        // query MongoDB to find the top nine most liked images
        // by sorting them in descending like count order
        models.Image.find({}, {}, {limit: 9, sort: {likes: -1}},
            function(err, images) {
                if (err) throw err;
                callback(null, images);
            });
    }
};