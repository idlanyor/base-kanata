// import canvafy from "canvafy";

// const getPpUrl = async (sock, id) => {
//     const ppUrl = 'https://telegra.ph/file/8360caca1efd0f697d122.jpg'
//     try {
//         return await sock.profilePictureUrl(id, "image")
//     } catch {
//         return ppUrl
//     }
// }


// export async function Welcome(sock, sender, namaGrup, pushName) {
//     return await new canvafy.WelcomeLeave()
//         .setAvatar(await getPpUrl(sock, pushName))
//         .setBackground("image", "https://telegra.ph/file/cad7038fe82e47f79c609.jpg")
//         .setAvatarBorder("#db1514")
//         .setTitle(`Welcome User !`)
//         .setDescription(`Selamat datang di Grup ${namaGrup}`)
//         .setOverlayOpacity(0.5)
//         .build()
// }