const fs = require('fs');
const { Client, Collection } = require('discord.js');
const { bottoken, lavalinkpassword } = require('./config.json');
const client = new Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
const { Manager } = require("erela.js");
const Deezer  = require("erela.js-deezer");
const AppleMusic  = require("erela.js-apple");
const Spotify = require("better-erela.js-spotify").default;

// Define some options for the node
const nodes = [
  {
    host: "127.0.0.1",
    password: lavalinkpassword,
    port: 2333,
  }
];

// Assign Manager to the client variable
client.manager = new Manager({
  // The nodes to connect to, optional if using default lavalink options
  nodes,
  plugins: [
    // Initiate the plugin
    new Deezer(),
    new AppleMusic(),
    new Spotify()
  ],
  // Method to send voice data to Discord
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    // NOTE: FOR ERIS YOU NEED JSON.stringify() THE PAYLOAD
    if (guild) guild.shard.send(payload);
  }
});

// Emitted whenever a node connects
client.manager.on("nodeConnect", node => {
    console.log(`Node "${node.options.identifier}" connected.`)
})

// Emitted whenever a node encountered an error
client.manager.on("nodeError", (node, error) => {
    console.log(`Node "${node.options.identifier}" encountered an error: ${error.message}.`)
})

client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));



for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.once('ready', c => {
  client.manager.init(client.user.id);
	console.log(`Ready! Logged in as ${c.user.tag}`);
  client.user.setActivity("to your Wishes", {
    type: "LISTENING"
  });
});

client.manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  // Send a message when the track starts playing with the track name and the requester's Discord tag, e.g. username#discriminator
  channel.send(`Now playing: \`${track.title}\`, requested by \`${track.requester.tag}\`.`);
  });
  
  // Emitted the player queue ends
  client.manager.on("queueEnd", player => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send("That's all folks. Thanks for using AstralEars!");
  player.destroy();
  });

// THIS IS REQUIRED. Send raw events to Erela.js
client.on("raw", d => client.manager.updateVoiceState(d));

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
 
	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction, client);
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


client.login(bottoken);