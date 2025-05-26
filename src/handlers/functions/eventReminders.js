const { EmbedBuilder } = require('discord.js');
const { model: AnnouncementChannels } = require('../../database/models/announcement-channels');
const chalk = require('chalk');
const fullLog = false;

class ReminderManager {
    constructor() {
        // Définir les valeurs des seuils
        this.monthValue = 30 * 24 * 60 * 60 * 1000;  // 30 jours
        this.weekValue = 7 * 24 * 60 * 60 * 1000;    // 7 jours
        this.dayValue = 24 * 60 * 60 * 1000;         // 1 jour

        if (fullLog) {
            console.log('\nSeuils de rappels configurés:');
            console.log(`- Mois: ${this.formatTime(this.monthValue)}`);
            console.log(`- Semaine: ${this.formatTime(this.weekValue)}`);
            console.log(`- Jour: ${this.formatTime(this.dayValue)}`);
        }
    }

    updateCurrentTime() {
        const now = Date.now();
        const date = new Date(now);
        this.now = date.getTime();
        if (fullLog) console.log(`\nMise à jour de l'heure: ${new Date(this.now).toLocaleString()}`);
    }

    formatTime(ms) {
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        return `${days}j ${hours}h ${minutes}m`;
    }

    initializeReminderState(eventStartTimestamp) {
        this.updateCurrentTime();
        const timeUntilEvent = eventStartTimestamp - this.now;

        // Initialiser tous les rappels à non envoyés
        let reminders = {
            month: { sent: false, timestamp: null },
            week: { sent: false, timestamp: null },
            day: { sent: false, timestamp: null }
        };

        // Utiliser updateFartherReminders pour marquer les rappels appropriés
        if (timeUntilEvent <= this.dayValue) {
            reminders = this.updateFartherReminders(reminders, 'day');
        } else if (timeUntilEvent <= this.weekValue) {
            reminders = this.updateFartherReminders(reminders, 'week');
        } else if (timeUntilEvent <= this.monthValue) {
            reminders = this.updateFartherReminders(reminders, 'month');
        }

        return reminders;
    }

    updateFartherReminders(reminders, type) {
        const updated = { ...reminders };
        
        // Mettre à jour en cascade selon le type
        switch (type) {
            case 'month':
                updated.month = { sent: true, timestamp: this.now };
                break;
            case 'week':
                updated.month = { sent: true, timestamp: this.now };
                updated.week = { sent: true, timestamp: this.now };
                break;
            case 'day':
                updated.month = { sent: true, timestamp: this.now };
                updated.week = { sent: true, timestamp: this.now };
                updated.day = { sent: true, timestamp: this.now };
                break;
        }
        
        return updated;
    }

