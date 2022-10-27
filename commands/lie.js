const { SlashCommandBuilder, messageLink } = require('discord.js');
const { shuffle, myArrayShuffle } = require('../utils.js');
const wait = require('node:timers/promises').setTimeout;

const numericalEmojis = [`1️⃣`,`2️⃣`,`3️⃣`,`4️⃣`,`5️⃣`,`6️⃣`,`7️⃣`,`8️⃣`,`9️⃣`];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lie')
		.setDescription('Start a round of two truths one lie!')
        .addStringOption(option =>
            option
                .setName('lie')
                .setDescription('lie')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('truth_1')
                .setDescription('truth')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('truth_2')
                .setDescription('truth')
                .setRequired(true)),
	async execute(interaction) {
        // game rules
        const timerSeconds = 5;
        const numArgs = interaction.options._hoistedOptions.length;
        console.log(`Starting game with ${timerSeconds} seconds and ${numArgs} statements...`)

        // statements
        let statements = [...interaction.options._hoistedOptions];
        const gameTruth = statements[0];
        //const statement1 = interaction.options.getString('lie') ?? 'Nothing';
        //const statement2 = interaction.options.getString('truth_1') ?? 'Nothing';
        //const statement3 = interaction.options.getString('truth_2') ?? 'Nothing';
        console.log(statements);

        // shuffle statements
        statements = myArrayShuffle(statements);
        console.log(statements);
        const truthIndex = statements.findIndex(function (entry) { return entry.name === "lie"; });
        console.log(`truth index: ${truthIndex}`);

        // send initial message to start game
        let msg = `Which of these statements about ${interaction.user.username} is correct? \n`;
        let st_i = 0;
        for(let st of statements) {
            let txt = st.value;
            msg += numericalEmojis[st_i]+`: ${txt}\n`;
            st_i++;
        }
        let timerTxt = `**${timerSeconds}** seconds remaining!\n`;
		const message = await interaction.reply({content: timerTxt+msg, fetchReply: true });

        // add reactions
        try {
            for(let r = 0; r < numArgs; r++) {
                await message.react(numericalEmojis[r]);
            }
        }
        catch (error) {
            console.error(`Failed to offer a reaction!`)
        }

        //do countdown
        for(let i = 0; i < timerSeconds; i++) {
            await wait(1000);
            //edit timer msg
            timerTxt = `**${timerSeconds-i}** seconds remaining!\n`;
            await interaction.editReply(timerTxt+msg);
        }
        timerTxt = `**Time's up!** `;
        await interaction.editReply(timerTxt+msg);

        //check and tally reactions
        const userReactions = message.reactions.cache;
        try {
            for (const reaction of userReactions) {
                //await reaction.users.remove(userId);
                console.log(reaction);
            }
        } catch (error) {
            console.error('Failed to remove reactions.');
        }

        //complete game
        await interaction.followUp({content: `Winners go here!`, ephemeral: false});
	},
};