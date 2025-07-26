# 🚀 Quick Setup Guide - Store Feature

## 1. Prerequisites
- ✅ Pterodactyl panel sudah running
- ✅ Admin API key dan Client API key tersedia
- ✅ QRIS image URL siap digunakan

## 2. Update Configuration

Edit file `global.js` dan update bagian `storeConfig`:

```javascript
globalThis.storeConfig = {
    pterodactyl: {
        url: "https://panel.roidev.my.id",
        apiKey: "ptlc_t4zgkJH2ZmcmFZchnQxFn3N3J2Fn1nfFkh9BtbNggTk",
        adminApiKey: "ptla_suW1wqLztnQUv7IRUnr9B395MQ7YFTcTmeHI4ThqiXv",
        emailSuffix: "antidonasi.web.id"
    },
    qris: {
        imageUrl: "https://your-qris-image-url.jpg" // ⚠️ UPDATE THIS
    },
    admin: {
        owner: "62895395590009",
        storeAdmin: "62895395590009"
    }
}
```

## 3. Verify Pterodactyl Configuration

Pastikan di Pterodactyl panel:
- Node ID `1` tersedia dan aktif
- Egg ID `18` (NodeJS), `15` (Ubuntu/VPS), `22` (Python) tersedia
- Email server sudah dikonfigurasi untuk mengirim password

## 4. Test Commands

### Customer Commands:
```
!catalog              # Lihat katalog produk
!order a1 testuser    # Buat pesanan NodeJS Kroco
!order-status ORD-... # Cek status pesanan
!my-orders            # Lihat semua pesanan
```

### Admin Commands:
```
!payment-done ORD-...    # Konfirmasi pembayaran
!payment-cancel ORD-...  # Batalkan pesanan
```

## 5. Order Flow Test

1. Customer: `!order a1 testuser`
2. Bot akan kirim detail pesanan + QRIS
3. Customer kirim screenshot bukti bayar (gambar tanpa caption)
4. Bot auto-detect dan ubah status ke "payment_sent"
5. Admin: `!payment-done ORD-xxxxx`
6. Bot buat user + server otomatis
7. Customer terima detail akses

## 6. Important Notes

### QRIS Configuration
Update `globalThis.storeConfig.qris.imageUrl` dengan URL gambar QRIS Anda.

### Node & Egg IDs
Sesuaikan `nodeId` dan `eggId` di konfigurasi produk jika berbeda:

```javascript
// Contoh jika menggunakan Node ID 2 dan Egg ID 25 untuk NodeJS
a1: { name: "NodeJS Kroco", ram: "1GB", cpu: "100%", price: 5000, nodeId: 2, eggId: 25 }
```

### Email Suffix
Pastikan domain email di `emailSuffix` bisa menerima email untuk reset password.

## 7. Database Auto-Init

Database akan otomatis tercipta dengan struktur:
- `orders`: Menyimpan semua pesanan
- `users`: Data user existing  
- `groups`: Data grup existing

## 8. Monitoring

Check logs untuk error:
```bash
node main.js
```

Error yang umum:
- Pterodactyl API connection failed
- Invalid node/egg configuration
- QRIS image tidak bisa diakses

## 9. Production Checklist

- [ ] Update QRIS image URL
- [ ] Test Pterodactyl API connectivity
- [ ] Verify email configuration
- [ ] Test complete order flow
- [ ] Setup backup untuk database
- [ ] Configure proper logging

## 10. Support Commands

Tambahkan ke help menu existing atau buat command baru untuk show store help:

```javascript
case 'store-help':
    await m.reply(`
🏪 *STORE COMMANDS*

👤 *Customer:*
!catalog - Lihat produk
!order [kode] [username] - Buat pesanan
!order-status [id] - Cek status
!my-orders - Lihat pesanan saya

👑 *Admin:*
!payment-done [id] - Konfirmasi bayar
!payment-cancel [id] - Batalkan pesanan
    `);
    break;
```

## Ready to Deploy! 🎉

Setelah setup selesai, restart bot dan test dengan membuat pesanan dummy untuk memastikan semua berfungsi dengan baik.