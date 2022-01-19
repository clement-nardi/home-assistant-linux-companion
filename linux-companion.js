#!/usr/bin/env node

const mqtt = require('mqtt')
const YAML = require('yaml')
const fs = require('fs')
const osInfo = require('linux-os-info')
const { spawn } = require('child_process');
const { exit } = require('process');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

let conf = {}

const argv = yargs(hideBin(process.argv))
    .default('c', './conf.yml')
    .describe('c', 'configuration file')
    .option('v')
    .describe('v', 'verbose')
    .help('h')
    .alias('h', 'help')
    .alias('c', 'conf')
    .usage('$0 [--conf PATH/TO/CONF.YML] [-v]')
    .version(false)
    .strict()
    .argv

if (!argv.v) {
    console.info = function () {}
}

try {
    console.log('Loading configuration from ' + argv.conf)
    conf = YAML.parse(fs.readFileSync(argv.conf, 'utf8'))
} catch (e) {
    console.warn('cannot read configuration from ' + argv.conf)
    console.warn(e)
    exit(1)
}

console.log(conf)

if (!conf.mqtt_url || !conf.mqtt_user || !conf.mqtt_password) {
    console.warn('Please provide mqtt_url, mqtt_user and mqtt_password in the configuration file.')
    exit(1)
}

console.log('Connecting...')
const client = mqtt.connect(conf.mqtt_url, {'username': conf.mqtt_user, 'password': conf.mqtt_password})

var info = osInfo({mode: 'sync'})
let id = info.hostname
let state_topic=`homeassistant/sensor/${id}-current-app/state`
let x_events_launched = false
let previous_data = ""


client.on('connect', function () {
    console.log('Connected!')

    let unique_id = id + "-current-app"

    let config_payload = {
        name: id + ' current application', 
        state_topic: state_topic,
        value_template: "{{ value_json.app}}",
        unique_id: unique_id,
        device: {
            identifiers: [id],
            name: id,
            manufacturer: `${info.type} ${info.id_like} ${info.version_id}`,
            model: `${info.name} ${info.version}`
        }
    }

    let config_url = `homeassistant/sensor/${unique_id}/config`
    console.log('Publishing config at ' + config_url)
    console.log(config_payload)
    client.publish(config_url, JSON.stringify(config_payload), {retain: true})

    unique_id = id + "-is-fullscreen"
    config_payload.name = id + ' is fullcreen'
    config_payload.device_class = 'opening'
    config_payload.value_template = '{{ value_json.is_fullscreen}}'
    config_payload.unique_id = unique_id

    config_url = `homeassistant/binary_sensor/${unique_id}/config`
    console.log('Publishing config at ' + config_url)
    console.log(config_payload)
    client.publish(config_url, JSON.stringify(config_payload), {retain: true})

    if (!x_events_launched) {
        x_events_launched = true
        const x_events = spawn('./x-events.sh');
        
        x_events.stdout.on('data', (raw_data) => {
            const data = raw_data.toString().trim()
            if (data != previous_data) {
                previous_data = data
                console.log(`sending ${data}`);
                client.publish(state_topic, data, {retain: true})
            } else {
                console.info('repeated event: ' + data)
            }
        })
        x_events.stderr.on('data', (raw_data) => {
            if (argv.v) {
                console.warn(raw_data.toString())
            }
        })
    }
})

client.on('reconnect', function () {
    console.info('reconnect')
})
client.on('close', function () {
    console.info('close')
})
client.on('disconnect', function (packet) {
    console.info('disconnect')
    console.info(packet)
})

client.on('offline', function () {
    console.info('offline')
})
client.on('error', function (error) {
    console.info('error')
    console.info(error)
})

client.on('end', function () {
    console.info('end');
})

client.on('packetreceive', function(packet) {
    console.info('packetreceive')
    console.info(packet)
})