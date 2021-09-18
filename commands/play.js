const {
	SlashCommandBuilder
} = require('@discordjs/builders');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Add a song to the queue')
		.addStringOption(option => option.setName('input').setDescription('Link or Name').setRequired(true)),
	async execute(interaction, client) {
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

		// Connect to the voice channel and add the track to the queue
		player.connect();
		player.queue.add(res.tracks[0]);

		// Checks if the client should play the track if it's the first one added
		if (!player.playing && !player.paused && !player.queue.size) player.play()

		return interaction.reply(`enqueuing \`${res.tracks[0].title}\`.`);
	},
};