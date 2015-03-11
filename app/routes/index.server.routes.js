module.exports = function(router) {
    var index = require('../controllers/index.server.controller');
    router.get('/', index.render);

    return router;
};