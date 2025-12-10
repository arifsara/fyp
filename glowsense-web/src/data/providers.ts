export interface Provider {
  id: string;
  name: string;
  role: string;
  specialty: string[];
  bio: string;
  rating: number;
  location: string;
  priceRange: string;
}

export const providersData: Provider[] = [
  {
    id: "1",
    name: "Dr. Evelyn Harper",
    role: "Dermatologist",
    specialty: ["Acne Treatment", "Chemical Peels", "Sensitive Skin"],
    bio: "Board-certified dermatologist with 10 years of experience treating hormonal acne and scarring. Uses a holistic approach combining medical grade treatments with lifestyle changes.",
    rating: 4.9,
    location: "New York, NY",
    priceRange: "$$$"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    role: "Senior Esthetician",
    specialty: ["Hydrafacial", "Anti-Aging", "Dry Skin"],
    bio: "Specializes in restoring moisture to dry, dehydrated skin. Certified Hydrafacial practitioner helping clients achieve that 'glass skin' look.",
    rating: 4.8,
    location: "Brooklyn, NY",
    priceRange: "$$"
  },
  {
    id: "3",
    name: "Mia Rodriguez",
    role: "Makeup Artist",
    specialty: ["Bridal Makeup", "Natural Glam", "Color Theory"],
    bio: "Expert makeup artist focused on enhancing natural beauty. Known for long-lasting bridal looks and teaching clients proper color correction techniques.",
    rating: 5.0,
    location: "Manhattan, NY",
    priceRange: "$$"
  },
  {
    id: "4",
    name: "David Chen",
    role: "Hair Stylist",
    specialty: ["Color Correction", "Balayage", "Damaged Hair"],
    bio: "Master colorist specializing in fixing damaged hair and creating natural-looking balayage. Uses organic products to maintain hair health.",
    rating: 4.7,
    location: "Queens, NY",
    priceRange: "$$$"
  }
];

