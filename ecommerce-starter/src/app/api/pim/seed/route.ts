import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allSectors } from "@/config/pim-sectors";

/**
 * POST /api/pim/seed
 * Seeds the PIM system with all sector definitions (catalogs, product types, attribute groups, attribute definitions).
 * Safe to call multiple times — uses upserts.
 */
export async function POST() {
  try {
    let catalogsCreated = 0;
    let typesCreated = 0;
    let groupsCreated = 0;
    let attributesCreated = 0;

    for (const sector of allSectors) {
      // Create catalog
      const catalog = await db.catalog.upsert({
        where: { slug: sector.slug },
        update: { name: sector.name, description: sector.description, sector: sector.sector },
        create: { name: sector.name, slug: sector.slug, description: sector.description, sector: sector.sector },
      });
      catalogsCreated++;

      // Create attribute groups
      const groupMap: Record<string, string> = {};
      for (const group of sector.attributeGroups) {
        const created = await db.attributeGroup.upsert({
          where: { slug: group.slug },
          update: { name: group.name },
          create: { name: group.name, slug: group.slug },
        });
        groupMap[group.slug] = created.id;
        groupsCreated++;
      }

      // Create product types and their attributes
      for (const pt of sector.productTypes) {
        const productType = await db.productType.upsert({
          where: { slug: pt.slug },
          update: { name: pt.name, description: pt.description, icon: pt.icon },
          create: {
            catalogId: catalog.id,
            name: pt.name,
            slug: pt.slug,
            description: pt.description,
            icon: pt.icon,
          },
        });
        typesCreated++;

        // Create attribute definitions
        for (let i = 0; i < pt.attributes.length; i++) {
          const attr = pt.attributes[i];
          const groupId = groupMap[attr.group] ?? null;

          // Use the composite unique constraint
          const existing = await db.attributeDefinition.findUnique({
            where: { productTypeId_slug: { productTypeId: productType.id, slug: attr.slug } },
          });

          if (existing) {
            await db.attributeDefinition.update({
              where: { id: existing.id },
              data: {
                name: attr.name,
                type: attr.type,
                unit: attr.unit ?? null,
                isRequired: attr.isRequired ?? false,
                isFilterable: attr.isFilterable ?? false,
                isSearchable: attr.isSearchable ?? false,
                showOnCard: attr.showOnCard ?? false,
                options: attr.options ? JSON.stringify(attr.options) : null,
                validation: attr.validation ? JSON.stringify(attr.validation) : null,
                sortOrder: i,
                groupId,
              },
            });
          } else {
            await db.attributeDefinition.create({
              data: {
                productTypeId: productType.id,
                groupId,
                name: attr.name,
                slug: attr.slug,
                type: attr.type,
                unit: attr.unit ?? null,
                isRequired: attr.isRequired ?? false,
                isFilterable: attr.isFilterable ?? false,
                isSearchable: attr.isSearchable ?? false,
                showOnCard: attr.showOnCard ?? false,
                options: attr.options ? JSON.stringify(attr.options) : null,
                validation: attr.validation ? JSON.stringify(attr.validation) : null,
                sortOrder: i,
              },
            });
          }
          attributesCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      seeded: {
        catalogs: catalogsCreated,
        productTypes: typesCreated,
        attributeGroups: groupsCreated,
        attributeDefinitions: attributesCreated,
      },
    });
  } catch (error) {
    console.error("[PIM_SEED]", error);
    return NextResponse.json({ error: "Failed to seed PIM data" }, { status: 500 });
  }
}
