module.exports = {
    versions: '3.1.x',
    onStart(client) {
        process.on('uncaughtException', async (err) => {
            client.logger.err(err);
        });
        process.on('unhandledRejection', async (err) => {
            client.logger.err(err);
        });

        return true;
    }
}