module.exports = function(controller) {

    controller.on('user_channel_join,user_group_join', function(bot, message) {

        bot.reply(message, 'Welcome, <@' + message.user_id + '>! Type "/?" for help or "/roll" plus a dice expression such as "1d20" or "10d12+4" to get started.');

    });

}
