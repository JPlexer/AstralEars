const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pause the currently playing song'),
	async execute(interaction, client) {
		client.manager.players.get(interaction.guild.id).pause(true)
		await interaction.reply("Paused the currently playing Track!");
	},
};