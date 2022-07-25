const { default: axios } = require("axios");
const { RecipleScript, version } = require("reciple");

/**
 * @type {RecipleScript}
 */
const script = {
    versions: '3.1.x',
    docsData: [],
    docsVersion: `v${version}`,
    logger: null,
    async onStart(client) {
        this.logger = client.logger.cloneLogger({ loggerName: 'Docs' });

        return this.fetchDocs();
    },
    async fetchDocs() {
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
        this.logger.warn(`Fetched docs ${this.docsVersion}!`);
       	this.logger.debug(this.docsData);

        setTimeout(() => this.fetchDocs(), 1000 * 60 * 20);
        return true;
    }
};

module.exports = script;
