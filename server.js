var fs=require('fs');
var path=require('path');
var http=require('http');
var url=require('url');
var mime = require('mime-types');
var cache={}; //用于缓存文件
//基于socket.io 的服务器聊天功能
var chatServer=require('./lib/chat_server.js');

//构建http服务器
var server=http.createServer(function(req,res){
	var pathname=url.parse(req.url,true).pathname;
	if(pathname='/'){
		pathname+='index.html'; // 默认静态页面
	}
	var filePath=path.join(__dirname,'public',pathname); //绝对路径
	serverStatic(req,res,filePath);
})
server.listen(8080,function(){
	console.log('localhost:8080');
})
chatServer.listen(server); // server是http 服务器
//提供静态文件服务，主要是读取静态文件内容
function serverStatic(req,res,filePath){ //filename 是静态文件的地址(绝对路径)
  if(cache[filePath]){
  	sendFile(res,filePath,cache[filePath]); //从缓存中读取内容
  }else{ //若无缓存，则从文件系统中读取(或者数据库之类的)
  	fs.exists(filePath,function(exists){ //先判断文件是否存在
  		if(exists){
  			fs.readFile(filePath,'binary',function(err,data){
  				if(err){
  					send404(res); //读取文件失败，返回404
  				}else{
  					cache[filePath]=data; // 成功，将数据缓存到内存
  					sendFile(res,filePath,data); //发送数据
  				}
  			})
  		}else{
  			send404(res);
  		}
  	})
  }
}
//请求失败响应404
function send404(res){
	res.setHeader('Content-Type','text/plain');
	res.writeHead(404,'not found');
	res.end('Error 404: not found');
}
//请求成功，响应
function sendFile(res,filename,fileContent){
	
	res.writeHead(200,{ 'Content-Type': mime.lookup(path.basename(filename))});
	res.end(fileContent);
}