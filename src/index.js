import {Scraper} from './scraper/scraper.js'

const scraper = new Scraper("https://stackoverflow.com/questions")

// handling different exit events
const exits = [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`]
exits.forEach((eventType) => {
    process.on(eventType, exitRouter.bind(null,{exit:true}));
});

// exits process
function exitRouter(options, exitCode) {
    console.log("\nScraper Stopped!")
    console.log("\nSaving your data in data.csv file.\n")
    if(options.exit)
        process.exit(1)
}

const start = async () => {
    await scraper.init()
}

// starting our scrapper 
start()

// runs on exit event
function exitHandler(exitCode) {
    scraper.createCSV()
}

process.on('exit', exitHandler)

