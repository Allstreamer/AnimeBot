const Discord = require('discord.js');
const fs = require('fs');
const rgbHex = require('rgb-hex');
const { memeAsync } = require('memejs');
const { owner,
        prefix } = require('./Settings.json');
const { token } = require('./token.json');
//https://discord.com/oauth2/authorize?client_id=722119730701533245&permissions=8&scope=bot

const client = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ['TYPING_START'],
    messageCacheLifetime: 60,
    messageSweepInterval: 60
});

client.on('ready', () => { //Trigers When Bot Logs in
    client.user.setPresence({ activity: { name:'Love is War'}, status: 'online'})
    .catch(err => { console.log(err) });

    console.log(`Bot is online!`);
});

client.on('guildCreate', guild => { //Trigers When Bot Is Invited
    console.log(`I've joined the guild ${guild.name} (${guild.id}), owned by ${guild.owner.user.username} (${guild.owner.user.id}).`);
});

const helpData = fs.readFileSync('Help.txt', 'utf8', function(err, data) {
    if (err) console.log('Help File Missing!');
    return data.toString();
});

const LoadingBarCharacter = "■";
var channels = [];
const timerLength = 1000 * (process.env.aniinterval || 30);

function GenerateLoadingBar(value,maxValue){
    let percent = Math.round((value / maxValue) * 10); //0.0 - 1.0 5
    let temp = LoadingBarCharacter.repeat(percent);
    temp += "▢".repeat(10 - percent);
    return `[${temp}]`;
}
const scaleNum = (num, inMin, inMax, outMin, outMax) => {
    return (num - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

//////////////////////
//Message Processing//
//////////////////////
client.on('message', async message => {
    if (message.author.bot || message.system) return; // Ignore bots

    if (message.channel.type === 'dm') { // Direct Message
        return; //Optionally handle direct messages
    }
    console.log(message.content);
    
    if (message.content.toLowerCase().indexOf(prefix.toLowerCase()) === 0) {

        let msg = message.content.toLowerCase().slice(prefix.length); // slice of the prefix on the message
        let args = msg.split(' '); // break the message into part by spaces
        let cmd = args[0].toLowerCase(); // set the first word as the command in lowercase just in case
        args.shift(); // delete the first word from the args

        if (cmd === 'ping') {
            let uptimeInMinutes = Math.round((client.uptime / 1000) / 60);
            let pingRange = scaleNum(client.ws.ping,0,10000,1,255);
            const PingColor = rgbHex(pingRange, 255 - pingRange, 0);

            const PingEmbed = new Discord.MessageEmbed()
            .setAuthor(client.user.username)
            .setColor(`#${PingColor}`)
            .addField("🏓",`Pong in ${client.ws.ping}ms\nThe Bot Has Been Up For ${uptimeInMinutes} Minute${uptimeInMinutes == 1 ? "" : "s"}!`);

            message.channel.send(PingEmbed);
            return;
        }

        else if (cmd === 'stats'){
            let memUsage = Math.round(process.memoryUsage().heapTotal / 1000000);
            const statsEmbed = new Discord.MessageEmbed()
                            .setAuthor(client.user.username)
                            .setColor("#00ff00")
                            .addField("💿",`Cpu Usage: ${Math.round(process.cpuUsage().user / 1000)}ms`)
                            .addField("📁", `Memory Usage: ${GenerateLoadingBar(memUsage,500)}${memUsage}mb`)
                            .addField("💻", `Platform: ${process.platform}`)
                            .addField("🛠",`Node.js ${process.version}`);
            message.channel.send(statsEmbed);
        }

        else if (cmd === 'addchannel'){
            if (channels.includes(message.channel)){
                const AddChannelFailedEmbed = new Discord.MessageEmbed()
                .setColor("#ff0000")
                .addField("🛑",`I already Post Here❗`);
                message.channel.send(AddChannelFailedEmbed);
            }else {
                const AddChannelSuccsessfullEmbed = new Discord.MessageEmbed()
                .setColor("#00ff00")
                .addField("👍",`I Will Now Post Memes Here☑`);

                message.channel.send(AddChannelSuccsessfullEmbed);
                channels.push(message.channel);
                console.log(`Added (${message.channel.name}) Channel from (${message.channel.guild.name})`);
            }
        }

        else if (cmd === 'remchannel'){
            if (channels.includes(message.channel)){
                channels.splice(channels.indexOf(message.channel));
                
                const RemoveChannelSuccsessfullEmbed = new Discord.MessageEmbed()
                .setColor("#00ff00")
                .addField("👍",`"${message.channel.name}" Channel Was Removed☑`);

                message.channel.send(RemoveChannelSuccsessfullEmbed);
                console.log(`Removed (${message.channel.name}) Channel from (${message.channel.guild.name})`);
            }else {
                const RemoveChannelFailedEmbed = new Discord.MessageEmbed()
                .setColor("#ff0000")
                .addField("🛑",`"${message.channel.name}" Channel Not In List‼`);
                message.channel.send(RemoveChannelFailedEmbed);
            }
        }

        else if (cmd === 'meme'){
            let subreddit = (args.length >= 1 ? args[0] : "animemes");

            memeAsync(subreddit).then(m => {
                const MemeEmbed = new Discord.MessageEmbed()
                .setImage(m.url)
                .setColor(0x55cc00)
                .setTitle(m.title)
                .setFooter('Here is your Meme ✔');
                message.channel.send(MemeEmbed);
            }).catch((err) => {
                message.channel.send("Error❌ When Getting Reddit post/Subreddit")
            });
        }

        else if (cmd === 'help'){
            message.channel.send(helpData);
            return;
        }

        else if (cmd === 'shutdown' && message.author.id == owner) {
            message.reply(`Shutting Down The Bot❗`).then(message => {
                client.destroy();
                process.exit();
            });
        }
    }
});

client.login(process.env.token || token);

function yourFunction(){
    console.log(`Sending Anime Memes To ${channels.length} Channels!`);
    const MemeEmbed = new Discord.MessageEmbed();
    memeAsync("animemes").then(m => {
        MemeEmbed.setImage(m.url)
            .setColor(0x55cc00)
            .setTitle(m.title)
            .setFooter('Here is your Meme ✔');

        channels.forEach(channel => {
            channel.send(MemeEmbed);
        });
    }).catch((err) => {
        channel.send("Error❌ When Getting Reddit post");
    });

    setTimeout(yourFunction, timerLength);
}
yourFunction();

process.on('exit', function (code) {
    client.destroy();
    return console.log(`About to exit with code ${code}`);
});