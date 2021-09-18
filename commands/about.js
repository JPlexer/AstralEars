const { SlashCommandBuilder } = require('@discordjs/builders');
const { Discord } = require('discord.js');
const { configcolor, configname, configversion} = require('../config.json');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('About the Bot'),
	async execute(interaction) {
		let embed = new Discord.MessageEmbed();
        embed.setTitle(`About ${configname}`);
        embed.setDescription("This is a Music Bot originally developed by vicr123, but now revived and maintained by JPlexer.");
        embed.setColor(configcolor);
        embed.addField("License", "This Bot is licenced under the GPL v3 License.");
        embed.addField("Github", "The Source Code of the Bot is available at https://github.com/JPlexer/AstralEars");
		embed.setFooter(configname + " " + configversion);
		await interaction.reply({ embeds: [embed] });
	},
};