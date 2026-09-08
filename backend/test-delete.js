const jwt = require('jsonwebtoken');

async function test() {
  // Generate a token for a purchase user
  const token = jwt.sign(
    { userId: 'test-admin-id', role: 'purchase' },
    'ad5b0c6b0b7748c384e4b0da8d2cfa1e760e5d5f64123400c5a83ecba66f8e1b',
    { expiresIn: '1h' }
  );
  
  const suppliersRes = await fetch('http://localhost:10000/api/suppliers', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const suppliersData = await suppliersRes.json();
  console.log('Suppliers:', suppliersData.data?.suppliers?.length);
  
  if (suppliersData.data?.suppliers?.length > 0) {
    const supplierId = suppliersData.data.suppliers[0].id;
    console.log('Trying to delete supplier:', supplierId);
    const deleteRes = await fetch(`http://localhost:10000/api/suppliers/${supplierId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Delete status:', deleteRes.status);
    console.log('Delete response:', await deleteRes.text());
  }
}

test();
