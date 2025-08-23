# Dokumentasi API Tenant

Berikut adalah dokumentasi untuk menggunakan API tenant.

## Autentikasi

Semua endpoint API memerlukan autentikasi menggunakan token JWT. Token didapatkan melalui endpoint login.

### Login Tenant

**URL**: `/api/tenant/:slug/login`  
**Method**: `POST`  
**Body**:

```json
{
  "username": "your_username",
  "password": "your_password"
}