const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('repeat')
		.setDescription('Repeat the currently playing song'),
	async execute(interaction, client) {
		if (!client.manager.players.get(interaction.guild.id).trackRepeat) {
			client.manager.players.get(interaction.guild.id).setTrackRepeat(true);
			client.updateEmbedMessage(interaction.guild.id);
			await interaction.reply('Repeating `' + client.manager.players.get(interaction.guild.id).queue.current.title + "`");
		} else {
			client.manager.players.get(interaction.guild.id).setTrackRepeat(false);
			client.updateEmbedMessage(interaction.guild.id);
			await interaction.reply('Continuing with queue.');
		}
	},
};