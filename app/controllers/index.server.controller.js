exports.render = function(req, res) {
    res.render('index', {
    	title: 'Snaphunt',
    	user: req.user ? req.user.username : ''
    });
};