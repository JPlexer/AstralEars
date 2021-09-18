const { SlashCommandBuilder } = require('@discordjs/builders');
const {MessageEmbed} = require("discord.js");
const {configcolor, configname, configversion} = require("../config.json");
module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Show the queue'),
	async execute(interaction, client) {
		const player = client.manager.players.get(interaction.guildId);
    	const queue = player.queue;
		let embed = new MessageEmbed();
		embed.setColor(configcolor);
		embed.setTitle("Queue");
		embed.addField("#1", queue.current.title + " - " + queue.current.author);
		var i = 2;
		queue.forEach(element => {
			embed.addField("#" + i, element.title + " - " + element.author);
			i++;
		});
		embed.setFooter(configname + " " + configversion + " - " + (player.queue.size + 1) + " items enqueued");
		await interaction.reply({ embeds: [embed] });
	},
};