const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('repeat')
		.setDescription('Repeat the currently playing song'),
	async execute(interaction) {
		await interaction.reply('repeat');
	},
};