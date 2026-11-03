const { onVoiceStateUpdate } = require('../database/activity');

module.exports = {
  name: 'voiceStateUpdate',
  execute(oldState, newState) {
    onVoiceStateUpdate(oldState, newState);
  }
};