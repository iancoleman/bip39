# this script is intended to be run in a VM
# running ubuntu 20.04 server
# from the root directory of this repo

echo "This script is intended to be run in a VM."
echo "It may do things to your OS that you don't want to be peristent."
echo "Please type virtualmachine to continue, or Ctrl-C to quit."

read passage

if [ "$passage" = "virtualmachine" ]; then
    echo "Installing dev environment"
else
    echo "Did not type virtualmachine, quitting with no changes applied"
    exit
fi

# set up place for local binaries
mkdir $HOME/.bin
echo "export PATH=$PATH:$HOME/.bin" >> $HOME/.bashrc
source $HOME/.bashrc

# allow python3 to be run with python command
ln -s /usr/bin/python3 $HOME/.bin/python

# install firefox and other dependencies
sudo apt-get -y install firefox unzip openjdk-11-jre-headless xvfb libxi6 libgconf-2-4 make build-essential
# install chrome
curl -sS -o - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add
sudo sh -c "echo \"deb https://dl.google.com/linux/chrome/deb/ stable main\" >> /etc/apt/sources.list.d/google-chrome.list"
sudo apt-get -y update
sudo apt-get -y install google-chrome-stable

# install nodejs for running tests
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.36.0/install.sh | bash
# load nvm
source $HOME/.bashrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
# install latest node
nvm install node
# install jasmine
cd tests
npm install --global jasmine
npm install selenium-webdriver
# install gecko webdriver for firefox
wget https://github.com/mozilla/geckodriver/releases/download/v0.29.0/geckodriver-v0.29.0-linux64.tar.gz --output-document=/tmp/geckodriver.tar.gz
tar -xf /tmp/geckodriver.tar.gz -C $HOME/.bin
# install chrome webdriver for chromium
wget https://chromedriver.storage.googleapis.com/88.0.4324.96/chromedriver_linux64.zip --output-document=/tmp/chromedriver.zip
unzip /tmp/chromedriver.zip -d $HOME/.bin

# to run tests
# cd tests
# Xvfb :1 -screen 1 1024x768x24 & export DISPLAY=:1.1
# BROWSER=firefox jasmine spec/tests.js
# BROWSER=chrome jasmine spec/tests.js
