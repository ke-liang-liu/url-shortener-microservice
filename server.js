'use strict';

var express = require('express');
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// schema
const urlPairSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
// model
const UrlPair = mongoose.model('UrlPair', urlPairSchema );

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.route("/api/shorturl/:urlNum")
   .post(function (req, res) {  // for post method, urlNum = 'new'
  // {"original_url":"https://www.freecodecamp.org","short_url":2}
  dns.lookup(req.body.url.replace(/^https?:\/\//, ''), function (err, addresses, family) {
    if (err) { res.json({ "error":"Invalid Hostname" })}
  });
  
  UrlPair.findOne({original_url: req.body.url}, function(err, doc) {
    if (err) { console.log('UrlPair.find() error: ' + err)} 
    if (doc) {
      res.json({ original_url: doc.original_url, short_url: doc.short_url });    
    } else {
      UrlPair.countDocuments((err, urlPairCount) => {
        if (err) { console.log('UrlPair.count() error: ' + err)}        
        new UrlPair({ original_url: req.body.url, short_url: urlPairCount })
        .save(function(err, doc) {
          if (err) { console.log('new UrlPair().save() error: ' + err)}        
          res.json({ original_url: doc.original_url, short_url: doc.short_url  })
        })
      })
    }
  })
})
.get(function(req, res) {
  let filter = {short_url: +req.params.urlNum};
  UrlPair.findOne(filter, function(err, doc) {
    if (err) { res.json('UrlPair.findOne() error: ' + err)}
    if (doc == null)
      res.json({"error":"No short URL found for the given input"});
    else
      res.redirect(doc.original_url);
  })  
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});