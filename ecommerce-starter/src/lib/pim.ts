/**
 * PIM (Product Information Management) Library
 * Handles attribute parsing, validation, and querying
 */

import { db } from "./db";
import type { AttributeType } from "@/config/pim-sectors";

// ─── Attribute Value Parsing ─────────────────────────────────────

export function parseAttributeValue(value: string, type: AttributeType): unknown {
  switch (type) {
    case "NUMBER":
      return parseFloat(value);
    case "BOOLEAN":
      return value === "true";
    case "MULTISELECT":
      try { return JSON.parse(value); } catch { return []; }
    case "DATE":
      return new Date(value);
    default:
      return value;
  }
}

export function serializeAttributeValue(value: unknown, type: AttributeType): string {
  switch (type) {
    case "NUMBER":
      return String(value);
    case "BOOLEAN":
      return value ? "true" : "false";
    case "MULTISELECT":
      return JSON.stringify(value);
    case "DATE":
      return value instanceof Date ? value.toISOString() : String(value);
    default:
      return String(value ?? "");
  }
}

// ─── Attribute Validation ────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAttributeValue(
  value: string,
  type: AttributeType,
  options?: string[] | null,
  validation?: { min?: number; max?: number; pattern?: string } | null,
  isRequired?: boolean
): ValidationResult {
  const errors: string[] = [];

  if (!value && isRequired) {
    errors.push("This field is required");
    return { valid: false, errors };
  }

  if (!value) return { valid: true, errors: [] };

  switch (type) {
    case "NUMBER": {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push("Must be a valid number");
      } else if (validation) {
        if (validation.min !== undefined && num < validation.min) {
          errors.push(`Minimum value is ${validation.min}`);
        }
        if (validation.max !== undefined && num > validation.max) {
          errors.push(`Maximum value is ${validation.max}`);
        }
      }
      break;
    }
    case "SELECT": {
      if (options && !options.includes(value)) {
        errors.push(`Must be one of: ${options.join(", ")}`);
      }
      break;
    }
    case "MULTISELECT": {
      try {
        const values = JSON.parse(value) as string[];
        if (options) {
          const invalid = values.filter((v) => !options.includes(v));
          if (invalid.length > 0) {
            errors.push(`Invalid options: ${invalid.join(", ")}`);
          }
        }
      } catch {
        errors.push("Must be a valid JSON array");
      }
      break;
    }
    case "BOOLEAN": {
      if (value !== "true" && value !== "false") {
        errors.push("Must be true or false");
      }
      break;
    }
    case "URL": {
      try { new URL(value); } catch {
        errors.push("Must be a valid URL");
      }
      break;
    }
    case "COLOR": {
      if (!/^#[0-9a-fA-F]{6}$/.test(value) && !/^[a-zA-Z]+$/.test(value)) {
        errors.push("Must be a hex color (#RRGGBB) or color name");
      }
      break;
    }
    case "DATE": {
      if (isNaN(Date.parse(value))) {
        errors.push("Must be a valid date");
      }
      break;
    }
  }

  if (validation?.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      errors.push("Value does not match the required pattern");
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── PIM Queries ─────────────────────────────────────────────────

export async function getProductWithAttributes(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      catalog: true,
      productType: true,
      attributes: {
        include: {
          definition: {
            include: { group: true },
          },
        },
      },
      category: true,
      variants: true,
    },
  });

  if (!product) return null;

  // Group attributes by their group
  const groupedAttributes: Record<string, {
    groupName: string;
    attributes: {
      name: string;
      slug: string;
      value: unknown;
      type: string;
      unit: string | null;
    }[];
  }> = {};

  for (const attr of product.attributes) {
    const groupSlug = attr.definition.group?.slug ?? "ungrouped";
    const groupName = attr.definition.group?.name ?? "Other";

    if (!groupedAttributes[groupSlug]) {
      groupedAttributes[groupSlug] = { groupName, attributes: [] };
    }

    groupedAttributes[groupSlug].attributes.push({
      name: attr.definition.name,
      slug: attr.definition.slug,
      value: parseAttributeValue(attr.value, attr.definition.type as AttributeType),
      type: attr.definition.type,
      unit: attr.definition.unit,
    });
  }

  return { ...product, groupedAttributes };
}

export async function getCatalogWithTypes(catalogSlug: string) {
  return db.catalog.findUnique({
    where: { slug: catalogSlug },
    include: {
      productTypes: {
        include: {
          attributes: {
            include: { group: true },
            orderBy: { sortOrder: "asc" },
          },
          _count: { select: { products: true } },
        },
      },
      _count: { select: { products: true } },
    },
  });
}

export async function getFilterableAttributes(productTypeSlug: string) {
  return db.attributeDefinition.findMany({
    where: {
      productType: { slug: productTypeSlug },
      isFilterable: true,
    },
    include: { group: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getProductsByAttributes(
  productTypeSlug: string,
  filters: Record<string, string>,
  page = 1,
  limit = 12
) {
  const skip = (page - 1) * limit;

  // Build attribute filter conditions
  const attributeConditions = Object.entries(filters).map(([slug, value]) => ({
    attributes: {
      some: {
        definition: { slug },
        value: { contains: value },
      },
    },
  }));

  const where = {
    productType: { slug: productTypeSlug },
    archived: false,
    AND: attributeConditions,
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        attributes: {
          include: { definition: true },
          where: { definition: { showOnCard: true } },
        },
        category: true,
      },
    }),
    db.product.count({ where }),
  ]);

  return { products, total, totalPages: Math.ceil(total / limit) };
}
