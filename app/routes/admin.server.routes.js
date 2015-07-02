var mongoose = require('mongoose');

module.exports = function(router) {

    router.route('/resetdb')
        .get(function (req, res, next) {

            if(req.app.db.resetDb()){
                res.send("Reset database");
            } else {
                res.send("Uable to reset database");
            }
        });

    return router;
};