import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Image } from '@/components/ui/Image';
import type { Category } from '@/core/models/catalog.model';
import { brandColors } from '@/theme/tokens';

export interface CategoryTreeProps {
  categories: Category[];
  onSelect: (selection: { slug: string; name: string; kind: 'category' | 'subcategory' }) => void;
  testID?: string;
}

export function CategoryTree({ categories, onSelect, testID }: CategoryTreeProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (slug: string) => setExpanded((cur) => (cur === slug ? null : slug));

  return (
    <View testID={testID ?? 'category-tree'}>
      {categories.map((cat) => {
        const hasChildren = (cat.children?.length ?? 0) > 0;
        const isExpanded = expanded === cat.slug;
        return (
          <View key={cat.slug}>
            <Pressable
              testID={`category-${cat.slug}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: hasChildren ? isExpanded : undefined }}
              onPress={() =>
                hasChildren
                  ? toggle(cat.slug)
                  : onSelect({ slug: cat.slug, name: cat.name, kind: 'category' })
              }
              onLongPress={
                hasChildren
                  ? () => onSelect({ slug: cat.slug, name: cat.name, kind: 'category' })
                  : undefined
              }
              className="flex-row items-center border-b border-brand-dark/10 bg-white p-4 active:opacity-80"
            >
              <Image source={cat.imageUrl} width={48} height={48} rounded contentFit="cover" />
              <View className="ml-3 flex-1">
                <Text className="font-brand-bold text-base text-brand-dark">{cat.name}</Text>
                <Text className="font-brand text-xs text-brand-dark/60">
                  {cat.productsCount} productos
                </Text>
              </View>
              {hasChildren && (
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color={brandColors.dark}
                />
              )}
            </Pressable>
            {hasChildren && isExpanded && (
              <View testID={`category-children-${cat.slug}`}>
                {cat.children!.map((child) => (
                  <Pressable
                    key={child.slug}
                    testID={`subcategory-${child.slug}`}
                    accessibilityRole="button"
                    onPress={() =>
                      onSelect({ slug: child.slug, name: child.name, kind: 'subcategory' })
                    }
                    className="flex-row items-center bg-brand-medium py-3 pl-16 pr-4 active:opacity-80"
                  >
                    <Text className="font-brand text-sm text-brand-dark">{child.name}</Text>
                    <Text className="ml-2 font-brand text-xs text-brand-dark/60">
                      ({child.productsCount})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
