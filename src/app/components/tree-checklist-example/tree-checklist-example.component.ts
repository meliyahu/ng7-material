import { Component, OnInit, Injectable } from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';
import { LookupService } from '../../services/lookup.service';
import { ThemeItemNode, ThemeItemFlatNode } from '../../models/theme-item-node';

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<ThemeItemNode[]>([]);

  get data(): ThemeItemNode[] { 
    return this.dataChange.value; 
  }

  constructor(private lookupService: LookupService) {
    this.initialize();
  }

  initialize() {
    // Build the tree nodes from Json object. The result is a list of `ThemeItemNode` with nested
    //     file node as children.
    this.getGeologyLookup();
  }

  getGeologyLookup(){

    this.lookupService.getGeologyLookUp().subscribe(responseList => {
      
      let treeData = {}; 
      responseList.forEach(element => {
        treeData = {...treeData,...element}
      });

      // console.log('treeData =', treeData);

      const data = this.buildFileTree(treeData, 0, undefined);

      // console.log('data=', data);

      // Notify the change.
     this.dataChange.next(data);
   
    });
  }
  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `ThemeItemNode`.
   */
  buildFileTree(obj: {[key: string]: any}, level: number, parent?:string): ThemeItemNode[] {
    return Object.keys(obj).reduce<ThemeItemNode[]>((accumulator, key) => {
      
      // console.log('key=', key);

      const value = obj[key];
      const node = new ThemeItemNode();
      node.item = key;
      node.parent = parent?parent:undefined;

      // console.log('value=', value);
      
      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1, node.item);
        } else {
          node.item = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  // /** Add an item to to-do list */
  // insertItem(parent: ThemeItemNode, name: string) {
  //   if (parent.children) {
  //     parent.children.push({item: name} as ThemeItemNode);
  //     this.dataChange.next(this.data);
  //   }
  // }

  // updateItem(node: ThemeItemNode, name: string) {
  //   node.item = name;
  //   this.dataChange.next(this.data);
  // }
}

@Component({
  selector: 'app-tree-checklist-example',
  templateUrl: './tree-checklist-example.component.html',
  styleUrls: ['./tree-checklist-example.component.css'],
  providers: [ChecklistDatabase]
})
export class TreeChecklistExampleComponent implements OnInit {

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<ThemeItemFlatNode, ThemeItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<ThemeItemNode, ThemeItemFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: ThemeItemFlatNode | null = null;

  /** The new item's name */
  newItemName = '';

  treeControl: FlatTreeControl<ThemeItemFlatNode>;

  treeFlattener: MatTreeFlattener<ThemeItemNode, ThemeItemFlatNode>;

  dataSource: MatTreeFlatDataSource<ThemeItemNode, ThemeItemFlatNode>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<ThemeItemFlatNode>(true /* multiple */);

  currentSelectedNodes = new Set();

  constructor(private database: ChecklistDatabase) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<ThemeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    database.dataChange.subscribe(data => {
      this.dataSource.data = data;
    });
  }

  isNodeSelected(node: any){
    //console.log("in isNodeSelected. Node is: ", node)
    let selected = this.checklistSelection.isSelected(node);
    node.isSelected = selected;
    //console.log("ischecked: ", checked)
    this.manageSelectedNodes(node);

    return selected;

  }
  getLevel = (node: ThemeItemFlatNode) => node.level;

  isExpandable = (node: ThemeItemFlatNode) => node.expandable;

  getChildren = (node: ThemeItemNode): ThemeItemNode[] => node.children;

  hasChild = (_: number, _nodeData: ThemeItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: ThemeItemFlatNode) => _nodeData.item === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: ThemeItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item
        ? existingNode
        : new ThemeItemFlatNode();
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.expandable = !!node.children;
    flatNode.parent = node.parent;
    flatNode.isSelected = false;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: ThemeItemFlatNode): boolean {

    //console.log("in descendantsAllSelected. node is:", node);
    
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    
    //Make sure descendants are tracked if they are selected
    descendants.forEach(descendant => {
      this.isNodeSelected(descendant);
    })

    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: ThemeItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the theme item selection. Select/deselect all the descendants node */
  themeItemSelectionToggle(node: ThemeItemFlatNode): void {
    
    //console.log('in themeItemSelectionToggle. Node is:', node);

    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    
    //console.log('descendants=', descendants);
    
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.every(child => 
      this.checklistSelection.isSelected(child)
    );

    // console.log('this.checklistSelection=', this.checklistSelection);

    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf theme item selection. Check all the parents to see if they changed */
  themeLeafItemSelectionToggle(node: ThemeItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: ThemeItemFlatNode): void {
    let parent: ThemeItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: ThemeItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: ThemeItemFlatNode): ThemeItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  /** Keep track of selected nodes */
  manageSelectedNodes(node: ThemeItemFlatNode){
       if (node.isSelected == true){
         this.currentSelectedNodes.add(node);
       } else {
         this.currentSelectedNodes.delete(node);
       }
       //console.log('currentSelectedNodes: ', this.currentSelectedNodes);
  }
  
  ngOnInit() {
  
  }

}
