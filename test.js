import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  console.log('Navigating to http://localhost:4173/patients/P-10234');
  await page.goto('http://localhost:4173/patients/P-10234', { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  console.log('HTML length:', content.length);
  
  if (content.includes('PATIENT DETAIL PAGE MOUNTED')) {
    console.log('SUCCESS: Marker found in HTML');
  } else {
    console.log('FAILURE: Marker NOT found in HTML');
  }
  
  await browser.close();
})();
