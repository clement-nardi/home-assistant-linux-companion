# About

This is an Home Assistant companion app for Linux that provides:
 - (sensor) current application name
 - (binary_sensor) is fullscreen

![HA device](https://github.com/clement-nardi/home-assistant-linux-companion/blob/main/ha-device.png?raw=true)

## Technical information

 - No polling. The app listens to X11 events.
 - Uses MQTT auto-discovery. No configuration needed in HA.

# How to use

## Home Assistant prerequisites

 - [Enable MQTT in Home Assistant](https://www.home-assistant.io/integrations/mqtt/)
 - [Get an MQTT server, like the Mosquito MQTT add-on](https://www.home-assistant.io/docs/mqtt/broker)

## Local prerequisites

 - Linux only, x11 only (not wayland)
 - Works with nodeJS 16 LTS

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
```

## Run the app

1. Download repo
2. Fill conf.yml
3. Run `npm i`
4. Run `./linux-companion.js`
