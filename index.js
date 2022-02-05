const fs = require('fs')
const express = require('express');
const app = express();
var cors = require('cors');
const BodyParse = require('body-parser')

app.all('', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  // Auth Each API Request created by user.
  next();
});

app.use(function (req, res, next) {
  if (req.path.indexOf('.') === -1) {
    res.setHeader('Content-Type', 'text/html');
  }
  next();
});
app.use('/', express.static(__dirname + '/.well-known'));
app.use(express.static(__dirname + '/'));
app.use(BodyParse.urlencoded({ extended: false }));
app.use(BodyParse.json());
app.use(cors());

var coinsList = {}
var coinsListBeta = {}

if (fs.existsSync("coinlist.json")) {
  coinsList = getJson("coinlist.json");
}
if (fs.existsSync("coins_beta.json")) {
  coinsListBeta = getJson("coins_beta.json");
}

app.get("/getcoins", (req, res) => { // mongoDB
  res.json(coinsList);
  res.end();
})

app.get("/getcoinsbeta", (req, res) => { // mongoDB
  res.json(coinsList);
  res.end();
})

app.get("/gemcore", (req, res) => { // mongoDB
  if(req.query.coin)
  {
    var data = getJson("gemcore/" + req.query.coin.toLocaleLowerCase() + ".json");
    res.json(data);
    res.end();
  }
})

app.get("/gemcore/beta", (req, res) => { // mongoDB
  if(req.query.coin)
  {
    var data = getJson("gemcore/beta/" + req.query.coin.toLocaleLowerCase() + ".json");
    res.json(data);
    res.end();
  }
})

function getJson(file) {
  try {
    var text = fs.readFileSync(file, "utf8");
    text = JSON.parse(text);
    console.log(text);
    return text;
  }
  catch (_) {
    return []
  }
}

app.listen(1234);