import { load } from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs'
import puppeteer from 'puppeteer'


// maintains the current scraping page
let COUNT=1;

export class Scraper{
    
    // initializing variables
    constructor(url){
        this.url=url
        this.totalPages=0
        this.questions={}
    }
    // initializing scrapper
    async init() {
        try {
            this.browser= await puppeteer.launch({
                args: [ "--hide-scrollbars", "--disable-web-security","--no-sandbox",'--disable-setuid-sandbox'],
                headless: true,
                ignoreHTTPSErrors: true,
              })
        } catch (error) {
            console.error("Err: ", error);
        }
    }
    async scrapeData(name){
        console.log(name)
        return await this.scrapeQuestionsList(this.url, name)
    }
    async getMagnetUrl(url, browser){
        try{
            console.log(url)
            let page = await browser.newPage();
            await page.goto(url)
            let data = await page.evaluate(() => {
                let result=[]
                let items = document.querySelectorAll('#d')
                items.forEach((ele)=>{
                    result = ele.children[0].href
                })
                return result
            })
            
            await page.close()
            return data
        }catch(err){
            console.log(err)
            return ""
        }
       
    }
    async getTotalPages() {
        try {
            const result = await fetch(this.url);
            const text = await result.text();
            const $ = load(text);
            const html = $.html();
            return parseInt($(html).find('#mainbar > div.s-pagination.site1.themed.pager.float-left > a:nth-child(7)').text());
        } catch (error) {
            console.error("Err: ", error);
        }
    }
    async fetchMovies(startUrl,movieName){
        movieName = movieName.replace(" ",'+')
        startUrl+=`/search.php?q=${movieName}&cat=201`
        const result = await fetch(startUrl);
        const text = await result.text();
        const $ = load(text);
        const html = $.html();
       
        const movieCol = $(html).find('section.col-center')
        let browser = this.browser;
	try {
	    console.log("Opening the browser......");
	   
        let page = await browser.newPage();
        await page.goto(startUrl)
        let data = await page.evaluate(() => {
            let result=[]
            let items = document.querySelectorAll('span.list-item.item-name.item-title')
            
            items.forEach((ele,index)=>{
                if(index<5)
                    result.push({title:ele.innerText,link:ele.children[0].href})
            })
            return result
        })
        console.log(data)
       
        let p = await data.map((obj,index)=>{
            return new Promise(async (resolve,reject)=>{
                data[index] = {...data[index], magnetUrl: await this.getMagnetUrl(obj.link,browser)}
                resolve()
            })
        })
        console.log(p)
       await Promise.all(p)
    return data
        
	} catch (err) {
	    console.log("Could not create a browser instance => : ", err);
	}
    
    }
    async nextScraper(){
        if(COUNT<this.totalPages){
            // starting scrape function
            this.scrapeQuestionsList(this.url+`?page=${COUNT}`).then(()=>{
                this.nextScraper()
            })
            // Increamenting Count so next time it will parse next page
            COUNT++
        }
    }
    
    scrapeQuestionsList(url,name){
        return new Promise(async (resolve,reject)=>{
           try{
                const res = await fetch(url);
                const text = await res.text();
                const $ = load(text);
                const html = $.html();
                const proxylist = $(html).find('#proxyList > tbody > tr')
                let data = []
                for(let i=0;i<proxylist.length;i++){
                    if(data.length>4)
                        break;
                    let ele = proxylist[i]
                    const a = $(ele).find('a').attr('href')
                    let movies = await this.fetchMovies(a,name)
                    console.log("movies",movies)
                    if(movies.length>5)
                        data=[...data,...movies]
                    else
                        data = [...data,...movies]
                    console.log(data.length)
                }
                console.log("final Data",data)
                this.browser.close()
                resolve(data) 
           }catch(err){
                console.log("Error: ",err)
                reject()
           }
            
        })
    }

    getQuestionDetail($, ele) {
        try {
            const title = $(ele).find('.question-hyperlink').text();
            const questionLink = $(ele).find('.question-hyperlink').attr('href');
            const answerCount = $(ele).find('.status > strong').text();
            const upvotes = $(ele).find('.vote-count-post').text();
            return {
                title,
                questionLink,
                answerCount,
                upvotes,
                count: 1
            }
        } catch (error) {
            console.error("Err: ", error);
        }
    }
    
    createCSV(){
        let data = 'Question Link, Question,Answer Count,Upvotes,Count\n';
        for (let q in this.questions) {
            
            data += `'${this.questions[q].questionLink}',${this.questions[q].title?.replace(',', ' ')},${this.questions[q].answerCount},${this.questions[q].upvotes},${this.questions[q].count}\n`;
        }
        fs.writeFileSync(`./data.csv`, data, "utf-8");
    }
}

