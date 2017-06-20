
/**
 * Module dependencies.
 */
var socketio = require('socket.io');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var jade = require('jade');
var imageRoom = require('./routes/imageRoom');
var session = require('express-session');
var app = express();

// all environments
app.use(session({
	secret : 'koggiri',
	resave : false,
	saveUnitialized : true
}))
app.set('port', process.env.PORT || 8082);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/imageroom/lobby', imageRoom.lobby);
app.get('/imageroom/canvas', imageRoom.canvas);

var server = http.createServer(app);

server.listen(app.get('port'), function() {
	console.log('서버 시작');
});


var imgList = {};
var empList = {};

// 소켓 서버 생성
var io = socketio.listen(server);

io.sockets.on('connection', function(socket){
	var isInRoom = false;
	
	var emp_id;
	var room_id;
	
	// 방 접속
	socket.on('join',function(data){
		console.log(data);
		isInRoom = true;
		// client가 발생시킨 이벤트의 룸id와 empid를 서버에 저장
		room_id = data.room_id;
		console.log(room_id);
		emp_id = data.emp_id;
		// 클라이언트 해당 방 접속
		socket.join(room_id);
		console.log(imgList[room_id]+"imgList");
		io.sockets.to(this.id).emit('drawImage',imgList[room_id]);
		
		//사람이 없으면 방id에 해당하는 list배열 생성.
		if(empList[room_id] == undefined){ 
			empList[room_id] = [];
		}
		// 방에 들어온 client의 emp_id를 list에 추가
		empList[room_id].push(emp_id); 
		// 해당 방에 현재 접속자 명단을 전송
		io.sockets.to(room_id).emit('joinList',empList[room_id]);
		
	});
	
	// 방 생성
	socket.on('create_room',function(data){
		io.sockets.emit('create_room',data)
	});
	
	// 그림 그리기
	socket.on('draw', function(data) {
		io.sockets.to(room_id).emit('line', data);
	});
	// 그림판 지우기
	socket.on('clean', function() {
		io.sockets.to(room_id).emit('clean');
	});
	// 캡쳐 이미지 추가
	socket.on('drawImage', function(data) {
		io.sockets.to(room_id).emit('drawImage', data.toString());
	});
	// 이미지 캡쳐
	socket.on('saveImage', function(data) {
		imgList[room_id] = data.toString();
	});
	// 이미지 불러오기
	socket.on('loadImage', function() {
		io.sockets.emit('drawImage', imgList[room_id]);

		console.log(empList[room_id]+"empList");
	});
	//권한 제거
	socket.on('addDrawDisable', function(data) {
		io.sockets.to(room_id).emit('addDrawDisable', data);
	});
	//권한 추가
	socket.on('removeDrawDisable', function(data) {
		io.sockets.to(room_id).emit('removeDrawDisable', data);
	});
	// 채팅 발송
	socket.on('chat', function(data) {
		io.sockets.to(room_id).emit('chat', data);
	});

	//방 퇴장
	socket.on('disconnect', function() {
		if (isInRoom) {
			// 현재 접속자 명단에서 나간 emp_id 제거
			var index = empList[room_id].indexOf(emp_id); 

			empList[room_id].splice(index, 1);
			
			//업데이트된 현재 접속자 명단을 전송
			io.sockets.to(room_id).emit('joinList',
					empList[room_id]);
		}
	});
});

