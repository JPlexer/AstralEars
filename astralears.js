/****************************************
 * 
 *   AstralEars: Music bot
 *   Copyright (C) 2021 Victor Tran and JPlexer
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * *************************************/
const Discord = require('discord.js');
const ytdl = require('ytdl-core')
const ytsearch = require('youtube-search');
const keys = require('./keys.js');
const config = require('./config.js');
const URL = require('url');

const client = new Discord.Client({
    restTimeOffset: 10
});

var currentMemory = {}

process.on('unhandledRejection', function(err, p) {
    console.log(err);
});

process.on('uncaughtException', function(err) {
    console.log(err);
});

function getRandom () {
    if (arguments.length == 1) {
      if (typeof arguments[0] == Array) {
        var random = Math.floor(Math.random() * 1000) % arguments[0].length;
        return arguments[0][random];
      }
    } else {
      var random = Math.floor(Math.random() * 1000) % arguments.length;
      return arguments[random];
    }
  }
function setActivity(client) {
    client.user.setActivity(getRandom(
      `Ozzy Osbourne - Crazy Train`,
      `DJT - The Witch`,
      `Anders Enger Jensen - DiscoVision`,
      `Micheal Jackson - The Girl Is Mine`,
      `Vrabbers - Silly`,
      `TrackTribe - Walk Through the Park`,
      `Telstra - At Home with the Adams Family`, 
      `Lionel Richie - Hello`,
	  `Nokia - Ringtone Arabic`,
	  `Air Supply - All Out Of Love`,
	  `Karl Marx - The Communist Manifesto`,
	  `Alexandrov Ensemble - The National Anthem of the United Socialist Soviet Republics`,
      ), {
        type: "LISTENING"
      });
  }

function secondsToString(seconds) {
    let truncSeconds = Math.floor(seconds % 60);
    let min = Math.floor(seconds / 60);

    let timeString;
    if (truncSeconds < 10) {
        timeString = min + ":0" + truncSeconds;
    } else {
        timeString = min + ":" + truncSeconds;
    }
    return timeString;
}

function playNextSong(gid, manualSkip, skippingUser) {
    let connection = currentMemory[gid].voiceConnection;
    if(manualSkip) {
        if (currentMemory[gid].channel != currentMemory[gid].mediaPlayerMessage.guild.member(skippingUser).voice.channel) {
            currentMemory[gid].textChannel.send("<:aewarning:838515499611586561> To skip an item, you'll need to be in the same voice channel.");
            return;
        }
        if (currentMemory[gid].mediaPlayerMessage.guild.member(skippingUser).hasPermission("MANAGE_MESSAGES")) {
            currentMemory[gid].skipRequesters = [];
        } else {
       if (connection.channel.members.filter(member => !member.user.bot).size / 2 > currentMemory[gid].skipRequesters.length) {
           if(currentMemory[gid].skipRequesters.includes(skippingUser.id)) {
            currentMemory[gid].textChannel.send(`<:aewarning:838515499611586561> You already voted to skip. You need ${Math.ceil((connection.channel.members.filter(member => !member.user.bot).size / 2) - currentMemory[gid].skipRequesters.length)} more person to skip.`);
            return;
        } else {
            currentMemory[gid].skipRequesters.push(skippingUser.id)
            if (connection.channel.members.filter(member => !member.user.bot).size / 2 > currentMemory[gid].skipRequesters.length) {
                currentMemory[gid].textChannel.send(`<:aewarning:3838515499611586561> Counted Vote! You need ${Math.ceil((connection.channel.members.filter(member => !member.user.bot).size / 2) - currentMemory[gid].skipRequesters.length)} more person to skip.`);
                return;
            } else {
                currentMemory[gid].skipRequesters = [];
            }
        }
       } else {
        currentMemory[gid].skipRequesters = [];
       }
    }
        //console.log(connection.channel.members.filter(member => !member.user.bot).size)
    }
        if (currentMemory[gid].queue.length > 0 || currentMemory[gid].repeat) {  
            if (connection.dispatcher != null) {
                connection.dispatcher.destroy();
            }
            let video;
            if (currentMemory[gid].repeat) {
                video = currentMemory[gid].playing;
            } else {
                video = currentMemory[gid].queue.shift();
            }

            let dispatcher;
            if (video.method == "ytdl") {
                let stream = ytdl(video.url, {
                    filter: "audioonly",
                    quality: "highestaudio"
                });
                stream.on("progress", function(length, total, totalLength) {
                    currentMemory[gid].playing.buffer = total / totalLength;
                });

                dispatcher = connection.play(stream, {
                    volume: 0.7
                });
            } else if (video.method == "ffmpeg") {
                dispatcher = connection.play(video.url);
            }
            dispatcher.once('finish', function(reason) {
                setTimeout(function() {
                    playNextSong(gid, false);
                }, 100);
            });

            currentMemory[gid].textChannel.send("Now Playing: **" + video.title + "** (" + secondsToString(video.length) + ")\n" + " @ <" + video.url + ">");
            currentMemory[gid].playing = video;
            currentMemory[gid].playing.buffer = 0;
            updateEmbedMessage(gid);
        } else {
            if (connection.dispatcher != null) {
                connection.dispatcher.destroy();
            }
            let embed = new Discord.MessageEmbed();
            embed.setTitle(config.name);
            embed.setColor(config.color);
            embed.setDescription("That's all folks! Thanks for using "+ config.name+"!");

            currentMemory[gid].mediaPlayerMessage.edit("", embed);
            currentMemory[gid].textChannel.send(embed);
            currentMemory[gid].mediaPlayerMessage.unpin();
			currentMemory[gid].mediaPlayerMessage.reactions.removeAll();
            currentMemory[gid].channel = null;
            currentMemory[gid].paused = false;
            currentMemory[gid].repeat = false;
            currentMemory[gid].skipRequesters = [];
            currentMemory[gid].voiceConnection.disconnect();
        }
}

