$(document).ready(function(){
	var $hiddenDiv = $('#hiddenDiv');
	var emp;
	
	//emp 정보 셋팅 @
	$.ajax({
		type: 'get',
		url: 'http://localhost:8081/imageRoom/getEmp',
		data: {
			emp_id: $hiddenDiv.find('#emp_id').text() 
		},
		success: function(data){
			
			emp = data;
		}
	});
	
	//맨 처음 페이지 접속시 db에 있는 방에 대한 정보 ajax 처리 @
	$.ajax({
		type: 'get',
		url: 'http://localhost:8081/imageRoom/imageRoomLobby',
		success: function(data){
			$.each(data, function(index, item){
				createRoom(item);
			});
		}
	});
	
	//Socket 처리
	var socket = io.connect();
	
	function createRoom(data){
		var divTag = $('<div></div>')
						.attr('data-index', data.room_id)
						.addClass('roomDiv');
		
		$('<span></span>')
		.text('방이름 : ' + data.room_nm)
		.addClass('roomName')
		.appendTo(divTag)
		.after('</br>');
		
		$('<span></span>')
		.text('방장 : ' + data.dept_nm + ' ' + data.emp_nm)
		.addClass('creater')
		.appendTo(divTag)
		.after('</br>');

		$('<button></button>').attr({
			'data-room': data.room_id
		}).text('입장')
		.addClass('btn')
		.addClass('btn-default')
		.appendTo(divTag);
		
		var aTag = $('<a>방삭제</a>')
					.addClass('removeTag');
		
		divTag
		.append(aTag)
		.appendTo('#roomDiv');
	}
	
	socket.on('create_room', function(data){
		//문서 객체를 추가
		createRoom(data);
	});
	
	//이벤트 연결
	$('#roomDiv').on('click', 'button', function(){
		//방의 pk 변수 선언
		var room = $(this).attr('data-room');
		
		//방의 pk를 가지고 페이지 이동
		location = 'canvas?room_id=' + room;
	});
	
	$('#roomDiv').on('click', 'a', function(event){
		event.stopPropagation();
		var that = $(this);
		//@
		$.ajax({
			type : 'post',
			url : 'http://localhost:8081/imageRoom/imageRoomDelete',
			data: {
				room_id : that.parent().attr('data-index')
			},
			dataType : 'text',
			success : function(result) {
				if (result == 'SUCCESS') {
					alert('삭제되었습니다.');
					that.parent().remove();
				}
			}
		});
	});
	
	//방 생성 버튼 클릭시
	$('#createButton').click(function(){
		$.ajax({
			type: 'get',
			url: 'http://localhost:8081/imageRoom/getRoomNo',
			success: function(room_id){
				//방 이름에 대한 변수 선언
				var room_nm = $('#room').val(); // 방이름 설정한거 가져옴
				
				//ajax로 spring에  방이름,emp_id,room_id 전송 @
				$.ajax({
					type: 'post',
					url: 'http://localhost:8081/imageRoom/imageRoomLobby',
					data: {
						room_nm: room_nm, 
						emp_id: emp.emp_id, 
						room_id: room_id
					},	
					success: function(message){
						//Spring과 통신되어 db에 저장이 되면 소켓 이벤트 발생
						socket.emit('create_room', {
							room_nm: room_nm,
							room_id: room_id,
							emp_nm: emp.emp_nm,
							dept_nm: emp.dept_nm,
							pos_nm: emp.pos_nm,
						});
						
						alert('방이 생성되었습니다.');
					}
				});
			}
		});
		
		/* 
		//페이지 이동
		location = '/canvas/' + room;
		 */
	});
});