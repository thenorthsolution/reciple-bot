import { config as baseConfig } from "./reciple.mjs";

// @ts-check

/**
 * @satisfies {import('reciple').RecipleConfig}
 */
export const config = {
    ...baseConfig,
    applicationCommandRegister: {
        ...baseConfig.applicationCommandRegister,
        allowRegisterGlobally: false,
        allowRegisterToGuilds: true,
        registerToGuilds: process.env.TEST_GUILD ? [process.env.TEST_GUILD] : []
    },
    logger: {
        debugmode: true
    },
    checkForUpdates: false
};