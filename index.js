const net = require('net');
var request = require("request")
var converter = require('hex2dec');
const Discord = require('discord.js');
const client = new Discord.Client();
const mysql = require('mysql');

let servers = [{
    "name": "eu-1",
    "ip": "46.4.227.67",
    "port": 10455,
    "chat": "798233942464659456",
  },
  {
    "name": "eu-2",
    "ip": "46.4.227.67",
    "port": 10456,
    "chat": "798234381776060446",
  },
  {
    "name": "eu-3",
    "ip": "creftan.com",
    "port": 10455,
    "chat": "798238164837466163",
  },
  {
    "name": "eu-4",
    "ip": "creftan.com",
    "port": 10456,
    "chat": "798238182931955752",
  },
  {
    "name": "eu-5",
    "ip": "creftan.com",
    "port": 10457,
    "chat": "798238295724916757",
  },
  {
    "name": "ru-1",
    "ip": "217.15.194.94",
    "port": 10455,
    "chat": "798238330697416734"
  },
  {
    "name": "ru-2",
    "ip": "217.15.194.94",
    "port": 10456,
    "chat": "798238347634016346",
  },
  {
    "name": "ru-3",
    "ip": "217.15.194.94",
    "port": 10457,
    "chat": "798238363655995482",
  },
  {
    "name": "ru-4",
    "ip": "217.15.194.94",
    "port": 10458,
    "chat": "798238379305074738",
  },
  {
    "name": "ru-5",
    "ip": "217.15.194.94",
    "port": 10459,
    "chat": "798238405448040450",
  },
  {
    "name": "us-1",
    "ip": "97.94.74.187",
    "port": 10455,
    "chat": "798238423504650251",
  },
  {
    "name": "us-2",
    "ip": "97.94.74.187",
    "port": 10455,
    "chat": "798238439429636146",
  },
]

var server = "";
var port = "";
var chatChannel = "";

var myArgs = process.argv.slice(2);

servers.forEach(function(item, index) {
  switch (myArgs[0]) {
    case item.name:
      console.log(item.ip + " " + item.port + " " + item.chat);
      server = item.ip;
      port = item.port;
      chatChannel = item.chat;
      break;
  }
})

var con = mysql.createConnection({
  host: "",
  user: "",
  password: "",
  database: ""
});

client.login('clienttoken');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.member.roles.cache.some(r => ["Admin", "Dev", "Mod", "Server Staff", "Proficient", "Staff"].includes(r.name)) && chatChannel === msg.channel.id) {
    messageGameServer(`Staff: ${msg.content}`);
  } else {

  }
})

client.on('message', msg => {
  console.log(msg.content);
  console.log(msg.channel.id);
})

function getSteamName(steamid, message, discordChannel) {
  var newSteamID = converter.hexToDec(steamid.toString('hex'));
  var url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=FAD2F299F66CCE4B55D86996BB0A998D&steamids=https://steamid.io/lookup/" + newSteamID;
  request({
    url: url,
    json: true
  }, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log('console.log: ' + body.response.players[0].personaname + message + " (" + newSteamID + ")") // Print the json response
      /* Embed msg from game server */

      const msgembed = new Discord.MessageEmbed()
        .setDescription(`[${body.response.players[0].personaname}](http://steamcommunity.com/profiles/${newSteamID}): ${message}`)
      client.channels.cache.get(chatChannel).send(msgembed);
    }
  })
}

let connected = false;
var clientSocket = new net.Socket();

clientSocket.connect(port, server, function() {
  if (!myArgs[0]) {
    console.log('Connected to: ' + server + ' ' + port)
  } else {
    console.log('Connected to: ' + server + ' ' + port + "(" + myArgs[0].toUpperCase())
    connected = true;
    clientSocket.write(Buffer.from([0x01]));
  }
});

clientSocket.on('close', function() {
  connected = false;
  console.log('Connection closed');
});

clientSocket.on('readable', () => {
  let chunk;
  while ((chunk = clientSocket.read(1)) != null) {
    let cmd = chunk.readInt8();
    switch (cmd) {
      case 0x13: {
        let buffer = clientSocket.read(4);
        let length = buffer.readInt32BE();
        let msg = clientSocket.read(length);
        let id = clientSocket.read(8);
        let filter = (clientSocket.read(1)).readInt8();
        getSteamName(id, "[" + filter + "]" + ": " + msg.toString('utf8', 0, msg.indexOf('\0')))
        break;
      }
      default:
        clientSocket.read();
    }
  }
});

function messageGameServer(msg) {
  let buffer = Buffer.alloc(1 + 4 + (msg.length * 4) + 8 + 1);
  buffer.writeUInt8(0x13);
  buffer.writeUInt32BE(msg.length * 4, 1);
  buffer.write(msg, 5);
  buffer.writeUInt32BE(0, 5 + (msg.length * 4));
  buffer.writeUInt32BE(0, 5 + (msg.length * 4) + 4);
  buffer.writeUInt8(0, 5 + (msg.length * 4) + 1);
  clientSocket.write(buffer);
}

setInterval(function() {
  if (connected) {
    clientSocket.write(Buffer.from([0x01]));
  }
}, 5000);