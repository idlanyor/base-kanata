// variabel dasar
globalThis.owner = "Nama Lu Cik";
globalThis.botName = "Kanata Bot";
globalThis.ownerNumber = ["62895395590009"];
globalThis.botNumber = "628157695152";
globalThis.sessionName = 'kanata-bot';
globalThis.ppUrl = 'https://telegra.ph/file/8360caca1efd0f697d122.jpg';
globalThis.bannerUrl = 'https://telegra.ph/file/8360caca1efd0f697d122.jpg';
globalThis.newsletterUrl = 'https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m';

// Store Configuration
globalThis.storeConfig = {
    pterodactyl: {
        url: "",
        apiKey: "",
        adminApiKey: "",
        emailSuffix: ""
    },
    qris: {
        imageUrl: ""
    },
    admin: {
        owner: "",
        storeAdmin: ""
    }
}

// Premium Configuration
globalThis.premiumConfig = {
    qris: {
        imageUrl: ""
    },
    admin: {
        owner: "",
        premiumAdmin: ""
    }
}

// Products Configuration
globalThis.products = {
    nodejs: {},
    vps: {},
    python: {}
}

// Premium products now use PREMIUM_PLANS from User model
// No need for separate premium products configuration

// fungsi dasar
globalThis.isOwner = (id) => {
    return id === globalThis.ownerNumber
}
globalThis.isBot = async (id) => {
    return id === globalThis.botNumber
}

// Store helper functions
globalThis.isStoreAdmin = (id) => {
    return id === (globalThis.storeConfig.admin.storeAdmin || '') + '@s.whatsapp.net' || (globalThis.ownerNumber || []).includes(id)
}

globalThis.getProduct = (code) => {
    const lowerCode = (code || '').toLowerCase()
    for (const category in globalThis.products) {
        if (globalThis.products[category][lowerCode]) {
            return { ...globalThis.products[category][lowerCode], code: lowerCode, category }
        }
    }
    return null
}

// Premium helper functions
globalThis.isPremiumAdmin = (id) => {
    return id === (globalThis.premiumConfig.admin.premiumAdmin || '') + '@s.whatsapp.net' || (globalThis.ownerNumber || []).includes(id)
}

// variabel apikey
globalThis.apiKey = {
    gemini: '',
    gpt: '',
    ytdl: '',
    fasturl: '',
    mistral: '',
    removeBG: '',
    groq: '',
    pdf: {
        secret: '',
        public: ''
    }
}

// variabel paired apikey with baseurl
globalThis.apiHelper = {
    medanpedia: {
        apiId: '',
        apiKey: ''
    },
    lolhuman: {
        apikey: '',
        baseUrl: 'https://api.lolhuman.xyz/api/'
    },
    betabotz: {
        apikey: '',
        baseUrl: 'https://api.betabotz.eu.org/api/'
    },
    skizotech: {
        apikey: '',
        baseUrl: 'https://skizo.tech/api/'
    },
    nyxs: {
        apikey: '',
        baseUrl: 'https://api.nyxs.pw/api/'
    }
}

