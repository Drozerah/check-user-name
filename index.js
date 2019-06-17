'use strict'
/**
 * Node modules
 */
const async = require('async')
const https = require('https')
const events = require('events')
const util = require('util')
const Ora = require('ora')
const {blue, red} = require('chalk')

/**
 * App modules
 */
const json = require('./data/sites.json')

/**
 * SPINNER
 * Returns a new instance of Ora to create a spinner
 */
const Spinner = () => new Ora({
    color:'magenta',
    spinner: {
        frames: [
			"Checking ■···",
			"Checking ·□··",
			"Checking ··▪·",
			"Checking ···▫"
        ],
        interval: 90
      }
})


// declare new spinner instance
const Spin = Spinner()

/**
 * USER NAME TO CHECK
 */

// get process.argv userName 
const [,,userNameCMD] = process.argv

// if userNameCMD is undefined use default 'john_doe' as userName
const userName = userNameCMD || 'john_doe'

// declare async.parallel() Object first argument 
const tasks = {}

// declare request counter
let requestCounter = 0

// populate the tasks collection Object with data from ./data/site.json using forEach method 
json.forEach((obj, idx) => {

    tasks[`GET_API_${idx}`] = callback => {
     
        // prepare result Object
        const result = {
            statusCode: undefined,
            url: obj.url,
            apiName: obj.name,
            userName: userName,
            userProfil: obj.url + userName,
            mainProcessId: undefined
        }
    
        /**
         * REQUEST APIs
         * make a get request to a given url with a given user name
         */
        https.get( result.url + result.userName, (response) => {
    
            // update spinner text content
            Spin.text = `| ${percent(requestCounter, json.length).toFixed()} % | ${obj.name}`
            // update resquestCounter
            requestCounter++
            // upate result Oject
            result.statusCode = response.statusCode
            result.mainProcessId = process.pid
    
            // send result to last callback
            callback(null, result)

        
        }).on("error", (err) => { // an error occurs into the silence!
    
            // upate result Oject
            result.statusCode = err.code
            result.mainProcessId = process.pid
            // update resquestCounter
            requestCounter++
    
            callback(null, result)
        })
    }
})


// declare run() function
function Run(obj){

    // lauch timer
    console.time(blue('Checking Duration'))

    /**
     * CONTROL FLOW
     * we use the async.parallel partern @{doc} \> https://caolan.github.io/async/v3/docs.html#parallel
     * "Run the tasks collection of functions in parallel, without waiting until the previous function has completed"
     */
    async.parallel(obj, (error, results) => {
    
        // stop spinner
        Spin.stop()

        // error message
        console.log(`err: ${error}`)
        console.log('-------------------------')

        /**
         * RESULTS
         */
        console.log(results)

        console.log('-------------------------\n')
        // print default user name message
        if (!userNameCMD) {     
            console.log(red(`! Default user name is: ${userName}\n>> please provide a user name\n>> run 'npm run start myUserName'`));
        }
        // stop timer
        console.timeEnd(blue('Checking Duration'))
        // print analytic
        console.log('GET request counter:',requestCounter)
        console.log('json length:',json.length)
        console.log('results length:',Object.keys(results).length)
        Spin.succeed(`Done: ${percent(requestCounter,Object.keys(results).length).toFixed()} %`)
        // return messages
        Spin.succeed('Thank you! Hope to see you next time!')
        Spin.succeed('Coded by Drozerah https://github.com/Drozerah')
        // Ends node.js process 
        process.exit()
    })
}

// create a Run class that inherits the events.EventEmitter class
util.inherits(Run, events.EventEmitter)

// suscribe to a new event
const run = new Run(tasks)

// run APIs calls
run.on("runEvent", (user) => {

    // messages
    console.log('Start!')
    console.log(`Checking user name in progress for: ${user}`)
    console.log('Please wait until checking ends!')
    // start spinner
    Spin.start()
})

// emit runEvent + passing in userName param
run.emit("runEvent", userName)

const percent = (cur, total) => (cur / total) * 100
