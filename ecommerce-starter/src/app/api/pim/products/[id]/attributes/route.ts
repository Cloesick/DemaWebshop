import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProductWithAttributes, validateAttributeValue, serializeAttributeValue } from "@/lib/pim";
import type { AttributeType } from "@/config/pim-sectors";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductWithAttributes(params.id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      productId: product.id,
      productName: product.name,
      catalog: product.catalog,
      productType: product.productType,
      groupedAttributes: product.groupedAttributes,
    });
  } catch (error) {
    console.error("[PIM_PRODUCT_ATTRIBUTES_GET]", error);
    return NextResponse.json({ error: "Failed to fetch product attributes" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { attributes } = body as { attributes: { definitionId: string; value: unknown }[] };

    if (!attributes || !Array.isArray(attributes)) {
      return NextResponse.json({ error: "attributes array is required" }, { status: 400 });
    }

    // Validate all attributes
    const definitions = await db.attributeDefinition.findMany({
      where: { id: { in: attributes.map((a) => a.definitionId) } },
    });

    const errors: Record<string, string[]> = {};
    for (const attr of attributes) {
      const def = definitions.find((d: any) => d.id === attr.definitionId);
      if (!def) {
        errors[attr.definitionId] = ["Attribute definition not found"];
        continue;
      }

      const serialized = serializeAttributeValue(attr.value, def.type as AttributeType);
      const options = def.options ? JSON.parse(def.options) : null;
      const validation = def.validation ? JSON.parse(def.validation) : null;
      const result = validateAttributeValue(serialized, def.type as AttributeType, options, validation, def.isRequired);

      if (!result.valid) {
        errors[def.slug] = result.errors;
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    // Upsert all attribute values
    const results = await Promise.all(
      attributes.map((attr) => {
        const def = definitions.find((d: any) => d.id === attr.definitionId)!;
        const value = serializeAttributeValue(attr.value, def.type as AttributeType);

        return db.productAttribute.upsert({
          where: {
            productId_attributeDefinitionId: {
              productId: params.id,
              attributeDefinitionId: attr.definitionId,
            },
          },
          update: { value },
          create: {
            productId: params.id,
            attributeDefinitionId: attr.definitionId,
            value,
          },
        });
      })
    );

    return NextResponse.json({ updated: results.length });
  } catch (error) {
    console.error("[PIM_PRODUCT_ATTRIBUTES_PUT]", error);
    return NextResponse.json({ error: "Failed to update attributes" }, { status: 500 });
  }
}
