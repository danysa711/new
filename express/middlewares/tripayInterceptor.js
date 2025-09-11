const tripayInterceptor = () => {
  return (req, res, next) => {
    // Hanya memproses request ke Tripay
    if (req.url.includes('/api/tripay') || req.url.includes('/api/subscriptions/purchase')) {
      // Intercept request body dan perbaiki format angka
      const originalBody = req.body;

      // Konversi nilai desimal menjadi integer di semua property numerik
      if (originalBody) {
        // Fungsi rekursif untuk memperbaiki angka
        const fixNumericValues = (obj) => {
          if (!obj || typeof obj !== 'object') return obj;
          
          Object.keys(obj).forEach(key => {
            // Jika nilai adalah number dengan desimal, bulatkan ke bawah
            if (typeof obj[key] === 'number' && !Number.isInteger(obj[key])) {
              obj[key] = Math.floor(obj[key]);
              console.log(`Nilai ${key} dibulatkan: ${obj[key]}`);
            }
            // Jika nilai adalah string tapi mungkin angka desimal
            else if (typeof obj[key] === 'string' && !isNaN(obj[key]) && obj[key].includes('.')) {
              obj[key] = Math.floor(parseFloat(obj[key]));
              console.log(`String numerik ${key} dikonversi: ${obj[key]}`);
            }
            // Jika nilai adalah objek atau array, proses secara rekursif
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
              fixNumericValues(obj[key]);
            }
          });
          
          return obj;
        };
        
        req.body = fixNumericValues(originalBody);
        
        // Log perubahan untuk debugging
        if (JSON.stringify(originalBody) !== JSON.stringify(req.body)) {
          console.log('Body sebelum interceptor:', JSON.stringify(originalBody));
          console.log('Body setelah interceptor:', JSON.stringify(req.body));
        }
      }
    }
    
    next();
  };
};

module.exports = tripayInterceptor;