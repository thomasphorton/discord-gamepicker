const config = require('./config');
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: config.aws.region});

module.exports = {
  pickGame: function(id) {
    return new Promise(async (resolve, reject) => {
      let list = await this.getList(id)
      let pickedGame = list[Math.floor(Math.random() * list.length)];
      resolve(pickedGame);
    })
  },

  getList: function(id) {
    return new Promise((resolve, reject) => {

      let params = {
        TableName: config.aws.gameListTableName,
        Key: {
          'channelID': id
        }
      };

      docClient.get(params, (err, data) => {
        if (err) console.log(err);
        else {
          if (!data.Item || !data.Item.games || data.Item.games.length < 1) {
            resolve([])
          } else {
            resolve(data.Item.games);
          }
        }
      })
    })
  },

  updateGameList: function(channelId, list) {
    return new Promise((resolve, reject) => {
      let params = {
        TableName: config.aws.gameListTableName,
        Key: {
          'channelID': channelId
        },
        UpdateExpression: 'set #gameList = :gameList',
        ExpressionAttributeNames: { '#gameList': 'games' },
        ExpressionAttributeValues: { ':gameList': list }
      };

      docClient.update(params, (err, data) => {
        if (err) console.log(err);
        else {
          resolve(list);
        }
      });
    })
  },

  addGame: function(channelId, gameName) {
    return new Promise(async (resolve, reject) => {
      let list = await this.getGameList(channelId);
      list.push(gameName);
      let updatedGameList = await this.updateGameList(channelId, gameList);
      resolve({addedGame: gameName, updatedGameList});
    })
  },

  removeGame: function(channelId, gameId) {
    return new Promise(async (resolve, reject) => {
      let list = await this.getList(channelId);
      let removedGame = list.splice(gameId, 1);
      let updatedGameList = await this.updateGameList(channelId, list);
      resolve({removedGame, updatedGameList});
    })
  }
}
