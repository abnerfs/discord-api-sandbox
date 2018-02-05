const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const queryString = require('query-string');
const randomString = require('random-string');
const fetch = require('node-fetch');
const handlebars = require('express-handlebars');


const PORT = process.env.PORT || 8083;

const client_id = process.env.DISCORD_ID;
const client_secret = process.env.DISCORD_SECRET;
const link = `http://localhost:${PORT}/`;
const redirect_uri = link + 'callback';
const apiLink = 'https://discordapp.com/api/oauth2/';

/* Scopes: https://discordapp.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes*/
// const scope = 'email identify guilds guilds.join gdm.join messages.read rpc rpc.api rpc.notifications.read webhook.incoming';
const scope = 'email identify';


app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules'));
app.use(cookieParser());
app.engine('hbs', handlebars({
    extname: 'hbs' ,
    defaultLayout: 'main'
}));

app.set('view engine', 'hbs');


/* Fluxo de autenticação discord https://discordapp.com/developers/docs/topics/oauth2#oauth2 */
app.get('/callback', (req, res) => {
    const { code, error, state } = req.query;

    if(error)
    {
        /* Tratar erro aqui */
        return;
    }

    const headers = new fetch.Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    const body = {
        client_id,
        client_secret,
        grant_type: 'authorization_code',
        code,
        redirect_uri
    };

    fetch(`${apiLink}token`, {
        method: 'POST',
        body: queryString.stringify(body),
        headers
    }).then(response => response.json())
    .then(response => {
        const { access_token,
        refresh_token,
        expires_in,
        scope,
        token_type } = response;

        console.log(response);

        res.cookie('access_token', access_token);
        res.cookie('refresh_token', refresh_token);
        res.cookie('expires_in', expires_in);
        res.cookie('scope', scope);
        res.cookie('token_type', token_type);

        res.redirect('/');
    });
});

app.get('/', (req, res) => {
    const access_token = req.cookies['access_token'];
    const refresh_token = req.cookies['refresh_token'];
    const expires_in = req.cookies['expires_in'];
    const scope = req.cookies['scope'];
    const token_type = req.cookies['token_type'];

    if(!access_token)
    {
        res.redirect('/login');
        return;
    }

    res.render('main', {
        access_token,
        refresh_token,
        expires_in,
        scope,
        token_type
    });

});

app.get('/login', (req, res) => {
    
    const body = {
        redirect_uri,
        response_type: 'code',
        client_id,
        scope,
        state: randomString()
    };
    res.redirect(`${apiLink}authorize?${queryString.stringify(body)}`)

});

app.listen(PORT, () => {
    console.log('Servidor iniciado na porta: ', PORT);
});


