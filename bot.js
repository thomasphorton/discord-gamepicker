const config = require('./config');
const Discord = require('discord.js');
const client = new Discord.Client();

const gameList = require('./game-list');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  let normalizedMessage = msg.content.toLowerCase();

  if (normalizedMessage.startsWith('!gamepicker')) {
    let args = msg.content.split(' ');
    let cmd;
    args.splice(0, 1);

    if (args.length > 0) {
      cmd = args[0].toLowerCase();
    }

    switch(cmd) {
      case 'pick':
      case 'p':
        handlePickGame(msg, args);
        break;
      case 'list':
      case 'ls':
        handleGameList(msg, args);
        break;
      case 'add':
      case 'a':
        handleAddGame(msg, args);
        break;
      case 'remove':
      case 'rm':
        handleRemoveGame(msg, args);
        break;
      case 'help':
      case 'h':
      default:
        handleHelp(msg, args);
    }
  }
});

client.login(config.auth.token);

function handleHelp(msg, args) {
  msg.channel.send(require('./helptext'));
}

async function handlePickGame(msg, args) {
  let id = msg.channel.id
  let pickedGame = await gameList.pickGame(id);
  msg.channel.send(`You should play ${pickedGame}!`);
}

async function handleGameList(msg, args) {
  let id = msg.channel.id;
  let list = await gameList.getList(id)

  if (list.length < 1) {
    msg.channel.send(`This channel's game list is empty! Use \`!gamepicker add\` add to add a game to the list.`)
  }
  else {
    msg.channel.send(`This channel has ${list.length} games on its playlist.
${renderGameList(list)}
    `)
  }
}

async function handleAddGame(msg, args) {
  let gameName = args.slice(1).join(' ');

  let res = await gameList.addGame(msg.channel.id, gameName)
  msg.channel.send(`Added \`${res.addedGame}\` to the gamelist. There are now ${res.updatedGameList.length} games on this channel's playlist.
${renderGameList(res.updatedGameList)}
  `)
}

async function handleRemoveGame(msg, args) {
  let gameId = args.slice(1).join(' ');

  let res = await gameList.removeGame(msg.channel.id, gameId)
  msg.channel.send(`Removed \`${res.removedGame}\` from the gamelist. There are now ${res.updatedGameList.length} games on this channel's playlist.
${renderGameList(res.updatedGameList)}
  `);
}

function renderGameList(list) {
  return '```' + list.map((game, i) => `${i}. ${game}`).join('\n') + '```';
}
