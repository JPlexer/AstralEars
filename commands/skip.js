const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Vote to skip to the next song'),
	async execute(interaction, client) {
		var skippingUser = interaction.member;
		var player = client.manager.players.get(interaction.guild.id)
		const gid = interaction.guild.id;
		if(!player) {interaction.reply("<:aewarning:838515499611586561> AstralEars needs to be in a Voice Channel."); return;}
		const vchannel = client.channels.cache.get(player.voiceChannel);
		if (vchannel != skippingUser.voice.channel) {
            interaction.reply("<:aewarning:838515499611586561> To skip an item, you'll need to be in the same voice channel.");
            return;
        }
        /*if (skippingUser.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
			client.manager.players.get(interaction.guild.id).stop();
            client.skippingUsers[gid] = [];
        } else {*/
       if (vchannel.members.filter(member => !member.user.bot).size / 2 > client.skippingUsers[gid].length) {
           if(client.skippingUsers[gid].includes(skippingUser.id)) {
               if(Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length) === 1) {
                interaction.reply(`<:aewarning:838515499611586561> You already voted to skip. You need ${Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length)} more person to skip.`);
                return;
               } else {
                interaction.reply(`<:aewarning:838515499611586561> You already voted to skip. You need ${Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length)} more people to skip.`);
                return;
               }
               
        } else {
            client.skippingUsers[gid].push(skippingUser.id)
            if (vchannel.members.filter(member => !member.user.bot).size / 2 > client.skippingUsers[gid].length) {
                if(Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length) === 1) {
                    interaction.reply(`<:aewarning:838515499611586561> Counted Vote! You need ${Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length)} more person to skip.`);
                return;
                   } else {
                    interaction.reply(`<:aewarning:838515499611586561> Counted Vote! You need ${Math.ceil((vchannel.members.filter(member => !member.user.bot).size / 2) - client.skippingUsers[gid].length)} more people to skip.`);
                return;
                   }
                
            } else {
                client.skippingUsers[gid] = [];
				client.manager.players.get(interaction.guild.id).stop();
            }
        }
       } else {
        client.skippingUsers[gid] = [];
		client.manager.players.get(interaction.guild.id).stop();
       }
   // }
		await interaction.reply('Skipping...');
	},
};