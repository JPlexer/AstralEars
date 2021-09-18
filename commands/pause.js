const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pause the currently playing song'),
	async execute(interaction, client) {
		client.manager.players.get(interaction.guild.id).pause(true);
		client.updateEmbedMessage(interaction.guild.id);
		await interaction.reply("Paused the currently playing Track!");
	},
};