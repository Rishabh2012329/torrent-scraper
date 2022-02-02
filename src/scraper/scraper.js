import { load } from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs'

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
            console.log("Initializing Scraper")
            // getting total pages on stackoverflow questions
            this.totalPages = await this.getTotalPages();

            console.log("\nScraper Started")
            /*
                Started scraping first five pages if any function completes it will call nextScraper
                which will start paring next page and so on, so it will maintain concurrency of 5.
            */ 
            for(let i=1;i<=5;i++){
                // starting scrape function
                this.scrapeQuestionsList(this.url+`?page=${COUNT}`).then(()=>{
                    this.nextScraper()
                })
                COUNT++
            }
        } catch (error) {
            console.error("Err: ", error);
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
    
    scrapeQuestionsList(url){
        return new Promise(async (resolve,reject)=>{
           try{
                const res = await fetch(url);
                const text = await res.text();
                const $ = load(text);
                const html = $.html();
                let questionElements = $(html).find('#mainbar > #questions > .question-summary');
                
                for (let p = 0; p < questionElements.length; p++) {
                    const ele = questionElements[p];
                    const questionLink = $(ele).find('.question-hyperlink').attr('href');
                    if(this.questions[questionLink]){
                        this.questions[questionLink].count+=1
                        continue
                    }
                    const q = this.getQuestionDetail($, ele);

                    this.questions[q.questionLink] = q
                  
                }
                resolve() 
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

