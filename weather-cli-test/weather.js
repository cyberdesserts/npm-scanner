#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const { Command } = require('commander');
require('dotenv').config();

const program = new Command();

program
  .name('weather')
  .description('Get weather information for any city')
  .version('1.0.0')
  .argument('<city>', 'city name to get weather for')
  .action(async (city) => {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || 'demo_key';
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

      console.log(chalk.blue(`🌤️  Fetching weather for ${city}...`));

      const response = await axios.get(url);
      const weather = response.data;

      console.log(chalk.green.bold(`\n📍 Weather in ${weather.name}, ${weather.sys.country}`));
      console.log(chalk.yellow(`🌡️  Temperature: ${weather.main.temp}°C (feels like ${weather.main.feels_like}°C)`));
      console.log(chalk.cyan(`☁️  Conditions: ${weather.weather[0].description}`));
      console.log(chalk.magenta(`💧 Humidity: ${weather.main.humidity}%`));
      console.log(chalk.white(`💨 Wind: ${weather.wind.speed} m/s`));

    } catch (error) {
      if (error.response?.status === 401) {
        console.log(chalk.red('❌ Invalid API key. Set OPENWEATHER_API_KEY in .env file'));
        console.log(chalk.yellow('Get your free API key at: https://openweathermap.org/api'));
      } else if (error.response?.status === 404) {
        console.log(chalk.red(`❌ City "${city}" not found`));
      } else {
        console.log(chalk.red(`❌ Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

program.parse();