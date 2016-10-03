var models = require('../models'),
    async = require('async');

module.exports = {

    // single parameter, callback, is a function called once all the work
    // in the function is finished executing
    newest: function(callback) {

        // query every comment in the db, limit it to 10 displayed
        models.Comment.find({}, {}, { limit: 10, sort: { 'timestamp': -1 }},
            
            // callback; second param is array of comments found
            function(err, comments) {

                // This function accepts two parameters: a single comment
                // model and a callback func named next
                var attachImage = function(comment, next){

                    // find that single comment model with a matching image_id
                    models.Image.findOne({_id : comment.image_id},
                        function(err, image) {
                            if (err) throw err;

                            // attach the image to the comment
                            comment.image = image;
                            next(err);
                        });
                };

                // .each loops through every comment in the comments array
                // attachImage is passed as the second parameter and will be
                   // called on every comment in the array in the first param
                async.each(comments, attachImage, 

                    // this inline anonymous func executes after the whole 
                    // comments collection has been iterated on
                    function(err) {
                        if (err) throw err;
                        callback(err, comments);
                    });

            });
    }
};