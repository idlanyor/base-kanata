export const handler = 'btn'
export default async ({ sock, m, id }) => {
    // Contoh button biasa
    await m.sendButton('Pilih menu di bawah:', [
        { id: '.ping', text: 'Ping Bot' },
        { id: '.owner', text: 'Owner Bot' },
        { id: '.menu', text: 'Main Menu' }
    ], {
        header: 'Menu Bot',
        footer: '© Kanata Bot',
        newsletterName: 'Kanata Menu'
    })

    // Contoh interactive button
    await m.sendInteractiveButton('Pilih opsi:', [
        {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
                title: 'Select Menu',
                sections: [{
                    title: 'Main Menu',
                    highlight_label: '!',
                    rows: [
                        {
                            header: 'All Features',
                            title: 'Menu Bot',
                            description: 'Show all bot features',
                            id: 'menu'
                        }
                    ]
                }]
            })
        },
        {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: 'Quick Action',
                id: 'action1'
            })
        },
        {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: 'Visit Website',
                url: 'https://example.com',
                merchant_url: 'https://example.com'
            })
        }
    ], {
        header: 'Interactive Menu',
        footer: 'Choose your option'
    })
} 