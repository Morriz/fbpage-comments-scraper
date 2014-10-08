'use strict';

var crypto = require('crypto')
  , http = require('http')
  , server
  , graph = require('fbgraph')
  , request = require('request')
  , Feed = require('feed')
  , page = 'devsurplus'
  , siteLink = 'http://devsurplus.net/'
  , siteImage = 'http://devsurplus.net/image.png'
  , appId = process.env.APPID
  , appSecret = process.env.APPSECRET
  , graphBaseUrl = 'https://graph.facebook.com'
  , accessTokenUrl = graphBaseUrl + '/oauth/access_token?client_id=' + appId + '&client_secret=' + appSecret + '&grant_type=client_credentials'
  , options = {
    timeout: 3000, pool: { maxSockets: Infinity }, headers: { connection: 'keep-alive' }
  }
  , feedData = {
    title: 'DevSurplus page comments feed',
    description: 'Only lists comments that were made on posts on the page.',
    link: siteLink,
    image: siteImage,
    copyright: 'Dowutchawant',

    author: {
      name: 'Maurice Faber',
      email: 'morriz@idiotz.nl',
      link: 'https://github.com/Morriz'
    }
  }
  ;

server = http.createServer(function (req, response) {
  var feed = new Feed(feedData)
    , out
    ;
  request(accessTokenUrl, {}, function (err, resp) {
    var accessToken = resp.body.split('=')[1];
    graph
      .setAccessToken(accessToken)
      .setOptions(options)
      .get(page + '/posts', function (err, res) {
        res.data.forEach(function (post) {
          var pb = post.message
            , pc = post.comments
            , id = post.id.split('_')[1]
            ;
          if (!pb || !pc) {
            return;
          }
          pc.data.forEach(function (comment) {
            var author = comment.from.name
              , title = "New comment by " + author + " on post '" + (pb.length > 40 ? pb.substr(0, 40) : pb) + "'"
              , description = comment.message
              , link = 'https://www.facebook.com/' + page + '/posts/' + id
              , guid = link + '-' + crypto.createHash('md5').update(author + description).digest('hex')
              ;
            feed.addItem({
              title: title,
              link: link,
              guid: guid,
              description: description,
              content: description,
              author: [
                { name: author }
              ],
              date: new Date(comment.created_time)
            });
          });
        });
        out = feed.render('rss-2.0');
        response.end(out);
      });
  });
}).listen(8888, function () {
  console.info('server listening on port: %s', 8888);
});