const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed,  MessageActionRow, MessageButton, Permissions } = require('discord.js');
const { configcolor, configname, configversion} = require('../config.json');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop the entire queue'),
	async execute(interaction, client) {
		var player = client.manager.players.get(interaction.guild.id)
		const vchannel = client.channels.cache.get(player.voiceChannel);
      if (interaction.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES) || vchannel.members.filter(member => !member.user.bot).size <= 2) {
        const player = client.manager.players.get(interaction.guildId);
      client.mediaPlayerMessage[interaction.guild.id].unpin();
      let embed = new MessageEmbed();
      embed.setTitle(configname);
      embed.setColor(configcolor);
      embed.setDescription("That's all folks! Thanks for using "+ configname+"!");
        
      client.mediaPlayerMessage[interaction.guild.id].edit({ embeds: [embed] });
      client.mediaPlayerMessage[interaction.guild.id] = false;
      interaction.reply("That's all folks! Thanks for using "+ configname+"!");
      player.destroy();
      } else {
		interaction.reply(`<:aewarning:838515499611586561> You are not allowed to Stop `);
          }
	},
};