const { SlashCommandBuilder } = require('@discordjs/builders');
const { Discord } = require('discord.js');
const { configcolor, configname} = require('../config.json');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Help!'),
	async execute(interaction) {
		let embed = new Discord.MessageEmbed();
            embed.setTitle( configname+ " Help");
            embed.setDescription("Here are some things you can try.");
            embed.setColor(configcolor);
            embed.addField("Enqueue an item", "To enqueue an item, simply place the search query or URL after the prefix. For example,\n" + config.prefix + "https://www.youtube.com/watch?v=dQw4w9WgXcQ\n" + config.prefix + "DiscoVision");
            embed.addField("Using the player", "When music is playing, a pinned message will indicate the current status of the player. Reactions to that message can be used to control the player.");
			embed.setFooter(configname + " " + configversion);
			await interaction.reply({ embeds: [embed] });
	},
};