function updateEmbedMessage(gid) {
    ytdl.getInfo(currentMemory[gid].playing.url).then(function(info) {
        let embed = new Discord.MessageEmbed();
        embed.setTitle(config.name);
        
        embed.addField("Item", info.videoDetails.title + "\n" + info.videoDetails.author.name);
        embed.addField("Requested by", currentMemory[gid].playing.user);
        if (currentMemory[gid].paused) {
            embed.setDescription("Paused");
            embed.setColor("#FFC000");
        } else {
            embed.setDescription("Now Playing");
            embed.setColor(config.color);
        }

        let flags = "";
        if (currentMemory[gid].repeat) {
            flags += "🔂";
        } else {
            flags += "▶"
        }
        embed.setFooter(flags + " - "+ config.name +" " + config.version + " - " + parseInt(currentMemory[gid].queue.length) + " items enqueued");
        embed.setImage(currentMemory[gid].playing.thumb);

        if (currentMemory[gid].queue.length > 0) {
            ytdl.getInfo(currentMemory[gid].queue[0].url).then(function(info2) {
                embed.addField("Up Next", info2.videoDetails.title + "\n" + info2.videoDetails.author.name);
                currentMemory[gid].mediaPlayerMessage.edit("", embed);
            });
        } else {
            currentMemory[gid].mediaPlayerMessage.edit("", embed);
        }
    });

    if (currentMemory[gid].paused) {
        currentMemory[gid].mediaPlayerMessage.react("▶");
        for (const reaction of currentMemory[gid].mediaPlayerMessage.reactions.cache.values()) {
            if (reaction.emoji.name == "⏸") {
                reaction.remove()
            }
        }
    } else {
        currentMemory[gid].mediaPlayerMessage.react("⏸");
        for (const reaction of currentMemory[gid].mediaPlayerMessage.reactions.cache.values()) {
            if (reaction.emoji.name == "▶") {
                reaction.remove()
            }
        }
    }
}

function forceStop(gid, stoppingUser) {
    
    if (!currentMemory[gid].mediaPlayerMessage.guild.member(stoppingUser).hasPermission("MANAGE_MESSAGES")) {
        currentMemory[gid].textChannel.send(`<:aeforbidden:838515097940000768> You do not have the Permission to Stop! You'll need the "Manage Messages" Permission to stop Songs`);
    } else {
        if (currentMemory[gid].channel != currentMemory[gid].mediaPlayerMessage.guild.member(stoppingUser).voice.channel) {
            currentMemory[gid].textChannel.send("<:aewarning:838515499611586561> To stop the Queue, you'll need to be in the same voice channel.");
            return;
        }
        let embed = new Discord.MessageEmbed();
        embed.setTitle(config.name);
        embed.setColor(config.color);
        embed.setDescription("That's all folks! Thanks for using "+ config.name+"!");
    
        currentMemory[gid].mediaPlayerMessage.edit("", embed);
        currentMemory[gid].textChannel.send(embed);
        currentMemory[gid].mediaPlayerMessage.unpin();
		currentMemory[gid].mediaPlayerMessage.reactions.removeAll();
        currentMemory[gid].channel = null;
        currentMemory[gid].paused = false;
        currentMemory[gid].repeat = false;
        currentMemory[gid].skipRequesters = [];
        currentMemory[gid].voiceConnection.disconnect();
    }
}

