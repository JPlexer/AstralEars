const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const { MessageEmbed,  MessageActionRow, MessageButton } = require('discord.js');
const { configcolor, configname, configversion} = require('../config.json');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('activities')
		.setDescription('Create a Discord Activity Invite Link')
		.addStringOption(option =>
            option.setName('type')
                .setDescription('The type of activity to summon')
                .setRequired(true)
                .addChoice('Youtube', 'youtube')
                .addChoice('Poker', 'poker')
                .addChoice('Chess', 'chess')
                .addChoice('Betrayal', 'betrayal')
                .addChoice('Fishington', 'fishing')
                .addChoice('Letter Tile', 'lettertile')
                .addChoice('Words Snack', 'wordsnack')
                .addChoice('Doodle Crew', 'doodlecrew')
                .addChoice('SpellCast', 'spellcast')
                .addChoice('Awkword', 'awkword')),
	async execute(interaction, client) {
        const command = interaction.options.getString("type");
        if (!interaction.member.voice.channel) return interaction.reply("You need to join a voice channel.");
            client.discordTogether.createTogetherCode(interaction.member.voice.channel.id, command).then(async invite => {
                if(invite.code == "https://discord.com/invite/50013") {
                    return interaction.reply("The bot has no permission to create a Invite. Please reinvite AstralEars at https://jplexer.omg.lol/astralears")
                }
                return interaction.reply(`${invite.code}`);
            })
    }
};