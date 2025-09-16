// pages/api/inventory.js
export const inventory = [
  { key: "1", item: "Apple", L1: "Fruit", price: 100, stock: 50, supplier: "Fresh Farms", rating: 4.5 },
  { key: "2", item: "Banana", L1: "Fruit", price: 40, stock: 120, supplier: "Tropical Foods", rating: 4.2 },
  { key: "3", item: "Mango", L1: "Fruit", price: 80, stock: 75, supplier: "Sunrise Traders", rating: 4.8 },
  { key: "4", item: "Carrot", L1: "Vegetable", price: 60, stock: 90, supplier: "Green Valley", rating: 4.1 },
  { key: "5", item: "Potato", L1: "Vegetable", price: 30, stock: 200, supplier: "Agro Fresh", rating: 4.0 },
  { key: "6", item: "Tomato", L1: "Vegetable", price: 50, stock: 150, supplier: "Veggie World", rating: 4.3 },
  { key: "7", item: "Orange", L1: "Fruit", price: 70, stock: 80, supplier: "Citrus Co.", rating: 4.6 },
  { key: "8", item: "Grapes", L1: "Fruit", price: 120, stock: 60, supplier: "Vineyard Supply", rating: 4.7 },
];

  // Generate dynamic columns from keys
export const columns = Object.keys(inventory[0] || {}).map((col) => ({
  title: col.toUpperCase(),
  dataIndex: col,
  key: col,
}));

export default function handler(req, res) {
  res.status(200).json({ data: inventory, columns });
}
