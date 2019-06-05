# GamePicker Discord Bot

This bot aims to answer the question of 'What are we playing tonight?'.

## Invoking the Bot

### Commands
* `!gp set steamid <steamid>: Sets Steam ID string for the current user.`
* `!gp get steamid: Fetches the current user's Steam ID.`
* `!gp showlist [discordUser]: Shows the GameCollection shared between mentioned users.`
* `!gp pickrandom [discordUser]: Picks a random game from the GameCollection shared between mentioned users.`

## Running the Bot
The bot is currently deployed on an AWS EC2 instance, kept alive with [pm2](https://www.npmjs.com/package/pm2).
