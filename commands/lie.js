const { SlashCommandBuilder, messageLink } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lie')
		.setDescription('Start a round of two truths one lie!')
        .addStringOption(option =>
            option
                .setName('truth_1')
                .setDescription('truth')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('truth_2')
                .setDescription('truth')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('lie')
                .setDescription('lie')
                .setRequired(true)),
	async execute(interaction) {
        //game rules
        const timerSeconds = 15;

        //statements
        const statement1 = interaction.options.getString('truth_1') ?? 'Nothing';
        const statement2 = interaction.options.getString('truth_2') ?? 'Nothing';
        const statement3 = interaction.options.getString('lie') ?? 'Nothing';
        //shuffle statements

        //send initial message to start game
        let msg = `Which of these statements about ${interaction.user.username} is correct? \n1️⃣: ${statement1}, \n2️⃣: ${statement2}, \n3️⃣: ${statement3} `
        let timerTxt = `**${timerSeconds}** seconds remaining!\n`;
		const message = await interaction.reply({content: timerTxt+msg, fetchReply: true });

        // add reactions
        try {
		    await message.react(`1️⃣`);
            await message.react(`2️⃣`);
            await message.react(`3️⃣`);
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
        timerTxt = `**Time's up!**`;
        await interaction.editReply(timerTxt+msg);

        //check and tally reactions
        const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(userId));
        try {
            for (const reaction of userReactions.values()) {
                await reaction.users.remove(userId);
            }
        } catch (error) {
            console.error('Failed to remove reactions.');
        }


        //complete game
        await interaction.followUp({content: `Winners go here!`, ephemeral: false});
	},
};