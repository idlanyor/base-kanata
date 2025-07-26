// variabel dasar
globalThis.owner = "Kanata Universe";
globalThis.botName = "Kanata Bot";
globalThis.ownerNumber = ["62895395590009"]
globalThis.botNumber = "62895395590009"
globalThis.sessionName = 'sonata-bot'
globalThis.ppUrl = 'https://telegra.ph/file/8360caca1efd0f697d122.jpg'
globalThis.bannerUrl = 'https://telegra.ph/file/8360caca1efd0f697d122.jpg'
globalThis.newsletterUrl = 'https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m'

// Store Configuration
globalThis.storeConfig = {
    pterodactyl: {
        url: "https://panel.roidev.my.id",
        apiKey: "ptlc_t4zgkJH2ZmcmFZchnQxFn3N3J2Fn1nfFkh9BtbNggTk",
        adminApiKey: "ptla_suW1wqLztnQUv7IRUnr9B395MQ7YFTcTmeHI4ThqiXv",
        emailSuffix: "antidonasi.web.id"
    },
    qris: {
        // Add your QRIS image URL here
        imageUrl: "https://example.com/qris.jpg"
    },
    admin: {
        owner: "62895395590009",
        storeAdmin: "62895395590009"
    }
}

// Products Configuration
globalThis.products = {
    nodejs: {
        a1: { name: "NodeJS Kroco", ram: "1GB", cpu: "100%", price: 5000, nodeId: 1, eggId: 18 },
        a2: { name: "NodeJS Karbit", ram: "2GB", cpu: "150%", price: 7500, nodeId: 1, eggId: 18 },
        a3: { name: "NodeJS Standar", ram: "4GB", cpu: "200%", price: 10000, nodeId: 1, eggId: 18 },
        a4: { name: "NodeJS Sepuh", ram: "5GB", cpu: "250%", price: 12500, nodeId: 1, eggId: 18 },
        a5: { name: "NodeJS Suhu", ram: "8GB", cpu: "300%", price: 15000, nodeId: 1, eggId: 18 },
        a6: { name: "NodeJS Pro Max", ram: "16GB", cpu: "400%", price: 20000, nodeId: 1, eggId: 18 }
    },
    vps: {
        b1: { name: "VPS Kroco", ram: "1GB", cpu: "100%", price: 7500, nodeId: 1, eggId: 15 },
        b2: { name: "VPS Karbit", ram: "2GB", cpu: "150%", price: 10000, nodeId: 1, eggId: 15 },
        b3: { name: "VPS Standar", ram: "4GB", cpu: "200%", price: 15000, nodeId: 1, eggId: 15 },
        b4: { name: "VPS Sepuh", ram: "6GB", cpu: "250%", price: 20000, nodeId: 1, eggId: 15 },
        b5: { name: "VPS Suhu", ram: "8GB", cpu: "300%", price: 25000, nodeId: 1, eggId: 15 },
        b6: { name: "VPS Pro Max", ram: "16GB", cpu: "400%", price: 35000, nodeId: 1, eggId: 15 }
    },
    python: {
        c1: { name: "Python Kroco", ram: "1GB", cpu: "100%", price: 3000, nodeId: 1, eggId: 22 },
        c2: { name: "Python Karbit", ram: "1GB", cpu: "150%", price: 5000, nodeId: 1, eggId: 22 },
        c3: { name: "Python Standar", ram: "2GB", cpu: "150%", price: 7500, nodeId: 1, eggId: 22 },
        c4: { name: "Python Sepuh", ram: "4GB", cpu: "200%", price: 10000, nodeId: 1, eggId: 22 },
        c5: { name: "Python Suhu", ram: "6GB", cpu: "250%", price: 12500, nodeId: 1, eggId: 22 },
        c6: { name: "Python Pro Max", ram: "8GB", cpu: "300%", price: 17500, nodeId: 1, eggId: 22 }
    }
}

// fungsi dasar
globalThis.isOwner = (id) => {
    return id === globalThis.ownerNumber
}
globalThis.isBot = async (id) => {
    return id === botNumber
}

// Store helper functions
globalThis.isStoreAdmin = (id) => {
    return id === globalThis.storeConfig.admin.storeAdmin || globalThis.ownerNumber.includes(id)
}

globalThis.getProduct = (code) => {
    const lowerCode = code.toLowerCase()
    for (const category in globalThis.products) {
        if (globalThis.products[category][lowerCode]) {
            return { ...globalThis.products[category][lowerCode], code: lowerCode, category }
        }
    }
    return null
}

// variabel apikey
globalThis.apiKey = {
    gemini: 'AIzaSyBmiAY7nBuRDVne17wfTsNdGeSVdw8jj8I',
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

// Gemini AI Configuration
process.env.GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY' // Ganti dengan API key Anda
