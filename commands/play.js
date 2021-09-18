const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const { MessageEmbed,  MessageActionRow, MessageButton } = require('discord.js');
const { configcolor, configname, configversion} = require('../config.json');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Add a song to the queue')
		.addStringOption(option => option.setName('input').setDescription('Link or Name').setRequired(true)),
	async execute(interaction, client) {
		const gid = interaction.guild.id;
		const command = interaction.options.getString('input');
		if (!interaction.member.voice.channel) return interaction.reply("you need to join a voice channel.");
		if (!command.length) return interaction.reply("you need to give me a URL or a search term.");

		const search = command;
		let res;

		try {
			// Search for tracks using a query or url, using a query searches youtube automatically and the track requester object
			res = await client.manager.search(search, interaction.member.user);
			// Check the load type as this command is not that advanced for basics
			if (res.loadType === "LOAD_FAILED") throw res.exception;
			else if (res.loadType === "PLAYLIST_LOADED") throw {
				message: "Playlists are not supported with this command."
			};
		} catch (err) {
			return interaction.reply(`there was an error while searching: ${err.message}`);
		}

		// Create the player 
		const player = client.manager.create({
			guild: interaction.guild.id,
			voiceChannel: interaction.member.voice.channel.id,
			textChannel: interaction.channel.id,
		});

		if(!client.mediaPlayerMessage[gid]) {
			let embed = new MessageEmbed();
			embed.setTitle(configname);
			embed.setColor(configcolor);
			embed.setDescription("Welcome to "+ configname +"! Initializing media player...");
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
			var message = interaction.channel.send({ embeds: [embed], components: [row] });
			client.mediaPlayerMessage[gid] = await message;
			client.mediaPlayerMessage[gid].pin();
		}
		// Connect to the voice channel and add the track to the queue
		player.connect();
		player.queue.add(res.tracks[0]);
		
		// Checks if the client should play the track if it's the first one added
		if (!player.playing && !player.paused && !player.queue.size) player.play();


		let embed = new MessageEmbed();
		embed.setColor(configcolor);
		embed.setTitle(configname);
		embed.setDescription("<:aesuccess:838515500169822268> Enqueued!");
		embed.addField("Item", res.tracks[0].title + "\n" + res.tracks[0].author);
		embed.setFooter(configname + " " + configversion + " - " + (player.queue.size + 1) + " items enqueued");
		client.updateEmbedMessage(gid);
		return interaction.reply({ embeds: [embed] });
	},
};