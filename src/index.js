const express = require("express");
const path = require("path");
const mysql = require("mysql")
require('dotenv').config()

var hist
let fecha_in=0
let fecha_fin=0
let fecha=0
let press_lat=0
let press_lng=0
var ruta

const dgram = require('dgram');
const req = require("express/lib/request");
const { timeStamp } = require("console");
const server = dgram.createSocket('udp4');

const data = {
  lat: "",
  long: "",
  time: "",
  date: "",
}

var con = mysql.createConnection({  
  host: process.env.HOST,  
  user: process.env.USER_DB,  
  password: process.env.PASSWORD,  
  database: process.env.DB  
});  
con.connect(function(err) {  
if (err) throw err;  
console.log("Connected!");})  

const app = express();
app.use(express.static(path.join(__dirname , "public")));
app.use(express.json())

app.get("/", (req, res) => {
  console.log(true)
  res.sendFile(path.join(__dirname + "/public/main.html"));
});

app.get('/data',(req,res)=>{
  con.query('select * from datos ORDER BY id DESC LIMIT 1',(err,message)=>{
   
     res.status(200).json({
      data: message
    });
    
  });
});


server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});
server.on('message', async (msg, senderInfo) => {
  console.log('Messages received ' + msg)
  const mensaje = String(msg).split("\n")

  const variables = 
  data.lat = mensaje[0].split(" ")[1]
  data.long = mensaje[1].split(" ")[1]
  data.time = mensaje[2].split(" ")[2];
  data.date = mensaje[2].split(" ")[1].slice(1)
  fecha = data.date+" "+data.time;

  var ts = new Date(fecha).getTime();
  console.log(ts);

  

  var sql = `INSERT INTO datos (latitud , longitud, hora, fecha,timestamp) VALUES ('${data.lat}','${data.long}','${data.time}','${data.date}','${ts}')`;
  con.query(sql, function (err, result) {  
    if (err) throw err;  
    console.log("dato recibido");  
    });  
});
server.on('listening', (req, res) => {
  const address = server.address();
  console.log(`server listening on ${address.address}:${address.port}`);
});

app.post("/historicos", function(req, res) {
  
    hist = req.body;
    fecha_in= hist[0];
    fecha_fin=hist[1];
    
});

app.get('/request',(req,res)=>{

    con.query(`select latitud,longitud, fecha, hora from datos where timestamp between'${fecha_in}' and '${fecha_fin}' 
      order by id`,(err, historial,fields)=>{
      
      res.status(200).json({
        data: historial,
      });
    })

})

app.post("/update", function(req, res) {
  console.log("Actualizado")

})

app.post("/rutas", function(req, res) {
  
  ruta = req.body;
  press_lat=ruta.lat;
  press_lng=ruta.lng;

  console.log(press_lat)
  console.log(press_lng)

  var rutas = con.query(`select * from datos where (latitud-'${press_lat}')*(latitud-'${press_lat}')+(longitud-('${press_lng}'))*(longitud-('${press_lng}'))<0.0001 order by id`,
  (err, historial,fields)=>{
    
    console.log(historial)
    res.json(historial)
  })

});



server.bind(3020);

app.listen(3000,()=>{
    console.log(`server connected http://localhost:${3000}`)
});