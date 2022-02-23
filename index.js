import express from 'express'
import dotenv from 'dotenv'
import {Scraper} from './scraper/scraper.js'

const app = express()

app.use(express.json())

dotenv.config()

const scraper = new Scraper("https://proxybay.github.io")

const start = async () =>{
    await scraper.init()
}

app.post('/getMagnet',async (req,res)=>{
    await start()
    const name = req.body.name
    const data = await scraper.scrapeData(name)
    res.send({data})
})
app.get('/',(req,res)=>{
    res.send({message:"ok"})
})

const port = process.env.PORT || 5050
app.listen(port,()=>{
    console.log("application started at Port ",port)
})

