const Discord = require('discord.js');
const fs = require('fs');
const { memeAsync } = require('memejs');
const Settings = require('./settings.json');
//https://discord.com/oauth2/authorize?client_id=722119730701533245&permissions=8&scope=bot

const client = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ['TYPING_START'],
    messageCacheLifetime: 60,
    messageSweepInterval: 60
});

client.on('ready', () => { //Trigers When Bot Logs in
    client.user.setPresence({ activity: { name:'Dying'}, status: 'online'});
    console.log(`Bot is online!`);
});

client.on('guildCreate', guild => { //Trigers When Bot Is Invited
    console.log(`I've joined the guild ${guild.name} (${guild.id}), owned by ${guild.owner.user.username} (${guild.owner.user.id}).`);
});

const helpData = fs.readFileSync('Help.txt', 'utf8', function(err, data) {
    if (err) console.log('Help File Missing!');
    return data.toString();
});

var channels = [];
const timerLength = 1000 * (process.env.aniinterval || 15);

//////////////////////
//Message Processing//
//////////////////////
client.on('message', async message => {
    if (message.author.bot || message.system) return; // Ignore bots

    if (message.channel.type === 'dm') { // Direct Message
        return; //Optionally handle direct messages
    }
    
    if (message.content.indexOf(Settings.prefix) === 0) {

        let msg = message.content.slice(Settings.prefix.length); // slice of the prefix on the message
        let args = msg.split(' '); // break the message into part by spaces
        let cmd = args[0].toLowerCase(); // set the first word as the command in lowercase just in case
        args.shift(); // delete the first word from the args

        if (cmd === 'ping') {
            const PingEmbed = new Discord.MessageEmbed()
            .setAuthor(client.user.username)
            .setColor("#ff0000")
            .addField("🏓",`Pong in ${client.ws.ping}\nThe Bot Has Been Up For ${Math.round((client.uptime / 1000) / 60)} Minutes!`)
            message.channel.send(PingEmbed);
            return;
        }
        else if (cmd === 'stats'){
            const statsEmbed = new Discord.MessageEmbed()
                            .setAuthor(client.user.username)
                            .setColor("#00ff00")
                            .addField("💻",`Cpu Usage: ${Math.round(process.cpuUsage().user / 1000)}ms`)
                            .addField("🔳", `Memory Usage: ${Math.round(process.memoryUsage().heapTotal / 1000000)}mb`)
            message.channel.send(statsEmbed);
        }
        else if (cmd === 'addchannel'){
            if (channels.includes(message.channel)){
                message.channel.send("I already Post Here")
            }else {
                channels.push(message.channel);
                console.log(`Added (${message.channel.name}) Channel from (${message.channel.guild.name})`);
            }
        }
        else if (cmd === 'remchannel'){
            if (channels.includes(message.channel)){
                channels.splice(channels.indexOf(message.channel));
                message.channel.send("Channel Was Removed!");
                console.log(`Removed (${message.channel.name}) Channel from (${message.channel.guild.name})`);
            }else {
                message.channel.send("Channel Not In List!");
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

        else if (cmd === 'shutdown' && message.author.id == Settings.owner) {
            message.reply(`Shutting Down The Bot❗`).then(message => {
                client.destroy();
                process.exit();
            });
        }
    }
});

client.login(Settings.token || process.env.token);

function yourFunction(){
    console.log(`Sending Anime Memes To ${channels.length} Channels!\n`);
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