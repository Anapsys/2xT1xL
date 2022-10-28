const { 
    SlashCommandBuilder, messageLink, SelectMenuBuilder,
    ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const { shuffle, myArrayShuffle, setUserReaction } = require('../utils.js');
const wait = require('node:timers/promises').setTimeout;

const numericalEmojis = [`1️⃣`,`2️⃣`,`3️⃣`,`4️⃣`,`5️⃣`,`6️⃣`,`7️⃣`,`8️⃣`,`9️⃣`];

module.exports = {
    // the appearance and personality of the function
	data: new SlashCommandBuilder()
		.setName('lie')
		.setDescription('Start a round of two truths one lie!'),
        /*
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
                */

    // the actual behavior of the function
	async execute(interaction) {
        // game rules
        const timerSeconds = 120;
        const numArgs = interaction.options._hoistedOptions.length;
        console.log(`Starting game with ${timerSeconds} seconds and ${numArgs} statements...`)
        let playerAnswers = new Map();

        // modal
        const modal = new ModalBuilder()
			.setCustomId('2T1L_Modal')
			.setTitle('Two Truths, One Lie');

		// Create the text input components
        //const inputTimeLimit = new SelectMenuBuilder()
        //    .setCustomId('inputTime')
        //    .setLabel("How many seconds for this round?")
		const inputLie = new TextInputBuilder()
			.setCustomId('inputLie')
			.setLabel("Tell a lie... (or very near truth)")
            //.setPlaceholder('')
			.setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        const inputLieJustify = new TextInputBuilder()
			.setCustomId('inputLieJustify')
			.setLabel("What about this is wrong? (optional)")
            //.setPlaceholder(`It's "distant lands".`)
			.setStyle(TextInputStyle.Short);
		const inputTruth1 = new TextInputBuilder()
			.setCustomId('inputTruth1')
			.setLabel("Now tell an iffy truth!")
            //.setPlaceholder('Enter some text!')
			.setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        const inputTruth2 = new TextInputBuilder()
			.setCustomId('inputTruth2')
			.setLabel("...and one more truth.")
            //.setPlaceholder('Enter some text!')
			.setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

		// An action row only holds one text input,
		// so you need one action row per text input.
		const ActionRow1 = new ActionRowBuilder().addComponents(inputLie);
		const ActionRow2 = new ActionRowBuilder().addComponents(inputLieJustify);
        const ActionRow3 = new ActionRowBuilder().addComponents(inputTruth1);
        const ActionRow4 = new ActionRowBuilder().addComponents(inputTruth2);
        modal.addComponents(ActionRow1, ActionRow2, ActionRow3, ActionRow4);
        await interaction.showModal(modal);

        // statements
        let statements = [...interaction.options._hoistedOptions];
        const gameTruth = statements[0].value;
        //const statement1 = interaction.options.getString('lie') ?? 'Nothing';
        //const statement2 = interaction.options.getString('truth_1') ?? 'Nothing';
        //const statement3 = interaction.options.getString('truth_2') ?? 'Nothing';
        console.log(statements);

        // shuffle statements
        statements = myArrayShuffle(statements);
        console.log(statements);
        const truthIndex = statements.findIndex(function (entry) { return entry.name === "lie"; });
        let matchingReaction = numericalEmojis[truthIndex];
        console.log(`truth index: ${truthIndex}`);

        // send initial message to start game
        let msg = `Which of these statements about ${interaction.user} is correct? \n`;
        let st_i = 0;
        for(let st of statements) {
            let txt = st.value;
            msg += numericalEmojis[st_i]+`: *${txt}*\n`;
            st_i++;
        }
        let timerTxt = `⏰**${timerSeconds}** seconds remaining!\n`;
        let rulesWarning = `*(only your most recent reaction will count)*`;
		const message = await interaction.reply({content: timerTxt+msg+rulesWarning, fetchReply: true });

        // add reactions
        try {
            for(let r = 0; r < numArgs; r++) {
                await message.react(numericalEmojis[r]);
            }
        }
        catch (error) {
            console.error(`Failed to offer a reaction!`)
        }

        //check and tally reactions
        const filter = (reaction, user) => {
            return user.id !== message.author.id;
        };
        const collector = message.createReactionCollector({ filter, time: timerSeconds*1000 });
        collector.on('collect', (reaction, user) => {
            console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
            playerAnswers = setUserReaction(playerAnswers, user, reaction.emoji.name);
        });
        collector.on('end', collected => {
            console.log(`Collected ${collected.size} items`);
        });

        //do countdown
        for(let i = 0; i < timerSeconds; i++) {
            await wait(1000);
            //edit timer msg
            timerTxt = `⏰**${timerSeconds-i}** seconds remaining!\n`;
            await interaction.editReply(timerTxt+msg);
        }
        timerTxt = `⏰**Time's up!** `;
        await interaction.editReply(timerTxt+msg);
        
        //complete game
        let winners = [];
        playerAnswers.forEach((val, key) => {
            if (val == matchingReaction) winners.push(key);
        })
        console.log(winners);

        //announce winners
        let completionMessage = ``;
        completionMessage += `*"${gameTruth}"* was a lie!\n **WINNERS**: `;
        winners.forEach(element => {
            completionMessage += `${element} `
        });
        await interaction.followUp({content: completionMessage, ephemeral: false});
	},
};