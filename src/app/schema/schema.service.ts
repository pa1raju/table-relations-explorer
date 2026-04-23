import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  RelationEdge,
  SchemaSnapshot,
  TableDefinition,
} from './schema.model';

const MOCK_SCHEMA: SchemaSnapshot = {
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'email', type: 'varchar' },
        { name: 'password_hash', type: 'varchar' },
        { name: 'full_name', type: 'varchar' },
        { name: 'first_name', type: 'varchar' },
        { name: 'last_name', type: 'varchar' },
        { name: 'phone', type: 'varchar' },
        { name: 'phone_verified', type: 'bool' },
        { name: 'email_verified', type: 'bool' },
        { name: 'status', type: 'varchar' },
        { name: 'role', type: 'varchar' },
        { name: 'avatar_url', type: 'varchar' },
        { name: 'preferred_language', type: 'varchar' },
        { name: 'preferred_currency', type: 'varchar' },
        { name: 'default_address_id', type: 'uuid' },
        { name: 'referral_code', type: 'varchar' },
        { name: 'marketing_opt_in', type: 'bool' },
        { name: 'last_login_at', type: 'timestamp' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'updated_at', type: 'timestamp' },
      ],
    },
    {
      name: 'addresses',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'user_id', type: 'uuid' },
        { name: 'label', type: 'varchar' },
        { name: 'recipient_name', type: 'varchar' },
        { name: 'contact_phone', type: 'varchar' },
        { name: 'line1', type: 'varchar' },
        { name: 'line2', type: 'varchar' },
        { name: 'line3', type: 'varchar' },
        { name: 'city', type: 'varchar' },
        { name: 'state', type: 'varchar' },
        { name: 'postal_code', type: 'varchar' },
        { name: 'country_code', type: 'char(2)' },
        { name: 'latitude', type: 'numeric' },
        { name: 'longitude', type: 'numeric' },
        { name: 'is_billing', type: 'bool' },
        { name: 'is_shipping', type: 'bool' },
        { name: 'is_default', type: 'bool' },
        { name: 'instructions', type: 'text' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'updated_at', type: 'timestamp' },
      ],
    },
    {
      name: 'categories',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'parent_id', type: 'uuid', nullable: true },
        { name: 'created_by', type: 'uuid' },
        { name: 'name', type: 'varchar' },
        { name: 'slug', type: 'varchar' },
        { name: 'description', type: 'text' },
        { name: 'image_url', type: 'varchar' },
        { name: 'icon_url', type: 'varchar' },
        { name: 'banner_url', type: 'varchar' },
        { name: 'sort_order', type: 'int' },
        { name: 'depth_level', type: 'int' },
        { name: 'path', type: 'varchar' },
        { name: 'is_active', type: 'bool' },
        { name: 'product_count', type: 'int' },
        { name: 'meta_title', type: 'varchar' },
        { name: 'meta_description', type: 'varchar' },
        { name: 'color_code', type: 'varchar' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'updated_at', type: 'timestamp' },
        { name: 'deleted_at', type: 'timestamp' },
      ],
    },
    {
      name: 'products',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'category_id', type: 'uuid' },
        { name: 'sku', type: 'varchar' },
        { name: 'slug', type: 'varchar' },
        { name: 'name', type: 'varchar' },
        { name: 'short_description', type: 'varchar' },
        { name: 'description', type: 'text' },
        { name: 'brand', type: 'varchar' },
        { name: 'vendor', type: 'varchar' },
        { name: 'price', type: 'numeric' },
        { name: 'compare_at_price', type: 'numeric' },
        { name: 'currency', type: 'char(3)' },
        { name: 'weight_grams', type: 'int' },
        { name: 'stock_quantity', type: 'int' },
        { name: 'reserved_quantity', type: 'int' },
        { name: 'image_url', type: 'varchar' },
        { name: 'status', type: 'varchar' },
        { name: 'rating_avg', type: 'numeric' },
        { name: 'rating_count', type: 'int' },
        { name: 'created_at', type: 'timestamp' },
      ],
    },
    {
      name: 'orders',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'user_id', type: 'uuid' },
        { name: 'shipping_address_id', type: 'uuid' },
        { name: 'billing_address_id', type: 'uuid' },
        { name: 'coupon_id', type: 'uuid', nullable: true },
        { name: 'order_number', type: 'varchar' },
        { name: 'subtotal_amount', type: 'numeric' },
        { name: 'tax_amount', type: 'numeric' },
        { name: 'shipping_amount', type: 'numeric' },
        { name: 'discount_amount', type: 'numeric' },
        { name: 'total_amount', type: 'numeric' },
        { name: 'currency', type: 'char(3)' },
        { name: 'status', type: 'varchar' },
        { name: 'payment_status', type: 'varchar' },
        { name: 'payment_method', type: 'varchar' },
        { name: 'shipping_method', type: 'varchar' },
        { name: 'tracking_number', type: 'varchar' },
        { name: 'placed_at', type: 'timestamp' },
        { name: 'shipped_at', type: 'timestamp' },
        { name: 'delivered_at', type: 'timestamp' },
      ],
    },
    {
      name: 'order_items',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'order_id', type: 'uuid' },
        { name: 'product_id', type: 'uuid' },
        { name: 'product_name', type: 'varchar' },
        { name: 'product_sku', type: 'varchar' },
        { name: 'variant_label', type: 'varchar' },
        { name: 'quantity', type: 'int' },
        { name: 'unit_price', type: 'numeric' },
        { name: 'total_price', type: 'numeric' },
        { name: 'tax_amount', type: 'numeric' },
        { name: 'discount_amount', type: 'numeric' },
        { name: 'refunded_quantity', type: 'int' },
        { name: 'refunded_amount', type: 'numeric' },
        { name: 'warehouse_code', type: 'varchar' },
        { name: 'picked_at', type: 'timestamp' },
        { name: 'packed_at', type: 'timestamp' },
        { name: 'shipped_at', type: 'timestamp' },
        { name: 'delivered_at', type: 'timestamp' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'updated_at', type: 'timestamp' },
      ],
    },
    {
      name: 'reviews',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'product_id', type: 'uuid' },
        { name: 'user_id', type: 'uuid' },
        { name: 'order_item_id', type: 'uuid' },
        { name: 'response_by', type: 'uuid', nullable: true },
        { name: 'approved_by', type: 'uuid', nullable: true },
        { name: 'rating', type: 'int' },
        { name: 'title', type: 'varchar' },
        { name: 'comment', type: 'text' },
        { name: 'helpful_count', type: 'int' },
        { name: 'report_count', type: 'int' },
        { name: 'verified_purchase', type: 'bool' },
        { name: 'status', type: 'varchar' },
        { name: 'response_text', type: 'text' },
        { name: 'response_at', type: 'timestamp' },
        { name: 'image_urls', type: 'jsonb' },
        { name: 'language', type: 'varchar' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'updated_at', type: 'timestamp' },
        { name: 'approved_at', type: 'timestamp' },
      ],
    },
    {
      name: 'coupons',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'created_by', type: 'uuid' },
        { name: 'applicable_category_id', type: 'uuid', nullable: true },
        { name: 'applicable_product_id', type: 'uuid', nullable: true },
        { name: 'code', type: 'varchar' },
        { name: 'discount_type', type: 'varchar' },
        { name: 'discount_value', type: 'numeric' },
        { name: 'min_order_amount', type: 'numeric' },
        { name: 'max_discount_amount', type: 'numeric' },
        { name: 'usage_limit', type: 'int' },
        { name: 'usage_count', type: 'int' },
        { name: 'per_user_limit', type: 'int' },
        { name: 'valid_from', type: 'timestamp' },
        { name: 'valid_until', type: 'timestamp' },
        { name: 'is_active', type: 'bool' },
        { name: 'stackable', type: 'bool' },
        { name: 'description', type: 'text' },
        { name: 'terms', type: 'text' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'updated_at', type: 'timestamp' },
      ],
    },
  ],
  foreignKeys: [
    { fromTable: 'addresses', fromColumn: 'user_id', toTable: 'users', toColumn: 'id' },
    { fromTable: 'addresses', fromColumn: 'recipient_name', toTable: 'users', toColumn: 'full_name' },
    { fromTable: 'addresses', fromColumn: 'contact_phone', toTable: 'users', toColumn: 'phone' },
    { fromTable: 'users', fromColumn: 'default_address_id', toTable: 'addresses', toColumn: 'id' },
    { fromTable: 'categories', fromColumn: 'parent_id', toTable: 'categories', toColumn: 'id' },
    { fromTable: 'categories', fromColumn: 'created_by', toTable: 'users', toColumn: 'id' },
    { fromTable: 'categories', fromColumn: 'meta_title', toTable: 'products', toColumn: 'name' },
    { fromTable: 'categories', fromColumn: 'product_count', toTable: 'products', toColumn: 'id' },
    { fromTable: 'products', fromColumn: 'category_id', toTable: 'categories', toColumn: 'id' },
    { fromTable: 'products', fromColumn: 'brand', toTable: 'categories', toColumn: 'name' },
    { fromTable: 'products', fromColumn: 'rating_avg', toTable: 'reviews', toColumn: 'rating' },
    { fromTable: 'products', fromColumn: 'rating_count', toTable: 'reviews', toColumn: 'id' },
    { fromTable: 'orders', fromColumn: 'user_id', toTable: 'users', toColumn: 'id' },
    { fromTable: 'orders', fromColumn: 'shipping_address_id', toTable: 'addresses', toColumn: 'id' },
    { fromTable: 'orders', fromColumn: 'billing_address_id', toTable: 'addresses', toColumn: 'id' },
    { fromTable: 'orders', fromColumn: 'coupon_id', toTable: 'coupons', toColumn: 'id' },
    { fromTable: 'orders', fromColumn: 'currency', toTable: 'users', toColumn: 'preferred_currency' },
    { fromTable: 'orders', fromColumn: 'subtotal_amount', toTable: 'coupons', toColumn: 'min_order_amount' },
    { fromTable: 'orders', fromColumn: 'discount_amount', toTable: 'coupons', toColumn: 'discount_value' },
    { fromTable: 'orders', fromColumn: 'total_amount', toTable: 'coupons', toColumn: 'max_discount_amount' },
    { fromTable: 'order_items', fromColumn: 'order_id', toTable: 'orders', toColumn: 'id' },
    { fromTable: 'order_items', fromColumn: 'product_id', toTable: 'products', toColumn: 'id' },
    { fromTable: 'order_items', fromColumn: 'product_name', toTable: 'products', toColumn: 'name' },
    { fromTable: 'order_items', fromColumn: 'product_sku', toTable: 'products', toColumn: 'sku' },
    { fromTable: 'order_items', fromColumn: 'variant_label', toTable: 'products', toColumn: 'slug' },
    { fromTable: 'order_items', fromColumn: 'unit_price', toTable: 'products', toColumn: 'price' },
    { fromTable: 'order_items', fromColumn: 'total_price', toTable: 'products', toColumn: 'compare_at_price' },
    { fromTable: 'order_items', fromColumn: 'tax_amount', toTable: 'products', toColumn: 'price' },
    { fromTable: 'order_items', fromColumn: 'discount_amount', toTable: 'products', toColumn: 'compare_at_price' },
    { fromTable: 'order_items', fromColumn: 'warehouse_code', toTable: 'products', toColumn: 'vendor' },
    { fromTable: 'order_items', fromColumn: 'picked_at', toTable: 'orders', toColumn: 'placed_at' },
    { fromTable: 'order_items', fromColumn: 'shipped_at', toTable: 'orders', toColumn: 'shipped_at' },
    { fromTable: 'order_items', fromColumn: 'delivered_at', toTable: 'orders', toColumn: 'delivered_at' },
    { fromTable: 'reviews', fromColumn: 'product_id', toTable: 'products', toColumn: 'id' },
    { fromTable: 'reviews', fromColumn: 'user_id', toTable: 'users', toColumn: 'id' },
    { fromTable: 'reviews', fromColumn: 'order_item_id', toTable: 'order_items', toColumn: 'id' },
    { fromTable: 'reviews', fromColumn: 'response_by', toTable: 'users', toColumn: 'id' },
    { fromTable: 'reviews', fromColumn: 'approved_by', toTable: 'users', toColumn: 'id' },
    { fromTable: 'reviews', fromColumn: 'rating', toTable: 'products', toColumn: 'rating_avg' },
    { fromTable: 'reviews', fromColumn: 'helpful_count', toTable: 'products', toColumn: 'rating_count' },
    { fromTable: 'reviews', fromColumn: 'image_urls', toTable: 'products', toColumn: 'image_url' },
    { fromTable: 'reviews', fromColumn: 'language', toTable: 'users', toColumn: 'preferred_language' },
    { fromTable: 'reviews', fromColumn: 'created_at', toTable: 'products', toColumn: 'created_at' },
    { fromTable: 'reviews', fromColumn: 'title', toTable: 'products', toColumn: 'short_description' },
    { fromTable: 'reviews', fromColumn: 'comment', toTable: 'products', toColumn: 'description' },
    { fromTable: 'coupons', fromColumn: 'created_by', toTable: 'users', toColumn: 'id' },
    { fromTable: 'coupons', fromColumn: 'applicable_category_id', toTable: 'categories', toColumn: 'id' },
    { fromTable: 'coupons', fromColumn: 'applicable_product_id', toTable: 'products', toColumn: 'id' },
    { fromTable: 'coupons', fromColumn: 'discount_value', toTable: 'products', toColumn: 'price' },
    { fromTable: 'coupons', fromColumn: 'min_order_amount', toTable: 'orders', toColumn: 'subtotal_amount' },
    { fromTable: 'coupons', fromColumn: 'max_discount_amount', toTable: 'orders', toColumn: 'discount_amount' },
    { fromTable: 'coupons', fromColumn: 'usage_count', toTable: 'orders', toColumn: 'id' },
    { fromTable: 'coupons', fromColumn: 'description', toTable: 'categories', toColumn: 'description' },
  ],
};