function pause(gid) {
    if (!currentMemory[gid].paused) {
        currentMemory[gid].voiceConnection.dispatcher.pause();
        currentMemory[gid].paused = true;
        updateEmbedMessage(gid);
    }
}

function resume(gid) {
    if (currentMemory[gid].paused) {
        currentMemory[gid].voiceConnection.dispatcher.resume();
        currentMemory[gid].paused = false;
        updateEmbedMessage(gid);
    }
}

function toggleRepeat(gid) {
    currentMemory[gid].repeat = !currentMemory[gid].repeat;
    updateEmbedMessage(gid);
}

function printQueue(gid) {
    if (currentMemory[gid].queue.length == 0) {
        currentMemory[gid].textChannel.send("This is the final item. Enqueue an item with `" + config.prefix + "[url/query]`");
    } else {
        let queue = "";
        for (let i = 0; i < currentMemory[gid].queue.length; i++) {
            let item = currentMemory[gid].queue[i];
            queue += "<" + item.url + "> -> " + item.user + "\n";
        }
        currentMemory[gid].textChannel.send(queue);
    }
}

function printTime(gid) {
    let elapsed = currentMemory[gid].voiceConnection.dispatcher.streamTime / 1000;
    let total = currentMemory[gid].playing.length;
    text = "```" + secondsToString(elapsed) + " [";

    if (total == -1) {
        text = "▜▟▜▟▜▟▜▟▜▟] ∞ (less than ∞ buffered)```";
    } else {
        let buffer = Math.round(currentMemory[gid].playing.buffer * 10);

        let ratio = elapsed / total * 10;

        for (let i = 0; i < 10; i++) {
            if (i == Math.floor(ratio)) {
                if (ratio - Math.floor(ratio) < 0.5) {
                    text += "▙";
                } else {
                    text += "█";
                }
            } else if (i < ratio) {
                text += "█";
            } else if (i < buffer) {
                text += "▄";
            } else {
                text += " ";
            }
        }
        text += "] " + secondsToString(total) + " (" + Math.floor(currentMemory[gid].playing.buffer * 100) + "% buffered)```";
    }
    currentMemory[gid].textChannel.send(text);
}

async function addReactionHandler(message, gid) {
    message.awaitReactions(function(reaction) {
        if (reaction.count > 1) {
            return true;
        }
        return false;
    }, {
        max: 1
    }).then(async function(reactions) {
        let reaction = reactions.first();

        var currentUser;
        for (let [id, user] of reaction.users.cache) {
            if (id != client.user.id) {
                await reaction.users.remove(id);
                currentUser = user;
            }
        }
        
        if (message.guild.member(currentUser).voice.channel == null) {

        } else {
            if (message.guild.member(currentUser).voice.channel.id != currentMemory[gid].channel) {

            } else {
                if (reaction.emoji.name == "⏭") {
                    message.channel.send("**" + currentUser.tag + "**: " + config.prefix + "skip");
                    playNextSong(gid, true, currentUser);
                } else if (reaction.emoji.name == "⏹") {
                    message.channel.send("**" + currentUser.tag + "**: " + config.prefix + "stop");
                    forceStop(gid, currentUser);
                } else if (reaction.emoji.name == "⏸") {
                    message.channel.send("**" + currentUser.tag + "**: " + config.prefix + "pause");
                    pause(gid);
                } else if (reaction.emoji.name == "▶") {
                    message.channel.send("**" + currentUser.tag + "**: " + config.prefix + "resume");
                    resume(gid);
                } else if (reaction.emoji.name == "🔂") {
                    message.channel.send("**" + currentUser.tag + "**: " + config.prefix + "repeat");
                    toggleRepeat(gid);
                } else if (reaction.emoji.name == "🇶") {
                    message.channel.send("**" + currentUser.tag + "**: " + config.prefix + "queue");
                    printQueue(gid);
                }
            }
        }
        addReactionHandler(message, gid);
    }).catch(function(err) {
        console.log(err);
    });
}

