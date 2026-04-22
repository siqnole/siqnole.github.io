require('dotenv').config();
const fs = require('fs');
const cheerio = require('cheerio');

async function fetchBooks() {
  try {
    console.log("Fetching books from StoryGraph...");
    const username = "siq";
    const url = `https://app.thestorygraph.com/currently-reading/${username}`;
    
    const cookieHeader = process.env.STORYGRAPH_COOKIE;
    
    if (!cookieHeader) {
      console.warn("WARNING: STORYGRAPH_COOKIE is not set in your .env file. Fetch will likely fail.");
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cookie': cookieHeader,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const books = [];
    const seenTitles = new Set();
    
    $(".book-pane-content").each((i, el) => {
      const titleEl = $(el).find("h3 a[href^='/books/']").first();
      const authorEl = $(el).find("a[href^='/authors/']").first();
      const imageEl = $(el).find(".book-cover img").first();
      
      const title = titleEl.text().trim();
      const author = authorEl.text().trim();
      
      if (title && author && !seenTitles.has(title)) {
        seenTitles.add(title);
        books.push({
          title: title,
          author: author,
          imageUrl: imageEl.attr("src"),
          bookUrl: `https://app.thestorygraph.com${titleEl.attr("href")}`
        });
      }
    });

    const outputData = {
      books,
      isReading: books.length > 0
    };

    fs.writeFileSync('reading.json', JSON.stringify(outputData, null, 2));
    console.log(`Successfully saved ${books.length} books to reading.json`);

  } catch (error) {
    console.error("StoryGraph Scraper Error:", error.message);
  }
}

fetchBooks();
