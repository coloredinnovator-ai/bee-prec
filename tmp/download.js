const fs = require('fs');
const https = require('https');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  await download('https://raw.githubusercontent.com/coloredinnovator-ai/bee-prec/main/public/index.html', '/tmp/index.html');
  await download('https://raw.githubusercontent.com/coloredinnovator-ai/bee-prec/main/public/site.js', '/tmp/site.js');
  await download('https://raw.githubusercontent.com/coloredinnovator-ai/bee-prec/main/public/styles.css', '/tmp/styles.css');
  console.log('Downloaded');
}

main();
