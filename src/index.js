import {Scraper} from './scraper/scraper.js'
import express from 'express'
import dotenv from 'dotenv'

const app = express()
app.use(express.json())

dotenv.config()

const scraper = new Scraper("https://proxybay.github.io")

app.post('/getMagnet',async (req,res)=>{
    const name = req.body.name
    const data = await scraper.scrapeData(name)
    res.send({data})
})


const port = process.env.PORT || 5000
app.listen(port,()=>{
    console.log("application started at Port ",port)
})

