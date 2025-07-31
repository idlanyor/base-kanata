# 💎 Premium Auto-Provisioning Setup Guide

Panduan lengkap untuk mengatur fitur premium dengan **Auto-Provisioning System** yang terintegrasi dengan User model dan PREMIUM_PLANS.

## 🚀 Key Features

### ✅ **Auto-Provisioning System:**
- **Automatic Plan Activation**: Premium plans otomatis aktif setelah konfirmasi pembayaran
- **User Model Integration**: Terintegrasi penuh dengan sistem user existing
- **Real-time Status Update**: Status premium otomatis update di database
- **Intelligent Upgrade Logic**: Hanya izinkan upgrade ke plan yang lebih tinggi

### 🔧 **Semi-Auto Features:**
- **Payment Proof Detection**: Bot otomatis deteksi bukti pembayaran
- **Admin Confirmation**: Admin confirm payment → System auto-activate premium
- **Instant Notification**: Customer langsung dapat notifikasi aktivasi

## 📋 Prerequisites

1. **WhatsApp Bot** yang sudah terinstall dan berjalan
2. **User Registration System** harus aktif
3. **QRIS image URL** untuk pembayaran (opsional)
4. **Database** yang sudah dikonfigurasi

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
```

### 2. Premium Plans (Auto-Configured)

Premium plans sudah dikonfigurasi dalam User model dengan struktur:

```javascript
// Auto-loaded from database/models/User.js
PREMIUM_PLANS = {
  FREE: {
    name: 'Free',
    level: 0,
    dailyLimit: 50,
    features: ['basic_commands', 'basic_ai'],
    price: 0
  },
  BASIC: {
    name: 'Basic',
    level: 1,
    dailyLimit: 200,
    features: ['basic_commands', 'basic_ai', 'priority_support', 'custom_bio'],
    price: 50000
  },
  PREMIUM: {
    name: 'Premium',
    level: 2,
    dailyLimit: 500,
    features: ['all_commands', 'advanced_ai', 'priority_support', 'custom_bio', 'unlimited_stickers', 'voice_commands'],
    price: 100000
  },
  VIP: {
    name: 'VIP',
    level: 3,
    dailyLimit: 1000,
    features: ['all_commands', 'advanced_ai', 'priority_support', 'custom_bio', 'unlimited_stickers', 'voice_commands', 'exclusive_features'],
    price: 200000
  }
}
```

### 3. User Registration Requirement

⚠️ **PENTING**: Users harus registrasi terlebih dahulu sebelum bisa order premium:

```
!register <nama>
```

## 🚀 Usage

### Customer Commands:
```
.premium-catalog              # Lihat katalog premium plans
.premium-order basic johndoe  # Order Basic Plan
.premium-order premium alice  # Order Premium Plan  
.premium-order vip bob        # Order VIP Plan
.premium-status PREM-...      # Cek status pesanan
.my-premium-orders            # Lihat semua pesanan premium
```

### Admin Commands:
```
.premium-payment-done PREM-...    # Konfirmasi & auto-activate premium
.premium-payment-cancel PREM-...  # Batalkan pesanan premium
```

### Integration Commands:
```
!profile                      # Lihat status premium saat ini
!premium                      # Lihat plans dan status
!usage                        # Check daily usage limits
```

## 🔄 Auto-Provisioning Flow

### **Complete Automation Process:**

1. **Customer Order**: `.premium-order basic johndoe`
   - ✅ Check user registration
   - ✅ Validate plan level (must be upgrade)
   - ✅ Check pending orders
   - ✅ Create order in database

2. **Payment Proof**: Customer sends image
   - ✅ Auto-detect payment proof
   - ✅ Update order status to "payment_sent"
   - ✅ Notify admin with order details

3. **Admin Confirmation**: `.premium-payment-done PREM-xxxxx`
   - ✅ **AUTO-PROVISION**: System automatically:
     - Updates user.premiumPlan in database
     - Sets premium expiry date (30 days)
     - Updates daily limits
     - Activates all plan features
   - ✅ Notify customer with activation details

4. **Instant Activation**: Customer immediately gets:
   - ✅ Premium status active
   - ✅ Increased daily limits
   - ✅ Access to premium features
   - ✅ Updated profile information

## 📊 Database Integration

### **Automatic Updates:**

#### User Model Updates:
```javascript
// Auto-updated on premium activation
user.premiumPlan = 'BASIC' | 'PREMIUM' | 'VIP'
user.premiumExpiry = '2024-02-01T00:00:00.000Z'
user.limits.dailyCommands = plan.dailyLimit
user.limits.dailyMessages = plan.dailyLimit * 2
```

#### Premium Orders Tracking:
```javascript
// Order progression
order.status = 'pending' → 'payment_sent' → 'completed'
order.premiumDetails = {
  activatedAt: timestamp,
  expiresAt: timestamp,
  features: [...],
  planLevel: 1,
  dailyLimit: 200
}
```

## 🛡️ Security Features

### **Built-in Validations:**
- ✅ User must be registered
- ✅ Only upgrade to higher level plans
- ✅ No duplicate pending orders
- ✅ Admin-only confirmation
- ✅ Payment proof verification

### **Auto-Expiry Management:**
```javascript
// Auto-check on every command
const isPremium = await User.checkPremiumStatus(userId)
// Auto-downgrade to FREE if expired
```

## 🎯 Key Advantages

### **1. Full Integration**
- Seamless dengan existing user system
- Real-time status updates
- Automatic feature activation

### **2. Zero Manual Work**
- Admin hanya perlu confirm payment
- System otomatis handle semua provisioning
- Customer langsung dapat akses

### **3. Error Prevention**
- Intelligent validation
- No double-ordering
- Automatic expiry handling

### **4. Scalable**
- Easy to add new plans
- Configurable pricing & features
- Centralized plan management

## 📈 Monitoring & Analytics

### **Real-time Status Check:**
```javascript
// Check user premium status
const user = await User.getById(userId)
const premiumStatus = await User.checkPremiumStatus(userId)
const stats = await User.getStats(userId)
```

### **Usage Tracking:**
```javascript
// Auto-tracked daily usage
await User.incrementUsage(userId, 'command')
const limits = await User.checkLimit(userId, 'command')
```

## 🔧 Customization

### **Add New Premium Plan:**
```javascript
// In database/models/User.js
ENTERPRISE: {
  name: 'Enterprise',
  level: 4,
  dailyLimit: 2000,
  features: ['all_features', 'api_access', 'white_label'],
  price: 500000
}
```

### **Modify Expiry Period:**
```javascript
// In plugins/misc/premium.js autoProvisionPremium()
expiresAt.setDate(expiresAt.getDate() + 30) // Change 30 to desired days
```

### **Custom Features:**
```javascript
// Add new features to any plan
features: ['existing_features', 'new_custom_feature']
```

## 🚨 Important Notes

### **User Registration Required**
- All premium features require user registration
- Command `.premium-catalog` will show registration prompt if needed

### **Plan Level Logic**
- Users can only upgrade to higher level plans
- Current plan level is compared with target plan level
- No downgrades through order system (manual admin only)

### **Auto-Expiry**
- Premium plans auto-expire after 30 days
- System automatically downgrades to FREE plan
- Users get notified about expiry

### **Database Consistency**
- All premium data stored in User model
- PremiumOrder for order tracking only
- Single source of truth for premium status

## 🛠️ Troubleshooting

### **Common Issues:**

1. **"Must register first"**
   - Solution: User runs `!register <name>` first

2. **"Cannot upgrade to same/lower level"**
   - Solution: Check current plan with `!profile`

3. **"Still have pending order"**
   - Solution: Complete or cancel existing order first

4. **Premium not activated after payment**
   - Check: Admin ran `.premium-payment-done PREM-xxx`
   - Check: Order status in database

### **Debug Commands:**
```bash
# Check user premium status
!profile

# Check order status  
.premium-status PREM-xxx

# Check current premium orders
.my-premium-orders
```

## ✨ Ready to Deploy!

The auto-provisioning system is now ready with:
- ✅ Full automation after payment confirmation
- ✅ Seamless User model integration  
- ✅ Real-time premium status updates
- ✅ Intelligent upgrade validation
- ✅ Zero manual configuration needed

**Test the complete flow:**
1. Register user: `!register testuser`
2. Order premium: `.premium-order basic testuser`
3. Send payment proof (image)
4. Admin confirm: `.premium-payment-done PREM-xxx`
5. Check status: `!profile`

🎉 **Premium is now auto-activated and ready to use!**