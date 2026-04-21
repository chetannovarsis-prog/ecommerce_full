const http = require('http');

http.get('http://localhost:5000/api/products', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const products = JSON.parse(data).data || JSON.parse(data);
    const indigo = products.find(p => p.name && p.name.toLowerCase().includes('indigo edit'));
    if (indigo) {
      console.log("Variants for Indigo:");
      indigo.variants.forEach(v => console.log(`ID: ${v.id}, Title: "${v.title}"`));
    }
  });
});
