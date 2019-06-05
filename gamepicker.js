const config = require('./config');
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: config.aws.region});
const cloudWatch = new AWS.CloudWatch({region: config.aws.region});

const SteamAPI = require('steamapi');
const steam = new SteamAPI(config.auth.steam_token);

module.exports = {
  updateSteamId: function(discordUserId, steamId) {
    return new Promise((resolve, reject) => {
      let params = {
        TableName: config.aws.discordUsersTableName,
        Key: {
          'discordUserId': discordUserId
        },
        UpdateExpression: 'set #steamId = :steamId',
        ExpressionAttributeNames: { '#steamId': 'steamId' },
        ExpressionAttributeValues: { ':steamId': steamId }
      };

      docClient.update(params, (err, data) => {
        if (err) {
          cloudWatch.putMetricData({
            MetricName: 'GamePicker',
            Dimensions: [{
              Name: 'updateSteamIdError',
              Value: 1
            }]
          }, (e, d) => {
            reject(err);
          })
        }
        else {
          resolve(steamId)
        }
      });
    });
  },

  getSteamId: function(discordUserId) {
    return new Promise((resolve, reject) => {
      let params = {
        TableName: config.aws.discordUsersTableName,
        Key: {
          'discordUserId': discordUserId
        }
      };

      docClient.get(params, (err, data) => {
        if (err) reject(err);
        else {
          resolve(data.Item.steamId);
        }
      })
    });
  },

  createList: function(discordUserIds) {
    return new Promise(async (resolve, reject) => {

      try {
        // Get steam game list for each user.
        let getOwnedGameLists = discordUserIds.map(async discordUserId => {
          let steamId = await this.getSteamId(discordUserId);
          let id = await steam.resolve(`https://steamcommunity.com/id/${steamId}`);
          let games = await steam.getUserOwnedGames(id);

          return {
            discordUserId,
            games
          };
        })

        let ownedGameLists = await Promise.all(getOwnedGameLists)
        let combinedGameList = {};

        // Iterate through individual lists to form a combined list.
        ownedGameLists.forEach(gameList => {
          gameList.games.forEach(game => {

            // If the game ID is new, create a new object.
            if (combinedGameList[game.appID] === undefined) {
              combinedGameList[game.appID] = {
                game: game,
                ownedBy: [gameList.discordUserId]
              };

            // Otherwise, add the the user ID to the list of owners.
            }
            else {
              combinedGameList[game.appID].ownedBy.push(gameList.discordUserId)
            }
          })
        });

        // Transform the game object into an Array and sort it.
        let gameList = Object.values(combinedGameList).sort(compare);

        resolve(gameList);
      }
      catch(err) {
        reject(err);
      }
    });
  }
}

function compare(a, b) {
  let comparison = 0;

  if (a.ownedBy.length < b.ownedBy.length) {
    comparison = 1;
  }
  else {
    comparison = -1;
  }

  return comparison
}
