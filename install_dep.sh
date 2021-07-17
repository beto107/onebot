#!/bin/bash
sudo apt update;
sudo apt-get install software-properties-common -y;
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -;
wget -q https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash;
cd /root;
source ~/.bashrc;
#nvm ls-remote;
nvm ls-remote
nvm install 16.4.2;
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list';
sudo apt update;
sudo apt install -y curl nano crontab nano graphicsmagick gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget build-essential apt-transport-https libgbm-dev -y;
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -;
sudo apt install nodejs;
sudo apt install npm;
sudo apt install google-chrome-stable -y;
sudo apt install ffmpeg -y;
cd /root/onebot;
mkdir media_cache;
cd /root/onebot/scripts &&
chmod +x login;
chmod +x restartbot;
chmod +x sendreq;
chmod +x startbot;
chmod +x stopbot;