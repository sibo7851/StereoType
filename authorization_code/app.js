/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var path = require('path')

var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'XXXXXXXX'; // Your client id
var client_secret = 'XXXXXXXXXX'; // Your secret
//var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
//https://stereotype3.herokuapp.com/
var redirect_uri = 'XXXXXXXXXXX';
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added

var pgp = require('pg-promise')();

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'Spotify',
  user: 'postgres',
  password: 'password'
};

var db = pgp(process.env.DATABASE_URL ||dbConfig);

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};



var stateKey = 'spotify_auth_state';

var app = express();
var htmlPath = path.join(__dirname, 'public/images');
app.use(express.static(htmlPath));
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static(__dirname + '/views'))
   .use(cors())
   .use(cookieParser());
app.set("view engine", "ejs");


app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private user-read-recently-played user-top-read user-read-birthdate';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});



app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/main/', function(req, res) {
  // alert('Test')
  console.log('Testing')
  var query = 'select * from user_names;';
  db.any(query)
        .then(function (rows) {
          console.log('In then')
            res.render('main',{
        my_title: "Home Page",
        data: rows,
        color: '',
        color_msg: 'this is a color'
      })

        })
        .catch(function (err) {
            console.log('In catch')
            // display error message in case an error
            //request.flash('error', err);
            res.render('main', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: 'bababababa'
            })
        })
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


/*
app.post('/home/pick_color', function(req, res) {
  var insert_statement = "INSERT INTO user_names(user_name) VALUES('bob sucker')";




db.none(insert_statement)
    .then(() => {
      alert("I FUCKIN DID IT")
        // success;
    })
    .catch(error => {
      alert("I FUCKIN SUCK")
        // error;
    });
});
*/
app.post('/home/pick_color', function(req, res) {
    var key1=req.body.userid;
  var key2;
  var insert_statement="";
  for (var i=0;i<10;i++)
  {
  key2=req.body.name[i];
  insert_statement+= "INSERT INTO x"+key1+"(name) VALUES('"+key2+"');";
  }
db.none(insert_statement)
    .then(data => {
        console.log('DATA:', data); // print data;
        console.log('req:', req.body.name);
    })
    .catch(error => {
        console.log('ERROR:', error); // print the error;
    })
    //.finally(db.$pool.end);
});

app.post('/home/pick_cumberbun', function(req, res) {
  var userid=req.body.userid;
    var insert_statement="";
    console.log()
  for (var i=0;i<10;i++)
  {
    var key1=req.body.features.audio_features[i].id;

  key2=req.body.features.audio_features[i].energy;
  key3=req.body.features.audio_features[i].valence;
  key4=req.body.features.audio_features[i].speechiness;
  key5=req.body.features.audio_features[i].danceability;
  key6=req.body.features.audio_features[i].acousticness;
  insert_statement+= "UPDATE x"+userid+" SET energy ='"+key2+"'  WHERE name='"+key1+"';"
  insert_statement+= "UPDATE x"+userid+" SET valence ='"+key3+"'  WHERE name='"+key1+"';"
  insert_statement+= "UPDATE x"+userid+" SET danceability ='"+key5+"'  WHERE name='"+key1+"';"
  insert_statement+= "UPDATE x"+userid+" SET speechiness ='"+key4+"'  WHERE name='"+key1+"';"
  insert_statement+= "UPDATE x"+userid+" SET acousticness ='"+key6+"'  WHERE name='"+key1+"';"
}
db.none(insert_statement)
    .then(info => {
      console.log('thats a lot of damage');
      })
    .catch(error => {
        console.log('ERROR:', error); // print the error;
    })
    //.finally(db.$pool.end);
});

app.post('/home/login', function(req, res) {
    var key1=req.body.userid;
    console.log("here we friggin are");
    console.log(key1);
  var insert_statement= "CREATE TABLE IF NOT EXISTS x"+key1+"(energy DECIMAL (5,2), acousticness DECIMAL (5,2), valence DECIMAL (5,2), speechiness DECIMAL (5,2), danceability DECIMAL (5,2), name VARCHAR(50), genre VARCHAR(50), id VARCHAR(50));"
  db.none(insert_statement)
    .then(info => {
      console.log('something friggin happened');
      })
    .catch(error => {
        console.log('ERROR:', error); // print the error;
    })
    //.finally(db.$pool.end);
});

function getCookie(cookieString) {
  
  var ca = cookieString.split('=');
  //alert(ca[1]);
  //globalUserId=ca[2];
  return ca[1];
}

  app.get('/home/juju', function(req, res) {
var cookieIs=(req.cookies.username);
var userid=getCookie(cookieIs);
console.log(userid);
  var query = "SELECT AVG(energy) FROM x"+userid+";SELECT AVG(acousticness) FROM x"+userid+";SELECT AVG(valence) FROM x"+userid+";SELECT AVG(speechiness) FROM x"+userid+";SELECT AVG(danceability) FROM x"+userid+";SELECT name FROM x"+userid+" ORDER BY RANDOM() LIMIT 1;";
db.multi(query)
    .then(data => {

        // data[0] = result from the first query;
        // data[1] = result from the second query;
        var arg=[data[0],data[1],data[2],data[3],data[4],data[5]];
        res.send(arg);
    })
    .catch(error => {
        // error
    });

});

console.log('Listening on 3000');
app.listen(process.env.PORT || 8888)