    getPendingReminders(event) {
        this.updateCurrentTime();
        const timeUntilEvent = event.scheduledStartTimestamp - this.now;
        if (fullLog) {
            console.log(`\nVérification des rappels pour ${event.eventName}`);
            console.log(`Date de l'événement: ${new Date(event.scheduledStartTimestamp).toLocaleString()}`);
            console.log(`Date actuelle: ${new Date(this.now).toLocaleString()}`);
            console.log(`Temps restant: ${this.formatTime(timeUntilEvent)}`);
            console.log('État actuel des rappels:', event.sentReminders);
        }

        // Ne pas envoyer de rappels pour les événements passés
        if (timeUntilEvent <= 0) {
            if (fullLog) console.log(`Événement ${event.eventName} déjà passé, pas de rappels à envoyer`);
            return [];
        }

        // Vérifier chaque seuil dans l'ordre
        if (fullLog) console.log('\nVérification des seuils:');
        
        // Vérification du rappel mensuel
        if (fullLog) {
        console.log(`\nRappel mensuel:`);
        console.log(`- Déjà envoyé? ${event.sentReminders.month}`);
        console.log(`- Temps restant <= ${this.formatTime(this.monthValue)}? ${timeUntilEvent <= this.monthValue}`);
        }
        if (!event.sentReminders.month && timeUntilEvent <= this.monthValue) {
            if (fullLog) console.log('✓ Envoi du rappel 1 mois');
            return [{
                type: 'month',
                //message: 'dans 1 mois'
                message: `<t:${event.scheduledStartTimestamp}:R>`
            }];
        }

        // Vérification du rappel hebdomadaire
        if (fullLog) {
            console.log(`\nRappel hebdomadaire:`);
            console.log(`- Déjà envoyé? ${event.sentReminders.week/1000}`);
            console.log(`- Temps restant <= ${this.formatTime(this.weekValue)}? ${timeUntilEvent <= this.weekValue}`);
        }
        if (!event.sentReminders.week && timeUntilEvent <= this.weekValue) {
            if (fullLog) console.log('✓ Envoi du rappel 1 semaine');
            return [{
                type: 'week',
                //message: 'dans 1 semaine'
                message: `<t:${event.scheduledStartTimestamp/1000}:R>`
            }];
        }

        // Vérification du rappel journalier
        if (fullLog) {
            console.log(`\nRappel journalier:`);
            console.log(`- Déjà envoyé? ${event.sentReminders.day}`);
            console.log(`- Temps restant <= ${this.formatTime(this.dayValue)}? ${timeUntilEvent <= this.dayValue}`);
        }
        if (!event.sentReminders.day && timeUntilEvent <= this.dayValue) {
            if (fullLog) console.log('✓ Envoi du rappel 1 jour');
            return [{
                type: 'day',
                //message: 'demain'
                message: `<t:${event.scheduledStartTimestamp/1000}:R>`
            }];
        }

        if (fullLog) console.log('\n✗ Aucun rappel à envoyer pour le moment');
        return [];
    }

