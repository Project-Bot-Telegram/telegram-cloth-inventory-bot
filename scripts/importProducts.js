const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const connectDB = require('../src/database/database');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const productFilePath = path.resolve(__dirname, '..', 'product.txt');

const parseProductFile = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const categories = [];
  const products = [];
  let section = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      // ignore blank lines and comments, but still allow section markers below
      if (trimmed.toLowerCase().startsWith('categories:')) {
        section = 'categories';
      } else if (trimmed.toLowerCase().startsWith('products:')) {
        section = 'products';
      }
      continue;
    }

    if (trimmed.toLowerCase().startsWith('categories:')) {
      section = 'categories';
      continue;
    }

    if (trimmed.toLowerCase().startsWith('products:')) {
      section = 'products';
      continue;
    }

    if (section === 'categories') {
      const match = trimmed.match(/^\d+\.\s*(.+)$/);
      if (match) {
        categories.push(match[1].trim());
      }
      continue;
    }

    if (section === 'products') {
      const parts = trimmed.split('|').map((part) => part.trim());
      if (parts.length >= 5) {
        const [name, category, priceStr, quantityStr, image] = parts;
        const price = Number(priceStr);
        const quantity = Number(quantityStr);
        if (!name || !category) {
          console.warn('Skipping invalid product line:', trimmed);
          continue;
        }
        products.push({
          name,
          category,
          price: Number.isFinite(price) ? price : 0,
          quantity: Number.isFinite(quantity) ? quantity : 0,
          image: image || '',
        });
      } else {
        console.warn('Skipping malformed product line:', trimmed);
      }
    }
  }

  return { categories, products };
};

const importData = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.error('Unable to connect to MongoDB. Import aborted.');
    process.exit(1);
  }

  try {
    const { categories, products } = parseProductFile(productFilePath);

    const categoryMap = {};
    for (const name of categories) {
      const category = await Category.findOneAndUpdate(
        { name },
        { name },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
      );
      categoryMap[name] = category;
      console.log(`Imported category: ${name}`);
    }

    let importedCount = 0;
    for (const productData of products) {
      const category = categoryMap[productData.category];
      if (!category) {
        console.warn(`Category not found for product: ${productData.name} -> ${productData.category}`);
        continue;
      }

      await Product.findOneAndUpdate(
        { name: productData.name, category_id: category._id },
        {
          name: productData.name,
          category_id: category._id,
          price: productData.price,
          quantity: productData.quantity,
          image: productData.image,
          description: '',
        },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
      );
      importedCount += 1;
    }

    console.log(`✅ Imported ${importedCount} products.`);
  } catch (err) {
    console.error('Import failed:', err);
  } finally {
    process.exit(0);
  }
};

importData();
