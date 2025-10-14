whenever you modify run

npx prisma generate in /src/prisma

To renew ssl
sudo certbot renew --dry-run

to add ssl
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.dootling.com
