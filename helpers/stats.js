var models = require('../models'), 
	async = require('async');

module.exports = function(callback) {
	async.parallel([
		function(next) {
			
			// the callback function could have been abbreviated
			// to be 'next' because the parameter signatures match
			models.Image.count({}, function(err, total) {
				next(err, total);
			});
		},
		function(next) {
			models.Comment.count({}, next);
		},
		function(next) {

			// use the aggregate functionality of MongoDB to get a
			// sum of all the views across all the images
			models.Image.aggregate({ $group : {
				_id : '1',
				viewsTotal : { $sum : '$views' }
			}}, function(err, result) {
				var viewsTotal = 0;
				if (result.length > 0) {
					viewsTotal += result[0].viewsTotal;
				}
				next(null, viewsTotal);
			});
		},
		function(next) {
			models.Image.aggregate({ $group : {
				_id : '1',
				totalLikes : { $sum : '$likes' }
			}}, function(err, result) {
				var totalLikes = 0;
				if (result.length > 0) {
					totalLikes += result[0].totalLikes;
				}
				next(null, totalLikes);
			});
		}
	], function(err, results) {
		callback(null, {
			images:   results[0],
			comments: results[1],
			views: 	  results[2],
			likes:    results[3]
		});
	});
};