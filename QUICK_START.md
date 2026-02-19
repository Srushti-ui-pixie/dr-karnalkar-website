# Quick Start Guide

## 🚀 Quick Deployment to kneespinerevival.com

### Step 1: Fix MongoDB Connection (If Needed)

If you're getting authentication errors, verify in MongoDB Atlas:

1. **Check Database User:**
   - Go to MongoDB Atlas → Database Access
   - Verify user `Kneespine-admin` exists
   - Reset password if needed and update `.env`

2. **Check Network Access:**
   - Go to Network Access
   - Add `0.0.0.0/0` to allow all IPs (for development)

3. **Get Fresh Connection String:**
   - Go to Database → Connect → Connect your application
   - Copy the connection string
   - Update `.env` file with: `MONGODB_URI=<your-connection-string>/kneespine_db?retryWrites=true&w=majority`

### Step 2: Test Locally

```bash
npm start
```

Visit: http://localhost:5000

You should see: `Connected to MongoDB Atlas` in console.

### Step 3: Choose Deployment Platform

**Easiest: Vercel**
```bash
npm i -g vercel
vercel login
vercel
```

Then add environment variables in Vercel dashboard and connect your domain.

**See DEPLOYMENT.md for detailed instructions for all platforms.**

---

## 📋 Environment Variables Needed

Copy these to your hosting platform:

```
MONGODB_URI=mongodb+srv://Kneespine-admin:YOUR_PASSWORD@kneespine-cluster.x384hkc.mongodb.net/kneespine_db?retryWrites=true&w=majority&appName=kneespine-cluster
PORT=5000
DOCTOR_EMAIL=your-email@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
DOCTOR_WHATSAPP_TO=whatsapp:+919881307084
```

---

## ✅ What's Been Fixed

- ✅ MongoDB Atlas connection configured
- ✅ Appointment form data structure fixed to match API
- ✅ Email transporter setup added
- ✅ Deployment configs created (Vercel, Railway, Render, Heroku)
- ✅ `.gitignore` created to protect `.env`

---

## 🔧 Current Status

- **MongoDB:** Connection string configured (verify credentials if auth fails)
- **API:** Ready to receive appointments
- **Frontend:** Form submission fixed
- **Deployment:** Config files ready

---

## 📞 Next Steps

1. Fix MongoDB authentication (if needed)
2. Test locally: `npm start`
3. Choose deployment platform
4. Deploy and add environment variables
5. Connect domain: kneespinerevival.com

Good luck! 🎉

