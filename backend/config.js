const axios = require('axios');

const bratnetApi = axios.create({
    baseURL: process.env.BRATNET_API_URL,
    auth: {
        username: process.env.BRATNET_USERNAME,
        password: process.env.BRATNET_PASSWORD
    },
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

module.exports = bratnetApi;
