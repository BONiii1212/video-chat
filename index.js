const express = require('express');
const app = express();
const fs = require('fs')
const http = require('http').createServer(app)


let sslOptions = {
    key: fs.readFileSync('/Users/louyangbo/Project/video_talk/static/ssl.key'),
    cert: fs.readFileSync('/Users/louyangbo/Project/video_talk/static/ssl.crt')
}

const https = require('https').createServer(sslOptions, app)
const io = require('socket.io')(https)

https.listen(443,()=>{
    console.log('https listen on')
})

app.use("/static", express.static('static/'))

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/index.html')
})

app.get('/camera', (req, res)=>{
    res.sendFile(__dirname+'/camera.html')
})

// 监听新链接，并输出socket.id
io.on("connection", (socket) => {
    // 加入子房间
    socket.join(socket.id)
    console.log("a user connected" + socket.id)

    // socket.on("disconnect", ()=> {
    //     console.log("user disconnected" + socket.id)
    // })

    socket.on("chat message",(msg)=>{
        console.log(socket.id+"say"+msg)
        // io.emit("chat message", msg)
        socket.broadcast.emit("chat message", msg) // 广播
    })
    // 新用户请求加入
    socket.on('new user greet',(data)=>{
        console.log(socket.id + 'greet' + data.msg)
        socket.broadcast.emit('need connect', {sender:socket.id, msg:data.msg})
    })
    // 老用户同意新用户加入
    socket.on('ok we connect',(data)=>{
        io.to(data.receiver).emit('ok we connect',{sender: data.sender})
    })
    // 用户失去连接
    socket.on('disconnect', () =>{ 
        socket.broadcast.emit('user disconnected',socket.id)
    })
    //sdp 消息的转发
    socket.on( 'sdp', ( data ) => {
        console.log('sdp');
        console.log(data.description);
        //console.log('sdp:  ' + data.sender + '   to:' + data.to);
        socket.to( data.to ).emit( 'sdp', {
            description: data.description,
            sender: data.sender
        } );
    } );
    //candidates 消息的转发
    socket.on( 'ice candidates', ( data ) => {
        console.log('ice candidates:  ');
        console.log(data);
        socket.to( data.to ).emit( 'ice candidates', {
            candidate: data.candidate,
            sender: data.sender
        } );
    } );
})


// http.listen(3000, () => {
//     console.log('listening on *:3000')
// })
