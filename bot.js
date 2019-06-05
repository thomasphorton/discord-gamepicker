const config = require('./config');
const Discord = require('discord.js');
const client = new Discord.Client();

const gamepicker = require('./gamepicker');

const botInvocation = `!gp`;
// const botInvocation = `!gamepicker`;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  let normalizedMessage = msg.content.toLowerCase();

  if (normalizedMessage.startsWith(botInvocation)) {
    let args = msg.content.split(' ');
    let cmd;
    args.splice(0, 1);

    if (args.length > 0) {
      cmd = args[0].toLowerCase();
      args.splice(0, 1);
    }

    switch(cmd) {
      case 'set':
        handlers.set(msg, args);
        break;
      case 'get':
        handlers.get(msg, args);
        break;
      case 'showlist':
        handlers.showList(msg, args);
        break;
      case 'pick':
        handlers.pickRandom(msg, args);
        break;
      case 'help':
      case 'h':
      default:
        handlers.help(msg, args);
    }
  }
});

client.login(config.auth.token);

let handlers = {
  set: async function (msg, args) {
    if (args[0].toLowerCase() === 'steamid') {
      let discordUserId = msg.author.id;
      let steamId = args[1];

      try {
        let res = await gamepicker.updateSteamId(discordUserId, steamId);
        msg.reply(`I've set your Steam ID to '${steamId}'`)
      }
      catch(err) {
        console.log(err);
        msg.reply(`Error updating your Steam ID to '${steamId}'`);
      }
    }
  },

  get: async function(msg, args) {
    if (args[0].toLowerCase() === 'steamid') {
      let discordUserId = msg.author.id;

      try {
        let steamId = await gamepicker.getSteamId(discordUserId);
        msg.reply(`I've got your Steam ID recorded as '${steamId}'. You can update it with \`${botInvocation} set steamid <YOUR ID>\`.`);
      }
      catch(err) {
        console.log(err);
        msg.reply(`Error retrieving your Steam Id.`);
      }
    }
  },

  showList: async function(msg, args) {
    let users = msg.mentions.users;

    if (users.size === 0) {
      msg.channel.send(`No users have been selected. Mention them with \`${botInvocation} showlist @Player1 @Player2\``);
    }
    else {
      let discordUserIds = msg.mentions.users.map(user => user.id);

      try {
        let gameList = await gamepicker.createList(discordUserIds);

        // Display only the first 10 games.
        gameList = gameList.slice(0, 10);

        msg.channel.send(renderGameList(gameList, users.size));
      }
      catch(err) {
        console.log(err);
        msg.channel.send(`There was an error creating a gamelist for the provided users.`);
      }

    }
  },

  pickRandom: async function(msg, args) {
    let users = msg.mentions.users;

    if (users.size === 0) {
      msg.channel.send(`No users have been selected. Mention them with \`${botInvocation} pick @Player1 @Player2\``);
    }
    else {
      let discordUserIds = msg.mentions.users.map(user => user.id);
      let gameList = await gamepicker.createList(discordUserIds);

      let pickedGame = gameList[Math.floor(Math.random() * gameList.length)];

      msg.channel.send(`You should play ${pickedGame.game.name}!`);
    }
  },

  help: async function(msg, args) {
    msg.channel.send(require('./helptext'));
  }
}

function renderGameList(list, totalUsers) {
  let markup = '```\n';

  list.forEach((item, i) => {
    let game = item.game;

    let ownershipMessage = `Owned by ${item.ownedBy.length}/${totalUsers}`;

    if (item.ownedBy.length === totalUsers) {
      ownershipMessage = `Owned by everyone!`;
    }

    markup += `${i}. ${game.name} | ${ownershipMessage}\n`
  });

  markup += '```';

  return markup;
}
