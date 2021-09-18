const fs = require('fs');
const { Client, Collection, MessageEmbed } = require('discord.js');
const { bottoken, lavalinkpassword, configcolor, configname, configversion } = require('./config.json');
const client = new Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
const { Manager } = require("erela.js");
const Deezer  = require("erela.js-deezer");
const AppleMusic  = require("erela.js-apple");
const Spotify = require("better-erela.js-spotify").default;
const play = require('./commands/play');

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
  client.updateEmbedMessage(channel.guildId);
  channel.send(`Now playing: \`${track.title}\`, requested by \`${track.requester.tag}\`.`);
  });
  
  // Emitted the player queue ends
  client.manager.on("queueEnd", player => {
  const channel = client.channels.cache.get(player.textChannel);
  client.mediaPlayerMessage[client.channels.cache.get(player.textChannel).guildId].unpin();
  let embed = new MessageEmbed();
	embed.setTitle(configname);
	embed.setColor(configcolor);
	embed.setDescription("That's all folks! Thanks for using "+ configname+"!");
		
	client.mediaPlayerMessage[client.channels.cache.get(player.textChannel).guildId].edit({ embeds: [embed] });
  client.mediaPlayerMessage[client.channels.cache.get(player.textChannel).guildId] = false;
  channel.send("That's all folks! Thanks for using "+ configname+"!");
  player.destroy();
  });

  client.updateEmbedMessage = function (gid) {
    const player = client.manager.players.get(gid);
    const queue = player.queue;

      let embed = new MessageEmbed();
      embed.setTitle(configname);
      
      embed.addField("Item", queue.current.title + "\n" + queue.current.author);
      embed.addField("Requested by", queue.current.requester.tag);
      if (player.paused) {
        embed.setDescription("Paused");
        embed.setColor("#FFC000");
      } else {
        embed.setDescription("Now Playing");
        embed.setColor(configcolor);
      }
  
      let flags = "";
      if (player.trackRepeat) {
        flags += "🔂";
      } else {
        flags += "▶"
      }
      embed.setFooter(flags + " - "+ configname +" " + configversion + " - " + parseInt(queue.length) + " items enqueued");
      embed.setImage(queue.current.thumbnail);
  
      if (queue.length > 0) {
          embed.addField("Up Next", queue[0].title + "\n" + queue[0].author);
          client.mediaPlayerMessage[gid].edit({ embeds: [embed] });
      } else {
        client.mediaPlayerMessage[gid].edit({ embeds: [embed] });
      }
  
  }

// THIS IS REQUIRED. Send raw events to Erela.js
client.on("raw", d => client.manager.updateVoiceState(d));
client.on('messageCreate', function(message) {
  if(message.content.startsWith("ae:")) {
    message.channel.send(configname + " doesn't use this prefix anymore. Please use the / commands.")
  }
});
client.on('interactionCreate', async interaction => {
  const gid = interaction.guild.id;
  if(!client.skippingUsers) {
    client.skippingUsers={};
  }

  if(!client.mediaPlayerMessage) {
    client.mediaPlayerMessage={};
  }

  if(!client.skippingUsers[gid]) {client.skippingUsers[gid] = []};

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