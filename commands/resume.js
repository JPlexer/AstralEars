const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Resume the currently playing song'),
	async execute(interaction, client) {
		client.manager.players.get(interaction.guild.id).pause(false)
		await interaction.reply('Resumed the currently playing Track!');
	},
};