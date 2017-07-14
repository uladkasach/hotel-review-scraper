module.exports = function(){
    var horseman = this; // define horseman object explicitly
    
    return this
        .wait(21)
        
        // grab a review_link, use huristic returning next unscraped link w/ most reviews
        .then(()=>{ // output opening
            console.log("Grabbing next review link from database...");
            return horseman;
        })
        .then(()=>{
            return new Promise((resolve, reject)=>{
                var query = connection.query('SELECT `LinkID`, `Link`, `ReviewCount` FROM `review_links` WHERE `Scraped` = 0 ORDER BY `ReviewCount` DESC LIMIT 1', function(err, result) {
                    if(err === null){
                        var source_result = result[0];
                        var cleaned_result = {
                            id : source_result.LinkID,
                            url : source_result.Link,
                            count : source_result.ReviewCount,
                        }
                        console.log(cleaned_result);
                        resolve([cleaned_result, true]);
                    } else {
                        console.log(err);
                        reject([err, false]);
                    }
                });
            })
        })
    
    
        // open the review link
        .then((data)=>{
            console.log("Opening Trip Advisor Review Link...");
            var review_link = data[0];
            var url = review_link.url;
            global.current_review_link_id = review_link.id;
            var review_count = review_link.count;
            return horseman
                .open("https://www.tripadvisor.com"+url)
        })
        .then(()=>{ // output opening
            console.log("Opened Review Page. Waiting for everything to load...");
            return horseman;
        })
        .catch((e)=>{
            console.log("Caught an early error.")
            //console.log(e)
            //console.log(Object.keys(e))
            throw e;
        })
        .waitForNextPage({timeout: 15000}) // wait up to 15 seconds for first page

        .then(()=>{
            return horseman
                // recursivly scrape each review page
                .recursively_scrape_each_review_page().then(()=>{ return 1; });

        })
        .catch((e)=>{
            //console.log(Object.keys(e));
            e.substring(0,100);
            console.log("caught error, going to move forward and mark this city negative one...");
            return horseman.wait(1500).then(()=>{ return -1; });
        })
    
        // mark the review link as scraped
        .then((scrape_value)=>{
            process.exit;
            return new Promise((resolve, reject)=>{
                console.log("updating last review link to scraped_status " + scrape_value)
                var query_data = [{ Scraped: scrape_value }, { LinkID: global.current_review_link_id }];
                var query = connection.query('UPDATE review_links SET ? WHERE ?', query_data, function(err, result) {
                    if(err === null){
                        //console.log(result);
                        resolve([result, true]);
                    } else {
                        console.log(err);
                        resolve([err, false]);
                    }
                });
            })
        })
        .then(()=>{
            // call self to continue with next link
            return horseman.scrape_all_review_links();
        })
        
            
    
}