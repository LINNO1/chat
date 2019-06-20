var socketio=require('socket.io');
var nickNames={}; //socket.id 对应的用户昵称
var namesUsed=[]; // 已用的昵称
var currentRoom={}; //当前房间
var guestNumber=1; //上线用户数
var io;
function listen(server){ // 参数是http服务器
	io=socketio.listen(server); // 启动socket.io服务器，允许它搭载在已有的http服务器上
	io.set('log level',1);
	io.sockets.on('connection',function(socket){ // socket 是？？？？？
		guestNumber=assignGuestName(socket,guestNumber,nickNames,namesUsed);//分配用户名
		joinRoom(socket,'lobby'); // 放在聊天室 ‘lobby’
		handleMsgBroadcast(socket,nickNames); //处理用户消息
		handleNameChange(socket,nickNames,namesUsed); //处理用户更名
		handleRoomJoin(socket); // 聊天室的创建和变更
		socket.on('roomSever',function(){  // 前端触发该事件
			console.log('io.sockets.manager.rooms=',io.sockets.manager.rooms);
			socket.emit('roomClient',io.sockets.manager.rooms); //然后向客户端发送当前房间号
		})
		handleClientDisconnection(socket,nickNames,namesUsed); //用户断开连接后的清除连接
	})

}
/*
   分配昵称;(前端注册 nameResult 事件，服务器分配好昵称触发该事件)
 房间更换请求;(joinResult事件，前端注册，服务器触发 )
 昵称更换请求(nameResult事件，前端注册，服务器触发)
 发送聊天消息;(message 事件，服务器和前端都注册了，服务器: 向当前房间内其他用户推送消息，前端：显示消息)
 房间创建;调用房间更换请求函数(join 事件 参数为{newRoom: xxx}) 服务器注册，前端触发(chat类中)
 用户断开连接。注册disconnect 事件*/
//分配昵称，为每个上线的用户分配昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed){
	var name='Guest'+guestNumber; // 用户名
	nickNames[socket.id]=name; //////////////////////////
	// socket的nameResult事件在前端chat_ui.js注册了，这里前后端的socket是一样的？？？
	// 这样前后端可以直接通信？？？
	socket.emit('nameResult',{ //触发 nameResult 事件，传入的数据为 用户名
		success: true,     //昵称分配成功，应该在消息框中显示
		name: name
	})
	namesUsed.push(name); //记录已用的用户名
	console.log('nickNames: ',nickNames);
	console.log('namesUsed:',namesUsed);
	console.log('currentRoom:',currentRoom);
	return guestNumber+1; //返回用户个数
}
function joinRoom(socket,room){
	socket.join(room); // socket.join() 11111111111111111111111
	currentRoom[socket.id]=room; 
	socket.emit('joinResult',{room: room}); //触发 给前端发消息
	//通知 房间里的其他用户有新用户进入了房间
	socket.broadcast.to(room).emit('message',{text: nickNames[socket.id]+' has joined '+room+'.'});
    var usersInRoom=io.sockets.clients(room); // 得到一个数组 元素是socket对象

    if(usersInRoom.length>1){ // 如果不止一个用户在这个房间，汇总下
    	var userInRoomSummary = 'Users currently in '+room+':';
    	for(var index in usersInRoom){ // userInRoom 为数组
    		var userSocketId = usersInRoom[index].id;//得到该房间所有用户socket.id
    		console.log('userSocketId=',userSocketId)
    		if(userSocketId !=socket.id){ // 不是本人
    			if(index>0){
    				userInRoomSummary+=', ';
    			}
    			userInRoomSummary+=nickNames[userSocketId];
    		}
    	}
    	userInRoomSummary+='.';
    	socket.emit('message',{text: userInRoomSummary}); //将房间里其他用户的汇总发送给这个用户
    	
    }	

}
function handleNameChange(socket,nickNames,namesUsed){
	socket.on('nameAttempt',function(name){
		if(name.indexOf('Guest')==0){
			socket.on('nameResult',{
				success: false,
				message: 'Names cannot begin with "Guest".'
			})
		}else{
			if(namesUsed.indexOf(name)==-1){
				var preName=nickNames[socket.id];
				var preNameIdx = namesUsed.indexOf(preName);
				delete namesUsed[preNameIdx];
				namesUsed.push(name);
				nickNames[socket.id]=name;
				socket.emit('nameResult',{
					success: true,
					name: name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message',{
					text: preName + ' is now known as '+name+' . '
				});
			}else{
				socket.emit('nameResult',{
					success: false,
					message: 'That name is already in use.'
				})
			}
		}
	})
}
//服务器将用户的消息向同个房间广播
function handleMsgBroadcast(socket){
	socket.on('message',function(message){ //注册 message事件
		socket.broadcast.to(message.room).emit('message',{ 
			text: nickNames[socket.id]+ ' : '+message.text
		})
	})
}
//用户加入已有的房间
function handleRoomJoin(socket){
	socket.on('join',function(room){
		socket.leave(currentRoom[socket.id]);//socket.leave(string)2222222222222222222222 
		joinRoom(socket,room.newRoom);
	})
}
//用户离开聊天程序时的处理
function handleClientDisconnection(socket){
	socket.on('disconnect',function(){
		var nameIdx=namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIdx]; //删除已用昵称
		delete nickNames[socket.id];
	})
}
module.exports={listen:listen};
/*
 socket.join(room) 加入房间号
 socket.leave(room) 离开房间
 io.sockets.clients(room) 返回socket对象数组 为房间room的用户socket 
*/