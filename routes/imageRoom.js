exports.lobby = function(req, res){
	req.session.emp_id = req.query.emp_id;
	
	//로비에 세션에서 가져온 emp_id 데이터를 뿌려줌 
	res.render('lobby',{
		"emp_id": req.session.emp_id
	});
};

exports.canvas = function(req, res){
	res.render('canvas',{
		"emp_id": req.session.emp_id,
		"room_id": req.query.room_id
	});
}


/*
exports.login = function(req, res){
	res.render('login');
}

exports.test = function(req, res){
	res.render('test', {
		"emp_no": req.session.emp_no,
		"image_room_no": req.query.image_room_no
	});
}
*/



















