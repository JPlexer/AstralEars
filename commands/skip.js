const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Vote to skip to the next song'),
	async execute(interaction) {
		await interaction.reply('skip');
	},
};