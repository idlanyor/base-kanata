// variabel dasar
globalThis.owner = "Roynaldi";
globalThis.botName = "Sonata Bot";
globalThis.ownerNumber = ""
globalThis.botNumber = "628157695152"
globalThis.sessionName = 'kanata-bot'

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
