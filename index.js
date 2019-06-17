'use strict'
/**
 * Node modules
 */
const async = require('async')
const https = require('https')
const events = require('events')
const util = require('util')
const Ora = require('ora')
const {blue, red, green} = require('chalk')

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

/**
 * Declare variables, classes...
 */

// declare async.parallel() Object first argument 
const tasks = {}

// declare request counter
let requestCounter = 0

// declare result object
const resultsArray = []

// declare a new class that extend the events class
class EventEmitter extends events{}

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


// declare Run function
function Run(tasks){

    // lauch timer
    console.time(blue('Checking Duration'))

    /**
     * CONTROL FLOW
     * we use the async.parallel partern @{doc} \> https://caolan.github.io/async/v3/docs.html#parallel
     * "Run the tasks collection of functions in parallel, without waiting until the previous function has completed"
     */
    async.parallel(tasks, (error, results) => {
    
        // stop spinner
        Spin.stop()

        // error message
        if (error) console.log(`err: ${error}`)
  
        /**
         * RESULTS
         */
        // instanciate a new Emitter
        const resultEvent = new EventEmitter

        // WORKING WITH RESULTS DATA
        // add listener to resultEvent
        resultEvent.addListener("resultEvent", (data) => {

                resultsArray.push(data)

                workingWithResults(resultsArray)

        }).emit('resultEvent', results)// emit the 'results' event & passing arguments to listerner
    })
}

// Run inherits from the EventEmitter class
util.inherits(Run, EventEmitter)

// instanciate new event Emitter
const runEvent = new Run(tasks)

// add listener to runEvent
runEvent.addListener("runEvent", (user) => {

    // print start message
    const startMsg = `Start!\nChecking user name in progress for: ${user}\nPlease wait until checking ends!`
    console.log(green(startMsg))

    // start spinner
    Spin.start() 

}).emit("runEvent", userName) // emit runEvent + passing in userName param
    

// formate percentage
const percent = (cur, total) => (cur / total) * 100

/**
 * WORKING WITH RESULTS
 */
const workingWithResults = (data) => {

    console.log('-------------------------')

    // print results
    console.log(data)

    console.log('-------------------------\n')

    // print default user name message
    if (!userNameCMD) { 

        console.log(red(`! Default user name is: ${userName}\n>> please provide a user name\n>> run 'npm run start myUserName'`));
    }
    // stop timer
    console.timeEnd(blue('Checking Duration'))

    // print analytic
    const analytic = `GET request counter: ${requestCounter}\njson length: ${json.length}\nresults length: ${Object.keys(resultsArray[0]).length}`
    console.log(analytic)

    // update spinner
    Spin.succeed(`Done: ${percent(requestCounter,Object.keys(resultsArray[0]).length).toFixed()} %`)
    // return messages
    Spin.succeed('Thank you! Hope to see you next time!')
    Spin.succeed('Coded by Drozerah https://github.com/Drozerah')

    // Ends node.js process 
    process.exit()
}