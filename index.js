const fs = require('fs')
const express = require('express');
const app = express();
var cors = require('cors');
const BodyParse = require('body-parser')
var request = require("request");

var user = "bitcoin";
var password = "local321"
var port = 16112;
var data;
getMNInfo(function(d){
  data = d;
  console.log("Total MN", data.totalmn);
})

setInterval(() => {
  getMNInfo(function(d){
    data = d;
    console.log("Total MN", data.totalmn);
  })
}, 60 * 15);

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

app.get("/chaininfo", (req, res) => { // mongoDB
  res.json(data);
  res.end();
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

//#endregion
function calculateSupply (blockHeight) {
  if (blockHeight < 8000) {
    return 80000
  }
  var epochs = Math.floor((blockHeight - 1) / 2102400)
  var remainder = (blockHeight - 1) % 2102400
  var previousEpochsTotalReward = 0
  for (var epoch = 0; epoch < epochs; epoch++) {
    previousEpochsTotalReward = previousEpochsTotalReward + (2102400 * (20 / Math.pow(2, epoch)))
  }
  var currentEpochReward = 20 / Math.pow(2, epochs)
  var currentTotalReward = (remainder + 1) * currentEpochReward
  return previousEpochsTotalReward + currentTotalReward - 79980
}

function calculateSupplyGemlink (blockHeight) {
  var epochs = Math.floor((blockHeight - 1) / 2102400)
  var remainder = (blockHeight - 1) % 2102400
  var previousEpochsTotalReward = 0
  for (var epoch = 0; epoch < epochs; epoch++) {
    previousEpochsTotalReward = previousEpochsTotalReward + (2102400 * (30 / Math.pow(2, epoch)))
  }
  var currentEpochReward = 30 / Math.pow(2, epochs)
  var currentTotalReward = (remainder + 1) * currentEpochReward
  return previousEpochsTotalReward + currentTotalReward
}

function calculateSupplyNew (blockHeight) {
  if (blockHeight < 2167200) {
    return calculateSupply(blockHeight);
  } else if(blockHeight == 2167200) {
    return calculateSupply(2102400) + 10000000 + 30;
  } else {
    return calculateSupply(2102400) + 10000000 + 30 + calculateSupplyGemlink(blockHeight - 2167200);
  }
}

function getMNInfo(callback){
  data = {};
  curlData(user, password, port, "listmasternodes", [], function(mnlist){
    data.totalmn = mnlist.result.result.filter(function(item){
      return item.status == "ENABLED"
    }).length;
    data.firstpayment = Math.floor(data.totalmn * 2.6);
    curlData(user, password, port, "getinfo", [], function(info){
      data.circulating = calculateSupplyNew(info.result.result.blocks);
      data.maxsupply = 160000000;
      data.mnlist = mnlist.result.result;
      callback(data);
    })
  })
}
function curlData(username, password, port, methods, params, callback) {
  var options = {
    url: "http://localhost:" + port,
    method: "post",
    headers: {
      "content-type": "text/plain",
    },
    auth: {
      user: username,
      pass: password,
    },
    body: JSON.stringify({
      jsonrpc: "1.0",
      id: "getdata",
      method: methods,
      params: params,
    }),
  };

  request(options, function (error, response, body) {
    if (error) {
      callback({
        error
      });
    } else {
      var data = body;
      try {
        data = JSON.parse(body);
      } catch (ex) {}
      callback({
        result: data
      });
    }
  });
}



app.listen(1234);