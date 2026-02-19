# Deployment Guide for kneespinerevival.com

This guide will help you deploy your website to https://kneespinerevival.com/

## Prerequisites

1. ✅ MongoDB Atlas account and connection string configured
2. ✅ Environment variables ready
3. ✅ Code pushed to GitHub (recommended)

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   Follow the prompts:
   - Link to existing project? No
   - Project name: kneespine-website
   - Directory: ./
   - Override settings? No

4. **Add Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from your `.env` file:
     - `MONGODB_URI`
     - `PORT` (optional, Vercel sets this automatically)
     - `DOCTOR_EMAIL`
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
     - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `DOCTOR_WHATSAPP_TO`

5. **Connect Custom Domain:**
   - Go to Settings → Domains
   - Add `kneespinerevival.com` and `www.kneespinerevival.com`
   - Update your domain's DNS records as instructed by Vercel:
     - Add CNAME record: `www` → `cname.vercel-dns.com`
     - Add A record: `@` → Vercel's IP (provided in dashboard)

6. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

### Option 2: Railway

**Steps:**

1. **Sign up:** Go to https://railway.app and sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure:**
   - Railway will auto-detect Node.js
   - Add environment variables in the Variables tab:
     - Copy all from your `.env` file

4. **Deploy:**
   - Railway will automatically deploy
   - Get your deployment URL

5. **Add Custom Domain:**
   - Go to Settings → Domains
   - Add `kneespinerevival.com`
   - Update DNS records as instructed

---

### Option 3: Render

**Steps:**

1. **Sign up:** Go to https://render.com and sign up

2. **Create New Web Service:**
   - Connect your GitHub repository
   - Settings:
     - **Name:** kneespine-website
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `node server.js`

3. **Add Environment Variables:**
   - Go to Environment section
   - Add all variables from `.env`

4. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy automatically

5. **Add Custom Domain:**
   - Go to Settings → Custom Domains
   - Add `kneespinerevival.com`
   - Update DNS records

---

### Option 4: VPS (DigitalOcean, AWS EC2, etc.)

**Steps:**

1. **Set up VPS:**
   - Create Ubuntu 20.04+ server
   - SSH into server

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone Repository:**
   ```bash
   git clone <your-repo-url>
   cd "website dr.kalnarkar"
   npm install
   ```

5. **Create .env file:**
   ```bash
   nano .env
   ```
   Paste all environment variables

6. **Start with PM2:**
   ```bash
   pm2 start server.js --name kneespine-website
   pm2 save
   pm2 startup
   ```

7. **Install Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

8. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/kneespinerevival
   ```
   Add:
   ```nginx
   server {
       listen 80;
       server_name kneespinerevival.com www.kneespinerevival.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Enable Site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/kneespinerevival /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Install SSL (Let's Encrypt):**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d kneespinerevival.com -d www.kneespinerevival.com
    ```

---

## MongoDB Atlas Network Access

**Important:** Before deploying, update MongoDB Atlas Network Access:

1. Go to MongoDB Atlas → Network Access
2. Add your hosting provider's IP ranges OR
3. For development/testing: Add `0.0.0.0/0` (allows all IPs - less secure but easier)

**IP Ranges by Provider:**
- **Vercel:** Use `0.0.0.0/0` (they use dynamic IPs)
- **Railway:** Use `0.0.0.0/0`
- **Render:** Use `0.0.0.0/0`
- **VPS:** Add your server's static IP

---

## Domain DNS Configuration

### For Vercel/Railway/Render (CNAME):
```
Type: CNAME
Name: www
Value: [provided by hosting platform]
TTL: 3600

Type: A or CNAME
Name: @
Value: [provided by hosting platform]
TTL: 3600
```

### For VPS (A Record):
```
Type: A
Name: @
Value: [your server IP]
TTL: 3600

Type: A
Name: www
Value: [your server IP]
TTL: 3600
```

---

## Environment Variables Checklist

Make sure these are set in your hosting platform:

- [ ] `MONGODB_URI` - Your MongoDB Atlas connection string
- [ ] `PORT` - Usually auto-set by platform (5000 for VPS)
- [ ] `DOCTOR_EMAIL` - Email to receive appointment notifications
- [ ] `SMTP_HOST` - SMTP server (e.g., smtp.gmail.com)
- [ ] `SMTP_PORT` - SMTP port (587 or 465)
- [ ] `SMTP_USER` - SMTP username
- [ ] `SMTP_PASS` - SMTP password/app password
- [ ] `TWILIO_ACCOUNT_SID` - Twilio account SID
- [ ] `TWILIO_AUTH_TOKEN` - Twilio auth token
- [ ] `TWILIO_WHATSAPP_FROM` - Twilio WhatsApp number
- [ ] `DOCTOR_WHATSAPP_TO` - Doctor's WhatsApp number

---

## Testing After Deployment

1. **Health Check:**
   Visit: `https://kneespinerevival.com/health`
   Should return: `{"status":"ok"}`

2. **Test Appointment:**
   - Fill out the appointment form
   - Check MongoDB Atlas to verify data is saved
   - Check email/WhatsApp notifications (if configured)

3. **Check Logs:**
   - Vercel: Dashboard → Deployments → View Logs
   - Railway: Deployments → View Logs
   - Render: Logs tab
   - VPS: `pm2 logs kneespine-website`

---

## Troubleshooting

### MongoDB Connection Issues:
- Verify network access in MongoDB Atlas
- Check connection string format
- Ensure database user has correct permissions

### Environment Variables Not Working:
- Restart/redeploy after adding variables
- Check variable names match exactly (case-sensitive)
- Verify no extra spaces in values

### Domain Not Working:
- Wait 24-48 hours for DNS propagation
- Use `nslookup kneespinerevival.com` to check DNS
- Verify DNS records are correct

### App Not Starting:
- Check logs for errors
- Verify all dependencies are installed
- Check PORT environment variable

---

## Support

If you encounter issues:
1. Check application logs
2. Verify all environment variables
3. Test MongoDB connection separately
4. Check domain DNS propagation

Good luck with your deployment! 🚀

