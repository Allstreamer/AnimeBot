const Discord = require('discord.js');          //Discord Connection Package
const fs = require('fs');                       //For Loading And Saving Json Files
const rgbHex = require('rgb-hex');              //For Converting RGB Color Space To Hex
const { memeAsync } = require('memejs');        //For Grabbing Image Of Of Any Subreddit
const { owner,
        prefix } = require('./Settings.json');  //Prefix And Owner Settings
const { token } = require('./token.json');      //Discord Bot Token

//https://discord.com/oauth2/authorize?client_id=722119730701533245&permissions=8&scope=bot Original Bot Invite Link

const client = new Discord.Client({
    disableEveryone: true,              //Prevents Bot From Doing @everyone
    disabledEvents: ['TYPING_START'],
    messageCacheLifetime: 60,           //Life Time Of A Message Untill It can be Deleted
    messageSweepInterval: 60            //Invterval of When Messages Are Going To Be Deleted
});

client.on('ready', () => {                                                          //Trigers When Bot Logs in
    client.user.setPresence({ activity: { name:'Love is War'}, status: 'online'})   //Sets The Game The Bot Is Playing and If It's Online/Idle/Invisible
    .catch(err => { console.log(err) });

    console.log(`Bot is online!`);
});

client.on('guildCreate', guild => {     //Trigers When Bot Is Invited To A New Discord Server
    console.log(`I've joined the guild ${guild.name} (${guild.id}), owned by ${guild.owner.user.username} (${guild.owner.user.id}).`);
});

const helpData = fs.readFileSync('Help.txt', 'utf8', function(err, data) {  //Reads Help Data From Help.txt File
    if (err) console.log('Help File Missing!');
    return data.toString();                                                 //Converts File Data To String
});

const LoadingBarCharacter = "■";                            //Character That Is Used To Generate Text Loading Bar
var channels = [];                                          //List Of Channels That Memes Are Sent To Every timerLength
const timerLength = 1000 * (process.env.aniinterval || 30); //(In Milliseconds) Either Takes Enviroment Varible

function GenerateLoadingBar(value,maxValue){                //Generates An Ascii Loading Bar With M
    let percent = Math.round((value / maxValue) * 10);      //Gets Percent Value And Multiplys it With 10 so it ranges from 0-10 insted of 0.0 - 1.0
    let temp = LoadingBarCharacter.repeat(percent);         //Adds Full Loading Bar Chracter "Percent" Times
    temp += "▢".repeat(10 - percent);                       //Repeats Empty Character (The Diffrence Between 100% minus The Current Percent) Times
    return `[${temp}]`;                                      //Adds A Bit Of Style To The Bar And Returns It As An String
}
Number.prototype.clamp = function(min, max) {               //Clampes A Number Between Two Values
    return Math.min(Math.max(this, min), max);
};
const scaleNum = (num, inMin, inMax, outMin, outMax) => {   //Scales A Number Between A Range and Clamps It Between The Range
    return ((num - inMin) * (outMax - outMin) / (inMax - inMin) + outMin).clamp(outMin,outMax);
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
            let pingRange = scaleNum(client.ws.ping,0,1000,1,255);
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