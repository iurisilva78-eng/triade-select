import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Iniciando seed...");

  const adminPassword = await bcrypt.hash("triade@admin2024", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@triadeselect.com.br" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@triadeselect.com.br",
      phone: "11999999999",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin criado:", admin.email);

  const categorias = [
    { name: "Capas", slug: "capas", description: "Capas profissionais para barbearia" },
    { name: "Uniformes", slug: "uniformes", description: "Camisas e uniformes" },
    { name: "Aventais", slug: "aventais", description: "Aventais profissionais" },
  ];

  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Categorias criadas");

  const capasCat = await prisma.category.findUnique({ where: { slug: "capas" } });
  const uniformesCat = await prisma.category.findUnique({ where: { slug: "uniformes" } });
  const aventaisCat = await prisma.category.findUnique({ where: { slug: "aventais" } });

  const produtos = [
    {
      name: "Capa Profissional Standard",
      slug: "capa-profissional-standard",
      description: "Capa profissional em tecido de alta qualidade, impermeável e resistente. Ideal para o dia a dia da barbearia.",
      categoryId: capasCat!.id,
      priceBase: 89.90,
      priceWithCustom: 129.90,
      productionDays: 15,
      weightGrams: 350,
      heightCm: 5,
      widthCm: 40,
      lengthCm: 60,
      allowsCustomization: true,
      images: [] as string[],
    },
    {
      name: "Capa Premium com Bordado",
      slug: "capa-premium-bordado",
      description: "Capa premium com bordado personalizado do logo da sua barbearia. Material de primeira linha.",
      categoryId: capasCat!.id,
      priceBase: 149.90,
      priceWithCustom: 199.90,
      productionDays: 15,
      weightGrams: 450,
      heightCm: 5,
      widthCm: 45,
      lengthCm: 65,
      allowsCustomization: true,
      images: [] as string[],
    },
    {
      name: "Camisa Uniforme Barbeiro",
      slug: "camisa-uniforme-barbeiro",
      description: "Camisa polo profissional para barbeiros. Tecido confortável, lavagem fácil e acabamento impecável.",
      categoryId: uniformesCat!.id,
      priceBase: 79.90,
      priceWithCustom: 109.90,
      productionDays: 15,
      weightGrams: 300,
      heightCm: 3,
      widthCm: 35,
      lengthCm: 50,
      allowsCustomization: true,
      images: [] as string[],
    },
    {
      name: "Avental Profissional",
      slug: "avental-profissional",
      description: "Avental resistente com bolsos funcionais. Proteção e estilo para o profissional da barbearia.",
      categoryId: aventaisCat!.id,
      priceBase: 99.90,
      priceWithCustom: 139.90,
      productionDays: 15,
      weightGrams: 400,
      heightCm: 3,
      widthCm: 50,
      lengthCm: 70,
      allowsCustomization: true,
      images: [] as string[],
    },
  ];

  for (const produto of produtos) {
    await prisma.product.upsert({
      where: { slug: produto.slug },
      update: {},
      create: produto,
    });
  }
  console.log("✅ Produtos criados");

  console.log("\n🎉 Seed concluído!");
  console.log("📧 Admin: admin@triadeselect.com.br");
  console.log("🔑 Senha: triade@admin2024");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
