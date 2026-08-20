/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let msg = await interaction.editReply({
    content: `---------------🦖`,
    withResponse: true,
  });
  let time = 1 * 1000;
  setTimeout(function () {
    interaction.editReply(`-----------🦖----`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`----------🦖------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`--------🦖--------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`------🦖-----------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`-------🦖-----------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`---🌵-----🦖---------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`---🌵-🦖-------------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`🦖\n ---🌵--------------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`------🦖---🌵--------------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`----🦖-----🌵----------------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`-🌵🌵-----🦖-------🌵--------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`----🌵🌵-🦖----------🌵------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`🦖\n ---🌵🌵-------------🌵---`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`-----🦖---🌵🌵-------------🌵--`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`-------🦖-----🌵🌵-------------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`🎂----🦖--------🌵🌵-----------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(`---🎂--🦖----------🌵🌵---------`);
  }, time);
  time += 1.5 * 1000;

  setTimeout(function () {
    interaction.editReply(
      `**Ⓜⓘⓢⓢⓘⓞⓝ Ⓒⓞⓜⓟⓛⓔⓣⓔⓓ !**\n ---🎂🦖----------🌵🌵-------------`,
    );
  }, time);
};