client.on('message', function(message) {
    if (message.author.id == client.user.id && message.system) {
        message.delete();
    } else if (message.content.startsWith(config.prefix)) {
        let command = message.content.substr(config.prefix.length);
        let gid = message.guild.id;

        if (currentMemory[gid] == null) {
            currentMemory[gid] = {
                queue: [],
                playing: null,
                channel: null,
                dispatcher: undefined,
                voiceConnection: null,
                textChannel: null,
                mediaPlayerMessage: null,
                paused: false,
                repeat: false,
                skipRequesters: []
            };
        }
        
        if (command == "ping") {
            message.reply("Mornin'");
        } else if (command == "next" || command == "skip") {
            if (currentMemory[gid].channel == null) {
                message.reply("To skip to the next item, you'll need to enqueue an item.");
            } else {
                playNextSong(gid, true, message.member);
            }
        } else if (command == "stop") {
            if (currentMemory[gid].channel == null) {
                message.reply("To stop playing media, you'll need to enqueue an item.");
            } else {
                forceStop(gid, message.member);
            }
        } else if (command == "pause") {
            if (currentMemory[gid].channel == null) {
                message.reply("To pause media, you'll need to enqueue an item.");
            } else {
                pause(gid);
            }
        } else if (command == "resume" || command == "play") {
            if (currentMemory[gid].channel == null) {
                message.reply("To resume media, you'll need to enqueue an item.");
            } else {
                resume(gid);
            }
        } else if (command == "repeat") {
            if (currentMemory[gid].channel == null) {
                message.reply("To toggle repeat, you'll need to enqueue an item.");
            } else {
                toggleRepeat(gid);
            }
        } else if (command == "queue") {
            if (currentMemory[gid].channel == null) {
                message.reply("To see the queue, you'll need to enqueue an item.");
            } else {
                printQueue(gid);
            }
        } else if (command == "time" || command == "np") {
            if (currentMemory[gid].channel == null) {
                message.reply("To see the time elapsed, you'll need to enqueue an item.");
            } else {
                printTime(gid);
            }
        } else if (command.startsWith("find ")) {
            let query = command.substr(5);

            //Search
            ytsearch(query, {
                maxResults: 10,
                key: keys.googlekey
            }, function(err, results) {
                if (err) {
                    message.channel.send("<:aeerror:838515499842535474> **Internal Error**\nHere are some things you can try:\nTry again in a few hours");
                } else {
                    let found = false;
                    for (let i = 0; i < results.length; i++) {
                        let result = results[i];
                        if (result.kind == "youtube#video") {
                            ytdl.getInfo(result.link).then(function(info) {
                                message.channel.send("Here's the item that'll be played:\n**" + info.videoDetails.title + "** (" + secondsToString(info.videoDetails.lengthSeconds) + ")\n" + " @ <" + result.link + ">");
                            }).catch(function(err) {
                                message.channel.send("<:aeerror:838515499842535474> **Internal Error**\nHere are some things you can try:\n- Try a different query");
                            });
                            found = true;
                            i = results.length;
                        }
                    }

                    if (!found) {
                        message.channel.send("<:aewarning:838515499611586561> **No Results**\nHere are some things you can try:\n- Refine your query\n- Try a different query");
                    }
                }
            });
        } else if (command == "help") {
            let embed = new Discord.MessageEmbed();
            embed.setTitle( config.name+ " Help");
            embed.setDescription("Here are some things you can try.");
            embed.setColor(config.color);
            embed.addField("Enqueue an item", "To enqueue an item, simply place the search query or URL after the prefix. For example,\n" + config.prefix + "https://www.youtube.com/watch?v=dQw4w9WgXcQ\n" + config.prefix + "DiscoVision");
            embed.addField("Using the player", "When music is playing, a pinned message will indicate the current status of the player. Reactions to that message can be used to control the player.");
            message.channel.send(embed);
        } else if (command == "about") {
                let embed = new Discord.MessageEmbed();
                embed.setTitle(`About ${config.name}`);
                embed.setDescription("This is a Music Bot originally developed by vicr123, but now revived and maintained by JPlexer.");
                embed.setColor(config.color);
                embed.addField("License", "This Bot is licenced under the GPL v3 License.");
                embed.addField("Github", "The Source Code of the Bot is available at https://github.com/JPlexer/AstralEars");
                message.channel.send(embed);
        } else {
            if(command.startsWith("play ")) {command = command.substr(5)}
            else if(command.startsWith("p ")) {command = command.substr(2)}

            if (currentMemory[gid].channel == null && message.member.voice.channel == null) {
                message.channel.send("<:aewarning:838515499611586561> To enqueue an item, you'll need to be in a voice channel.");
            } else {
                let accept = function(url, name, author, length, thumb, method) {
                    currentMemory[gid].queue.push({
                        url: url,
                        user: message.author.tag,
                        length: length,
                        title: name,
                        thumb: thumb,
                        method: method
                    });
                    currentMemory[gid].textChannel = message.channel;
                    
                    if (currentMemory[gid].channel == null) {
                        //Join channel
                        currentMemory[gid].channel = message.member.voice.channel.id;
                        message.member.voice.channel.join().then(function(connection) {
                            currentMemory[gid].voiceConnection = connection;
                            connection.on('warn', function(err) {
                                console.log(err);
                            });
                            playNextSong(gid, false);
                        });
                        let embed = new Discord.MessageEmbed();
                        embed.setTitle(config.name);
                        embed.setColor(config.color);
                        embed.setDescription("Welcome to "+ config.name +"! Initializing media player...");
                        message.channel.send(embed).then(function(message) {
                            message.pin();
                            currentMemory[gid].mediaPlayerMessage = message;
                            
                            message.react("🇶").then(function() {
                                message.react("🔂").then(function() {
                                    message.react("⏹").then(function() {
                                        message.react("⏭").then(function() {
                                            message.react("⏸");
                                        });
                                    });
                                });
                            });
        
                            addReactionHandler(message, gid);
                        }).catch(function(err) {
                            debugger;
                        });
                    } else {
                        let embed = new Discord.MessageEmbed();
                        embed.setColor(config.color);
                        embed.setTitle(config.name);
                        embed.setDescription("<:aesuccess:838515500169822268> Enqueued!");
                        embed.addField("Item", name + "\n" + author);
                        embed.setFooter(config.name + " " + config.version + " - " + parseInt(currentMemory[gid].queue.length) + " items enqueued");
                        message.channel.send(embed);

                        updateEmbedMessage(gid);
                    }
                }

                if (command.startsWith("<") && command.endsWith(">")) {
                    command = command.substr(1, command.length - 2);
                }

                //Queue song
                if (command.startsWith("http://") || command.startsWith("https://")) {
                    ytdl.getInfo(command).then(function(info) {
                        accept(command, info.videoDetails.title, info.videoDetails.author.name, parseInt(info.videoDetails.lengthSeconds), info.videoDetails.thumbnails[0].url, "ytdl");
                    }).catch(function(err) {
                        let url = URL.parse(command);
                        accept(command, "Network Stream", url.host, -1, "", "ffmpeg");
                    });
                } else {
                    //Search
                    ytsearch(command, {
                        maxResults: 10,
                        key: keys.googlekey
                    }, function(err, results) {
                        if (err) {
                            message.channel.send("<:aeerror:838515499842535474> **Internal Error**\nHere are some things you can try:\nTry again in a few hours");
                        } else {
                            let found = false;
                            for (let i = 0; i < results.length; i++) {
                                let result = results[i];
                                if (result.kind == "youtube#video") {
                                    ytdl.getInfo(result.link).then(function(info) {
                                        accept(result.link, info.videoDetails.title, info.videoDetails.author.name, parseInt(info.videoDetails.lengthSeconds), info.videoDetails.thumbnails[0].url, "ytdl");
                                    }).catch(function(err) {
                                        message.channel.send("<:aeerror:838515499842535474> **Internal Error**\nHere are some things you can try:\n- Try a different query");
                                    });
                                    found = true;
                                    i = results.length;
                                }
                            }

                            if (!found) {
                                message.channel.send("<:aewarning:838515499611586561> **No Results**\nHere are some things you can try:\n- Refine your query\n- Try a different query");
                            }
                        }
                    });
                }
            }
            message.delete();
        }
    }
});

client.on('ready', function() {
    console.log(`${config.name} is all ears!`);
    client.setInterval(setActivity, 180000, client);
    setActivity(client);
});

client.login(keys.key).catch(function() {
    console.log( config.name + "'s ears were chopped off! :(");
    process.exit(1);
});
