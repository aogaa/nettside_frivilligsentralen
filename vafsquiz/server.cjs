const http=require('http'),fs=require('fs'),path=require('path');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.mp3':'audio/mpeg'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p.endsWith('/'))p+='index.html';
  const fp=path.join(__dirname,p);
  fs.readFile(fp,(e,d)=>{
    if(e){res.writeHead(404);res.end('404');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(fp)]||'application/octet-stream'});
    res.end(d);
  });
}).listen(8765,()=>console.log('listening on 8765'));