    async checkEventReminders(client) {
        try {
            this.updateCurrentTime();
            const guilds = await AnnouncementChannels.find({});

            for (const guildData of guilds) {
                if (!guildData.EventThreads || !Array.isArray(guildData.EventThreads)) continue;

                for (const eventThread of guildData.EventThreads) {
                    try {
                        // Vérifier si le thread existe et est accessible
                        const thread = await client.channels.fetch(eventThread.threadId).catch(() => null);
                        if (!thread?.isThread() || !thread?.sendable) continue;

                        const timeUntilEvent = eventThread.scheduledStartTimestamp - this.now;

                        // Si l'événement n'a pas encore eu lieu et que le thread est archivé, on le désarchive
                        if (timeUntilEvent > 0 && thread.archived) {
                            try {
                                await thread.setArchived(false);
                                console.log(chalk.blue(chalk.bold(`Event`)), (chalk.white(`>>`)), chalk.green(`Unarchived thread for event`), chalk.red(`${eventThread.eventName}`));
                            } catch (error) {
                                console.error(chalk.blue(chalk.bold(`Event`)), (chalk.white(`>>`)), chalk.red(`Failed to unarchive thread for event ${eventThread.eventName}:`), error);
                                continue;
                            }
                        }

                        let hasUpdates = false;

                        // Initialiser ou valider la structure des rappels
                        let currentReminders = !eventThread.sentReminders || typeof eventThread.sentReminders !== 'object' 
                            ? this.initializeReminderState(eventThread.scheduledStartTimestamp)
                            : {
                                month: {
                                    sent: eventThread.sentReminders.month?.sent || false,
                                    timestamp: eventThread.sentReminders.month?.timestamp || null
                                },
                                week: {
                                    sent: eventThread.sentReminders.week?.sent || false,
                                    timestamp: eventThread.sentReminders.week?.timestamp || null
                                },
                                day: {
                                    sent: eventThread.sentReminders.day?.sent || false,
                                    timestamp: eventThread.sentReminders.day?.timestamp || null
                                }
                            };

                        // Si le rappel mensuel n'a pas été envoyé
                        if (!currentReminders.month.sent) {
                            if (timeUntilEvent <= this.monthValue) {
                                const embed = new EmbedBuilder()
                                    .setColor(0xf5a531)
                                    .setTitle(` `)
                                    .setDescription(`\`🔔\`  L'événement **[${eventThread.eventName}](https://discord.com/channels/${guildData.Guild}/${eventThread.threadId}/${eventThread.followupMessageId})** aura lieu <t:${Math.floor(eventThread.scheduledStartTimestamp/1000)}:R> !`);

                                await thread.send({ embeds: [embed] });
                                console.log(chalk.blue(chalk.bold(`Event`)), (chalk.white(`>>`)), chalk.green(`Reminder`), chalk.red(`month`), chalk.green(`sent for event`), chalk.red(`${eventThread.eventName} (${this.formatTime(this.now)} - ${this.formatTime(timeUntilEvent)})`));
                                
                                currentReminders.month = { sent: true, timestamp: this.now };
                                hasUpdates = true;
                            }
                        }

                        // Si le rappel hebdomadaire n'a pas été envoyé
                        if (!currentReminders.week.sent) {
                            if (timeUntilEvent <= this.weekValue) {
                                const embed = new EmbedBuilder()
                                    .setColor(0xf5a531)
                                    .setTitle(` `)
                                    .setDescription(`\`🔔\`  L'événement **[${eventThread.eventName}](https://discord.com/channels/${guildData.Guild}/${eventThread.threadId}/${eventThread.followupMessageId})** aura lieu <t:${Math.floor(eventThread.scheduledStartTimestamp/1000)}:R> !`);

                                await thread.send({ embeds: [embed] });
                                console.log(chalk.blue(chalk.bold(`Event`)), (chalk.white(`>>`)), chalk.green(`Reminder`), chalk.red(`week`), chalk.green(`sent for event`), chalk.red(`${eventThread.eventName} (${this.formatTime(this.now)} - ${this.formatTime(timeUntilEvent)})`));

                                currentReminders.week = { sent: true, timestamp: this.now };
                                hasUpdates = true;
                            }
                        }

                        // Si le rappel journalier n'a pas été envoyé
                        if (!currentReminders.day.sent) {
                            if (timeUntilEvent <= this.dayValue) {
                                const embed = new EmbedBuilder()
                                    .setColor(0xf5a531)
                                    .setTitle(` `)
                                    .setDescription(`\`🔔\`  L'événement **[${eventThread.eventName}](https://discord.com/channels/${guildData.Guild}/${eventThread.threadId}/${eventThread.followupMessageId})** aura lieu <t:${Math.floor(eventThread.scheduledStartTimestamp/1000)}:R> !`);

                                await thread.send({ embeds: [embed] });
                                console.log(chalk.blue(chalk.bold(`Event`)), (chalk.white(`>>`)), chalk.green(`Reminder`), chalk.red(`day`), chalk.green(`sent for event`), chalk.red(`${eventThread.eventName} (${this.formatTime(this.now)} - ${this.formatTime(timeUntilEvent)})`));

                                currentReminders.day = { sent: true, timestamp: this.now };
                                hasUpdates = true;
                            }
                        }

                        // Mettre à jour la base de données si des rappels ont été envoyés
                        if (hasUpdates) {
                            await AnnouncementChannels.updateOne(
                                { 
                                    Guild: guildData.Guild,
                                    'EventThreads.eventId': eventThread.eventId
                                },
                                { 
                                    $set: { 
                                        'EventThreads.$.sentReminders': currentReminders
                                    }
                                }
                            );
                        }
                    } catch (error) {
                        console.error(`Error processing event ${eventThread.eventName}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking event reminders:', error);
        }
    }
}

// Créer une instance singleton du ReminderManager
const manager = new ReminderManager();

// Export pour le système de handlers
module.exports = (client) => {
    return {
        checkEventReminders: () => manager.checkEventReminders(client)
    };
};

// Export pour l'utilisation directe
module.exports.ReminderManager = ReminderManager;
module.exports.createManager = () => new ReminderManager();