const { default: axios } = require("axios");
const { RecipleScript } = require("reciple");

/**
 * @type {RecipleScript}
 */
const script = {
    versions: '3.0.x',
    docsData: [],
    docsVersion: '3.0.0',
    async onStart(client) {
        const fetch = await axios({
            url: 'https://raw.githubusercontent.com/FalloutStudios/reciple-docs/main/docs/docs.json',
            responseType: 'json',
            method: 'GET'
        })
        .then(res => res.data)
        .catch(() => null);
        if (!fetch) return false;

        this.docsData = fetch.children;
        this.docsVersion = fetch.name.split(' - ').pop() || this.docsVersion;

        return true;
    }
};

module.exports = script;