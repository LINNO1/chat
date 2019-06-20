 	//定义chat类
//注意这是前端的js,不要用commonjs规范，在html直接用script标签按顺序添加
var Chat = function(socket){
	this.socket=socket;
}
//发送消息  房间号和消息内容 
Chat.prototype.sendMessage=function(room,text){
	var message = {  //消息构成： 房间号和信息内容
		room: room,
		text: text
	}
	this.socket.emit('message',message); // 触发message事件，发送消息
}
// 更换房间 参数为房间号
Chat.prototype.changeRoom=function(room){
	this.socket.emit('join',{  // 触发join事件，更换房间号
		newRoom: room
	});
}
//更换昵称 参数为新昵称
Chat.prototype.changeNick=function(name){
	this.socket.emit('nameAttempt',name); // 触发nameAttempt事件，更名
}
// 处理聊天命令，这是授信消息，可以不用处理直接显示(处理是为了防止xss攻击)
// 命令有两种 /nick [username]和/join [room name] 更换昵称和房间号
Chat.prototype.processCommand=function(command){
	var words = command.split(' ');
	var command = words[0].slice(1,words[0].length).toLowerCase(); // 去掉前面的\
	words.shift();
	var data=words.join(' ');
	var message =false;
	switch(command){
		case 'nick':
		this.changeNick(data); // 触发nameAttempt事件，更名
		break;
		case 'join':
		this.changeRoom(data); // 触发join事件，更名
		break;
		default:
		message='Unrecognized command';
		break;
	}
    return message;
}