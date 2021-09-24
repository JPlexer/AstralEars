const fs = require('fs');
const { Client, Collection, MessageEmbed,  MessageActionRow, MessageButton, Permissions } = require('discord.js');
const { bottoken, lavalinkpassword, configcolor, configname, configversion } = require('./config.json');
const client = new Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
const { Manager } = require("erela.js");
const Deezer  = require("erela.js-deezer");
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
  client.user.setActivity("your Wishes", {
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
    message.channel.send(configname + " doesn't use this prefix anymore. Please use the / commands. If they don't work for you, you might have to re-invite AstralEars here: https://jplexer.omg.lol/astralears.")
  }
});
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const gid = interaction.guild.id;
  if(!client.skippingUsers) {
    client.skippingUsers={};
  }

  if(!client.mediaPlayerMessage) {
    client.mediaPlayerMessage={};
  }

  if(!client.skippingUsers[gid]) {client.skippingUsers[gid] = []};

 
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

/*client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;
  if(!client.mediaPlayerMessage) {
    return
  }
  if(!client.mediaPlayerMessage[interaction.guild.id]) {
    return;
  }

  if (interaction.message.id == client.mediaPlayerMessage[interaction.guild.id].id) {
    if (interaction.customId == "queue") {
      const player = client.manager.players.get(interaction.guildId);
    	const queue = player.queue;
		  let embed = new MessageEmbed();
		  embed.setColor(configcolor);
		  embed.setTitle("Queue");
		  embed.addField("#1", queue.current.title + " - " + queue.current.author);
		  var i = 2;
		  queue.forEach(element => {
			  embed.addField("#" + i, element.title + " - " + element.author);
			  i++;
		  });
		  embed.setFooter(configname + " " + configversion + " - " + (player.queue.size + 1) + " items enqueued");
		  await interaction.reply({ embeds: [embed] });
    } else if (interaction.customId == "repeat") {
      if (!client.manager.players.get(interaction.guild.id).trackRepeat) {
        client.manager.players.get(interaction.guild.id).setTrackRepeat(true);
        client.updateEmbedMessage(interaction.guild.id);
        await interaction.reply('Repeating `' + client.manager.players.get(interaction.guild.id).queue.current.title + "`");
      } else {
        client.manager.players.get(interaction.guild.id).setTrackRepeat(false);
        client.updateEmbedMessage(interaction.guild.id);
        await interaction.reply('Continuing with queue.');
      }
    } else if (interaction.customId == "skip") {
      var skippingUser = interaction.member;
		var player = client.manager.players.get(interaction.guild.id)
		const gid = interaction.guild.id;
		if(!player) {interaction.reply("<:aewarning:838515499611586561> AstralEars needs to be in a Voice Channel."); return;}
		const vchannel = client.channels.cache.get(player.voiceChannel);
		if (vchannel != skippingUser.voice.channel) {
            interaction.reply("<:aewarning:838515499611586561> To skip an item, you'll need to be in the same voice channel.");
            return;
        }
        if (skippingUser.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
			client.manager.players.get(interaction.guild.id).stop();
            client.skippingUsers[gid] = [];
        } else {
       if (vchannel.members.filter(member => !member.user.bot).size / 2 > client.skippingUsers[gid].length) {
           if(client.skippingUsers[gid].includes(skippingUser.id)) {
               if(Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length) === 1) {
                interaction.reply(`<:aewarning:838515499611586561> You already voted to skip. You need ${Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length)} more person to skip.`);
                return;
               } else {
                interaction.reply(`<:aewarning:838515499611586561> You already voted to skip. You need ${Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length)} more people to skip.`);
                return;
               }
               
        } else {
            client.skippingUsers[gid].push(skippingUser.id)
            if (vchannel.members.filter(member => !member.user.bot).size / 2 > client.skippingUsers[gid].length) {
                if(Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length) === 1) {
                    interaction.reply(`<:aewarning:838515499611586561> Counted Vote! You need ${Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length)} more person to skip.`);
                return;
                   } else {
                    interaction.reply(`<:aewarning:838515499611586561> Counted Vote! You need ${Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length)} more people to skip.`);
                return;
                   }
                
            } else {
                client.skippingUsers[gid] = [];
				client.manager.players.get(interaction.guild.id).stop();
            }
        }
       } else {
        client.skippingUsers[gid] = [];
		client.manager.players.get(interaction.guild.id).stop();
       }
      }
   // }
		await interaction.reply('Skipping...');
    }
    else if (interaction.customId == "pause") {
      const player = client.manager.players.get(interaction.guildId);

      if(!player.paused) {
        client.manager.players.get(interaction.guild.id).pause(true);
        client.updateEmbedMessage(interaction.guild.id);
        const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('queue')
					.setLabel('Queue')
					.setStyle('SUCCESS'),
					new MessageButton()
					.setCustomId('repeat')
					.setLabel('Repeat')
					.setStyle('SUCCESS'),
					new MessageButton()
					.setCustomId('skip')
					.setLabel('Skip')
					.setStyle('SUCCESS'),
					new MessageButton()
					.setCustomId('pause')
					.setLabel('Resume')
					.setStyle('SUCCESS'),
					new MessageButton()
					.setCustomId('stop')
					.setLabel('Stop')
					.setStyle('SUCCESS'),
			);
        interaction.update({
          components: [row]
        })
      } else {
        client.manager.players.get(interaction.guild.id).pause(false);
        client.updateEmbedMessage(interaction.guild.id);
        const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('queue')
					.setLabel('Queue')
					.setStyle('SUCCESS'),
					new MessageButton()
					.setCustomId('repeat')
					.setLabel('Repeat')
					.setStyle('SUCCESS'),
					new MessageButton()
					.setCustomId('skip')
					.setLabel('Skip')
					.setStyle('SUCCESS'),
					new MessageButton()
					.setCustomId('pause')
					.setLabel('Pause')
					.setStyle('SUCCESS'),
					new MessageButton()
					.setCustomId('stop')
					.setLabel('Stop')
					.setStyle('SUCCESS'),
			);
        interaction.update({
          components: [row]
        })
      }
    }
    else if (interaction.customId == "stop") {
		var player = client.manager.players.get(interaction.guild.id)
		const vchannel = client.channels.cache.get(player.voiceChannel);
      if (interaction.user.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES) || vchannel.members.filter(member => !member.user.bot).size <= 2) {
        const player = client.manager.players.get(interaction.guildId);
      client.mediaPlayerMessage[interaction.guild.id].unpin();
      let embed = new MessageEmbed();
      embed.setTitle(configname);
      embed.setColor(configcolor);
      embed.setDescription("That's all folks! Thanks for using "+ configname+"!");
        
      client.mediaPlayerMessage[interaction.guild.id].edit({ embeds: [embed] });
      client.mediaPlayerMessage[interaction.guild.id] = false;
      interaction.reply("That's all folks! Thanks for using "+ configname+"!");
      player.destroy();
      } else {
		interaction.reply(`<:aewarning:838515499611586561> You are not allowed to Stop `);
          }
      
    }
  } else {
    return;
  }
  
});*/


client.login(bottoken);