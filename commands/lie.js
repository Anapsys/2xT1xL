const { 
    SlashCommandBuilder,  messageLink,
    ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const { shuffle, myArrayShuffle, setUserReaction } = require('../utils.js');
const wait = require('node:timers/promises').setTimeout;

const numericalEmojis = [`1️⃣`,`2️⃣`,`3️⃣`,`4️⃣`,`5️⃣`,`6️⃣`,`7️⃣`,`8️⃣`,`9️⃣`,];
const circleEmojis =    [`🔴`,`🟤`,`🟠`,`🟡`,`🟢`,`🔵`,`🟣`,`⚫`,`⚪`,];
const heartEmojis =     [`❤️`,`🤎`,`🧡`,`💛`,`💚`,`💙`,`💜`,`🖤`,`🤍`,];
let emojiScheme = numericalEmojis;

module.exports = {
    // the appearance and personality of the function
	data: new SlashCommandBuilder()
		.setName('lie')
		.setDescription('Start a round of two truths one lie!')
        .addIntegerOption(option =>
            option
                .setName(`timelimit`)
                .setDescription('Time limit (Seconds) (defaults to 2 mins)'))
        .setDMPermission(true),

    // the actual behavior of the function
	async execute(interaction) {
        // game rules
        const timerSeconds = interaction.options.getInteger('timelimit') ?? 120;
        const numArgs = interaction.options._hoistedOptions.length;
        console.log(`Starting game with ${timerSeconds} seconds and ${numArgs} statements...`)
        let playerAnswers = new Map();

        //await interaction.reply({ content: 'Collecting witness testimony...', ephemeral: true });
        //await interaction.deferReply();

        // modal
        const modal = new ModalBuilder()
        .setCustomId('2T1L_Modal')
        .setTitle('Two Truths, One Lie');

        // Create the text input components
        // const inputTimeLimit = new SelectMenuBuilder()
        //    .setCustomId('inputTime')
        //    .setLabel("How many seconds for this round?")
        const input1 = new TextInputBuilder()
            .setCustomId('inputLie')
            .setLabel("Tell a lie... (or very near truth)")
            //.setPlaceholder('')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        const input2 = new TextInputBuilder()
            .setCustomId('inputLieJustify')
            .setLabel("What about this is wrong? (optional)")
            //.setPlaceholder(`It's "distant lands".`)
            .setStyle(TextInputStyle.Short);
        const input3 = new TextInputBuilder()
            .setCustomId('inputTruth1')
            .setLabel("Now tell an iffy truth!")
            //.setPlaceholder('Enter some text!')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        const input4 = new TextInputBuilder()
            .setCustomId('inputTruth2')
            .setLabel("...and one more truth.")
            //.setPlaceholder('Enter some text!')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        // An action row only holds one text input,
        // so you need one action row per text input.
        const ActionRow1 = new ActionRowBuilder().addComponents(input1);
        const ActionRow2 = new ActionRowBuilder().addComponents(input2);
        const ActionRow3 = new ActionRowBuilder().addComponents(input3);
        const ActionRow4 = new ActionRowBuilder().addComponents(input4);
        modal.addComponents(ActionRow1, ActionRow2, ActionRow3, ActionRow4);

        await interaction.showModal(modal);
        const modalfilter = (interaction) => interaction.customId === '2T1L_Modal';
        await interaction.awaitModalSubmit({ modalfilter, time: 15_000 })
            .then(interaction => console.log(`${interaction.customId} was submitted!`))
            .catch(console.error);

        console.log(interaction)
        // statements
        let statements = [
            interaction.fields.getTextInputValue('inputLie') ?? `ERROR`,
            interaction.fields.getTextInputValue('inputTruth1') ?? `ERROR`,
            interaction.fields.getTextInputValue('inputTruth2') ?? `ERROR`,
        ];
        const gameTruth = statements[0];
        //const statement1 = interaction.options.getString('lie') ?? 'Nothing';
        //const statement2 = interaction.options.getString('truth_1') ?? 'Nothing';
        //const statement3 = interaction.options.getString('truth_2') ?? 'Nothing';
        console.log(statements);

        // shuffle statements
        statements = myArrayShuffle(statements);
        console.log(statements);
        const truthIndex = statements.findIndex(function (entry) { return entry.name === "lie"; });
        let matchingReaction = emojiScheme[truthIndex];
        console.log(`truth index: ${truthIndex}`);

        // send initial message to start game
        let msg = `One of these statements about ${interaction.user} is false! Which one is it? \n`;
        let st_i = 0;
        for(let st of statements) {
            let txt = st.value;
            msg += emojiScheme[st_i]+`: ${txt}\n`;
            st_i++;
        }
        let timerTxt = `⏰**${timerSeconds}** seconds remaining!\n`;
		const message = await interaction.editReply({content: timerTxt+msg, fetchReply: true, ephemeral: false });

        // add reactions
        try {
            for(let r = 0; r < numArgs; r++) {
                await message.react(emojiScheme[r]);
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