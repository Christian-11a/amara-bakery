export type ProductCategory = "Bread" | "Pastries" | "Cakes";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  price: number;
  description: string;
  image: string;
};

export const products: Product[] = [
  {
    id: "pandesal",
    name: "Classic Pandesal",
    category: "Bread",
    unit: "Pack of 6",
    price: 60,
    description: "Soft, warm rolls with a tender crumb and a light dusting of breadcrumbs.",
    image: "/images/pandesal.png",
  },
  {
    id: "sourdough",
    name: "Sourdough Loaf",
    category: "Bread",
    unit: "Whole loaf",
    price: 180,
    description: "A slow-fermented loaf with a crisp crust, chewy center, and gentle tang.",
    image: "/images/sourdough.png",
  },
  {
    id: "spanish-bread",
    name: "Spanish Bread",
    category: "Bread",
    unit: "Pack of 4",
    price: 80,
    description: "Pillowy rolls wrapped around a buttery, sweet breadcrumb filling.",
    image: "/images/spanish-bread.png",
  },
  {
    id: "cheese-rolls",
    name: "Cheese Rolls",
    category: "Bread",
    unit: "Pack of 4",
    price: 100,
    description: "Fluffy, golden rolls finished with a savory, melty cheese center.",
    image: "/images/cheese-rolls.png",
  },
  {
    id: "croissant",
    name: "Butter Croissant",
    category: "Pastries",
    unit: "Piece",
    price: 85,
    description: "Laminated by hand until crisp and flaky outside, soft and buttery inside.",
    image: "/images/croissant.png",
  },
  {
    id: "cinnamon-roll",
    name: "Cinnamon Roll",
    category: "Pastries",
    unit: "Piece",
    price: 75,
    description: "A soft spiral filled with cinnamon sugar and finished with a light glaze.",
    image: "/images/cinnamon-roll.png",
  },
  {
    id: "cream-puff",
    name: "Cream Puff",
    category: "Pastries",
    unit: "Box of 4",
    price: 120,
    description: "Delicate choux shells filled with smooth vanilla cream.",
    image: "/images/cream-puff.png",
  },
  {
    id: "pain-au-chocolat",
    name: "Pain au Chocolat",
    category: "Pastries",
    unit: "Piece",
    price: 95,
    description: "Flaky, golden pastry wrapped around rich dark chocolate.",
    image: "/images/pain-au-chocolat.png",
  },
  {
    id: "chocolate-cake",
    name: "Chocolate Cake",
    category: "Cakes",
    unit: "Slice",
    price: 110,
    description: "Moist cocoa cake layered with silky chocolate frosting.",
    image: "/images/chocolate-cake.png",
  },
  {
    id: "vanilla-cake",
    name: "Vanilla Cake",
    category: "Cakes",
    unit: "Slice",
    price: 100,
    description: "A tender vanilla sponge with a soft, creamy buttercream finish.",
    image: "/images/vanilla-cake.png",
  },
  {
    id: "carrot-cake",
    name: "Carrot Cake",
    category: "Cakes",
    unit: "Slice",
    price: 120,
    description: "Spiced carrot cake with a tangy cream cheese frosting.",
    image: "/images/carrot-cake.png",
  },
  {
    id: "lemon-loaf",
    name: "Lemon Loaf",
    category: "Cakes",
    unit: "Slice",
    price: 85,
    description: "Bright lemon loaf with a fine crumb and a delicate citrus glaze.",
    image: "/images/lemon-loaf.png",
  },
];

export const productById = new Map(products.map((product) => [product.id, product]));
