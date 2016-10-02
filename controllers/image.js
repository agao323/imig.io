var fs = require('fs'),
    path = require('path'),
    sidebar = require('../helpers/sidebar'),
    Models = require('../models'),
    MD5 = require('MD5');


module.exports = {
	index: function(req, res) {
        // instantiate an empty viewModel object to hold an image and comments
        var viewModel = {
            image: {},
            comments: []
        };
            
        // find the image by searching for the filename
        Models.Image.findOne({ filename: { $regex: req.params.image_id } },
            function(err, image) {
                if (err) { throw err; }
                if (image) {

                    // if the image is found, increment the views,
                    // attach the image to the viewModel, and save the 
                    // model to show the update 
                    image.views++; 
                    viewModel.image = image;
                    image.save();

                    // find comments that share the same image_id
                    Models.Comment.find({ image_id: image._id}, {}, {
                    sort: { 'timestamp': 1 }},
                        function(err, comments){
                            if (err) { throw err; }

                            // attach the comments to the viewModel
                            viewModel.comments = comments;

                            sidebar(viewModel, function(viewModel) {
                                res.render('image', viewModel);
                            });
                        }    
                    );
                } else {
                    // redirect to homepage if no image was found
                    res.redirect('/');
                }
            });
    },

    create: function(req, res) {
        var saveImage = function() {
            var possible = 'abcdefghijklmnopqrstuvwxyz0123456789', 
                imgUrl = '';

            for(var i=0; i < 6; i+=1) {
                imgUrl += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            // search for an image with the same filename first:
            Models.Image.find({ filename: imgUrl }, function(err, images) {
                if(images.length > 0) {
                    // if there's already an image with the randomly generated url 
                    // in the database, call the function again until the url is unique
                    saveImage();
                } else {
                    var tempPath = req.files.file.path,
                        ext = path.extname(req.files.file.name).toLowerCase(),
                        targetPath = path.resolve('./public/upload/' + imgUrl + ext);

                    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
                        fs.rename(tempPath, targetPath, function(err) {
                            if (err) throw err;

                            // create a new Image model and pass in default values through the constructor
                            var newImg = new Models.Image({
                                title: req.body.title,
                                description: req.body.description,
                                filename: imgUrl + ext
                            });

                            // save into MongoDB, callback redirects to the proper url 
                            newImg.save(function(err, image) {
                                console.log('Successfully inserted image: ' + image.filename);
                                res.redirect('/images/' + image.uniqueId);
                            });
                        });
                    } else {
                        fs.unlink(tempPath, function () {
                            if (err) throw err;

                            res.json(500, {error: 'Only image files are allowed.'});
                        });
                    }
                }
            });
        };

        saveImage();
    },

    like: function(req, res) {

        // search for a matching image in the db
        Models.Image.findOne({ filename: { $regex: req.params.image_id }},
            function(err, image) {
                if (!err && image) {

                    // if a valid image is found, increment likes and save it
                    image.likes++; 
                    image.save(function(err) {
                        if (err) { 
                            res.json(err);
                        } else {

                            // if saving it doesn't return an error, simply
                            // send a JSON object with the correct number of likes
                            // back to the browser
                            res.json({ likes: image.likes });
                        }
                    });
                }
            });
    },


    comment: function(request, response) {

        // find the image
        Models.Image.findOne({ filename: { $regex: request.params.image_id }},
            function(err, image) {
                if (!err && image) {

                    var newComment = new Models.Comment(request.body);

                    console.log(request.body);

                    newComment.gravatar = MD5(newComment.email);
                    newComment.image_id = image._id;
                    newComment.save(function(err, comment) {
                        if (err) { throw err; }
                        response.redirect('/images/' + image.uniqueId + '#THE_COMMENT_ID_IS:$' + comment._id);
                    });
                } else {
                    response.redirect('/');
                } 
            });
    }
};