@Injectable({ providedIn: 'root' })
export class SchemaService {
  loadSchema(): Observable<SchemaSnapshot> {
    return of(MOCK_SCHEMA);
  }

  getTables(snapshot: SchemaSnapshot): TableDefinition[] {
    return [...snapshot.tables].sort((a, b) => a.name.localeCompare(b.name));
  }

  getRelatedTableNames(snapshot: SchemaSnapshot, tableName: string): string[] {
    const related = new Set<string>();
    for (const fk of snapshot.foreignKeys) {
      if (fk.fromTable === tableName && fk.toTable !== tableName) {
        related.add(fk.toTable);
      }
      if (fk.toTable === tableName && fk.fromTable !== tableName) {
        related.add(fk.fromTable);
      }
    }
    return [...related].sort();
  }

  getEdgesBetween(
    snapshot: SchemaSnapshot,
    primary: string,
    others: string[],
  ): RelationEdge[] {
    const scope = new Set<string>([primary, ...others]);
    const edges: RelationEdge[] = [];
    for (const fk of snapshot.foreignKeys) {
      if (!scope.has(fk.fromTable) || !scope.has(fk.toTable)) continue;
      const direction: RelationEdge['direction'] =
        fk.fromTable === primary ? 'outgoing' : 'incoming';
      edges.push({ ...fk, direction });
    }
    return edges;
  }
}
