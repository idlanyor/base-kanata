# 💎 Premium Feature Setup Guide

Panduan lengkap untuk mengatur fitur premium dengan semi-auto provisioning antara owner dan client.

## 📋 Prerequisites

1. **WhatsApp Bot** yang sudah terinstall dan berjalan
2. **QRIS image URL** untuk pembayaran (opsional)
3. **Database** yang sudah dikonfigurasi

## 🔧 Installation

### 1. Update Configuration

Edit file `global.js` dan update bagian `premiumConfig`:

```javascript
globalThis.premiumConfig = {
    qris: {
        imageUrl: "https://your-qris-image-url.jpg" // ⚠️ UPDATE THIS
    },
    admin: {
        owner: "62895395590009",
        premiumAdmin: "62895395590009"
    }
}

// Premium Products Configuration
globalThis.premiumProducts = {
    p1: {
        name: "Premium Basic",
        price: 25000,
        features: [
            "Unlimited AI requests",
            "Priority support",
            "Custom commands",
            "Advanced features"
        ]
    },
    p2: {
        name: "Premium Pro",
        price: 50000,
        features: [
            "All Basic features",
            "Custom bot branding",
            "Multi-device support",
            "API access"
        ]
    },
    p3: {
        name: "Premium Enterprise",
        price: 100000,
        features: [
            "All Pro features",
            "White-label solution",
            "Dedicated support",
            "Custom integrations"
        ]
    }
}
```

### 2. Verify Database Configuration

Pastikan database sudah dikonfigurasi dengan benar:
- File `database/db.json` akan otomatis tercipta
- Struktur database akan otomatis terinisialisasi

## 🚀 Usage

### Customer Commands:
```
.premium-catalog              # Lihat katalog premium
.premium-order p1 testuser    # Buat pesanan Premium Basic
.premium-status PREM-...      # Cek status pesanan
.my-premium-orders            # Lihat semua pesanan premium
```

### Admin Commands:
```
.premium-payment-done PREM-...    # Konfirmasi pembayaran premium
.premium-payment-cancel PREM-...  # Batalkan pesanan premium
```

## 5. Premium Order Flow Test

1. Customer: `.premium-order p1 testuser`
2. Bot akan kirim detail pesanan + QRIS
3. Customer kirim screenshot bukti bayar (gambar tanpa caption)
4. Bot auto-detect dan ubah status ke "payment_sent"
5. Admin: `.premium-payment-done PREM-xxxxx`
6. Bot aktifkan premium account otomatis
7. Customer terima detail akses premium

## 6. Important Notes

### QRIS Configuration
Update `globalThis.premiumConfig.qris.imageUrl` dengan URL gambar QRIS Anda.

### Premium Features
Sesuaikan fitur premium di `globalThis.premiumProducts` sesuai kebutuhan:

```javascript
// Contoh menambah produk premium baru
p4: {
    name: "Premium Ultimate",
    price: 150000,
    features: [
        "All Enterprise features",
        "Custom development",
        "24/7 support",
        "Exclusive features"
    ]
}
```

### Admin Configuration
Pastikan nomor admin di `premiumConfig.admin.owner` dan `premiumConfig.admin.premiumAdmin` sudah benar.

## 7. Database Auto-Init

Database akan otomatis tercipta dengan struktur:
- `premiumOrders`: Menyimpan semua pesanan premium
- `users`: Data user existing  
- `groups`: Data grup existing

## 8. Monitoring

Check logs untuk error:
```bash
node main.js
```

Error yang umum:
- Database connection failed
- Invalid premium configuration
- QRIS image tidak bisa diakses

## 9. Production Checklist

- [ ] Update QRIS image URL
- [ ] Test premium order flow
- [ ] Verify admin configuration
- [ ] Test complete premium flow
- [ ] Setup backup untuk database
- [ ] Configure proper logging

## 10. Support Commands

Tambahkan ke help menu existing atau buat command baru untuk show premium help:

```javascript
case 'premium-help':
    await m.reply(`
💎 *PREMIUM COMMANDS*

👤 *Customer:*
.premium-catalog - Lihat produk premium
.premium-order [kode] [username] - Buat pesanan premium
.premium-status [id] - Cek status
.my-premium-orders - Lihat pesanan premium saya

👑 *Admin:*
.premium-payment-done [id] - Konfirmasi bayar premium
.premium-payment-cancel [id] - Batalkan pesanan premium
    `);
    break;
```

## 11. Semi-Auto Provisioning Features

### ✅ Automatic Features:
- **Payment Proof Detection**: Bot otomatis mendeteksi bukti pembayaran
- **Admin Notifications**: Owner mendapat notifikasi untuk setiap pesanan baru
- **Status Updates**: Status pesanan otomatis berubah saat bukti pembayaran diterima
- **Premium Activation**: Admin konfirmasi pembayaran, sistem otomatis aktifkan premium

### 🔧 Manual Steps:
- **Admin Confirmation**: Owner harus konfirmasi pembayaran dengan command
- **Quality Control**: Owner bisa review bukti pembayaran sebelum konfirmasi
- **Cancellation**: Owner bisa batalkan pesanan jika diperlukan

## 12. Premium Status Checking

Untuk mengecek status premium user dalam kode:

```javascript
import PremiumOrder from './database/models/PremiumOrder.js'

// Cek apakah user premium
const isPremium = await PremiumOrder.isUserPremium(userId)

// Dapatkan detail premium aktif
const activePremium = await PremiumOrder.getActivePremium(userId)
```

## Ready to Deploy! 🎉

Setelah setup selesai, restart bot dan test dengan membuat pesanan premium dummy untuk memastikan semua berfungsi dengan baik.