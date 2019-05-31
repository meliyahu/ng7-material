/**
 * Node for ecology theme item
 */
export class ThemeItemNode {
    parent: string;
    children: ThemeItemNode[];
    item: string;
}


/** 
 * Flat  theme node with expandable and level information 
 * */
export class ThemeItemFlatNode {
    item: string;
    level: number;
    expandable: boolean;
    isSelected: boolean;
    parent: string;
  }