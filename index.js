require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const url = require('url')
const shortId = require('shortid');
const cors = require('cors');
const app = express();

// Basic Configuration
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use("/public", express.static(process.cwd() + "/public"));
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})
const URL = mongoose.model("URL", urlSchema);


app.post('/api/shorturl/', async function(req, res) {

  const urlObj = req.body.url
  const parsedUrl = url.parse(urlObj)
  const urlCode = shortId.generate()
  if (!parsedUrl.hostname) {
      res.json({
        error: 'invalid url'
      })
    } else {
      try {
        let findOne = await URL.findOne({
          original_url: urlObj
        })
        if (findOne) {
          res.json({
            original_url: findOne.original_url,
            short_url: findOne.short_url
          })
        } else {
          findOne = new URL({
            original_url: urlObj,
            short_url: urlCode
          })
          await findOne.save()
          res.json({
            original_url: findOne.original_url,
            short_url: findOne.short_url
          })
        }
      } catch (err) {
        console.error(err)
        res.json('Server erorr...')
      }
    }
})


app.get('/api/shorturl/:short_url?', async function(req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      return res.json('No URL found')
    }
  } catch (err) {
    console.log(err)
    res.json('Server error')
  }
})



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
