// variabel dasar
globalThis.owner = "Nama Lu Cik";
globalThis.botName = "Kanata Bot";
globalThis.ownerNumber = ["62895395590009"]
globalThis.botNumber = "628157695152"
globalThis.sessionName = 'kanata-bot'
globalThis.ppUrl = 'https://telegra.ph/file/8360caca1efd0f697d122.jpg'
globalThis.bannerUrl = 'https://telegra.ph/file/8360caca1efd0f697d122.jpg'
globalThis.newsletterUrl = 'https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m'
// fungsi dasar
globalThis.isOwner = (id) => {
    return id === globalThis.ownerNumber
}
globalThis.isBot = async (id) => {
    return id === botNumber
}
// variabel apikey
globalThis.apiKey = {
    gemini: '',
    gpt: '',
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
