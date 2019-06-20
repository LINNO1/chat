/*
客户端的功能：
 1.向服务器发送用户的消息和昵称/房间变更请求；
   1.1 用户消息 防止xss攻击
   1.2 命令消息 chat.processCommand(包括跟换昵称和房间号)
 2.显示其他用户的消息，以及可用房间的列表。




*/



/*---------socketio 操作---------------------------*/

var socket = io.connect(); // io???????
$(document).ready(function(){ // 用户浏览器加载完页面后执行，主要是注册客户端的各种事件
	var chat = new Chat(socket); // 创建chat类的实例
    // 更改名字事件 result={success: true/false,name: }
	socket.on('nameResult',function(result){
		var message;
		if(result.success){ //若操作成功
			message='You are now known as '+result.name+' . ';
		}else{
			message=result.message;
		}
		$('.message').append(divSystemContent(message)); // 将更改名称结果显示
	})
	// 更改房间事件 result={room: }
	socket.on('joinResult',function(result){
		$('.room').text(result.room); // 显示新的房间名
		$('.message').append(divSystemContent('Room changed'))
	})
	// 发送消息事件 message={ room: , text:}
	socket.on('message',function(message){
		$('.message').append($('<div></div>').text(message.text));
	})
	// 显示可用房间数
	socket.on('room',function(rooms){
		$('.room-list').empty();
		for(var room in rooms){
			room = room.subString(1,room.length);
			if(room !=''){
				$('.room-list').append(divEscapedContent(room));
			}
		}
		$('.room-list div').click(function(){
			chat.processCommand('/join '+$(this).text());
			$('.send-msg').focus();
		})
	})
	// 定期显示可用房间列表
	setInterval(function(){
		socket.emit('rooms');
	},1000)
	$('.send-msg').focus();
	$('.send-form').submit(function(){
		processUserInput(chat,socket); // 出入输入框中的内容，分为普通的用户消息和命令
		return false;
	})
       
})

/*----------与UI有关的操作----------------------------------------*/
//处理用户信息，可疑，转义或text,防止xss攻击
function divEscapedContent(msg){
	return $('<div></div>').text(msg);
}
//处理系统信息，可信，直接html显示
function divSystemContent(msg){
	return $('<div></div>').html('<p>'+msg+'</p>');
}
// 处理用户提交的信息
// 依赖 chat类，注意script的添加顺序
function processUserInput(chat,socket){
   var message = $('.send-msg').val();
   var systemMessage;
   if(message.chatAt(0) == '/'){ //如果是聊天命令
		systemMessage=chat.processCommand(message); // 交给chat处理聊天命令，返回结果是false或者错误提示
        if(systemMessage){ //如果命令格式出错，则将错误提示显示在 message 框中
        	$('.message').append(divSystemContent(systemMessage));
        }
   }else{ // 如果是用户消息，则用chat类发送信息 当前房间号和消息内容
   	  //chat.sendMessage($('.room').text(),message);
   	  $('.message').append(divEscapedContent(message)); //将消息显示在message框中
   	  $('.message').scrollTop($('.message').prop('scrollHeight')); //???????????
   }
   $('.send-msg').val(''); // 清空发送框的内容
}